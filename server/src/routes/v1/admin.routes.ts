import { Router }       from 'express'
import { eq, desc, isNull, and, gte } from 'drizzle-orm'
import { authenticate }  from '../../middleware/auth.js'
import { requireAdmin }  from '../../middleware/rbac.js'
import { asyncHandler }  from '../../utils/asyncHandler.js'
import { db }            from '../../config/database.js'
import { users }         from '../../db/schema/users.js'
import { subscriptions } from '../../db/schema/subscriptions.js'
import { gmailConnections } from '../../db/schema/gmail.js'
import { applications } from '../../db/schema/applications.js'
import { cvs }          from '../../db/schema/cvs.js'
import { applicationSubmissions } from '../../db/schema/concierge.js'
import { PLAN_KEYS, planLimits } from '../../config/plans.js'
import { getAllowance } from '../../services/allowance.service.js'
import { ukWeekStart, ukWeekEnd, effectiveWeeklyUsed } from '../../utils/week.js'

const router = Router()

router.use(authenticate, requireAdmin())

// GET /api/admin/users — all customers with plan + usage + needs
router.get('/users', asyncHandler(async (_req, res) => {
  const allUsers = await db
    .select()
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(desc(users.createdAt))

  const enriched = await Promise.all(allUsers.map(async (u) => {
    const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, u.id)).limit(1)
    const [gmail] = await db.select({ email: gmailConnections.gmailEmail, lastSync: gmailConnections.lastSyncedAt })
      .from(gmailConnections).where(eq(gmailConnections.userId, u.id)).limit(1)

    // All applications with status breakdown
    const allApps = await db.select().from(applications).where(eq(applications.userId, u.id))

    // Applications by status
    const appsByStatus: Record<string, number> = {}
    for (const app of allApps) {
      appsByStatus[app.status] = (appsByStatus[app.status] ?? 0) + 1
    }

    // Active pipeline (not rejected/withdrawn)
    const activeApps      = allApps.filter(a => !['REJECTED','WITHDRAWN'].includes(a.status))
    const appliedCount    = allApps.filter(a => !['RECRUITER_OUTREACH','UNKNOWN'].includes(a.status)).length
    const interviewCount  = allApps.filter(a => ['SCREENING','ASSESSMENT','ASSESSMENT_SUBMITTED','HIRING_MANAGER_INTERVIEW','TECHNICAL_INTERVIEW','SYSTEM_DESIGN_INTERVIEW','CODING_INTERVIEW','SECOND_ROUND','THIRD_ROUND','FINAL_ROUND'].includes(a.status)).length
    const offerCount      = allApps.filter(a => a.status === 'OFFER').length

    // CVs by status
    const allCVs          = await db.select().from(cvs).where(and(eq(cvs.userId, u.id)))
    const cvsByStatus: Record<string, number> = {}
    for (const cv of allCVs) {
      cvsByStatus[cv.status] = (cvsByStatus[cv.status] ?? 0) + 1
    }
    const approvedCVs = allCVs.filter(c => c.status === 'APPROVED').length

    const plan = sub?.plan ?? 'STARTER'
    const limits = planLimits(plan)

    // Weekly usage = verified submissions this UK week (same source as customer + entitlement checks)
    const allowance = await getAllowance(u.id, plan, sub)
    const weeklyUsed = allowance.used
    const weeklyLimit = limits.weeklyApplications
    const weeklyRemaining = allowance.remaining

    // What services this customer needs
    const needs: string[] = []
    if (!u.emailVerified)                                     needs.push('Email verification')
    if (!u.profileComplete)                                   needs.push('Profile setup')
    if (!gmail)                                               needs.push('Gmail sync')
    if (plan === 'STARTER' || plan === 'EXPLORE')              needs.push('Plan upgrade')
    if (limits.managedService)                                needs.push('Managed service')
    if (allCVs.filter(c => c.status !== 'ARCHIVED').length === 0) needs.push('First CV')
    if (allCVs.some(c => c.status === 'IN_REVIEW'))          needs.push('CV in review')
    if (allCVs.some(c => c.status === 'REQUIRES_CHANGES'))    needs.push('CV needs changes')
    if (sub?.status === 'PAST_DUE')                           needs.push('Payment issue')
    if (sub?.status === 'TRIALING')                           needs.push('Trial → convert')
    if (activeApps.length === 0 && plan !== 'STARTER' && plan !== 'EXPLORE') needs.push('Start applying')

    return {
      id:              u.id,
      name:            `${u.firstName} ${u.lastName}`,
      email:           u.email,
      role:            u.role,
      emailVerified:   !!u.emailVerified,
      profileComplete: !!u.profileComplete,
      joinedAt:        u.createdAt,

      // Plan
      plan:            plan,
      planStatus:      sub?.status ?? 'ACTIVE',
      trialEnd:        sub?.trialEnd ?? null,

      // Weekly application usage
      weeklyAppsUsed:      weeklyUsed,
      weeklyAppsLimit:     weeklyLimit,
      weeklyAppsRemaining: weeklyRemaining,
      weeklyOutcomes:      allowance.outcomes,

      // Application counts
      totalApps:  allApps.length,
      activeApps: activeApps.length,
      appliedCount,
      interviewCount,
      offerCount,
      appsByStatus,

      // CV counts
      totalCVs:   allCVs.filter(c => c.status !== 'ARCHIVED').length,
      approvedCVs,
      cvsByStatus,

      // Services
      gmail:  gmail ? { email: gmail.email, lastSync: gmail.lastSync } : null,
      needs,
      cvReviewDone: !!(sub?.cvReviewDone),

      // Features available on their plan
      features: {
        weeklyApplications: limits.weeklyApplications,
        coverLetters:       limits.coverLetters,
        linkedIn:           limits.linkedIn,
        managedService:     limits.managedService,
        cvChanges:          limits.cvChanges,
      },
    }
  }))

  // Summary stats
  const stats = {
    total:             allUsers.length,
    explore:           enriched.filter(u => u.plan === 'EXPLORE').length,
    launch:            enriched.filter(u => u.plan === 'LAUNCH').length,
    momentum:          enriched.filter(u => u.plan === 'MOMENTUM').length,
    elite:             enriched.filter(u => u.plan === 'ELITE').length,
    trialing:          enriched.filter(u => u.planStatus === 'TRIALING').length,
    pastDue:           enriched.filter(u => u.planStatus === 'PAST_DUE').length,
    needsAttention:    enriched.filter(u => u.needs.length > 0).length,
    totalApplications: enriched.reduce((sum, u) => sum + u.totalApps, 0),
    totalApplied:      enriched.reduce((sum, u) => sum + u.appliedCount, 0),
    totalInterviews:   enriched.reduce((sum, u) => sum + u.interviewCount, 0),
    totalOffers:       enriched.reduce((sum, u) => sum + u.offerCount, 0),
  }

  res.json({ success: true, data: { users: enriched, stats } })
}))

