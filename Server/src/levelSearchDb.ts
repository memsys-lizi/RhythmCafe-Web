// 数据库搜索（/api/levels/db）——直接中转官方 Datasette，不缓存任何关卡数据。
//
// 一次前端请求 = 一次官方请求（顺序翻页时）。本模块只做三件事：
//   1. 参数翻译：前端查询参数 → 官方 Datasette 查询（白名单字段，见 upstream.ts）
//   2. 游标映射：官方只认 _next 不透明游标（忽略 _offset），前端传 page，
//      服务端为每个查询指纹记录「页号 → 游标」列表（每项几十字节，TTL 清理）
//   3. 格式转换：官方 rows/facet_results/filtered_table_rows_count → 搜索 API 形状
import {
  DatasetteSearchQuery,
  fetchUpstreamDatasetteSearch
} from './upstream.js'

export interface LevelDbSearchParams {
  query: string
  tagsAll: string[]
  authorsAll: string[]
  artistsAll: string[]
  difficulties: string[]
  minBpm: number | null
  maxBpm: number | null
  review: 'peer' | 'pending' | 'rejected' | 'all'
  page: number
  perPage: number
}

export interface LevelDbFacetCount {
  count: number
  highlighted: string
  value: string
}

export interface LevelDbSearchResults {
  hits: Record<string, unknown>[]
  estimatedTotalHits: number
  processingTimeMs: number
  limit: number
  offset: number
  query: string
  facetDistribution: Record<string, LevelDbFacetCount[]>
}

// ---- 官方响应形状 ----

type DatasetteRow = (string | number | null)[]

interface DatasetteFacetBucket {
  value: unknown
  count: number
}

interface DatasetteFacetGroup {
  results?: DatasetteFacetBucket[]
  terms?: DatasetteFacetBucket[]
}

interface DatasetteResponse {
  rows: DatasetteRow[]
  columns: string[]
  next?: string | null
  next_url?: string | null
  filtered_table_rows_count?: number
  facet_results?: Record<string, DatasetteFacetGroup>
  error?: string
}

// ---- 游标映射（唯一状态；只存「页号 → 游标」，不存关卡行）----

interface CursorState {
  // cursors[i] = 进入第 i+1 页要用的 _next；cursors[0] 用 null 占位（起点无游标）；
  // 值为 null 表示该页已到底（next=null），后续页没有更多数据
  cursors: (string | null)[]
  total: number // 最近一次官方响应的 filtered_table_rows_count
  updatedAt: number
}

const cursorStates = new Map<string, CursorState>()
// 同一查询指纹的请求串行化，避免并发翻页把游标数组写乱
const inflight = new Map<string, Promise<unknown>>()

const CURSOR_TTL_MS = 5 * 60 * 1000
const CURSOR_MAX_ENTRIES = 200

function buildFingerprint(params: LevelDbSearchParams): string {
  const { query, tagsAll, authorsAll, artistsAll, difficulties, minBpm, maxBpm, review, perPage } = params
  return JSON.stringify({
    query,
    tagsAll,
    authorsAll,
    artistsAll,
    difficulties,
    minBpm,
    maxBpm,
    review,
    perPage,
    sortBy: 'last_updated',
    sortDesc: true
  })
}

function getCursorState(fingerprint: string): CursorState {
  let state = cursorStates.get(fingerprint)
  const now = Date.now()

  if (state && now - state.updatedAt > CURSOR_TTL_MS) {
    cursorStates.delete(fingerprint)
    state = undefined
  }

  if (state) {
    // 命中即刷新为最近使用（简单 LRU）
    cursorStates.delete(fingerprint)
    cursorStates.set(fingerprint, state)
    return state
  }

  if (cursorStates.size >= CURSOR_MAX_ENTRIES) {
    const oldest = cursorStates.keys().next().value
    if (oldest !== undefined) {
      cursorStates.delete(oldest)
    }
  }

  state = { cursors: [], total: 0, updatedAt: now }
  cursorStates.set(fingerprint, state)
  return state
}

function withFingerprintLock<T>(fingerprint: string, fn: () => Promise<T>): Promise<T> {
  const previous = inflight.get(fingerprint) ?? Promise.resolve()
  const run = previous.catch(() => undefined).then(fn)
  inflight.set(fingerprint, run.then(() => undefined))
  return run
}

// ---- 关键词搜索（_where 跨列 OR LIKE）----
// 文本列直接子串匹配；JSON 数组列（tags/authors/artist_tokens）匹配带引号的
// 精确元素 `"值"`，避免子串误撞。LIKE 通配符 % _ 与转义符 \ 一律转义
const TEXT_SEARCH_COLUMNS = ['song', 'song_alt', 'artist', 'description']
const JSON_SEARCH_COLUMNS = ['tags', 'authors', 'artist_tokens']

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''")
}

