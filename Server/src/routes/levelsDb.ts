import type { FastifyInstance, FastifyRequest } from 'fastify'
import {
  LevelDbSearchParams,
  searchLevelsDb
} from '../levelSearchDb.js'

type LevelsDbRequest = FastifyRequest<{
  Querystring: Record<string, unknown>
}>

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 500

function parseNumber(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function parsePerPage(value: unknown): number {
  const n = parseNumber(value)
  if (n === null || n < 1) {
    return DEFAULT_PER_PAGE
  }
  // 钳制到 500（官方 Datasette _size 上限 1000，这里按产品要求 500）
  return Math.min(Math.floor(n), MAX_PER_PAGE)
}

function parsePage(value: unknown): number {
  const n = parseNumber(value)
  if (n === null || n < 1) {
    return 1
  }
  return Math.floor(n)
}

// Fastify 对重复参数解析为数组（tags_all=a&tags_all=b），
// 也兼容逗号分隔的单参数形式
function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String).map((v) => v.trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value.split(',').map((v) => v.trim()).filter(Boolean)
  }
  return []
}

function parseReview(value: unknown): LevelDbSearchParams['review'] {
  if (value === 'pending') {
    return 'pending'
  }
  if (value === 'rejected' || value === 'non-refereed') {
    return 'rejected'
  }
  if (value === 'all') {
    return 'all'
  }
  return 'peer'
}

function buildSearchParams(query: Record<string, unknown>): LevelDbSearchParams {
  return {
    query: typeof query.q === 'string' ? query.q : '',
    tagsAll: parseStringArray(query.tags_all),
    authorsAll: parseStringArray(query.authors_all),
    artistsAll: parseStringArray(query.artists_all),
    difficulties: parseStringArray(query.difficulty),
    minBpm: parseNumber(query.min_bpm),
    maxBpm: parseNumber(query.max_bpm),
    review: parseReview(query.peer_review),
    page: parsePage(query.page),
    perPage: parsePerPage(query.per_page)
  }
}

export async function registerLevelsDbRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/levels/db', async (request: LevelsDbRequest, reply) => {
    const params = buildSearchParams(request.query)

    try {
      const results = await searchLevelsDb(params)

      // 外层 envelope 与 /api/levels 完全一致，前端解析无需改动
      return {
        action: 'render',
        view: 'cafe:level_search',
        overlay: false,
        metadata: { title: '' },
        props: { results },
        context: {},
        messages: []
      }
    } catch (error) {
      request.log.error({ err: error }, 'Failed to search levels via datasette')
      return reply.code(502).send({
        error: 'UPSTREAM_UNAVAILABLE',
        message: '数据库服务暂时不可用，请稍后再试'
      })
    }
  })
}