// GET /api/admin/weekly?weeks=8 — per-customer submitted applications per week (UK weeks, Mon 00:00 reset)
router.get('/weekly', asyncHandler(async (req, res) => {
  const weeks = Math.min(26, Math.max(1, Number(req.query.weeks) || 8))
  const starts = Array.from({ length: weeks }, (_, i) => ukWeekStart(new Date(), weeks - 1 - i))
  const rangeStart = starts[0]

  const allUsers = await db.select().from(users).where(isNull(users.deletedAt)).orderBy(desc(users.createdAt))
  const subs = await db.select().from(subscriptions)
  const apps = await db.select({ userId: applicationSubmissions.userId, outcome: applicationSubmissions.outcome, verified: applicationSubmissions.verified, createdAt: applicationSubmissions.createdAt })
    .from(applicationSubmissions).where(gte(applicationSubmissions.createdAt, rangeStart))

  const planByUser = new Map(subs.map(s => [s.userId, s.plan]))
  const subByUser  = new Map(subs.map(s => [s.userId, s]))
  const buckets = new Map<string, number[]>()
  for (const a of apps) {
    if (a.outcome !== 'SUBMITTED' || !a.verified) continue
    const t = new Date(a.createdAt).getTime()
    let idx = -1
    for (let i = starts.length - 1; i >= 0; i--) { if (t >= starts[i].getTime()) { idx = i; break } }
    if (idx < 0) continue
    const row = buckets.get(a.userId) ?? new Array(weeks).fill(0)
    row[idx]++
    buckets.set(a.userId, row)
  }

  const customers = allUsers.map(u => {
    const plan = planByUser.get(u.id) ?? 'STARTER'
    const limit = planLimits(plan).weeklyApplications
    const perWeek = buckets.get(u.id) ?? new Array(weeks).fill(0)
    return {
      id: u.id, name: `${u.firstName} ${u.lastName}`, email: u.email, plan,
      weeklyLimit: limit,
      thisWeek: effectiveWeeklyUsed(subByUser.get(u.id), perWeek[weeks - 1]),
      perWeek,
    }
  })

  res.json({ success: true, data: {
    weeks: starts.map(d => d.toISOString()),
    resetsAt: ukWeekEnd().toISOString(),
    customers,
  } })
}))

// PATCH /api/admin/users/:id/weekly — set this week's completed-application count (slider). Clears itself next week.
router.patch('/users/:id/weekly', asyncHandler(async (req, res) => {
  const userId = String(req.params.id)
  const count = Number((req.body as { count?: unknown }).count)
  if (!Number.isInteger(count) || count < 0 || count > 1000) {
    res.status(400).json({ success: false, error: { code: 'INVALID_COUNT', message: 'count must be a whole number between 0 and 1000' } })
    return
  }
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  if (!sub) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } })
    return
  }
  await db.update(subscriptions).set({ weeklyApplicationsUsed: count, weekStartedAt: new Date() }).where(eq(subscriptions.userId, userId))
  res.json({ success: true, data: { thisWeek: count } })
}))

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body
  await db.update(users).set({ role }).where(eq(users.id, req.params.id))
  res.json({ success: true, data: { message: 'Role updated' } })
}))

// PATCH /api/admin/users/:id/plan — manually set plan (for custom arrangements)
router.patch('/users/:id/plan', asyncHandler(async (req, res) => {
  const { plan } = req.body as { plan: string }
  if (!(PLAN_KEYS as string[]).includes(plan)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_PLAN', message: 'Invalid plan' } })
    return
  }
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.id)).limit(1)
  if (sub) {
    await db.update(subscriptions).set({ plan: plan as never }).where(eq(subscriptions.userId, req.params.id))
  }
  res.json({ success: true, data: { message: `Plan updated to ${plan}` } })
}))

// PATCH /api/admin/users/:id/cv-review — mark starter CV review as done/undone
router.patch('/users/:id/cv-review', asyncHandler(async (req, res) => {
  const { done } = req.body as { done: boolean }
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.id)).limit(1)
  if (!sub) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Subscription not found' } })
    return
  }
  await db.update(subscriptions).set({ cvReviewDone: done ? 1 : 0 }).where(eq(subscriptions.userId, req.params.id))
  res.json({ success: true, data: { cvReviewDone: done } })
}))

export default router
