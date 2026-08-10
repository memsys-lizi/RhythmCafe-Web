import type { FastifyInstance, FastifyRequest } from 'fastify'
import { fetchUpstreamDatasette } from '../upstream.js'

type DatasetteRequest = FastifyRequest<{
  Querystring: Record<string, unknown>
}>

// 路径镜像官方 Datasette，客户端只需把 base URL 换成 /api/db 即可
const datasetteEndpointPath = '/api/db/rdlevels/rdlevels.json'

function firstValue(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return firstValue(value[0])
  }

  if (value === undefined || value === null) {
    return undefined
  }

  const text = String(value).trim()
  return text || undefined
}

function parseOffset(value: unknown): number | undefined {
  const text = firstValue(value)
  if (text === undefined) {
    return undefined
  }

  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : NaN
}

function rewriteNextUrl(nextUrl: string): string {
  try {
    const url = new URL(nextUrl)
    const params = new URLSearchParams()

    for (const key of ['_size', '_next', '_shape'] as const) {
      const value = url.searchParams.get(key)
      if (value) {
        params.set(key, value)
      }
    }

    const queryString = params.toString()
    return queryString
      ? `${datasetteEndpointPath}?${queryString}`
      : datasetteEndpointPath
  } catch {
    return nextUrl
  }
}

function rewriteDatasetteBody(body: string): string {
  try {
    const data = JSON.parse(body) as Record<string, unknown>

    // 上游 next_url 指向 datasette.rhythm.cafe 且是 http，必须重写回镜像，
    // 否则客户端跟随后就会绕过镜像直连官方
    if (data && typeof data === 'object' && typeof data.next_url === 'string') {
      data.next_url = rewriteNextUrl(data.next_url)
    }

    return JSON.stringify(data)
  } catch {
    // 非 JSON 响应（例如上游 HTML 错误页），原样透传
    return body
  }
}

export async function registerDatasetteRoutes(app: FastifyInstance): Promise<void> {
  app.get(datasetteEndpointPath, async (request: DatasetteRequest, reply) => {
    // 上游会静默忽略 _offset，直接透传会造成静默错数据，这里明确拒绝并引导使用游标
    const offset = parseOffset(request.query['_offset'])
    if (offset !== undefined && offset !== 0) {
      return reply.code(400).send({
        error: 'OFFSET_NOT_SUPPORTED',
        message: '官方 Datasette 不支持 offset 分页，请使用 _next 游标'
      })
    }

    try {
      const upstreamResponse = await fetchUpstreamDatasette({
        size: firstValue(request.query['_size']),
        next: firstValue(request.query['_next']),
        shape: firstValue(request.query['_shape'])
      })

      const body = await upstreamResponse.text()
      const contentType = upstreamResponse.headers.get('content-type')

      reply.code(upstreamResponse.status)
      if (contentType) {
        reply.header('content-type', contentType)
      }

      return reply.send(rewriteDatasetteBody(body))
    } catch (error) {
      request.log.error({ err: error }, 'Failed to fetch datasette from upstream')
      return reply.code(502).send({
        error: 'UPSTREAM_UNAVAILABLE',
        message: '数据库服务暂时不可用，请稍后再试'
      })
    }
  })
}