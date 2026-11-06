import {
  mysqlTable, varchar, text, tinyint, timestamp, mysqlEnum, int, index, uniqueIndex,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

// Elite Concierge onboarding + consent. One row per customer.
export const conciergeProfiles = mysqlTable('concierge_profiles', {
  id:                  varchar('id', { length: 36 }).primaryKey(),
  userId:              varchar('user_id', { length: 36 }).notNull(),
  cvId:                varchar('cv_id', { length: 36 }),
  preferredRoles:      text('preferred_roles'),
  locations:           text('locations'),
  salaryMin:           int('salary_min'),
  salaryMax:           int('salary_max'),
  workAuthorisation:   varchar('work_authorisation', { length: 255 }),
  workModes:           varchar('work_modes', { length: 100 }),        // comma list of REMOTE,HYBRID,ONSITE
  linkedinUrl:         varchar('linkedin_url', { length: 500 }),
  industries:          text('industries'),
  applicationNotes:    text('application_notes'),
  // Explicit, separately recorded permissions. Staff actions are gated on these.
  consentApply:        tinyint('consent_apply').notNull().default(0),
  consentOutreach:     tinyint('consent_outreach').notNull().default(0),
  consentedAt:         timestamp('consented_at'),
  assignedSpecialistId:varchar('assigned_specialist_id', { length: 36 }),
  onboardingComplete:  tinyint('onboarding_complete').notNull().default(0),
  createdAt:           timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:           timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userUq: uniqueIndex('uq_concierge_user').on(t.userId),
}))

export const submissionOutcomeEnum = mysqlEnum('outcome', ['ATTEMPTED', 'SUBMITTED', 'FAILED', 'DUPLICATE', 'BLOCKED'])

// Every attempt to submit an application on a customer's behalf. Only SUBMITTED + verified rows
// count towards the weekly allowance; the other outcomes are recorded separately for reporting.
export const applicationSubmissions = mysqlTable('application_submissions', {
  id:             varchar('id', { length: 36 }).primaryKey(),
  userId:         varchar('user_id', { length: 36 }).notNull(),
  applicationId:  varchar('application_id', { length: 36 }),
  outcome:        submissionOutcomeEnum.notNull(),
  verified:       tinyint('verified').notNull().default(0),
  evidence:       varchar('evidence', { length: 500 }),     // confirmation email / reference
  failureReason:  varchar('failure_reason', { length: 500 }),
  submittedBy:    varchar('submitted_by', { length: 36 }),  // staff user id
  createdAt:      timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  userWeekIdx: index('idx_sub_user_created').on(t.userId, t.createdAt),
  appIdx:      index('idx_sub_app').on(t.applicationId),
}))

export const recruiterMessages = mysqlTable('recruiter_messages', {
  id:             varchar('id', { length: 36 }).primaryKey(),
  userId:         varchar('user_id', { length: 36 }).notNull(),
  applicationId:  varchar('application_id', { length: 36 }),
  direction:      mysqlEnum('direction', ['OUTBOUND', 'INBOUND']).notNull().default('OUTBOUND'),
  channel:        mysqlEnum('channel', ['EMAIL', 'LINKEDIN', 'PHONE', 'OTHER']).notNull().default('EMAIL'),
  recruiterName:  varchar('recruiter_name', { length: 255 }),
  company:        varchar('company', { length: 255 }),
  subject:        varchar('subject', { length: 255 }),
  body:           text('body').notNull(),
  // DRAFT -> APPROVED (customer permission confirmed by staff) -> SENT -> REPLIED
  status:         mysqlEnum('status', ['DRAFT', 'APPROVED', 'SENT', 'REPLIED', 'ESCALATED']).notNull().default('DRAFT'),
  approvedBy:     varchar('approved_by', { length: 36 }),
  approvedAt:     timestamp('approved_at'),
  sentAt:         timestamp('sent_at'),
  followUpDueAt:  timestamp('follow_up_due_at'),
  createdBy:      varchar('created_by', { length: 36 }),
  createdAt:      timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:      timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx: index('idx_rm_user').on(t.userId),
}))

// Things a customer needs to do or confirm (shown on their dashboard).
export const conciergeActions = mysqlTable('concierge_actions', {
  id:             varchar('id', { length: 36 }).primaryKey(),
  userId:         varchar('user_id', { length: 36 }).notNull(),
  applicationId:  varchar('application_id', { length: 36 }),
  description:    varchar('description', { length: 500 }).notNull(),
  status:         mysqlEnum('status', ['OPEN', 'DONE']).notNull().default('OPEN'),
  createdBy:      varchar('created_by', { length: 36 }),
  createdAt:      timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  completedAt:    timestamp('completed_at'),
}, (t) => ({
  userIdx: index('idx_ca_user').on(t.userId),
}))