function buildWhereClause(query: string): string | undefined {
  const trimmed = query.trim()
  if (!trimmed) {
    return undefined
  }

  const plain = sqlEscape(escapeLike(trimmed))
  const jsonQuoted = sqlEscape(escapeLike(JSON.stringify(trimmed)))
  const clauses = [
    ...TEXT_SEARCH_COLUMNS.map((col) => `${col} like '%${plain}%' escape '\\'`),
    ...JSON_SEARCH_COLUMNS.map((col) => `${col} like '%${jsonQuoted}%' escape '\\'`)
  ]
  return `(${clauses.join(' or ')})`
}

// ---- 行/桶转换 ----

const BOOLEAN_COLUMNS = [
  'seizure_warning',
  'single_player',
  'two_player',
  'is_animated',
  'is_private',
  'is_hidden',
  'has_classics',
  'has_freetimes',
  'has_freezeshots',
  'has_holds',
  'has_oneshots',
  'has_skipshots',
  'has_squareshots',
  'has_window_dance'
]
const JSON_ARRAY_COLUMNS = ['tags', 'authors']

function parseJsonArray(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw) {
    return []
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean)
    }
    return typeof parsed === 'string' && parsed ? [parsed] : []
  } catch {
    return []
  }
}

function parseJsonRef(raw: unknown): { id: string; displayName: string } | undefined {
  if (typeof raw !== 'string' || !raw) {
    return undefined
  }
  try {
    const parsed = JSON.parse(raw) as unknown
    const obj = Array.isArray(parsed) ? parsed[0] : parsed
    if (!obj || typeof obj !== 'object') {
      return undefined
    }
    const record = obj as Record<string, unknown>
    const id = String(record.id ?? '')
    const displayName = String(record.displayName ?? record.display_name ?? record.name ?? id)
    return { id, displayName }
  } catch {
    return undefined
  }
}

function normalizeRow(columns: string[], row: DatasetteRow): Record<string, unknown> {
  const index = new Map(columns.map((col, i) => [col, i]))
  const at = (col: string): unknown => {
    const i = index.get(col)
    return i === undefined ? null : (row[i] ?? null)
  }

  const level: Record<string, unknown> = {}

  for (const col of columns) {
    if (col === 'rowid') {
      continue
    }
    const raw = at(col)
    if (BOOLEAN_COLUMNS.includes(col)) {
      level[col] = raw === 1 || raw === true
    } else if (JSON_ARRAY_COLUMNS.includes(col)) {
      level[col] = parseJsonArray(raw)
    } else if (col === 'submitter') {
      level[col] = parseJsonRef(raw)
    } else if (col === 'club') {
      // 官方 club JSON 的展示字段是 displayName，前端 Level 类型要求 name
      const ref = parseJsonRef(raw)
      level[col] = ref ? { id: ref.id, name: ref.displayName } : undefined
    } else if (col === 'id') {
      level.id = String(raw ?? '')
    } else {
      level[col] = raw
    }
  }

  // 无显式 id 列时退回 rowid（行内列名和取值一致）
  if (!level.id && index.has('rowid')) {
    level.id = String(at('rowid') ?? '')
  }

  return level
}

// 官方按 JSON 整串分桶（每列 30 桶上限），拆桶后按数组元素累加还原单标签计数；
// 极端情况下出现在 30+ 种整串组合里的标签计数会略低，已在文档说明
const JSON_FACET_COLUMNS = ['artist_tokens', 'tags', 'authors']

function distillFacets(
  facetResults?: Record<string, DatasetteFacetGroup>
): Record<string, LevelDbFacetCount[]> {
  const out: Record<string, LevelDbFacetCount[]> = {}
  if (!facetResults) {
    return out
  }

  for (const [column, group] of Object.entries(facetResults)) {
    const buckets = group.results ?? group.terms ?? []
    const counts = new Map<string, number>()

    for (const bucket of buckets) {
      const count = Number(bucket.count) || 0
      if (JSON_FACET_COLUMNS.includes(column)) {
        for (const value of parseJsonArray(bucket.value)) {
          counts.set(value, (counts.get(value) ?? 0) + count)
        }
      } else {
        const value = String(bucket.value)
        counts.set(value, (counts.get(value) ?? 0) + count)
      }
    }

    out[column] = [...counts.entries()]
      .map(([value, count]) => ({ value, count, highlighted: value }))
      .sort((a, b) => b.count - a.count)
  }

  return out
}

// ---- 官方请求 ----

