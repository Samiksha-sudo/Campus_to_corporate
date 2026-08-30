import { Link }            from 'react-router-dom'
import { motion }          from 'framer-motion'
import { CheckCircle2, X, ArrowRight } from 'lucide-react'
import { cn }              from '@/utils/cn'
import { Button, Badge }   from '@/components/ui'
import { ROUTES }          from '@/config/routes'

interface Plan {
  name:       string
  price:      string
  period:     string
  tagline:    string
  cta:        string
  ctaVariant: 'primary' | 'secondary' | 'accent'
  popular?:   boolean
  features:   { text: string; included: boolean }[]
}

const plans: Plan[] = [
  {
    name:       'Explore',
    price:      '£0',
    period:     'forever',
    tagline:    'Get started, no strings attached.',
    cta:        'Start free',
    ctaVariant: 'secondary',
    features: [
      { text: 'Evidence Bank (up to 20 entries)',     included: true  },
      { text: 'CV upload & storage (1 CV)',           included: true  },
      { text: 'Application tracker (up to 10 jobs)',  included: true  },
      { text: 'Basic role-fit scoring',               included: true  },
      { text: 'AI-written CV',                        included: false },
      { text: 'Specialist CV review',                 included: false },
      { text: 'Unlimited applications',               included: false },
      { text: 'Interview prep',                       included: false },
    ],
  },
  {
    name:       'Launch',
    price:      '£29',
    period:     'per month',
    tagline:    'For active job seekers.',
    cta:        'Start Launch',
    ctaVariant: 'primary',
    popular:    true,
    features: [
      { text: 'Unlimited Evidence Bank entries',      included: true  },
      { text: 'Unlimited CV storage',                 included: true  },
      { text: 'Unlimited application tracking',       included: true  },
      { text: 'Full AI role-fit scoring',             included: true  },
      { text: '1 AI-written CV per month',            included: true  },
      { text: 'Specialist CV review',                 included: false },
      { text: 'Interview prep guides',                included: true  },
      { text: 'Priority support',                     included: false },
    ],
  },
  {
    name:       'Momentum',
    price:      '£79',
    period:     'per month',
    tagline:    'With a human specialist in your corner.',
    cta:        'Start Momentum',
    ctaVariant: 'primary',
    features: [
      { text: 'Everything in Launch',                 included: true  },
      { text: '2 specialist-reviewed CVs per month',  included: true  },
      { text: 'Cover letter writing (2/month)',        included: true  },
      { text: 'LinkedIn profile optimisation',         included: true  },
      { text: 'Interview prep (personalised)',         included: true  },
      { text: 'Offer negotiation guidance',           included: true  },
      { text: 'Dedicated career specialist',          included: false },
      { text: 'Priority 24h turnaround',              included: true  },
    ],
  },
]

const oneOffs = [
  { name: 'CV Rewrite',               price: '£79',  note: 'One targeted CV, specialist-reviewed' },
  { name: 'LinkedIn Optimisation',    price: '£49',  note: 'Full profile rewrite + keyword targeting' },
  { name: 'Cover Letter',             price: '£39',  note: 'Per letter, tailored to the role' },
  { name: 'Interview Preparation',    price: '£59',  note: '60-min session with a career specialist' },
  { name: 'Career Strategy Session',  price: '£99',  note: '90-min deep-dive, recorded' },
  { name: 'Salary Negotiation Prep',  price: '£49',  note: 'Scripts, counters, and confidence' },
]

const faqs = [
  {
    q: 'Is the free plan really free?',
    a: 'Yes. The Explore plan is free indefinitely. No credit card required to sign up. You only need to pay if you want AI CV writing, specialist reviews, or unlimited tracking.',
  },
  {
    q: 'What does "specialist-reviewed" mean?',
    a: 'A real human CV writer — not just AI — reads your CV, checks it against your target role, and makes edits before returning it to you. You then approve the final version.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: "Yes. Cancel from your account settings at any time. You'll keep access until the end of your billing period.",
  },
  {
    q: 'Do you apply to jobs on my behalf?',
    a: 'Never without your explicit approval. You review and approve every application. Roleora is a tool to help you apply — not an agent that acts without you.',
  },
  {
    q: 'How quickly do I get my CV back?',
    a: 'Launch CVs (AI-generated) are instant. Momentum specialist reviews are returned within 24 hours on business days.',
  },
]

export default function PricingPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="container-xl max-w-2xl mx-auto">
          <p className="eyebrow mb-4">Pricing</p>
          <h1 className="text-5xl font-display font-extrabold text-slate-900 mb-5">
            Start free. Scale with you.
          </h1>
          <p className="text-xl text-slate-500">
            Transparent pricing. No hidden fees. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 bg-white">
        <div className="container-xl">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className={cn(
                  'relative rounded-2xl border p-7 flex flex-col',
                  plan.popular
                    ? 'border-brand-400 shadow-brand ring-1 ring-brand-300'
                    : 'border-slate-200',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge variant="brand">Most popular</Badge>
                  </div>
                )}

                <div className="mb-6">
                  <h2 className="font-display font-bold text-xl text-slate-900 mb-1">{plan.name}</h2>
                  <p className="text-sm text-slate-500 mb-4">{plan.tagline}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-display font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-slate-400 text-sm mb-1">/ {plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map(({ text, included }) => (
                    <li key={text} className={cn('flex items-start gap-2 text-sm', included ? 'text-slate-700' : 'text-slate-400')}>
                      {included
                        ? <CheckCircle2 size={15} className="text-brand-500 shrink-0 mt-0.5" />
                        : <X           size={15} className="text-slate-300 shrink-0 mt-0.5" />}
                      {text}
                    </li>
                  ))}
                </ul>

                <Link to={ROUTES.REGISTER}>
                  <Button variant={plan.ctaVariant} className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            All plans include UK GDPR compliance, secure file storage, and 2FA.
          </p>
        </div>
      </section>

      {/* One-off services */}
      <section className="section-padding bg-slate-50">
        <div className="container-xl max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="eyebrow mb-3">One-off Services</p>
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">
              Need something specific?
            </h2>
            <p className="text-slate-500">Buy individual services without a subscription.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {oneOffs.map(({ name, price, note }) => (
              <div key={name} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{note}</p>
                </div>
                <span className="font-display font-bold text-brand-600 text-lg shrink-0">{price}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" iconRight={<ArrowRight size={16} />}>
                Get started to purchase
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-white">
        <div className="container-xl max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {faqs.map(({ q, a }) => (
              <div key={q} className="border-b border-slate-100 pb-6">
                <p className="font-semibold text-slate-900 mb-2">{q}</p>
                <p className="text-slate-500 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
