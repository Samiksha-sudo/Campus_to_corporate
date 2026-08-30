import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { InferSelectModel } from 'drizzle-orm'
import type { users } from '../db/schema/users.js'

type User = InferSelectModel<typeof users>

export interface AccessTokenPayload {
  sub:   string
  email: string
  role:  string
}

export interface RefreshTokenPayload {
  sub:    string
  family: string
}

export function signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRY as jwt.SignOptions['expiresIn'] },
  )
}

export function signRefreshToken(userId: string, family: string): string {
  return jwt.sign(
    { sub: userId, family } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRY as jwt.SignOptions['expiresIn'] },
  )
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload
}

export function refreshTokenExpiresAt(): Date {
  const days = parseInt(env.JWT_REFRESH_EXPIRY.replace('d', ''), 10) || 30
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d
}
