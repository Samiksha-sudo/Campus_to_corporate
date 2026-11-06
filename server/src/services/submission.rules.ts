import { planLimits } from '../config/plans.js'
import { AppError } from '../utils/errors.js'

export type SubmissionOutcome = 'ATTEMPTED' | 'SUBMITTED' | 'FAILED' | 'DUPLICATE' | 'BLOCKED'
export type Reported = 'ATTEMPTED' | 'SUBMITTED' | 'FAILED'

export interface SubmissionContext {
  plan: string | null | undefined
  subscriptionStatus: string | null | undefined
  /** Only meaningful for managed (Elite) plans, where the customer must have granted permission. */
  consentApply: boolean
  onboardingComplete: boolean
  remaining: number
  alreadySubmitted: boolean
  reported: Reported
  verified: boolean
}

export type Decision = { outcome: SubmissionOutcome; reason?: string }

/**
 * Pure decision: what outcome should be recorded for a reported submission?
 * Only an outcome of SUBMITTED (with verified evidence) consumes allowance.
 */
export function decideSubmission(c: SubmissionContext): Decision {
  const limits = planLimits(c.plan)
  if (limits.weeklyApplications === 0) return { outcome: 'BLOCKED', reason: 'Plan has no application allowance' }
  if (c.subscriptionStatus && !['ACTIVE', 'TRIALING'].includes(c.subscriptionStatus)) {
    return { outcome: 'BLOCKED', reason: `Subscription is ${c.subscriptionStatus}` }
  }
  if (limits.managedService) {
    if (!c.onboardingComplete) return { outcome: 'BLOCKED', reason: 'Customer onboarding is not complete' }
    if (!c.consentApply) return { outcome: 'BLOCKED', reason: 'Customer has not authorised applications on their behalf' }
  }
  if (c.reported === 'FAILED' || c.reported === 'ATTEMPTED') return { outcome: c.reported }
  // reported SUBMITTED
  if (c.alreadySubmitted) return { outcome: 'DUPLICATE', reason: 'Already submitted for this application' }
  if (c.remaining <= 0) return { outcome: 'BLOCKED', reason: 'Weekly application allowance reached' }
  if (!c.verified) return { outcome: 'ATTEMPTED', reason: 'Submission not verified, so it does not count' }
  return { outcome: 'SUBMITTED' }
}

export type MessageAction = 'approve' | 'send' | 'reply' | 'escalate'
export type MessageStatus = 'DRAFT' | 'APPROVED' | 'SENT' | 'REPLIED' | 'ESCALATED'

/**
 * Recruiter message workflow. Nothing moves to APPROVED/SENT unless the customer granted outreach
 * permission. 'send' records that staff sent an approved message; this app has no outbound
 * recruiter email/LinkedIn integration, so the sending itself happens outside the system.
 */
export function nextMessageStatus(current: MessageStatus, action: MessageAction, consentOutreach: boolean): MessageStatus {
  if (action === 'escalate') return 'ESCALATED'
  if ((action === 'approve' || action === 'send') && !consentOutreach) {
    throw new AppError(403, 'Customer has not given permission for recruiter outreach', 'NO_CONSENT')
  }
  if (action === 'approve' && current === 'DRAFT') return 'APPROVED'
  if (action === 'send' && current === 'APPROVED') return 'SENT'
  if (action === 'reply' && (current === 'SENT' || current === 'REPLIED')) return 'REPLIED'
  throw new AppError(409, `Cannot ${action} a message that is ${current}`, 'INVALID_TRANSITION')
}
