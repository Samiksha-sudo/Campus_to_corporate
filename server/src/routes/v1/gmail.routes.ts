import { Router }      from 'express'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { env }          from '../../config/env.js'
import * as gmail       from '../../services/gmail.service.js'

const router = Router()

// GET /api/gmail/connect  — redirect user to Google OAuth consent
router.get('/connect', authenticate, asyncHandler(async (req, res) => {
  if (!env.GOOGLE_CLIENT_ID) {
    res.status(503).json({ success: false, error: { code: 'NOT_CONFIGURED', message: 'Gmail integration not yet configured. Please add your Google OAuth credentials.' } })
    return
  }
  const url = gmail.getAuthUrl(req.user!.id)
  res.json({ success: true, data: { url } })
}))

// GET /api/gmail/callback — Google redirects here after consent
router.get('/callback', asyncHandler(async (req, res) => {
  const { code, state: userId, error } = req.query as Record<string, string>

  if (error || !code || !userId) {
    return res.redirect(`${env.APP_URL}/app/settings?gmail=error`)
  }

  await gmail.handleCallback(code, userId)
  res.redirect(`${env.APP_URL}/app/settings?gmail=connected`)
}))

// GET /api/gmail/status — current connection status
router.get('/status', authenticate, asyncHandler(async (req, res) => {
  const status = await gmail.getStatus(req.user!.id)
  res.json({ success: true, data: status })
}))

// POST /api/gmail/sync — scan Gmail and update application statuses
router.post('/sync', authenticate, asyncHandler(async (req, res) => {
  const result = await gmail.syncEmails(req.user!.id)
  res.json({ success: true, data: result })
}))

// DELETE /api/gmail/disconnect — remove Gmail connection
router.delete('/disconnect', authenticate, asyncHandler(async (req, res) => {
  await gmail.disconnect(req.user!.id)
  res.json({ success: true, data: { message: 'Gmail disconnected' } })
}))

export default router
