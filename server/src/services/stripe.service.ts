import Stripe      from 'stripe'
import { eq }      from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db }      from '../config/database.js'
import { users }   from '../db/schema/users.js'
import { subscriptions } from '../db/schema/subscriptions.js'
import { env }     from '../config/env.js'
import { AppError } from '../utils/errors.js'

function getStripe() {
  if (!env.STRIPE_SECRET_KEY) throw new AppError(503, 'Stripe not configured', 'STRIPE_NOT_CONFIGURED')
  return new Stripe(env.STRIPE_SECRET_KEY)
}

const PRICE_MAP: Record<string, string | undefined> = {
  EXPLORE:  env.STRIPE_PRICE_EXPLORE,
  LAUNCH:   env.STRIPE_PRICE_LAUNCH,
  MOMENTUM: env.STRIPE_PRICE_MOMENTUM,
}

export async function createCheckoutSession(userId: string, plan: string): Promise<string> {
  const stripe = getStripe()

  const priceId = PRICE_MAP[plan]
  if (!priceId) throw new AppError(400, `No Stripe price configured for plan: ${plan}`, 'INVALID_PLAN')

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({ email: user.email, name: `${user.firstName} ${user.lastName}` })
    customerId = customer.id
    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId))
  }

  const session = await stripe.checkout.sessions.create({
    customer:             customerId,
    client_reference_id:  userId,
    mode:                 'subscription',
    payment_method_types: ['card'],
    line_items:           [{ price: priceId, quantity: 1 }],
    success_url:          `${env.APP_URL}/app/payment-success?plan=${plan}`,
    cancel_url:           `${env.APP_URL}/app/settings?payment=cancelled`,
    subscription_data:    { metadata: { userId, plan } },
  })

  return session.url!
}

export async function createBillingPortal(userId: string): Promise<string> {
  const stripe = getStripe()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.stripeCustomerId) throw new AppError(400, 'No Stripe customer found', 'NO_CUSTOMER')

  const session = await stripe.billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${env.APP_URL}/app/subscription`,
  })
  return session.url
}

type PaidPlan = 'EXPLORE' | 'LAUNCH' | 'MOMENTUM'
const PLAN_RANK: Record<PaidPlan, number> = { EXPLORE: 1, LAUNCH: 2, MOMENTUM: 3 }
// Fallback when price IDs are not configured: monthly price in pence
const AMOUNT_TO_PLAN: Record<number, PaidPlan> = { 4000: 'MOMENTUM', 2000: 'LAUNCH' }

// Work out which plan a Stripe subscription is for. The price actually paid is the
// source of truth; metadata is only a fallback (it can be missing or stale).
function resolvePlan(sub: Stripe.Subscription): PaidPlan {
  const item = sub.items.data[0]
  const priceId = item?.price.id
  const byPrice = (Object.keys(PRICE_MAP) as PaidPlan[]).find(k => PRICE_MAP[k] && PRICE_MAP[k] === priceId)
  if (byPrice) return byPrice
  const byAmount = item?.price.unit_amount != null ? AMOUNT_TO_PLAN[item.price.unit_amount] : undefined
  if (byAmount) return byAmount
  const meta = sub.metadata?.plan as PaidPlan | undefined
  if (meta && meta in PLAN_RANK) return meta
  return 'EXPLORE'
}

async function applySubscription(userId: string, sub: Stripe.Subscription): Promise<void> {
  const payload = {
    plan:                 resolvePlan(sub),
    status:               mapStatus(sub.status),
    stripeSubscriptionId: sub.id,
    stripePriceId:        sub.items.data[0]?.price.id,
    currentPeriodStart:   new Date(sub.current_period_start * 1000),
    currentPeriodEnd:     new Date(sub.current_period_end   * 1000),
    cancelAtPeriodEnd:    sub.cancel_at_period_end ? 1 : 0,
    trialEnd:             sub.trial_end ? new Date(sub.trial_end * 1000) : null,
  }
  const [existing] = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  if (existing) {
    await db.update(subscriptions).set(payload).where(eq(subscriptions.userId, userId))
  } else {
    await db.insert(subscriptions).values({ id: randomUUID(), userId, ...payload } as never)
  }
}

async function userIdForSubscription(sub: Stripe.Subscription): Promise<string | undefined> {
  if (sub.metadata?.userId) return sub.metadata.userId
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const [u] = await db.select({ id: users.id }).from(users).where(eq(users.stripeCustomerId, customerId)).limit(1)
  return u?.id
}

export async function handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
  if (!env.STRIPE_WEBHOOK_SECRET) return
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    throw new AppError(400, 'Invalid webhook signature', 'WEBHOOK_INVALID')
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.client_reference_id ?? session.metadata?.userId
      if (session.mode === 'subscription' && userId) {
        await syncPlan(userId).catch(() => undefined)
      } else if (session.mode === 'subscription' && session.customer) {
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer.id
        const [u] = await db.select({ id: users.id }).from(users).where(eq(users.stripeCustomerId, customerId)).limit(1)
        if (u) await syncPlan(u.id).catch(() => undefined)
      }
      break
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = await userIdForSubscription(sub)
      if (!userId) break
      // Sync from the full set of subs so an old/cancelled sub event can't downgrade a newer one
      await syncPlan(userId).catch(async () => { await applySubscription(userId, sub) })
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = await userIdForSubscription(sub)
      if (!userId) break
      // Only reset if no other live subscription remains (e.g. after an upgrade)
      await syncPlan(userId).catch(async () => {
        await db.update(subscriptions).set({ status: 'CANCELED', plan: 'STARTER' }).where(eq(subscriptions.userId, userId))
      })
      break
    }
  }
}

const LIVE_STATUSES: Stripe.Subscription.Status[] = ['active', 'trialing', 'past_due']

// Sync the user's Stripe subscriptions into the DB — called after checkout and from webhooks.
// Picks the highest-tier live subscription, so paying £40 always lands on Momentum.
export async function syncPlan(userId: string): Promise<void> {
  const stripe = getStripe()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.stripeCustomerId) return

  const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 20, status: 'all' })
  if (subs.data.length === 0) throw new AppError(503, 'Stripe subscription not ready yet', 'SUB_NOT_READY')

  const live = subs.data.filter(s => LIVE_STATUSES.includes(s.status))
  if (live.length > 0) {
    live.sort((a, b) => PLAN_RANK[resolvePlan(b)] - PLAN_RANK[resolvePlan(a)] || b.created - a.created)
    await applySubscription(userId, live[0])
    return
  }

  // Nothing live: a just-created checkout may still be 'incomplete'; otherwise reset to STARTER
  const incomplete = subs.data.find(s => s.status === 'incomplete')
  if (incomplete) throw new AppError(503, 'Stripe subscription not ready yet', 'SUB_NOT_READY')

  const [existing] = await db.select({ id: subscriptions.id }).from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  if (existing) {
    await db.update(subscriptions).set({ status: 'CANCELED', plan: 'STARTER' }).where(eq(subscriptions.userId, userId))
  }
}

function mapStatus(s: Stripe.Subscription.Status): 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE' {
  const map: Record<string, 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING' | 'INCOMPLETE'> = {
    active:             'ACTIVE',
    past_due:           'PAST_DUE',
    canceled:           'CANCELED',
    trialing:           'TRIALING',
    incomplete:         'INCOMPLETE',
    incomplete_expired: 'CANCELED',
    unpaid:             'PAST_DUE',
    paused:             'ACTIVE',
  }
  return map[s] ?? 'ACTIVE'
}
