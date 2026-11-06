import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  PLAN_LIMITS, PLAN_RANK, PAID_PLANS, PLAN_PRICE_PENCE, planLimits, resolvePlanFromPrice,
} from '../src/config/plans.js'
import { ukWeekStart, ukWeekEnd, effectiveWeeklyUsed } from '../src/utils/week.js'
import { computeAllowance, emptyOutcomes } from '../src/services/allowance.rules.js'
import { decideSubmission, nextMessageStatus, type SubmissionContext } from '../src/services/submission.rules.js'

describe('plan entitlements', () => {
  test('weekly application allowances', () => {
    assert.equal(PLAN_LIMITS.STARTER.weeklyApplications, 0)
    assert.equal(PLAN_LIMITS.EXPLORE.weeklyApplications, 50)
    assert.equal(PLAN_LIMITS.LAUNCH.weeklyApplications, 100)
    assert.equal(PLAN_LIMITS.MOMENTUM.weeklyApplications, 100)
    assert.equal(PLAN_LIMITS.ELITE.weeklyApplications, 200)
  })

  test('CV changes: Explore has 1, Launch and above unlimited (higher tier overrides lower)', () => {
    assert.equal(PLAN_LIMITS.STARTER.cvChanges, 1)
    assert.equal(PLAN_LIMITS.EXPLORE.cvChanges, 1)
    for (const p of ['LAUNCH', 'MOMENTUM', 'ELITE'] as const) assert.equal(PLAN_LIMITS[p].cvChanges, Infinity)
  })

  test('limits never decrease as you move up a tier', () => {
    const order = ['STARTER', 'EXPLORE', 'LAUNCH', 'MOMENTUM', 'ELITE'] as const
    for (let i = 1; i < order.length; i++) {
      const lo = PLAN_LIMITS[order[i - 1]], hi = PLAN_LIMITS[order[i]]
      assert.ok(hi.weeklyApplications >= lo.weeklyApplications)
      assert.ok(hi.cvChanges >= lo.cvChanges)
      assert.ok(hi.trackerJobs >= lo.trackerJobs)
      assert.ok(PLAN_RANK[order[i]] > PLAN_RANK[order[i - 1]])
    }
  })

  test('only Elite is a managed service; cover letters start at Pro; LinkedIn at Launch', () => {
    assert.deepEqual(Object.entries(PLAN_LIMITS).filter(([, v]) => v.managedService).map(([k]) => k), ['ELITE'])
    assert.equal(PLAN_LIMITS.LAUNCH.coverLetters, false)
    assert.equal(PLAN_LIMITS.MOMENTUM.coverLetters, true)
    assert.equal(PLAN_LIMITS.EXPLORE.linkedIn, false)
    assert.equal(PLAN_LIMITS.LAUNCH.linkedIn, true)
  })

  test('no plan carries an interview guarantee', () => {
    for (const l of Object.values(PLAN_LIMITS)) assert.equal('interviewGuarantee' in l, false)
  })

  test('unknown or missing plan falls back to Starter', () => {
    assert.equal(planLimits(undefined), PLAN_LIMITS.STARTER)
    assert.equal(planLimits('NOPE'), PLAN_LIMITS.STARTER)
  })

  test('prices in pence', () => {
    assert.deepEqual(PLAN_PRICE_PENCE, { EXPLORE: 1000, LAUNCH: 2000, MOMENTUM: 4900, ELITE: 10000 })
  })
})

