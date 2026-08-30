import express          from 'express'
import helmet           from 'helmet'
import cors             from 'cors'
import cookieParser     from 'cookie-parser'
import pinoHttp         from 'pino-http'
import { env }          from './config/env.js'
import { logger }       from './config/logger.js'
import { globalLimiter } from './middleware/rateLimiter.js'
import { requestId }    from './middleware/requestId.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import routes           from './routes/index.js'

const app = express()

app.set('trust proxy', 1)

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin:      env.APP_URL,
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}))

app.use(cookieParser())
app.use(requestId)
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/v1/health' } }))

// Stripe webhook needs raw body — must be before express.json()
app.use('/api/v1/stripe/webhook', express.raw({ type: 'application/json' }))

app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))
app.use(globalLimiter)

app.use('/api/v1', routes)

app.use(notFoundHandler)
app.use(errorHandler)

export { app }
