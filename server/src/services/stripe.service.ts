import Stripe      from 'stripe'
import { eq }      from 'drizzle-orm'
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
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (!userId) break
      const plan = (sub.metadata?.plan ?? 'EXPLORE') as 'EXPLORE' | 'LAUNCH' | 'MOMENTUM'
      const status = mapStatus(sub.status)
      await db.update(subscriptions).set({
        plan,
        status,
        stripeSubscriptionId: sub.id,
        stripePriceId:        sub.items.data[0]?.price.id,
        currentPeriodStart:   new Date(sub.current_period_start * 1000),
        currentPeriodEnd:     new Date(sub.current_period_end * 1000),
        cancelAtPeriodEnd:    sub.cancel_at_period_end ? 1 : 0,
        trialEnd:             sub.trial_end ? new Date(sub.trial_end * 1000) : null,
      }).where(eq(subscriptions.userId, userId))
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.userId
      if (userId) {
        await db.update(subscriptions).set({ status: 'CANCELED', plan: 'EXPLORE' }).where(eq(subscriptions.userId, userId))
      }
      break
    }
  }
}

// Sync the user's Stripe subscription into the DB — called after checkout when webhook can't reach localhost
export async function syncPlan(userId: string): Promise<void> {
  const stripe = getStripe()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user?.stripeCustomerId) return

  const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 1, status: 'all' })
  const sub  = subs.data[0]
  if (!sub) return

  const plan   = (sub.metadata?.plan ?? 'EXPLORE') as 'EXPLORE' | 'LAUNCH' | 'MOMENTUM'
  const status = mapStatus(sub.status)

  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).limit(1)
  if (existing) {
    await db.update(subscriptions).set({
      plan, status,
      stripeSubscriptionId: sub.id,
      stripePriceId:        sub.items.data[0]?.price.id,
      currentPeriodStart:   new Date(sub.current_period_start * 1000),
      currentPeriodEnd:     new Date(sub.current_period_end   * 1000),
      cancelAtPeriodEnd:    sub.cancel_at_period_end ? 1 : 0,
      trialEnd:             sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    }).where(eq(subscriptions.userId, userId))
  } else {
    await db.insert(subscriptions).values({
      userId, plan, status,
      stripeSubscriptionId: sub.id,
      stripePriceId:        sub.items.data[0]?.price.id,
      currentPeriodStart:   new Date(sub.current_period_start * 1000),
      currentPeriodEnd:     new Date(sub.current_period_end   * 1000),
      cancelAtPeriodEnd:    sub.cancel_at_period_end ? 1 : 0,
      trialEnd:             sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    } as never)
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
