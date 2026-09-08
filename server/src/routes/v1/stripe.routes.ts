import { Router }        from 'express'
import { z }             from 'zod'
import { eq, and, gte, count, sql } from 'drizzle-orm'
import { authenticate }  from '../../middleware/auth.js'
import { validate }      from '../../middleware/validate.js'
import { asyncHandler }  from '../../utils/asyncHandler.js'
import * as stripe       from '../../services/stripe.service.js'
import { db }            from '../../config/database.js'
import { subscriptions } from '../../db/schema/subscriptions.js'
import { applications }  from '../../db/schema/applications.js'
import { PLAN_LIMITS }   from '../../config/plans.js'

const router = Router()

const checkoutSchema = z.object({ plan: z.enum(['EXPLORE', 'LAUNCH', 'MOMENTUM']) })

// GET /api/stripe/subscription — current plan + usage
router.get('/subscription', authenticate, asyncHandler(async (req, res) => {
  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, req.user!.id)).limit(1)
  const plan   = (sub?.plan ?? 'STARTER') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  // Calculate this week's start (Monday 00:00:00)
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon, ...
  const daysBack = day === 0 ? 6 : day - 1
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - daysBack)
  weekStart.setHours(0, 0, 0, 0)

  // Count actual submitted applications this week (exclude just-saved or recruiter outreach)
  const [weekRow] = await db.select({ total: count() }).from(applications)
    .where(and(
      eq(applications.userId, req.user!.id),
      gte(applications.createdAt, weekStart),
      sql`${applications.status} NOT IN ('SAVED', 'RECRUITER_OUTREACH')`,
    ))
  const weeklyUsed = weekRow?.total ?? 0

  res.json({
    success: true,
    data: {
      plan:                   plan,
      status:                 sub?.status ?? 'ACTIVE',
      weeklyApplicationsUsed: weeklyUsed,
      weeklyApplicationsLimit:limits.weeklyApplications,
      trialEnd:               sub?.trialEnd ?? null,
      currentPeriodEnd:       sub?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd:      sub?.cancelAtPeriodEnd ?? 0,
      cvReviewDone:           !!(sub?.cvReviewDone),
    },
  })
}))

// POST /api/stripe/sync-plan  — pull latest sub from Stripe and update DB (used after checkout on localhost)
router.post('/sync-plan', authenticate, asyncHandler(async (req, res) => {
  await stripe.syncPlan(req.user!.id)
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.user!.id)).limit(1)
  res.json({ success: true, data: { plan: sub?.plan ?? 'EXPLORE', status: sub?.status ?? 'ACTIVE' } })
}))

// POST /api/stripe/checkout  — create Stripe Checkout session
router.post('/checkout', authenticate, validate({ body: checkoutSchema }), asyncHandler(async (req, res) => {
  const url = await stripe.createCheckoutSession(req.user!.id, req.body.plan)
  res.json({ success: true, data: { url } })
}))

// POST /api/stripe/billing-portal  — open Stripe Billing Portal
router.post('/billing-portal', authenticate, asyncHandler(async (req, res) => {
  const url = await stripe.createBillingPortal(req.user!.id)
  res.json({ success: true, data: { url } })
}))

// POST /api/stripe/webhook  — Stripe webhook events (raw body)
router.post('/webhook', asyncHandler(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string
  await stripe.handleWebhook(req.body as Buffer, sig)
  res.json({ received: true })
}))

export default router
