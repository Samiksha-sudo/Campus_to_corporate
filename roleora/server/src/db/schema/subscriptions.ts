import {
  mysqlTable, varchar, text, tinyint, timestamp, mysqlEnum, int, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const planEnum = mysqlEnum('plan', ['EXPLORE', 'LAUNCH', 'MOMENTUM', 'GUIDED'])
export const subStatusEnum = mysqlEnum('status', ['ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE'])

export const subscriptions = mysqlTable('subscriptions', {
  id:                   varchar('id', { length: 36 }).primaryKey(),
  userId:               varchar('user_id', { length: 36 }).notNull(),
  plan:                 planEnum.notNull().default('EXPLORE'),
  status:               subStatusEnum.notNull().default('ACTIVE'),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 100 }),
  stripePriceId:        varchar('stripe_price_id', { length: 100 }),
  currentPeriodStart:   timestamp('current_period_start'),
  currentPeriodEnd:     timestamp('current_period_end'),
  cancelAtPeriodEnd:    tinyint('cancel_at_period_end').notNull().default(0),
  trialEnd:             timestamp('trial_end'),
  cvCreditsUsed:        int('cv_credits_used').notNull().default(0),
  applyCreditsUsed:     int('apply_credits_used').notNull().default(0),
  createdAt:            timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:            timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx: index('idx_sub_user').on(t.userId),
}))

export const orders = mysqlTable('orders', {
  id:               varchar('id', { length: 36 }).primaryKey(),
  userId:           varchar('user_id', { length: 36 }).notNull(),
  serviceType:      varchar('service_type', { length: 100 }).notNull(),
  status:           mysqlEnum('status', ['PENDING', 'PAID', 'PROCESSING', 'COMPLETE', 'REFUNDED']).notNull().default('PENDING'),
  amountPence:      int('amount_pence').notNull(),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 100 }),
  notes:            text('notes'),
  completedAt:      timestamp('completed_at'),
  createdAt:        timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx: index('idx_orders_user').on(t.userId),
}))
