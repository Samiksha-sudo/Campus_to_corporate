import { Resend }  from 'resend'
import { env }     from '../config/env.js'
import { logger }  from '../config/logger.js'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY not set')
    _resend = new Resend(env.RESEND_API_KEY)
  }
  return _resend
}

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    logger.info({ to, subject }, '[Email] Skipped — no RESEND_API_KEY')
    return
  }
  const { error } = await getResend().emails.send({ from: env.EMAIL_FROM, to, subject, html })
  if (error) logger.error({ error, to, subject }, 'Email send failed')
}

export async function sendVerificationEmail(to: string, firstName: string, token: string): Promise<void> {
  const link = `${env.APP_URL}/verify-email?token=${token}`
  await send(to, 'Verify your Campus to Corporate email', `
    <p>Hi ${firstName},</p>
    <p>Please verify your email address by clicking the link below:</p>
    <p><a href="${link}">Verify email</a></p>
    <p>This link expires in 24 hours.</p>
    <p>If you didn't create a Campus to Corporate account, you can ignore this email.</p>
  `)
}

export async function sendPasswordResetEmail(to: string, firstName: string, token: string): Promise<void> {
  const link = `${env.APP_URL}/reset-password?token=${token}`
  await send(to, 'Reset your Campus to Corporate password', `
    <p>Hi ${firstName},</p>
    <p>We received a request to reset your password. Click the link below to choose a new one:</p>
    <p><a href="${link}">Reset password</a></p>
    <p>This link expires in 1 hour. If you didn't request a password reset, you can ignore this email.</p>
  `)
}

export async function sendWelcomeEmail(to: string, firstName: string): Promise<void> {
  await send(to, 'Welcome to Campus to Corporate', `
    <p>Hi ${firstName},</p>
    <p>Welcome to Campus to Corporate — your career, managed.</p>
    <p>You can now log in and start building your Evidence Bank and CV.</p>
    <p>If you have any questions, just reply to this email.</p>
  `)
}
