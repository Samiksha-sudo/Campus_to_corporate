import {
  mysqlTable, varchar, text, timestamp, index,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const gmailConnections = mysqlTable('gmail_connections', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  userId:       varchar('user_id', { length: 36 }).notNull().unique(),
  gmailEmail:   varchar('gmail_email', { length: 255 }).notNull(),
  accessToken:  text('access_token').notNull(),
  refreshToken: text('refresh_token').notNull(),
  tokenExpiry:  timestamp('token_expiry').notNull(),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt:    timestamp('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt:    timestamp('updated_at').notNull().default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
}, (t) => ({
  userIdx: index('idx_gmail_user').on(t.userId),
}))
