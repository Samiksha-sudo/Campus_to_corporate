import type { users } from '../db/schema/users.js'
import type { InferSelectModel } from 'drizzle-orm'

type User = InferSelectModel<typeof users>

declare global {
  namespace Express {
    interface Request {
      user?:      User
      requestId?: string
    }
  }
}
