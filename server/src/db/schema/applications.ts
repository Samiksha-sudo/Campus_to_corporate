import {
  mysqlTable, varchar, text, timestamp, mysqlEnum, index, tinyint, int,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const appStatusEnum = mysqlEnum('status', [
  'RECRUITER_OUTREACH',
  'APPLIED', 'UNDER_REVIEW',
  'SCREENING',
  'ASSESSMENT', 'ASSESSMENT_SUBMITTED',
  'HIRING_MANAGER_INTERVIEW',
  'TECHNICAL_INTERVIEW', 'SYSTEM_DESIGN_INTERVIEW', 'CODING_INTERVIEW',
  'SECOND_ROUND', 'THIRD_ROUND', 'FINAL_ROUND',
  'WAITING_FOR_RESPONSE',
  'REFERENCE_CHECK', 'BACKGROUND_CHECK', 'RIGHT_TO_WORK_CHECK',
  'SALARY_DISCUSSION',
  'OFFER_PENDING', 'OFFER', 'OFFER_ACCEPTED', 'OFFER_DECLINED',
  'REJECTED', 'WITHDRAWN', 'ROLE_CLOSED',
  'ON_HOLD', 'TALENT_POOL', 'NO_RESPONSE', 'UNKNOWN',
])

export const applications = mysqlTable('applications', {
  id:               varchar('id', { length: 36 }).primaryKey(),
  userId:           varchar('user_id', { length: 36 }).notNull(),
  cvId:             varchar('cv_id', { length: 36 }),
  companyName:      varchar('company_name', { length: 255 }).notNull(),
  jobTitle:         varchar('job_title', { length: 255 }).notNull(),
  jobUrl:           text('job_url'),
  jobDescription:   text('job_description'),
  location:         varchar('location', { length: 255 }),
  salaryRange:      varchar('salary_range', { length: 100 }),
  workMode:         mysqlEnum('work_mode', ['REMOTE', 'HYBRID', 'ONSITE']),
  status:           appStatusEnum.notNull().default('SAVED'),
  appliedAt:        timestamp('applied_at'),
  deadline:         timestamp('deadline'),
  userApproved:     tinyint('user_approved').notNull().default(0),
  coverLetter:      text('cover_letter'),
  tailoredCvR2Key:  varchar('tailored_cv_r2_key', { length: 500 }),
  roleFitScore:     int('role_fit_score'),
  roleFitBreakdown: text('role_fit_breakdown'),
  notes:            text('notes'),
  source:           varchar('source', { length: 100 }),
  assignedTo:       varchar('assigned_to', { length: 36 }),
  createdAt:        timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:        timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx:   index('idx_apps_user').on(t.userId),
  statusIdx: index('idx_apps_status').on(t.status),
}))

export const applicationEvents = mysqlTable('application_events', {
  id:            varchar('id', { length: 36 }).primaryKey(),
  applicationId: varchar('application_id', { length: 36 }).notNull(),
  userId:        varchar('user_id', { length: 36 }).notNull(),
  eventType:     varchar('event_type', { length: 100 }).notNull(),
  fromStatus:    appStatusEnum,
  toStatus:      appStatusEnum,
  notes:         text('notes'),
  createdAt:     timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  appIdx: index('idx_ae_app').on(t.applicationId),
}))

export const interviews = mysqlTable('interviews', {
  id:            varchar('id', { length: 36 }).primaryKey(),
  applicationId: varchar('application_id', { length: 36 }).notNull(),
  userId:        varchar('user_id', { length: 36 }).notNull(),
  round:         int('round').notNull().default(1),
  interviewType: mysqlEnum('interview_type', ['VIDEO', 'PHONE', 'ONSITE', 'TECHNICAL', 'ASSESSMENT']),
  scheduledAt:   timestamp('scheduled_at'),
  duration:      int('duration'),
  interviewers:  text('interviewers'),
  notes:         text('notes'),
  outcome:       mysqlEnum('outcome', ['PASS', 'FAIL', 'PENDING', 'RESCHEDULED']).default('PENDING'),
  feedbackNotes: text('feedback_notes'),
  createdAt:     timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:     timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  appIdx:  index('idx_iv_app').on(t.applicationId),
  userIdx: index('idx_iv_user').on(t.userId),
}))
