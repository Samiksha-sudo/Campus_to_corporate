import { randomUUID } from 'crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../config/database.js'
import { applications } from '../db/schema/applications.js'
import { applicationSubmissions, conciergeProfiles } from '../db/schema/concierge.js'
import { subscriptions } from '../db/schema/subscriptions.js'
import { AppError } from '../utils/errors.js'
import { getAllowance } from './allowance.service.js'
import { decideSubmission, type Reported } from './submission.rules.js'

export { decideSubmission, nextMessageStatus } from './submission.rules.js'

export async function recordSubmission(input: {
  userId: string
  applicationId: string
  reported: Reported
  verified: boolean
  evidence?: string
  failureReason?: string
  staffId: string
}) {
  const { userId, applicationId } = input
  const [app] = await db.select().from(applications)
    .where(and(eq(applications.id, applicationId), eq(applications.userId, userId))).limit(1)
  if (!app) throw new AppError(404, 'Application not found for this customer', 'NOT_FOUND')

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  const [profile] = await db.select().from(conciergeProfiles).where(eq(conciergeProfiles.userId, userId)).limit(1)
  const allowance = await getAllowance(userId, sub?.plan, sub)
  const prior = await db.select({ id: applicationSubmissions.id }).from(applicationSubmissions)
    .where(and(
      eq(applicationSubmissions.applicationId, applicationId),
      eq(applicationSubmissions.outcome, 'SUBMITTED'),
      eq(applicationSubmissions.verified, 1),
    )).limit(1)

  const decision = decideSubmission({
    plan: sub?.plan,
    subscriptionStatus: sub?.status,
    consentApply: !!profile?.consentApply,
    onboardingComplete: !!profile?.onboardingComplete,
    remaining: allowance.remaining,
    alreadySubmitted: prior.length > 0,
    reported: input.reported,
    verified: input.verified && !!input.evidence,
  })

  const id = randomUUID()
  await db.insert(applicationSubmissions).values({
    id, userId, applicationId,
    outcome: decision.outcome,
    verified: decision.outcome === 'SUBMITTED' ? 1 : 0,
    evidence: input.evidence ?? null,
    failureReason: decision.reason ?? input.failureReason ?? null,
    submittedBy: input.staffId,
  })

  if (decision.outcome === 'SUBMITTED') {
    await db.update(applications).set({ status: 'APPLIED', appliedAt: new Date() }).where(eq(applications.id, applicationId))
  }
  const after = await getAllowance(userId, sub?.plan, sub)
  return { id, outcome: decision.outcome, reason: decision.reason ?? null, allowance: after }
}
