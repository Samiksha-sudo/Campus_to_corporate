import Stripe from 'stripe'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load .env manually
const __dir = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dir, '../.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
)

const stripe = new Stripe(env.STRIPE_SECRET_KEY)

const plans = [
  { name: 'Launch',   amount: 1900, desc: '50 AI CVs · 100 job applications per month' },
  { name: 'Momentum', amount: 2900, desc: '150 AI CVs · unlimited applications per month' },
]

for (const plan of plans) {
  const price = await stripe.prices.create({
    currency: 'gbp',
    unit_amount: plan.amount,
    recurring: { interval: 'month' },
    product_data: { name: plan.name },
  })
  console.log(`${plan.name.toUpperCase()}_PRICE_ID=${price.id}`)
}
