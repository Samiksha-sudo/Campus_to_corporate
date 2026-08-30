import { Router }       from 'express'
import { eq, and, desc } from 'drizzle-orm'
import { randomUUID }    from 'crypto'
import { z }             from 'zod'
import { authenticate }  from '../../middleware/auth.js'
import { asyncHandler }  from '../../utils/asyncHandler.js'
import { db }            from '../../config/database.js'
import { cvs }           from '../../db/schema/cvs.js'
import { subscriptions } from '../../db/schema/subscriptions.js'
import { PLAN_LIMITS }   from '../../config/plans.js'
import { AppError }      from '../../utils/errors.js'

const router = Router()
router.use(authenticate)

const createSchema = z.object({
  title:        z.string().min(1).max(255),
  targetRole:   z.string().max(255).optional(),
  targetSector: z.string().max(255).optional(),
  content:      z.string().optional(),
})

const updateSchema = z.object({
  title:        z.string().min(1).max(255).optional(),
  targetRole:   z.string().max(255).optional(),
  targetSector: z.string().max(255).optional(),
  content:      z.string().optional(),
  isPrimary:    z.boolean().optional(),
})

// GET /cvs
router.get('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const rows = await db.select().from(cvs)
    .where(eq(cvs.userId, userId))
    .orderBy(desc(cvs.createdAt))
  res.json({ success: true, data: { cvs: rows } })
}))

// GET /cvs/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const [cv] = await db.select().from(cvs)
    .where(and(eq(cvs.id, req.params.id), eq(cvs.userId, userId)))
    .limit(1)
  if (!cv) throw new AppError(404, 'CV not found')
  res.json({ success: true, data: { cv } })
}))

// POST /cvs
router.post('/', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const body = createSchema.parse(req.body)

  // Check plan limits
  const [sub] = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId)).limit(1)
  const plan = (sub?.plan ?? 'EXPLORE') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan]

  const existing = await db.select().from(cvs).where(eq(cvs.userId, userId))
  const usedChanges = existing.filter(c => c.status !== 'DRAFT').length

  if (limits.cvChanges !== Infinity && usedChanges >= limits.cvChanges) {
    throw new AppError(403, `Your ${plan} plan allows ${limits.cvChanges} CV change(s). Upgrade to create more.`)
  }

  const id = randomUUID()
  await db.insert(cvs).values({
    id,
    userId,
    title:        body.title,
    targetRole:   body.targetRole ?? null,
    targetSector: body.targetSector ?? null,
    content:      body.content ?? null,
    status:       'DRAFT',
    isPrimary:    existing.length === 0 ? 1 : 0,
  })

  const [created] = await db.select().from(cvs).where(eq(cvs.id, id)).limit(1)
  res.status(201).json({ success: true, data: { cv: created } })
}))

// PATCH /cvs/:id
router.patch('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const body = updateSchema.parse(req.body)

  const [cv] = await db.select().from(cvs)
    .where(and(eq(cvs.id, req.params.id), eq(cvs.userId, userId)))
    .limit(1)
  if (!cv) throw new AppError(404, 'CV not found')
  if (cv.status === 'APPROVED') throw new AppError(400, 'Approved CVs cannot be edited')

  if (body.isPrimary) {
    // Unset other primary CVs first
    await db.update(cvs).set({ isPrimary: 0 }).where(eq(cvs.userId, userId))
  }

  await db.update(cvs).set({
    ...(body.title        != null && { title: body.title }),
    ...(body.targetRole   != null && { targetRole: body.targetRole }),
    ...(body.targetSector != null && { targetSector: body.targetSector }),
    ...(body.content      != null && { content: body.content }),
    ...(body.isPrimary    != null && { isPrimary: body.isPrimary ? 1 : 0 }),
  }).where(eq(cvs.id, req.params.id))

  const [updated] = await db.select().from(cvs).where(eq(cvs.id, req.params.id)).limit(1)
  res.json({ success: true, data: { cv: updated } })
}))

// POST /cvs/:id/submit — move DRAFT → IN_REVIEW
router.post('/:id/submit', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const [cv] = await db.select().from(cvs)
    .where(and(eq(cvs.id, req.params.id), eq(cvs.userId, userId)))
    .limit(1)
  if (!cv) throw new AppError(404, 'CV not found')
  if (cv.status !== 'DRAFT' && cv.status !== 'REQUIRES_CHANGES') {
    throw new AppError(400, 'Only DRAFT or REQUIRES_CHANGES CVs can be submitted')
  }

  await db.update(cvs).set({ status: 'IN_REVIEW' }).where(eq(cvs.id, req.params.id))
  res.json({ success: true, data: { message: 'CV submitted for review' } })
}))

// DELETE /cvs/:id — archive
router.delete('/:id', asyncHandler(async (req, res) => {
  const userId = req.user!.id
  const [cv] = await db.select().from(cvs)
    .where(and(eq(cvs.id, req.params.id), eq(cvs.userId, userId)))
    .limit(1)
  if (!cv) throw new AppError(404, 'CV not found')

  await db.update(cvs).set({ status: 'ARCHIVED' }).where(eq(cvs.id, req.params.id))
  res.json({ success: true, data: { message: 'CV archived' } })
}))

export default router
