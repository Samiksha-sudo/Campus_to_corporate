import { Router }        from 'express'
import { eq, and, desc }  from 'drizzle-orm'
import { randomUUID }     from 'crypto'
import { z }              from 'zod'
import { authenticate }   from '../../middleware/auth.js'
import { asyncHandler }   from '../../utils/asyncHandler.js'
import { db }             from '../../config/database.js'
import { applications }   from '../../db/schema/applications.js'
import { subscriptions }  from '../../db/schema/subscriptions.js'
import { PLAN_LIMITS }    from '../../config/plans.js'
import { AppError }       from '../../utils/errors.js'

const router = Router()
router.use(authenticate)

const createSchema = z.object({
  companyName:    z.string().min(1).max(255),
  jobTitle:       z.string().min(1).max(255),
  jobUrl:         z.string().url().optional(),
  jobDescription: z.string().optional(),
  location:       z.string().max(255).optional(),
  salaryRange:    z.string().max(100).optional(),
  workMode:       z.enum(['REMOTE', 'HYBRID', 'ONSITE']).optional(),
  deadline:       z.string().datetime().optional(),
  notes:          z.string().optional(),
  cvId:           z.string().uuid().optional(),
})

const updateSchema = z.object({
  status: z.enum([
    'RECRUITER_OUTREACH','APPLIED','UNDER_REVIEW','SCREENING',
    'ASSESSMENT','ASSESSMENT_SUBMITTED','HIRING_MANAGER_INTERVIEW',
    'TECHNICAL_INTERVIEW','SYSTEM_DESIGN_INTERVIEW','CODING_INTERVIEW',
    'SECOND_ROUND','THIRD_ROUND','FINAL_ROUND','WAITING_FOR_RESPONSE',
    'REFERENCE_CHECK','BACKGROUND_CHECK','RIGHT_TO_WORK_CHECK',
    'SALARY_DISCUSSION','OFFER_PENDING','OFFER','OFFER_ACCEPTED','OFFER_DECLINED',
    'REJECTED','WITHDRAWN','ROLE_CLOSED','ON_HOLD','TALENT_POOL','NO_RESPONSE','UNKNOWN',
  ]).optional(),
  notes:          z.string().optional(),
  salaryRange:    z.string().max(100).optional(),
  coverLetter:    z.string().optional(),
  cvId:           z.string().uuid().optional(),
})

// GET /applications
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const rows = await db.select().from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt))
  res.json({ success: true, data: { applications: rows } })
}))

// GET /applications/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, req.params.id), eq(applications.userId, userId)))
    .limit(1)
  if (!app) throw new AppError(404, 'Application not found')
  res.json({ success: true, data: { application: app } })
}))

// POST /applications
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const body = createSchema.parse(req.body)

  // Check weekly application limit
  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId)).limit(1)
  const plan = (sub?.plan ?? 'EXPLORE') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  if (limits.weeklyApplications === 0) {
    throw new AppError(403, 'Upgrade your plan to submit applications.')
  }

  // Reset weekly counter if week has rolled over
  const now = new Date()
  let weeklyUsed = sub?.weeklyApplicationsUsed ?? 0
  if (sub?.weekStartedAt) {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000
    if (now.getTime() - new Date(sub.weekStartedAt).getTime() >= msPerWeek) {
      weeklyUsed = 0
      await db.update(subscriptions).set({ weeklyApplicationsUsed: 0, weekStartedAt: now })
        .where(eq(subscriptions.userId, userId))
    }
  }

  if (weeklyUsed >= limits.weeklyApplications) {
    throw new AppError(403, `Weekly limit reached (${limits.weeklyApplications} applications). Resets next week.`)
  }

  const id = randomUUID()
  await db.insert(applications).values({
    id,
    userId,
    companyName:    body.companyName,
    jobTitle:       body.jobTitle,
    jobUrl:         body.jobUrl ?? null,
    jobDescription: body.jobDescription ?? null,
    location:       body.location ?? null,
    salaryRange:    body.salaryRange ?? null,
    workMode:       body.workMode ?? null,
    deadline:       body.deadline ? new Date(body.deadline) : null,
    notes:          body.notes ?? null,
    cvId:           body.cvId ?? null,
    status:         'SAVED',
  })

  // Increment weekly counter (only when status becomes APPLIED later, but track saves too)
  if (!sub?.weekStartedAt) {
    await db.update(subscriptions).set({ weekStartedAt: now })
      .where(eq(subscriptions.userId, userId))
  }

  const [created] = await db.select().from(applications).where(eq(applications.id, id)).limit(1)
  res.status(201).json({ success: true, data: { application: created } })
}))

// PATCH /applications/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const body = updateSchema.parse(req.body)

  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, req.params.id), eq(applications.userId, userId)))
    .limit(1)
  if (!app) throw new AppError(404, 'Application not found')

  const setData: Record<string, unknown> = {}
  if (body.status      != null) setData.status      = body.status
  if (body.notes       != null) setData.notes        = body.notes
  if (body.salaryRange != null) setData.salaryRange  = body.salaryRange
  if (body.coverLetter != null) setData.coverLetter  = body.coverLetter
  if (body.cvId        != null) setData.cvId         = body.cvId

  if (body.status === 'APPLIED' && app.status !== 'APPLIED') {
    setData.appliedAt = new Date()
    // Count against weekly limit
    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, userId)).limit(1)
    if (sub) {
      await db.update(subscriptions)
        .set({ weeklyApplicationsUsed: (sub.weeklyApplicationsUsed ?? 0) + 1 })
        .where(eq(subscriptions.userId, userId))
    }
  }

  await db.update(applications).set(setData as never).where(eq(applications.id, req.params.id))
  const [updated] = await db.select().from(applications).where(eq(applications.id, req.params.id)).limit(1)
  res.json({ success: true, data: { application: updated } })
}))

// POST /applications/:id/approve — customer approves for submission
router.post('/:id/approve', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, req.params.id), eq(applications.userId, userId)))
    .limit(1)
  if (!app) throw new AppError(404, 'Application not found')

  await db.update(applications)
    .set({ userApproved: 1, status: 'PREPARING' })
    .where(eq(applications.id, req.params.id))

  res.json({ success: true, data: { message: 'Application approved — our team will apply shortly.' } })
}))

// DELETE /applications/:id — withdraw
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, req.params.id), eq(applications.userId, userId)))
    .limit(1)
  if (!app) throw new AppError(404, 'Application not found')

  await db.update(applications).set({ status: 'WITHDRAWN' }).where(eq(applications.id, req.params.id))
  res.json({ success: true, data: { message: 'Application withdrawn' } })
}))

export default router
