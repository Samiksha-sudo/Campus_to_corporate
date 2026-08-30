import {
  mysqlTable, varchar, text, timestamp, mysqlEnum, index, tinyint,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const cvStatusEnum = mysqlEnum('status', [
  'DRAFT', 'IN_REVIEW', 'REQUIRES_CHANGES', 'APPROVED', 'ARCHIVED',
])

export const cvs = mysqlTable('cvs', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  userId:          varchar('user_id', { length: 36 }).notNull(),
  title:           varchar('title', { length: 255 }).notNull(),
  status:          cvStatusEnum.notNull().default('DRAFT'),
  targetRole:      varchar('target_role', { length: 255 }),
  targetSector:    varchar('target_sector', { length: 255 }),
  isPrimary:       tinyint('is_primary').notNull().default(0),
  r2Key:           varchar('r2_key', { length: 500 }),
  wordR2Key:       varchar('word_r2_key', { length: 500 }),
  content:         text('content'),
  aiFeedback:      text('ai_feedback'),
  specialistNotes: text('specialist_notes'),
  assignedTo:      varchar('assigned_to', { length: 36 }),
  atsScore:        varchar('ats_score', { length: 10 }),
  completedAt:     timestamp('completed_at'),
  createdAt:       timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:       timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx:   index('idx_cvs_user').on(t.userId),
  statusIdx: index('idx_cvs_status').on(t.status),
}))

export const cvRevisions = mysqlTable('cv_revisions', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  cvId:      varchar('cv_id', { length: 36 }).notNull(),
  version:   varchar('version', { length: 10 }).notNull(),
  r2Key:     varchar('r2_key', { length: 500 }).notNull(),
  notes:     text('notes'),
  createdBy: varchar('created_by', { length: 36 }).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
}, (t) => ({
  cvIdx: index('idx_cvr_cv').on(t.cvId),
}))