function nextCursor(data: DatasetteResponse): string | null {
  if (typeof data.next === 'string' && data.next) {
    return data.next
  }
  if (typeof data.next_url === 'string' && data.next_url) {
    try {
      const cursor = new URL(data.next_url).searchParams.get('_next')
      if (cursor) {
        return cursor
      }
    } catch {
      // 解析失败按到底处理
    }
  }
  return null
}

async function fetchDatasettePage(
  params: LevelDbSearchParams,
  next: string | undefined,
  wantsFacets: boolean
): Promise<DatasetteResponse> {
  const contains: DatasetteSearchQuery['contains'] = [
    ...params.tagsAll.map((value) => ({ column: 'tags', value })),
    ...params.authorsAll.map((value) => ({ column: 'authors', value })),
    ...params.artistsAll.map((value) => ({ column: 'artist_tokens', value }))
  ]

  const query: DatasetteSearchQuery = {
    perPage: params.perPage,
    ...(next ? { next } : {}),
    ...(params.query.trim() ? { where: buildWhereClause(params.query) } : {}),
    contains,
    ...(params.difficulties.length
      ? { difficulties: params.difficulties.map((value) => Number(value)) }
      : {}),
    ...(params.minBpm !== null ? { minBpm: params.minBpm } : {}),
    ...(params.maxBpm !== null ? { maxBpm: params.maxBpm } : {}),
    approval: params.review,
    // facet 计数只依赖过滤条件，同一查询的各页结果一致，只在首页请求省官方开销
    ...(wantsFacets
      ? { facets: ['artist_tokens', 'tags', 'authors', 'difficulty', 'single_player', 'two_player'] }
      : {})
  }

  const response = await fetchUpstreamDatasetteSearch(query)
  if (!response.ok) {
    throw new Error(`Datasette search failed: ${response.status}`)
  }

  const data = await response.json() as DatasetteResponse
  if (data.error) {
    throw new Error(`Datasette search error: ${data.error}`)
  }
  return data
}

// ---- 主入口 ----

async function searchLevelsDbLocked(
  params: LevelDbSearchParams
): Promise<LevelDbSearchResults> {
  const startedAt = Date.now()
  const fingerprint = buildFingerprint(params)
  const state = getCursorState(fingerprint)
  const targetPage = Math.max(1, params.page)

  // 步骤 1：顺序补拉游标到目标页-1（中间页数据丢弃，只记游标；
  // 顺序翻页时这里是 0 次请求）
  while (state.cursors.length < targetPage - 1) {
    const index = state.cursors.length
    const prevCursor = index === 0 ? undefined : state.cursors[index - 1]

    if (index > 0 && prevCursor === null) {
      // 已到底：补 null 占位到目标位置，让步骤 2 直接短路
      while (state.cursors.length < targetPage - 1) {
        state.cursors.push(null)
      }
      break
    }

    const data = await fetchDatasettePage(params, prevCursor ?? undefined, index === 0)
    state.total = data.filtered_table_rows_count ?? state.total
    state.updatedAt = Date.now()
    state.cursors.push(nextCursor(data))
  }

  // 步骤 2：请求目标页本身。关卡数据不缓存，无论此前是否拉过该页
  // 都必须重新请求（游标仅保证顺序推进不重拉中间页）
  let targetData: DatasetteResponse | undefined
  const prev = targetPage === 1 ? undefined : state.cursors[targetPage - 2]

  if (targetPage === 1 || prev !== null) {
    targetData = await fetchDatasettePage(params, prev ?? undefined, targetPage === 1)
    state.total = targetData.filtered_table_rows_count ?? state.total
    state.updatedAt = Date.now()

    if (state.cursors.length >= targetPage) {
      // 该页坐标已存在（曾拉过）：数据漂移时游标可能变化，覆写
      state.cursors[targetPage - 1] = nextCursor(targetData)
    } else {
      state.cursors.push(nextCursor(targetData))
    }
  }

  return {
    hits: targetData
      ? targetData.rows.map((row) => normalizeRow(targetData.columns, row))
      : [],
    estimatedTotalHits:
      (targetData?.filtered_table_rows_count ?? state.total) || 0,
    processingTimeMs: Date.now() - startedAt,
    limit: params.perPage,
    offset: (targetPage - 1) * params.perPage,
    query: params.query,
    facetDistribution: distillFacets(targetData?.facet_results)
  }
}

export function searchLevelsDb(
  params: LevelDbSearchParams
): Promise<LevelDbSearchResults> {
  // 同一指纹的请求串行：避免并发翻页把游标数组写乱（快速点击下一页时，
  // 后到的请求会等前者完成，游标天然有序）
  return withFingerprintLock(buildFingerprint(params), () =>
    searchLevelsDbLocked(params)
  )
}