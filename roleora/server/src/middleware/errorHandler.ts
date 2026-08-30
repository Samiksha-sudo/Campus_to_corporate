import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors.js'
import { logger }   from '../config/logger.js'
import { isProd }   from '../config/env.js'

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, requestId: req.requestId, url: req.url }, err.message)
    } else {
      logger.warn({ code: err.code, requestId: req.requestId, url: req.url }, err.message)
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code:    err.code ?? 'ERROR',
        message: err.message,
        ...(err.details && !isProd ? { details: err.details } : {}),
      },
    })
    return
  }

  logger.error({ err, requestId: req.requestId, url: req.url }, 'Unhandled error')

  res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_ERROR',
      message: isProd ? 'An unexpected error occurred' : String(err),
    },
  })
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code:    'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  })
}
