import './src/config/env.js'
import { app }             from './src/app.js'
import { env }             from './src/config/env.js'
import { logger }          from './src/config/logger.js'
import { testConnection }  from './src/config/database.js'

async function start() {
  try {
    await testConnection()
  } catch (err) {
    logger.error({ err }, 'Failed to connect to database — exiting')
    process.exit(1)
  }

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Roleora API started')
  })

  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received')
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

start()
