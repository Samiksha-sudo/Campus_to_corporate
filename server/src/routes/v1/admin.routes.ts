import { Router }       from 'express'
import { eq, desc, isNull, and } from 'drizzle-orm'
import { authenticate }  from '../../middleware/auth.js'
import { requireAdmin }  from '../../middleware/rbac.js'
import { asyncHandler }  from '../../utils/asyncHandler.js'
import { db }            from '../../config/database.js'
import { users }         from '../../db/schema/users.js'
import { subscriptions } from '../../db/schema/subscriptions.js'
import { gmailConnections } from '../../db/schema/gmail.js'
import { applications } from '../../db/schema/applications.js'
import { cvs }          from '../../db/schema/cvs.js'
import { PLAN_LIMITS }  from '../../config/plans.js'

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
    const pendingApproval = allApps.filter(a => !a.userApproved && !['REJECTED','WITHDRAWN'].includes(a.status))
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

    const plan = (sub?.plan ?? 'EXPLORE') as keyof typeof PLAN_LIMITS
    const limits = PLAN_LIMITS[plan]

    // Weekly usage — reset if week elapsed
    const now = new Date()
    let weeklyUsed = sub?.weeklyApplicationsUsed ?? 0
    if (sub?.weekStartedAt) {
      const msPerWeek = 7 * 24 * 60 * 60 * 1000
      if (now.getTime() - new Date(sub.weekStartedAt).getTime() >= msPerWeek) {
        weeklyUsed = 0
      }
    }
    const weeklyLimit     = limits.weeklyApplications === Infinity ? 9999 : limits.weeklyApplications
    const weeklyRemaining = Math.max(0, weeklyLimit - weeklyUsed)

    // What services this customer needs
    const needs: string[] = []
    if (!u.emailVerified)                                     needs.push('Email verification')
    if (!u.profileComplete)                                   needs.push('Profile setup')
    if (!gmail)                                               needs.push('Gmail sync')
    if (plan === 'EXPLORE')                                   needs.push('Plan upgrade')
    if (allCVs.filter(c => c.status !== 'ARCHIVED').length === 0) needs.push('First CV')
    if (allCVs.some(c => c.status === 'IN_REVIEW'))          needs.push('CV in review')
    if (allCVs.some(c => c.status === 'REQUIRES_CHANGES'))    needs.push('CV needs changes')
    if (sub?.status === 'PAST_DUE')                           needs.push('Payment issue')
    if (sub?.status === 'TRIALING')                           needs.push('Trial → convert')
    if (pendingApproval.length > 0)                           needs.push(`${pendingApproval.length} job${pendingApproval.length > 1 ? 's' : ''} to approve`)
    if (activeApps.length === 0 && plan !== 'EXPLORE')        needs.push('Start applying')

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

      // Application counts
      totalApps:     allApps.length,
      activeApps:    activeApps.length,
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

      // Features available on their plan
      features: {
        weeklyApplications: limits.weeklyApplications,
        coverLetters:       limits.coverLetters,
        linkedIn:           limits.linkedIn,
        interviewGuarantee: limits.interviewGuarantee,
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

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', asyncHandler(async (req, res) => {
  const { role } = req.body
  await db.update(users).set({ role }).where(eq(users.id, req.params.id))
  res.json({ success: true, data: { message: 'Role updated' } })
}))

// PATCH /api/admin/users/:id/plan — manually set plan (for custom arrangements)
router.patch('/users/:id/plan', asyncHandler(async (req, res) => {
  const { plan } = req.body as { plan: string }
  const validPlans = ['EXPLORE','LAUNCH','MOMENTUM']
  if (!validPlans.includes(plan)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_PLAN', message: 'Invalid plan' } })
    return
  }
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, req.params.id)).limit(1)
  if (sub) {
    await db.update(subscriptions).set({ plan: plan as never }).where(eq(subscriptions.userId, req.params.id))
  }
  res.json({ success: true, data: { message: `Plan updated to ${plan}` } })
}))

export default router
