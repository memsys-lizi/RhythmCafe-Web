const upstreamBaseUrl = process.env.RHYTHM_CAFE_BASE_URL ?? 'https://rhythm.cafe'
const datasetteBaseUrl = process.env.DATASETTE_BASE_URL ?? 'https://datasette.rhythm.cafe'
const upstreamUserAgent = process.env.UPSTREAM_USER_AGENT ?? 'RhythmCafeProxy/0.1'

const forwardedQueryKeys = [
  'q',
  'page',
  'tags_all',
  'authors_all',
  'artists_all',
  'difficulty',
  'min_bpm',
  'max_bpm',
  'peer_review'
] as const

type UpstreamQuery = Record<string, unknown>

function queryValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(queryValues)
  }

  if (value === undefined || value === null) {
    return []
  }

  const text = String(value).trim()
  return text ? [text] : []
}

export function buildLevelsUrl(query: UpstreamQuery): URL {
  const url = new URL('/levels/', upstreamBaseUrl)
  url.searchParams.set('_bridge', '1')

  for (const key of forwardedQueryKeys) {
    for (const value of queryValues(query[key])) {
      url.searchParams.append(key, value)
    }
  }

  return url
}

export async function fetchUpstreamLevels(query: UpstreamQuery): Promise<Response> {
  return fetch(buildLevelsUrl(query), {
    headers: {
      accept: '*/*',
      referer: `${upstreamBaseUrl}/`,
      'user-agent': upstreamUserAgent
    },
    signal: AbortSignal.timeout(15_000)
  })
}

export function buildDownloadUrl(id: string): URL {
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) {
    throw new Error('Invalid level id')
  }

  return new URL(`/levels/${id}/download/`, upstreamBaseUrl)
}

export async function fetchUpstreamDownload(
  id: string,
  range?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    accept: 'application/octet-stream',
    referer: `${upstreamBaseUrl}/`,
    'user-agent': upstreamUserAgent
  }

  if (range) {
    headers.range = range
  }

  return fetch(buildDownloadUrl(id), {
    headers,
    signal: AbortSignal.timeout(60_000)
  })
}

// DatasetteQuery 结构本身就是白名单：只允许 _size/_next/_shape 三个参数，
// 其余参数（包括任意 SQL）一律不透传
export interface DatasetteQuery {
  size?: string
  next?: string
  shape?: string
}

export function buildDatasetteUrl(query: DatasetteQuery): URL {
  const url = new URL('/rdlevels/rdlevels.json', datasetteBaseUrl)

  if (query.size) {
    url.searchParams.set('_size', query.size)
  }
  if (query.next) {
    url.searchParams.set('_next', query.next)
  }
  if (query.shape) {
    url.searchParams.set('_shape', query.shape)
  }

  return url
}

export async function fetchUpstreamDatasette(
  query: DatasetteQuery
): Promise<Response> {
  return fetch(buildDatasetteUrl(query), {
    headers: {
      accept: 'application/json',
      referer: `${datasetteBaseUrl}/`,
      'user-agent': upstreamUserAgent
    },
    signal: AbortSignal.timeout(30_000)
  })
}

// ---- 数据库搜索（/api/levels/db 中转用）----
// DatasetteSearchQuery 结构本身就是白名单：服务端把前端参数翻译成这些固定字段，
// 客户端不能直接透传任意参数（包括任意 SQL）
export interface DatasetteSearchQuery {
  perPage: number // _size
  next?: string // _next 不透明游标
  where?: string // _where：q 关键词的跨列 OR LIKE，由上层生成
  contains: { column: string; value: string }[] // column__contains="value"，多项为 AND
  difficulties?: number[] // difficulty__in=0,1,2 CSV 单参数
  minBpm?: number // min_bpm__gte
  maxBpm?: number // max_bpm__lte
  approval?: 'peer' | 'pending' | 'rejected' | 'all'
  facets?: string[] // _facet 重复参数
}

export function buildDatasetteSearchUrl(query: DatasetteSearchQuery): URL {
  const url = new URL('/rdlevels/rdlevels.json', datasetteBaseUrl)
  url.searchParams.set('_size', String(query.perPage))

  if (query.next) {
    url.searchParams.set('_next', query.next)
  }
  if (query.where) {
    url.searchParams.set('_where', query.where)
  }

  // JSON 数组列精确匹配：值用 JSON.stringify 包裹引号，避免子串误撞
  for (const { column, value } of query.contains) {
    url.searchParams.append(`${column}__contains`, JSON.stringify(value))
  }

  if (query.difficulties?.length) {
    url.searchParams.set('difficulty__in', query.difficulties.join(','))
  }
  if (query.minBpm !== undefined) {
    url.searchParams.set('min_bpm__gte', String(query.minBpm))
  }
  if (query.maxBpm !== undefined) {
    url.searchParams.set('max_bpm__lte', String(query.maxBpm))
  }

  // 审核口径与官方搜索 API 一致；缺省按已审核（peer）
  if (query.approval === 'pending') {
    url.searchParams.set('approval__exact', '0')
  } else if (query.approval === 'rejected') {
    url.searchParams.set('approval__lt', '0')
  } else if (query.approval !== 'all') {
    url.searchParams.set('approval__gte', '10')
  }
  url.searchParams.set('is_hidden__exact', '0')

  if (query.facets?.length) {
    // 官方 1.x 不认 CSV 形式的 _facet（400），必须重复参数
    for (const facet of query.facets) {
      url.searchParams.append('_facet', facet)
    }
  }

  // 与搜索 API 无关键词时的排序一致。
  // 官方 1.x 降序排序用 _sort_desc=col（_sort + _sort_by_desc 会 302 重定向）
  url.searchParams.set('_sort_desc', 'last_updated')

  return url
}

export async function fetchUpstreamDatasetteSearch(
  query: DatasetteSearchQuery
): Promise<Response> {
  return fetch(buildDatasetteSearchUrl(query), {
    headers: {
      accept: 'application/json',
      referer: `${datasetteBaseUrl}/`,
      'user-agent': upstreamUserAgent
    },
    signal: AbortSignal.timeout(30_000)
  })
}
