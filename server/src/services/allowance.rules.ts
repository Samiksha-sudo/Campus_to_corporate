import { planLimits } from '../config/plans.js'
import { effectiveWeeklyUsed, ukWeekEnd, ukWeekStart } from '../utils/week.js'

export type OutcomeCounts = Record<'ATTEMPTED' | 'SUBMITTED' | 'FAILED' | 'DUPLICATE' | 'BLOCKED', number>

export interface Allowance {
  limit: number
  used: number
  remaining: number
  periodStart: string
  resetsAt: string
  /** Per-outcome counts for the period. Only verified SUBMITTED rows count towards `used`. */
  outcomes: OutcomeCounts
}

export const emptyOutcomes = (): OutcomeCounts => ({ ATTEMPTED: 0, SUBMITTED: 0, FAILED: 0, DUPLICATE: 0, BLOCKED: 0 })

/**
 * Pure allowance calculation (no I/O) so entitlement logic is unit-testable.
 * The period is derived from the clock only — never from a request, session or restart — so it cannot
 * be reset by refreshing, logging out or re-fetching. There is no rollover: each period starts from zero.
 */
export function computeAllowance(
  plan: string | null | undefined,
  verifiedSubmitted: number,
  outcomes: OutcomeCounts,
  sub?: { weeklyApplicationsUsed?: number | null; weekStartedAt?: Date | string | null },
  now = new Date(),
): Allowance {
  const limit = planLimits(plan).weeklyApplications
  const used = effectiveWeeklyUsed(sub, verifiedSubmitted, now)
  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    periodStart: ukWeekStart(now).toISOString(),
    resetsAt: ukWeekEnd(now).toISOString(),
    outcomes,
  }
}
