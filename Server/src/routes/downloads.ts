import { Readable } from 'node:stream'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { buildDownloadUrl, fetchUpstreamDownload } from '../upstream.js'

type DownloadRequest = FastifyRequest<{
  Params: {
    id: string
  }
}>

const passthroughHeaders = [
  'content-type',
  'content-length',
  'content-disposition',
  'accept-ranges',
  'content-range',
  'etag',
  'last-modified'
] as const

export async function registerDownloadRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/levels/:id/download', async (request: DownloadRequest, reply) => {
    try {
      buildDownloadUrl(request.params.id)

      const upstreamResponse = await fetchUpstreamDownload(
        request.params.id,
        request.headers.range
      )

      reply.code(upstreamResponse.status)
      reply.header('cache-control', 'no-store')

      for (const header of passthroughHeaders) {
        const value = upstreamResponse.headers.get(header)
        if (value) {
          reply.header(header, value)
        }
      }

      if (!upstreamResponse.body) {
        return reply.send()
      }

      return reply.send(
        Readable.fromWeb(
          upstreamResponse.body as unknown as import('node:stream/web').ReadableStream
        )
      )
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid level id') {
        return reply.code(400).send({
          error: 'INVALID_LEVEL_ID',
          message: '无效的关卡 ID'
        })
      }

      request.log.error({ err: error }, 'Failed to download level from upstream')
      return reply.code(502).send({
        error: 'UPSTREAM_UNAVAILABLE',
        message: '下载服务暂时不可用，请稍后再试'
      })
    }
  })
}
