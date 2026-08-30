import { z } from 'zod'
import 'dotenv/config'

const schema = z.object({
  NODE_ENV:      z.enum(['development', 'test', 'production']).default('development'),
  PORT:          z.coerce.number().default(4000),
  APP_URL:       z.string().url(),
  API_BASE_URL:  z.string().url().optional(),

  DB_HOST:       z.string().default('localhost'),
  DB_PORT:       z.coerce.number().default(3306),
  DB_USER:       z.string(),
  DB_PASSWORD:   z.string(),
  DB_NAME:       z.string(),

  JWT_ACCESS_SECRET:  z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRY:  z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  R2_ACCOUNT_ID:       z.string().optional(),
  R2_ACCESS_KEY_ID:    z.string().optional(),
  R2_SECRET_ACCESS_KEY:z.string().optional(),
  R2_BUCKET_NAME:      z.string().optional(),
  R2_PUBLIC_URL:       z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM:     z.string().default('Roleora <noreply@roleora.co.uk>'),

  STRIPE_SECRET_KEY:      z.string().optional(),
  STRIPE_WEBHOOK_SECRET:  z.string().optional(),
  STRIPE_PRICE_LAUNCH:    z.string().optional(),
  STRIPE_PRICE_MOMENTUM:  z.string().optional(),
  STRIPE_PRICE_GUIDED:    z.string().optional(),

  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL:          z.string().default('claude-opus-5'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000),
  RATE_LIMIT_MAX:       z.coerce.number().default(100),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
export const isDev  = env.NODE_ENV === 'development'
export const isProd = env.NODE_ENV === 'production'
