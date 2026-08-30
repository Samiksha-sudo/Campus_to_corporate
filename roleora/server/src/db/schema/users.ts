import {
  mysqlTable, varchar, text, tinyint, timestamp, mysqlEnum, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const userRoleEnum = mysqlEnum('role', [
  'CUSTOMER', 'CAREER_SPECIALIST', 'CV_WRITER',
  'APPLICATION_SPECIALIST', 'ADMIN', 'SUPER_ADMIN',
])

export const users = mysqlTable('users', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  email:           varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:    varchar('password_hash', { length: 255 }).notNull(),
  firstName:       varchar('first_name', { length: 100 }).notNull(),
  lastName:        varchar('last_name', { length: 100 }).notNull(),
  role:            userRoleEnum.notNull().default('CUSTOMER'),
  emailVerified:   tinyint('email_verified').notNull().default(0),
  profileComplete: tinyint('profile_complete').notNull().default(0),
  avatarUrl:       text('avatar_url'),
  phone:           varchar('phone', { length: 30 }),
  linkedinUrl:     varchar('linkedin_url', { length: 500 }),
  location:        varchar('location', { length: 255 }),
  jobTitle:        varchar('job_title', { length: 255 }),
  yearsExperience: tinyint('years_experience'),
  targetSalaryMin: varchar('target_salary_min', { length: 20 }),
  targetSalaryMax: varchar('target_salary_max', { length: 20 }),
  bio:             text('bio'),
  stripeCustomerId:varchar('stripe_customer_id', { length: 100 }),
  createdAt:       timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  deletedAt:       timestamp('deleted_at'),
}, (t) => ({
  emailIdx: index('idx_users_email').on(t.email),
  roleIdx:  index('idx_users_role').on(t.role),
}))

export const refreshTokens = mysqlTable('refresh_tokens', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  userId:    varchar('user_id', { length: 36 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull().unique(),
  family:    varchar('family', { length: 36 }).notNull(),
  used:      tinyint('used').notNull().default(0),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx:   index('idx_rt_user').on(t.userId),
  familyIdx: index('idx_rt_family').on(t.family),
}))

export const emailVerifications = mysqlTable('email_verifications', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  userId:    varchar('user_id', { length: 36 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx: index('idx_ev_user').on(t.userId),
}))

export const passwordResets = mysqlTable('password_resets', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  userId:    varchar('user_id', { length: 36 }).notNull(),
  tokenHash: varchar('token_hash', { length: 255 }).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt:    timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx: index('idx_pr_user').on(t.userId),
}))
