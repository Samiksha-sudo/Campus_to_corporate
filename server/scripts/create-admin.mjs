import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import mysql from 'mysql2/promise'

const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '../.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8').split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
)

const conn = await mysql.createConnection({
  host: env.DB_HOST ?? 'localhost',
  port: Number(env.DB_PORT ?? 3306),
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
})

const id = randomUUID()
const hash = await bcrypt.hash('Admin2024!', 12)

await conn.execute(
  `INSERT INTO users (id, email, password_hash, first_name, last_name, role, email_verified, profile_complete)
   VALUES (?, ?, ?, ?, ?, 'ADMIN', 1, 1)
   ON DUPLICATE KEY UPDATE role='ADMIN'`,
  [id, 'admin@campus-to-corporate.co.uk', hash, 'Admin', 'User']
)

await conn.execute(
  `INSERT INTO subscriptions (id, user_id, plan, status) VALUES (?, ?, 'EXPLORE', 'ACTIVE')
   ON DUPLICATE KEY UPDATE plan='EXPLORE'`,
  [randomUUID(), id]
)

console.log('Admin created:')
console.log('  Email:    admin@campus-to-corporate.co.uk')
console.log('  Password: Admin2024!')

await conn.end()
