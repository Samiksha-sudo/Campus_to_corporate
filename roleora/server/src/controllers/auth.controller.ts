import type { Request, Response } from 'express'
import * as authService from '../services/auth.service.js'
import { env, isProd }  from '../config/env.js'

const REFRESH_COOKIE = 'rf_token'

function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge:   30 * 24 * 60 * 60 * 1000,
    path:     '/api/v1/auth',
  })
}

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' })
}

function safeUser(user: Record<string, unknown>) {
  const { passwordHash: _ph, ...rest } = user
  return rest
}

export async function register(req: Request, res: Response): Promise<void> {
  const { user, tokens } = await authService.register(req.body)
  setRefreshCookie(res, tokens.refreshToken)
  res.status(201).json({
    success: true,
    data: { user: safeUser(user as Record<string, unknown>), accessToken: tokens.accessToken },
  })
}

export async function login(req: Request, res: Response): Promise<void> {
  const { user, tokens } = await authService.login(req.body)
  setRefreshCookie(res, tokens.refreshToken)
  res.json({
    success: true,
    data: { user: safeUser(user as Record<string, unknown>), accessToken: tokens.accessToken },
  })
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefresh = req.cookies[REFRESH_COOKIE] as string | undefined
  if (!rawRefresh) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'No refresh token' } })
    return
  }
  const tokens = await authService.rotateRefreshToken(rawRefresh)
  setRefreshCookie(res, tokens.refreshToken)
  res.json({ success: true, data: { accessToken: tokens.accessToken } })
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawRefresh = req.cookies[REFRESH_COOKIE] as string | undefined
  await authService.logout(req.user!.id, rawRefresh)
  clearRefreshCookie(res)
  res.json({ success: true, data: null })
}

export async function me(req: Request, res: Response): Promise<void> {
  res.json({ success: true, data: safeUser(req.user as unknown as Record<string, unknown>) })
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.body as { token: string }
  await authService.verifyEmail(token)
  res.json({ success: true, data: { message: 'Email verified successfully' } })
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  const { email } = req.body as { email: string }
  await authService.forgotPassword(email)
  res.json({ success: true, data: { message: 'If that email is registered, a reset link has been sent' } })
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const { token, password } = req.body as { token: string; password: string }
  await authService.resetPassword(token, password)
  res.json({ success: true, data: { message: 'Password reset successfully. Please log in.' } })
}
