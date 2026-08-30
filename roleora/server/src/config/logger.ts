import pino from 'pino'
import { env, isDev } from './env.js'

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    },
  }),
  redact: {
    paths: [
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
      'authorization',
      'req.headers.authorization',
      'req.headers.cookie',
      'body.password',
      'body.cvContent',
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (req) => ({
      method:    req.method,
      url:       req.url,
      requestId: req.id,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  base: {
    env: env.NODE_ENV,
  },
})
