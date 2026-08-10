import Fastify from 'fastify'
import cors from '@fastify/cors'
import { registerDatasetteRoutes } from './routes/datasette.js'
import { registerDownloadRoutes } from './routes/downloads.js'
import { registerLevelRoutes } from './routes/levels.js'
import { registerLevelsDbRoutes } from './routes/levelsDb.js'

const app = Fastify({
  logger: true
})

const configuredOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

await app.register(cors, {
  origin: configuredOrigins?.length ? configuredOrigins : true
})

await registerLevelRoutes(app)
await registerLevelsDbRoutes(app)
await registerDownloadRoutes(app)
await registerDatasetteRoutes(app)

const port = Number(process.env.PORT ?? 7332)
const host = process.env.HOST ?? '0.0.0.0'

try {
  await app.listen({ port, host })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
