import { eq, and }      from 'drizzle-orm'
import { randomUUID }   from 'crypto'
import { db }           from '../config/database.js'
import {
  users, refreshTokens, emailVerifications, passwordResets,
} from '../db/schema/users.js'
import { subscriptions }  from '../db/schema/subscriptions.js'
import {
  hashPassword, verifyPassword,
  generateSecureToken, hashToken,
} from '../utils/crypto.js'
import {
  signAccessToken, signRefreshToken,
  verifyRefreshToken, refreshTokenExpiresAt,
} from '../utils/jwt.js'
import {
  ConflictError, AuthenticationError,
  NotFoundError, AppError,
} from '../utils/errors.js'
import {
  sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail,
} from './email.service.js'

export interface AuthTokens {
  accessToken:  string
  refreshToken: string
}

export interface RegisterInput {
  firstName: string
  lastName:  string
  email:     string
  password:  string
}

export interface LoginInput {
  email:    string
  password: string
}

export async function register(input: RegisterInput): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email.toLowerCase())).limit(1)
  if (existing.length > 0) throw new ConflictError('An account with this email already exists')

  const userId       = randomUUID()
  const passwordHash = await hashPassword(input.password)

  await db.insert(users).values({
    id:           userId,
    email:        input.email.toLowerCase(),
    passwordHash,
    firstName:    input.firstName,
    lastName:     input.lastName,
    role:         'CUSTOMER',
    emailVerified: 0,
  })

  await db.insert(subscriptions).values({
    id:     randomUUID(),
    userId,
    plan:   'EXPLORE',
    status: 'ACTIVE',
  })

  const verifyToken     = generateSecureToken()
  const verifyTokenHash = hashToken(verifyToken)
  const verifyExpires   = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await db.insert(emailVerifications).values({
    id:        randomUUID(),
    userId,
    tokenHash: verifyTokenHash,
    expiresAt: verifyExpires,
  })

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  const tokens = await issueTokenPair(user)

  sendVerificationEmail(user.email, user.firstName, verifyToken).catch(() => {})

  return { user, tokens }
}

export async function login(input: LoginInput): Promise<{ user: typeof users.$inferSelect; tokens: AuthTokens }> {
  const [user] = await db.select().from(users).where(eq(users.email, input.email.toLowerCase())).limit(1)

  if (!user || user.deletedAt) throw new AuthenticationError('Invalid email or password')

  const valid = await verifyPassword(input.password, user.passwordHash)
  if (!valid) throw new AuthenticationError('Invalid email or password')

  const tokens = await issueTokenPair(user)
  return { user, tokens }
}

export async function rotateRefreshToken(rawRefreshToken: string): Promise<AuthTokens> {
  let payload: { sub: string; family: string }
  try {
    payload = verifyRefreshToken(rawRefreshToken)
  } catch {
    throw new AuthenticationError('Invalid refresh token')
  }

  const tokenHash = hashToken(rawRefreshToken)

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1)

  if (!stored) throw new AuthenticationError('Refresh token not found')

  if (stored.used) {
    await db.delete(refreshTokens).where(eq(refreshTokens.family, stored.family))
    throw new AuthenticationError('Refresh token reuse detected — please log in again')
  }

  if (stored.expiresAt < new Date()) throw new AuthenticationError('Refresh token expired')

  await db.update(refreshTokens).set({ used: 1 }).where(eq(refreshTokens.tokenHash, tokenHash))

  const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1)
  if (!user || user.deletedAt) throw new AuthenticationError('User not found')

  return issueTokenPair(user)
}

export async function logout(userId: string, rawRefreshToken?: string): Promise<void> {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken)
    const [stored] = await db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash)).limit(1)
    if (stored) {
      await db.delete(refreshTokens).where(eq(refreshTokens.family, stored.family))
      return
    }
  }
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
}

export async function verifyEmail(token: string): Promise<void> {
  const tokenHash = hashToken(token)

  const [record] = await db
    .select()
    .from(emailVerifications)
    .where(eq(emailVerifications.tokenHash, tokenHash))
    .limit(1)

  if (!record || record.usedAt) throw new AppError(400, 'Invalid or expired verification link', 'INVALID_TOKEN')
  if (record.expiresAt < new Date())   throw new AppError(400, 'Verification link has expired', 'TOKEN_EXPIRED')

  await db.update(emailVerifications).set({ usedAt: new Date() }).where(eq(emailVerifications.tokenHash, tokenHash))
  await db.update(users).set({ emailVerified: 1 }).where(eq(users.id, record.userId))

  const [user] = await db.select().from(users).where(eq(users.id, record.userId)).limit(1)
  if (user) sendWelcomeEmail(user.email, user.firstName).catch(() => {})
}

export async function forgotPassword(email: string): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1)
  if (!user) return

  const token     = generateSecureToken()
  const tokenHash = hashToken(token)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

  await db.insert(passwordResets).values({
    id: randomUUID(), userId: user.id, tokenHash, expiresAt,
  })

  sendPasswordResetEmail(user.email, user.firstName, token).catch(() => {})
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token)

  const [record] = await db
    .select()
    .from(passwordResets)
    .where(eq(passwordResets.tokenHash, tokenHash))
    .limit(1)

  if (!record || record.usedAt) throw new AppError(400, 'Invalid or expired reset link', 'INVALID_TOKEN')
  if (record.expiresAt < new Date())   throw new AppError(400, 'Reset link has expired', 'TOKEN_EXPIRED')

  const passwordHash = await hashPassword(newPassword)

  await db.update(passwordResets).set({ usedAt: new Date() }).where(eq(passwordResets.tokenHash, tokenHash))
  await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId))

  await db.delete(refreshTokens).where(eq(refreshTokens.userId, record.userId))
}

async function issueTokenPair(user: typeof users.$inferSelect): Promise<AuthTokens> {
  const family      = randomUUID()
  const rawRefresh  = signRefreshToken(user.id, family)
  const tokenHash   = hashToken(rawRefresh)
  const expiresAt   = refreshTokenExpiresAt()

  await db.insert(refreshTokens).values({
    id: randomUUID(), userId: user.id, tokenHash, family, expiresAt,
  })

  return {
    accessToken:  signAccessToken(user),
    refreshToken: rawRefresh,
  }
}
