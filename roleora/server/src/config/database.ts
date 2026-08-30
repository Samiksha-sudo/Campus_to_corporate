import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env }    from './env.js'
import { logger } from './logger.js'
import * as schema from '../db/schema/index.js'

let _pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!_pool) {
    _pool = mysql.createPool({
      host:     env.DB_HOST,
      port:     env.DB_PORT,
      user:     env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit:    20,
      charset:            'utf8mb4',
      timezone:           'Z',
    })
    logger.info({ host: env.DB_HOST, port: env.DB_PORT, database: env.DB_NAME }, 'MySQL pool created')
  }
  return _pool
}

export const db = drizzle(getPool(), { schema, mode: 'default' })

export async function testConnection(): Promise<void> {
  const conn = await getPool().getConnection()
  await conn.ping()
  conn.release()
  logger.info('Database connection verified')
}