describe('Stripe price to plan resolution', () => {
  const map = { EXPLORE: 'price_e', LAUNCH: 'price_l', MOMENTUM: 'price_m', ELITE: 'price_x' }
  test('configured price IDs win over amount and metadata', () => {
    assert.equal(resolvePlanFromPrice({ priceId: 'price_x', unitAmount: 2000, metadataPlan: 'EXPLORE' }, map), 'ELITE')
    assert.equal(resolvePlanFromPrice({ priceId: 'price_m' }, map), 'MOMENTUM')
  })
  test('falls back to amount when price IDs are not configured', () => {
    assert.equal(resolvePlanFromPrice({ priceId: 'p', unitAmount: 10000 }, {}), 'ELITE')
    assert.equal(resolvePlanFromPrice({ priceId: 'p', unitAmount: 4900 }, {}), 'MOMENTUM')
    assert.equal(resolvePlanFromPrice({ priceId: 'p', unitAmount: 4000 }, {}), 'MOMENTUM')
    assert.equal(resolvePlanFromPrice({ priceId: 'p', unitAmount: 1000 }, {}), 'EXPLORE')
  })
  test('falls back to metadata, then Explore', () => {
    assert.equal(resolvePlanFromPrice({ priceId: 'p', unitAmount: 999, metadataPlan: 'LAUNCH' }, {}), 'LAUNCH')
    assert.equal(resolvePlanFromPrice({ priceId: 'p', unitAmount: 999, metadataPlan: 'JUNK' }, {}), 'EXPLORE')
  })
  test('an unset ELITE price ID never matches an undefined priceId', () => {
    assert.equal(resolvePlanFromPrice({ priceId: undefined, unitAmount: 2000 }, { ELITE: undefined }), 'LAUNCH')
  })
  test('every paid plan is resolvable by price ID (upgrade/downgrade targets)', () => {
    for (const p of PAID_PLANS) assert.equal(resolvePlanFromPrice({ priceId: map[p] }, map), p)
  })
})

describe('UK week boundaries', () => {
  test('week starts Monday 00:00 London (winter, GMT)', () => {
    // Wed 14 Jan 2026 12:00Z
    assert.equal(ukWeekStart(new Date('2026-01-14T12:00:00Z')).toISOString(), '2026-01-12T00:00:00.000Z')
  })
  test('week starts Monday 00:00 London (summer, BST = UTC+1)', () => {
    assert.equal(ukWeekStart(new Date('2026-07-15T12:00:00Z')).toISOString(), '2026-07-12T23:00:00.000Z')
  })
  test('Sunday 23:59:59 is still the old week; Monday 00:00 starts the next', () => {
    const lastSecond = new Date('2026-01-18T23:59:59Z')
    const monday = new Date('2026-01-19T00:00:00Z')
    assert.equal(ukWeekStart(lastSecond).toISOString(), '2026-01-12T00:00:00.000Z')
    assert.equal(ukWeekEnd(lastSecond).toISOString(), '2026-01-19T00:00:00.000Z')
    assert.equal(ukWeekStart(monday).toISOString(), '2026-01-19T00:00:00.000Z')
  })
  test('period length is 7 days, or 6/8 days+1h across a DST change', () => {
    const now = new Date('2026-03-25T12:00:00Z') // week containing the 29 March clock change
    const hours = (ukWeekEnd(now).getTime() - ukWeekStart(now).getTime()) / 36e5
    assert.equal(hours, 7 * 24 - 1)
  })
  test('the reset is a function of the clock only: same instant, same period, however often asked', () => {
    const t = new Date('2026-02-04T09:00:00Z')
    assert.equal(ukWeekStart(t).getTime(), ukWeekStart(t).getTime())
    assert.equal(ukWeekEnd(t).getTime(), ukWeekEnd(new Date(t.getTime() + 1000)).getTime())
  })
  test('admin manual override only applies within the week it was set', () => {
    const now = new Date('2026-02-04T09:00:00Z')
    const sub = { weeklyApplicationsUsed: 7, weekStartedAt: new Date('2026-02-03T09:00:00Z') }
    assert.equal(effectiveWeeklyUsed(sub, 2, now), 7)
    assert.equal(effectiveWeeklyUsed(sub, 2, new Date('2026-02-10T09:00:00Z')), 2)
  })
})

