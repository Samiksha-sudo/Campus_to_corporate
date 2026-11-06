import { Router }       from 'express'
import { z }            from 'zod'
import { randomUUID }   from 'crypto'
import { and, desc, eq, sql } from 'drizzle-orm'
import { authenticate } from '../../middleware/auth.js'
import { requireAdmin, requireStaff } from '../../middleware/rbac.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { AppError }     from '../../utils/errors.js'
import { db }           from '../../config/database.js'
import { users }        from '../../db/schema/users.js'
import { subscriptions } from '../../db/schema/subscriptions.js'
import { applications, interviews } from '../../db/schema/applications.js'
import {
  conciergeProfiles, conciergeActions, recruiterMessages, applicationSubmissions,
} from '../../db/schema/concierge.js'
import { planLimits } from '../../config/plans.js'
import { getAllowance } from '../../services/allowance.service.js'
import { recordSubmission, nextMessageStatus } from '../../services/submission.service.js'

const router = Router()
router.use(authenticate)

async function planFor(userId: string) {
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  return { sub, plan: sub?.plan ?? 'STARTER', managed: planLimits(sub?.plan).managedService }
}

const profileSchema = z.object({
  cvId:              z.string().uuid().nullable().optional(),
  preferredRoles:    z.string().max(2000).optional(),
  locations:         z.string().max(2000).optional(),
  salaryMin:         z.number().int().min(0).nullable().optional(),
  salaryMax:         z.number().int().min(0).nullable().optional(),
  workAuthorisation: z.string().max(255).optional(),
  workModes:         z.array(z.enum(['REMOTE', 'HYBRID', 'ONSITE'])).optional(),
  linkedinUrl:       z.string().url().max(500).optional().or(z.literal('')),
  industries:        z.string().max(2000).optional(),
  applicationNotes:  z.string().max(4000).optional(),
  consentApply:      z.boolean(),
  consentOutreach:   z.boolean(),
})

// ─── Customer ────────────────────────────────────────────────────────────────

// GET /concierge/me — everything the Elite dashboard needs
router.get('/me', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const { sub, plan, managed } = await planFor(userId)
  if (!managed) {
    res.json({ success: true, data: { eligible: false, plan } })
    return
  }
  const [profile] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, userId)).limit(1)
  const allowance = await getAllowance(userId, plan, sub)

  const [inProgress] = await db.select({ n: sql<number>`count(*)` }).from(applications)
    .where(and(eq(applications.userId, userId), sql`${applications.status} = 'PREPARING'`))
  const messages = await db.select().from(recruiterMessages)
    .where(and(eq(recruiterMessages.userId, userId), sql`${recruiterMessages.status} <> 'DRAFT'`))
    .orderBy(desc(recruiterMessages.createdAt)).limit(50)
  const actions = await db.select().from(conciergeActions)
    .where(and(eq(conciergeActions.userId, userId), eq(conciergeActions.status, 'OPEN')))
  const ivs = await db.select({
    id: interviews.id, applicationId: interviews.applicationId, round: interviews.round,
    interviewType: interviews.interviewType, scheduledAt: interviews.scheduledAt,
    company: applications.companyName, role: applications.jobTitle,
  }).from(interviews).innerJoin(applications, eq(applications.id, interviews.applicationId))
    .where(and(eq(interviews.userId, userId), eq(interviews.outcome, 'PENDING')))
    .orderBy(interviews.scheduledAt)

  let specialist: { name: string } | null = null
  if (profile?.assignedSpecialistId) {
    const [sp] = await db.select({ f: users.firstName, l: users.lastName }).from(users)
      .where(eq(users.id, profile.assignedSpecialistId)).limit(1)
    if (sp) specialist = { name: `${sp.f} ${sp.l}` }
  }

  const soon = Date.now() + 2 * 864e5
  res.json({ success: true, data: {
    eligible: true,
    plan,
    subscriptionStatus: sub?.status ?? 'ACTIVE',
    onboardingComplete: !!profile?.onboardingComplete,
    consents: { apply: !!profile?.consentApply, outreach: !!profile?.consentOutreach },
    profile: profile ?? null,
    allowance,
    inProgress: Number(inProgress?.n ?? 0),
    recruiterMessages: messages,
    followUpsDue: messages.filter(m => m.followUpDueAt && new Date(m.followUpDueAt).getTime() <= soon && m.status !== 'REPLIED').length,
    interviewInvitations: ivs,
    pendingActions: actions,
    specialist,
  } })
}))

