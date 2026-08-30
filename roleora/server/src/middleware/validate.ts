import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { AnyZodObject, ZodEffects } from 'zod'
import { ValidationError } from '../utils/errors.js'

type Schema = AnyZodObject | ZodEffects<AnyZodObject>

interface ValidateTargets {
  body?:   Schema
  params?: Schema
  query?:  Schema
}

export function validate({ body, params, query }: ValidateTargets): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (body)   req.body   = body.parse(req.body)
      if (params) req.params = params.parse(req.params) as typeof req.params
      if (query)  req.query  = query.parse(req.query)   as typeof req.query
      next()
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errors' in err) {
        next(new ValidationError('Validation failed', (err as { errors: unknown }).errors))
      } else {
        next(err)
      }
    }
  }
}
