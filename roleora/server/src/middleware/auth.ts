import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env }                  from '../config/env.js'
import { db }                   from '../config/database.js'
import { users }                from '../db/schema/users.js'
import { AuthenticationError }  from '../utils/errors.js'
import { eq }                   from 'drizzle-orm'

interface AccessTokenPayload {
  sub:   string
  email: string
  role:  string
  iat:   number
  exp:   number
}

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return next(new AuthenticationError())
  }

  const token = header.slice(7)
  let payload: AccessTokenPayload

  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
  } catch {
    return next(new AuthenticationError('Invalid or expired token'))
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1)

  if (!user || user.deletedAt) {
    return next(new AuthenticationError('User account not found'))
  }

  req.user = user
  next()
}

export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return next()

  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload
    db.select().from(users).where(eq(users.id, payload.sub)).limit(1).then(([user]) => {
      if (user && !user.deletedAt) req.user = user
      next()
    }).catch(() => next())
  } catch {
    next()
  }
}