// PUT /concierge/profile — onboarding answers + explicit permissions
router.put('/profile', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const { managed } = await planFor(userId)
  if (!managed) throw new AppError(403, 'Elite Concierge plan required', 'PLAN_REQUIRED')
  const b = profileSchema.parse(req.body)

  const [existing] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, userId)).limit(1)
  const anyConsent = b.consentApply || b.consentOutreach
  const values = {
    cvId: b.cvId ?? null,
    preferredRoles: b.preferredRoles ?? null,
    locations: b.locations ?? null,
    salaryMin: b.salaryMin ?? null,
    salaryMax: b.salaryMax ?? null,
    workAuthorisation: b.workAuthorisation ?? null,
    workModes: b.workModes?.join(',') ?? null,
    linkedinUrl: b.linkedinUrl || null,
    industries: b.industries ?? null,
    applicationNotes: b.applicationNotes ?? null,
    consentApply: b.consentApply ? 1 : 0,
    consentOutreach: b.consentOutreach ? 1 : 0,
    consentedAt: anyConsent ? (existing?.consentedAt ?? new Date()) : null,
    onboardingComplete: (b.preferredRoles && b.locations && b.workAuthorisation && b.cvId) ? 1 : 0,
  }
  if (existing) await db.update(conciergeProfiles).set(values).where(eq(conciergeProfiles.userId, userId))
  else await db.insert(conciergeProfiles).values({ id: randomUUID(), userId, ...values })
  const [profile] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, userId)).limit(1)
  res.json({ success: true, data: { profile } })
}))

// POST /concierge/actions/:id/done — customer completes an action
router.post('/actions/:id/done', asyncHandler(async (req, res) => {
  await db.update(conciergeActions).set({ status: 'DONE', completedAt: new Date() })
    .where(and(eq(conciergeActions.id, String(req.params.id)), eq(conciergeActions.userId, req.user!.id)))
  res.json({ success: true, data: { message: 'Done' } })
}))

// ─── Staff ───────────────────────────────────────────────────────────────────
const staff = Router()
staff.use(requireStaff())

// GET /concierge/staff/customers — Elite subscribers with allowance + consent state
staff.get('/customers', asyncHandler(async (_req, res) => {
  const subs = await db.select().from(subscriptions).where(eq(subscriptions.plan, 'ELITE'))
  const out = await Promise.all(subs.map(async (s) => {
    const [u] = await db.select().from(users).where(eq(users.id, s.userId)).limit(1)
    const [p] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, s.userId)).limit(1)
    const allowance = await getAllowance(s.userId, s.plan, s)
    return {
      userId: s.userId, name: u ? `${u.firstName} ${u.lastName}` : 'Unknown', email: u?.email,
      status: s.status, onboardingComplete: !!p?.onboardingComplete,
      consentApply: !!p?.consentApply, consentOutreach: !!p?.consentOutreach,
      assignedSpecialistId: p?.assignedSpecialistId ?? null, allowance,
    }
  }))
  res.json({ success: true, data: { customers: out } })
}))

// GET /concierge/staff/customers/:userId — profile, applications, messages, actions
staff.get('/customers/:userId', asyncHandler(async (req, res) => {
  const userId = String(req.params.userId)
  const [profile] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, userId)).limit(1)
  const apps = await db.select().from(applications).where(eq(applications.userId, userId)).orderBy(desc(applications.createdAt)).limit(200)
  const messages = await db.select().from(recruiterMessages).where(eq(recruiterMessages.userId, userId)).orderBy(desc(recruiterMessages.createdAt))
  const actions = await db.select().from(conciergeActions).where(eq(conciergeActions.userId, userId)).orderBy(desc(conciergeActions.createdAt))
  const submissions = await db.select().from(applicationSubmissions).where(eq(applicationSubmissions.userId, userId)).orderBy(desc(applicationSubmissions.createdAt)).limit(100)
  const { sub, plan } = await planFor(userId)
  res.json({ success: true, data: { profile: profile ?? null, applications: apps, messages, actions, submissions, allowance: await getAllowance(userId, plan, sub) } })
}))

const submissionSchema = z.object({
  applicationId: z.string().uuid(),
  result:        z.enum(['ATTEMPTED', 'SUBMITTED', 'FAILED']),
  verified:      z.boolean().default(false),
  evidence:      z.string().max(500).optional(),
  failureReason: z.string().max(500).optional(),
})

// POST /concierge/staff/customers/:userId/submissions — record an attempt/submission
staff.post('/customers/:userId/submissions', asyncHandler(async (req, res) => {
  const b = submissionSchema.parse(req.body)
  const result = await recordSubmission({
    userId: String(req.params.userId), applicationId: b.applicationId, reported: b.result,
    verified: b.verified, evidence: b.evidence, failureReason: b.failureReason, staffId: req.user!.id,
  })
  res.status(201).json({ success: true, data: result })
}))

const messageSchema = z.object({
  applicationId: z.string().uuid().optional(),
  direction:     z.enum(['OUTBOUND', 'INBOUND']).default('OUTBOUND'),
  channel:       z.enum(['EMAIL', 'LINKEDIN', 'PHONE', 'OTHER']).default('EMAIL'),
  recruiterName: z.string().max(255).optional(),
  company:       z.string().max(255).optional(),
  subject:       z.string().max(255).optional(),
  body:          z.string().min(1).max(10000),
  followUpDueAt: z.string().datetime().optional(),
})

