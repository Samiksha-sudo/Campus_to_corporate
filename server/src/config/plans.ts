// Single source of truth for plan entitlements on the server.
// The internal key MOMENTUM is the plan marketed as "Pro" (kept to avoid migrating existing rows).
// Allowances are overrides, not additive: a higher tier replaces the lower tier's limit.

export const PLAN_LIMITS = {
  STARTER: {
    cvChanges:          1,
    trackerJobs:        5,        // self-tracked jobs; managed applications are not capped by this
    weeklyApplications: 0,
    coverLetters:       false,
    linkedIn:           false,
    managedService:     false,
  },
  EXPLORE: {
    cvChanges:          1,
    trackerJobs:        10,
    weeklyApplications: 50,
    coverLetters:       false,
    linkedIn:           false,
    managedService:     false,
  },
  LAUNCH: {
    cvChanges:          Infinity,
    trackerJobs:        Infinity,
    weeklyApplications: 100,
    coverLetters:       false,
    linkedIn:           true,
    managedService:     false,
  },
  MOMENTUM: {
    cvChanges:          Infinity,
    trackerJobs:        Infinity,
    weeklyApplications: 100,
    coverLetters:       true,
    linkedIn:           true,
    managedService:     false,
  },
  ELITE: {
    cvChanges:          Infinity,
    trackerJobs:        Infinity,
    weeklyApplications: 200,
    coverLetters:       true,
    linkedIn:           true,
    managedService:     true,
  },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
export type PaidPlan = Exclude<PlanKey, 'STARTER'>

export const PLAN_KEYS = Object.keys(PLAN_LIMITS) as PlanKey[]
export const PAID_PLANS: PaidPlan[] = ['EXPLORE', 'LAUNCH', 'MOMENTUM', 'ELITE']

export const PLAN_RANK: Record<PlanKey, number> = { STARTER: 0, EXPLORE: 1, LAUNCH: 2, MOMENTUM: 3, ELITE: 4 }

export const PLAN_PRICE_PENCE: Record<PaidPlan, number> = { EXPLORE: 1000, LAUNCH: 2000, MOMENTUM: 4900, ELITE: 10000 }

// Fallback only when Stripe price IDs are not configured. 4000 is a legacy Pro price.
const AMOUNT_TO_PLAN: Record<number, PaidPlan> = { 1000: 'EXPLORE', 2000: 'LAUNCH', 4000: 'MOMENTUM', 4900: 'MOMENTUM', 10000: 'ELITE' }

export function isPlanKey(v: unknown): v is PlanKey {
  return typeof v === 'string' && v in PLAN_LIMITS
}

export function planLimits(plan: string | null | undefined) {
  return PLAN_LIMITS[isPlanKey(plan) ? plan : 'STARTER']
}

/**
 * Work out which plan a Stripe subscription item is for. The price actually paid is the
 * source of truth (price ID, then amount); metadata is only a fallback as it can be missing or stale.
 */
export function resolvePlanFromPrice(
  input: { priceId?: string; unitAmount?: number | null; metadataPlan?: string },
  priceMap: Partial<Record<PaidPlan, string | undefined>>,
): PaidPlan {
  const byPrice = PAID_PLANS.find(k => priceMap[k] && priceMap[k] === input.priceId)
  if (byPrice) return byPrice
  const byAmount = input.unitAmount != null ? AMOUNT_TO_PLAN[input.unitAmount] : undefined
  if (byAmount) return byAmount
  if (input.metadataPlan && (PAID_PLANS as string[]).includes(input.metadataPlan)) return input.metadataPlan as PaidPlan
  return 'EXPLORE'
}
