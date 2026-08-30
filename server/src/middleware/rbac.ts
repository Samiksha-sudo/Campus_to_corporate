import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ForbiddenError, AuthenticationError } from '../utils/errors.js'

type Role = 'CUSTOMER' | 'CAREER_SPECIALIST' | 'CV_WRITER' | 'APPLICATION_SPECIALIST' | 'ADMIN' | 'SUPER_ADMIN'

const ROLE_HIERARCHY: Record<Role, number> = {
  CUSTOMER:               0,
  CAREER_SPECIALIST:      1,
  CV_WRITER:              1,
  APPLICATION_SPECIALIST: 1,
  ADMIN:                  2,
  SUPER_ADMIN:            3,
}

export function requireRole(...allowed: Role[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AuthenticationError())

    const userRole = req.user.role as Role

    if (allowed.some((r) => r === userRole || ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[r])) {
      return next()
    }

    next(new ForbiddenError())
  }
}

export function requireAdmin(): RequestHandler {
  return requireRole('ADMIN', 'SUPER_ADMIN')
}

export function requireStaff(): RequestHandler {
  return requireRole('CAREER_SPECIALIST', 'CV_WRITER', 'APPLICATION_SPECIALIST', 'ADMIN', 'SUPER_ADMIN')
}