// POST /concierge/staff/customers/:userId/messages — draft an outbound message or log an inbound one
staff.post('/customers/:userId/messages', asyncHandler(async (req, res) => {
  const b = messageSchema.parse(req.body)
  const id = randomUUID()
  await db.insert(recruiterMessages).values({
    id, userId: String(req.params.userId), applicationId: b.applicationId ?? null,
    direction: b.direction, channel: b.channel, recruiterName: b.recruiterName ?? null,
    company: b.company ?? null, subject: b.subject ?? null, body: b.body,
    // inbound messages are records of a reply, not something to approve
    status: b.direction === 'INBOUND' ? 'REPLIED' : 'DRAFT',
    followUpDueAt: b.followUpDueAt ? new Date(b.followUpDueAt) : null,
    createdBy: req.user!.id,
  })
  res.status(201).json({ success: true, data: { id } })
}))

// PATCH /concierge/staff/messages/:id — approve / mark sent / reply / escalate
staff.patch('/messages/:id', asyncHandler(async (req, res) => {
  const b = z.object({
    action: z.enum(['approve', 'send', 'reply', 'escalate']),
    followUpDueAt: z.string().datetime().optional(),
  }).parse(req.body)
  const [msg] = await db.select().from(recruiterMessages).where(eq(recruiterMessages.id, String(req.params.id))).limit(1)
  if (!msg) throw new AppError(404, 'Message not found', 'NOT_FOUND')
  const [profile] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, msg.userId)).limit(1)

  const status = nextMessageStatus(msg.status, b.action, !!profile?.consentOutreach)
  const set: Record<string, unknown> = { status }
  if (b.action === 'approve') { set.approvedBy = req.user!.id; set.approvedAt = new Date() }
  if (b.action === 'send') set.sentAt = new Date()
  if (b.followUpDueAt) set.followUpDueAt = new Date(b.followUpDueAt)
  await db.update(recruiterMessages).set(set as never).where(eq(recruiterMessages.id, msg.id))
  res.json({ success: true, data: { status } })
}))

// POST /concierge/staff/customers/:userId/actions — flag something the customer must do
staff.post('/customers/:userId/actions', asyncHandler(async (req, res) => {
  const b = z.object({ description: z.string().min(1).max(500), applicationId: z.string().uuid().optional() }).parse(req.body)
  const id = randomUUID()
  await db.insert(conciergeActions).values({
    id, userId: String(req.params.userId), applicationId: b.applicationId ?? null,
    description: b.description, createdBy: req.user!.id,
  })
  res.status(201).json({ success: true, data: { id } })
}))

const interviewSchema = z.object({
  applicationId: z.string().uuid(),
  round:         z.number().int().min(1).max(10).default(1),
  interviewType: z.enum(['VIDEO', 'PHONE', 'ONSITE', 'TECHNICAL', 'ASSESSMENT']).optional(),
  scheduledAt:   z.string().datetime().optional(),
  interviewers:  z.string().max(1000).optional(),
  notes:         z.string().max(4000).optional(),
  status:        z.enum(['SCREENING', 'ASSESSMENT', 'HIRING_MANAGER_INTERVIEW', 'TECHNICAL_INTERVIEW', 'SECOND_ROUND', 'THIRD_ROUND', 'FINAL_ROUND']).default('SCREENING'),
})

// POST /concierge/staff/customers/:userId/interviews — record an interview and update the tracker
staff.post('/customers/:userId/interviews', asyncHandler(async (req, res) => {
  const userId = String(req.params.userId)
  const b = interviewSchema.parse(req.body)
  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, b.applicationId), eq(applications.userId, userId))).limit(1)
  if (!app) throw new AppError(404, 'Application not found for this customer', 'NOT_FOUND')
  const id = randomUUID()
  await db.insert(interviews).values({
    id, applicationId: b.applicationId, userId, round: b.round,
    interviewType: b.interviewType ?? null,
    scheduledAt: b.scheduledAt ? new Date(b.scheduledAt) : null,
    interviewers: b.interviewers ?? null, notes: b.notes ?? null,
  })
  await db.update(applications).set({ status: b.status }).where(eq(applications.id, b.applicationId))
  res.status(201).json({ success: true, data: { id } })
}))

// PATCH /concierge/staff/customers/:userId/specialist — admin assigns a specialist
staff.patch('/customers/:userId/specialist', requireAdmin(), asyncHandler(async (req, res) => {
  const userId = String(req.params.userId)
  const { specialistId } = z.object({ specialistId: z.string().uuid().nullable() }).parse(req.body)
  const [existing] = await db.select({ id: conciergeProfiles.id }).from(conciergeProfiles).where(eq(conciergeProfiles.userId, userId)).limit(1)
  if (existing) await db.update(conciergeProfiles).set({ assignedSpecialistId: specialistId }).where(eq(conciergeProfiles.userId, userId))
  else await db.insert(conciergeProfiles).values({ id: randomUUID(), userId, assignedSpecialistId: specialistId })
  res.json({ success: true, data: { specialistId } })
}))

router.use('/staff', staff)

export default router
