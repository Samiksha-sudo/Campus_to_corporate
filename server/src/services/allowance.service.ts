import { and, eq, gte, lt, sql } from 'drizzle-orm'
import { db } from '../config/database.js'
import { applicationSubmissions } from '../db/schema/concierge.js'
import { ukWeekEnd, ukWeekStart } from '../utils/week.js'
import { computeAllowance, emptyOutcomes, type Allowance, type OutcomeCounts } from './allowance.rules.js'

export { computeAllowance, type Allowance, type OutcomeCounts } from './allowance.rules.js'

/** Per-outcome counts + verified-submitted count for one user, for the current UK week. */
export async function weeklyOutcomes(userId: string, now = new Date()): Promise<{ outcomes: OutcomeCounts; verifiedSubmitted: number }> {
  const rows = await db
    .select({
      outcome: applicationSubmissions.outcome,
      verified: applicationSubmissions.verified,
      n: sql<number>`count(*)`,
    })
    .from(applicationSubmissions)
    .where(and(
      eq(applicationSubmissions.userId, userId),
      gte(applicationSubmissions.createdAt, ukWeekStart(now)),
      lt(applicationSubmissions.createdAt, ukWeekEnd(now)),
    ))
    .groupBy(applicationSubmissions.outcome, applicationSubmissions.verified)

  const outcomes = emptyOutcomes()
  let verifiedSubmitted = 0
  for (const r of rows) {
    const n = Number(r.n)
    outcomes[r.outcome] += n
    if (r.outcome === 'SUBMITTED' && r.verified) verifiedSubmitted += n
  }
  return { outcomes, verifiedSubmitted }
}

export async function getAllowance(
  userId: string,
  plan: string | null | undefined,
  sub?: { weeklyApplicationsUsed?: number | null; weekStartedAt?: Date | string | null },
  now = new Date(),
): Promise<Allowance> {
  const { outcomes, verifiedSubmitted } = await weeklyOutcomes(userId, now)
  return computeAllowance(plan, verifiedSubmitted, outcomes, sub, now)
}
