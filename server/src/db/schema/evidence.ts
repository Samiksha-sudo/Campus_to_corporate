import {
  mysqlTable, varchar, text, timestamp, mysqlEnum, index, tinyint,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const evidenceTypeEnum = mysqlEnum('evidence_type', [
  'ACHIEVEMENT', 'SKILL', 'PROJECT', 'CERTIFICATION', 'EDUCATION',
  'WORK_EXPERIENCE', 'VOLUNTEER', 'PUBLICATION', 'AWARD', 'OTHER',
])

export const evidenceBank = mysqlTable('evidence_bank', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  userId:       varchar('user_id', { length: 36 }).notNull(),
  type:         evidenceTypeEnum.notNull(),
  title:        varchar('title', { length: 255 }).notNull(),
  organisation: varchar('organisation', { length: 255 }),
  startDate:    varchar('start_date', { length: 10 }),
  endDate:      varchar('end_date', { length: 10 }),
  current:      tinyint('current').notNull().default(0),
  description:  text('description'),
  metrics:      text('metrics'),
  skills:       text('skills'),
  starMethod:   text('star_method'),
  r2Key:        varchar('r2_key', { length: 500 }),
  pinned:       tinyint('pinned').notNull().default(0),
  createdAt:    timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx:  index('idx_eb_user').on(t.userId),
  typeIdx:  index('idx_eb_type').on(t.type),
}))
