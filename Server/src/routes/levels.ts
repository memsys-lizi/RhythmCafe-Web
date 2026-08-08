import type { FastifyInstance, FastifyRequest } from 'fastify'
import { fetchUpstreamLevels } from '../upstream.js'

type LevelsRequest = FastifyRequest<{
  Querystring: Record<string, unknown>
}>

export async function registerLevelRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/levels', async (request: LevelsRequest, reply) => {
    try {
      const upstreamResponse = await fetchUpstreamLevels(request.query)
      const body = await upstreamResponse.text()
      const contentType = upstreamResponse.headers.get('content-type')

      reply.code(upstreamResponse.status)
      if (contentType) {
        reply.header('content-type', contentType)
      }

      return reply.send(body)
    } catch (error) {
      request.log.error({ err: error }, 'Failed to fetch levels from upstream')
      return reply.code(502).send({
        error: 'UPSTREAM_UNAVAILABLE',
        message: '关卡服务暂时不可用，请稍后再试'
      })
    }
  })
}