describe('weekly allowance', () => {
  const now = new Date('2026-02-04T09:00:00Z')
  test('Elite: 200 allowance, remaining = limit - verified submitted', () => {
    const a = computeAllowance('ELITE', 37, { ...emptyOutcomes(), SUBMITTED: 37 }, undefined, now)
    assert.equal(a.limit, 200); assert.equal(a.used, 37); assert.equal(a.remaining, 163)
    assert.equal(a.resetsAt, '2026-02-09T00:00:00.000Z')
  })
  test('remaining never goes negative', () => {
    assert.equal(computeAllowance('EXPLORE', 80, emptyOutcomes(), undefined, now).remaining, 0)
  })
  test('failed, duplicate, blocked and attempted rows do not consume allowance', () => {
    const o = { ATTEMPTED: 5, SUBMITTED: 3, FAILED: 2, DUPLICATE: 1, BLOCKED: 4 }
    const a = computeAllowance('LAUNCH', 3, o, undefined, now)
    assert.equal(a.used, 3)
    assert.deepEqual(a.outcomes, o)
  })
  test('no rollover: a new period starts from the new period count, not last week', () => {
    const nextWeek = new Date('2026-02-10T09:00:00Z')
    assert.equal(computeAllowance('EXPLORE', 0, emptyOutcomes(), undefined, nextWeek).remaining, 50)
  })
  test('Starter has no weekly allowance', () => {
    assert.equal(computeAllowance('STARTER', 0, emptyOutcomes(), undefined, now).limit, 0)
  })
})

describe('submission decisions', () => {
  const base: SubmissionContext = {
    plan: 'ELITE', subscriptionStatus: 'ACTIVE', consentApply: true, onboardingComplete: true,
    remaining: 10, alreadySubmitted: false, reported: 'SUBMITTED', verified: true,
  }
  test('verified submission within allowance is counted', () => {
    assert.equal(decideSubmission(base).outcome, 'SUBMITTED')
  })
  test('unverified submission is only an attempt', () => {
    assert.equal(decideSubmission({ ...base, verified: false }).outcome, 'ATTEMPTED')
  })
  test('duplicate is recorded as DUPLICATE, not counted', () => {
    assert.equal(decideSubmission({ ...base, alreadySubmitted: true }).outcome, 'DUPLICATE')
  })
  test('over the weekly allowance is BLOCKED', () => {
    assert.equal(decideSubmission({ ...base, remaining: 0 }).outcome, 'BLOCKED')
  })
  test('Elite without customer authorisation or onboarding is BLOCKED', () => {
    assert.equal(decideSubmission({ ...base, consentApply: false }).outcome, 'BLOCKED')
    assert.equal(decideSubmission({ ...base, onboardingComplete: false }).outcome, 'BLOCKED')
  })
  test('non-active subscription and plans with no allowance are BLOCKED', () => {
    assert.equal(decideSubmission({ ...base, subscriptionStatus: 'PAST_DUE' }).outcome, 'BLOCKED')
    assert.equal(decideSubmission({ ...base, plan: 'STARTER' }).outcome, 'BLOCKED')
  })
  test('self-service paid plans do not need the Elite consent record', () => {
    assert.equal(decideSubmission({ ...base, plan: 'LAUNCH', consentApply: false, onboardingComplete: false }).outcome, 'SUBMITTED')
  })
  test('failures are recorded as FAILED', () => {
    assert.equal(decideSubmission({ ...base, reported: 'FAILED' }).outcome, 'FAILED')
  })
})

describe('recruiter message workflow', () => {
  test('draft -> approved -> sent -> replied with outreach permission', () => {
    assert.equal(nextMessageStatus('DRAFT', 'approve', true), 'APPROVED')
    assert.equal(nextMessageStatus('APPROVED', 'send', true), 'SENT')
    assert.equal(nextMessageStatus('SENT', 'reply', true), 'REPLIED')
  })
  test('cannot approve or send without outreach permission', () => {
    assert.throws(() => nextMessageStatus('DRAFT', 'approve', false), /permission/)
    assert.throws(() => nextMessageStatus('APPROVED', 'send', false), /permission/)
  })
  test('cannot send an unapproved draft', () => {
    assert.throws(() => nextMessageStatus('DRAFT', 'send', true), /Cannot send/)
  })
  test('escalation is always possible', () => {
    assert.equal(nextMessageStatus('DRAFT', 'escalate', false), 'ESCALATED')
  })
})
