import { useState }         from 'react'
import { Link }             from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, X, ChevronDown, ArrowRight, Zap } from 'lucide-react'
import { cn }               from '@/utils/cn'
import { Button, Badge }    from '@/components/ui'
import { ROUTES }           from '@/config/routes'

// ─── Plans ────────────────────────────────────────────────────────────────────
interface Plan {
  name:       string
  monthly:    string
  annual:     string
  period:     string
  tagline:    string
  cta:        string
  ctaVariant: 'primary' | 'secondary' | 'accent'
  popular?:   boolean
  highlight?: boolean
  features:   { text: string; included: boolean }[]
}

const plans: Plan[] = [
  {
    name:       'Starter',
    monthly:    '£0',
    annual:     '£0',
    period:     'forever',
    tagline:    'Free career guidance + CV review.',
    cta:        'Start free',
    ctaVariant: 'secondary',
    features: [
      { text: 'Career guidance & resources',          included: true  },
      { text: '1 free CV review included',            included: true  },
      { text: 'Application tracker',                  included: false },
      { text: 'Application status tracking',          included: false },
      { text: 'Evidence Bank',                        included: false },
      { text: 'Unlimited CV changes',                 included: false },
      { text: 'Job applications',                     included: false },
      { text: 'Guaranteed interviews',                included: false },
    ],
  },
  {
    name:       'Explore',
    monthly:    '£10',
    annual:     '£8',
    period:     'per month',
    tagline:    'Start building your profile.',
    cta:        'Start Explore',
    ctaVariant: 'secondary',
    features: [
      { text: 'Career guidance & resources',          included: true  },
      { text: '1 CV review + 1 CV change included',  included: true  },
      { text: 'Application tracker (up to 10 jobs)',  included: true  },
      { text: 'Application status tracking',          included: true  },
      { text: 'Evidence Bank',                        included: false },
      { text: 'Unlimited CV changes',                 included: false },
      { text: 'Job applications (50/week)',            included: false },
      { text: 'Guaranteed interview per month',       included: false },
    ],
  },
  {
    name:       'Launch',
    monthly:    '£20',
    annual:     '£16',
    period:     'per month',
    tagline:    'Land your first interview.',
    cta:        'Start Launch',
    ctaVariant: 'primary',
    popular:    true,
    features: [
      { text: 'Career guidance & resources',          included: true  },
      { text: 'Unlimited CV changes',                 included: true  },
      { text: '50 job applications per week',         included: true  },
      { text: 'Application status tracking',          included: true  },
      { text: 'Guaranteed 1 interview per month',     included: true  },
      { text: 'LinkedIn profile optimisation',        included: true  },
      { text: 'Evidence Bank (unlimited)',            included: true  },
      { text: '200 applications per week',            included: false },
    ],
  },
  {
    name:       'Momentum',
    monthly:    '£40',
    annual:     '£32',
    period:     'per month',
    tagline:    'Multiple interviews every month.',
    cta:        'Start Momentum',
    ctaVariant: 'primary',
    highlight:  true,
    features: [
      { text: 'Everything in Launch',                 included: true  },
      { text: 'Unlimited CV changes',                 included: true  },
      { text: '200 job applications per week',        included: true  },
      { text: 'Application status tracking',          included: true  },
      { text: 'Multiple interviews per month',        included: true  },
      { text: 'Cover letter writing (unlimited)',     included: true  },
      { text: 'Interview prep (personalised)',        included: true  },
      { text: 'Dedicated career specialist',          included: true  },
    ],
  },
]

const faqs = [
  {
    q: 'What is the Starter plan?',
    a: 'Starter is completely free — no credit card needed. You get career guidance resources and 1 free CV review to get you started.',
  },
  {
    q: 'What does "guaranteed 1 interview per month" mean?',
    a: 'On Launch, we apply to 50 jobs per week on your behalf. If you don\'t receive at least one interview invitation in a month, we\'ll review your profile and strategy at no extra cost.',
  },
  {
    q: 'How does the weekly application limit work?',
    a: 'Applications reset every 7 days from your plan start date. Launch gets 50/week, Momentum gets 200/week. You approve every application before it goes out.',
  },
  {
    q: 'What is application status tracking?',
    a: 'We show you the real-time status of every application — from Saved through to Applied, Screening, Interview, Offer, or Rejected. No more chasing companies or guessing where things stand.',
  },
  {
    q: 'Do you apply to jobs on my behalf?',
    a: 'Yes — but never without your approval. You review every job before we apply. We handle the form-filling, cover letters, and submission.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from Settings at any time. You keep access until the end of your billing period. No questions asked.',
  },
  {
    q: 'What\'s the difference between Launch and Momentum?',
    a: 'Launch gives you 50 applications/week and a guaranteed interview per month. Momentum gives you 200/week, multiple interviews per month, personalised cover letters, a dedicated specialist, and priority queuing.',
  },
  {
    q: 'Is there an annual discount?',
    a: 'Yes — pay annually and save 20%. Explore drops to £8/mo, Launch to £16/mo (£192/yr), Momentum to £32/mo (£384/yr).',
  },
]

// ─── FAQ accordion item ───────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 text-sm pr-4">{q}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.22 }}
          className="shrink-0 text-slate-400"
        >
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-5 text-slate-500 text-sm leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annual : plan.monthly

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      className={cn(
        'relative rounded-2xl border flex flex-col transition-shadow duration-300',
        plan.popular
          ? 'border-brand-400 shadow-brand ring-1 ring-brand-300'
          : plan.highlight
            ? 'border-violet-400 shadow-[0_0_0_1px_rgb(139_92_246/0.2),0_8px_32px_-4px_rgb(139_92_246/0.35)]'
            : 'border-slate-200 hover:shadow-lifted',
        plan.highlight
          ? 'bg-gradient-to-b from-slate-950 to-slate-900 text-white'
          : 'bg-white',
      )}
    >
      {/* Popular / Best value badge */}
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <Badge variant="brand">Most popular</Badge>
        </div>
      )}
      {plan.highlight && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[11px] font-bold px-3 py-1 rounded-full">
            <Zap size={10} /> Best value
          </span>
        </div>
      )}

      <div className="p-7 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-6">
          <h2 className={cn('font-display font-bold text-xl mb-1', plan.highlight ? 'text-white' : 'text-slate-900')}>
            {plan.name}
          </h2>
          <p className={cn('text-sm mb-4', plan.highlight ? 'text-white/60' : 'text-slate-500')}>
            {plan.tagline}
          </p>
          <div className="flex items-end gap-1.5">
            <AnimatePresence mode="wait">
              <motion.span
                key={price}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className={cn('text-4xl font-display font-extrabold', plan.highlight ? 'text-white' : 'text-slate-900')}
              >
                {price}
              </motion.span>
            </AnimatePresence>
            <span className={cn('text-sm mb-1', plan.highlight ? 'text-white/50' : 'text-slate-400')}>
              {plan.monthly === '£0' ? '' : `/ mo${annual ? ' (billed annually)' : ''}`}
            </span>
          </div>
          {plan.monthly !== '£0' && annual && (
            <p className={cn('text-xs mt-1', plan.highlight ? 'text-violet-300' : 'text-brand-600')}>
              Save 20% vs monthly
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-2.5 mb-8 flex-1">
          {plan.features.map(({ text, included }) => (
            <li key={text} className={cn(
              'flex items-start gap-2 text-sm',
              included
                ? plan.highlight ? 'text-white/80' : 'text-slate-700'
                : plan.highlight ? 'text-white/25' : 'text-slate-400',
            )}>
              {included
                ? <CheckCircle2 size={15} className={plan.highlight ? 'text-violet-400 shrink-0 mt-0.5' : 'text-brand-500 shrink-0 mt-0.5'} />
                : <X           size={15} className="text-slate-300 shrink-0 mt-0.5" />}
              {text}
            </li>
          ))}
        </ul>

        <Link to={ROUTES.REGISTER}>
          <Button
            variant={plan.highlight ? 'accent' : plan.ctaVariant}
            className="w-full"
            iconRight={<ArrowRight size={15} />}
          >
            {plan.cta}
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Hero */}
      <section className="section-padding pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/80 to-transparent pointer-events-none" />
        <div className="container-xl max-w-2xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="eyebrow mb-4">Pricing</p>
            <h1 className="text-5xl font-display font-extrabold text-slate-900 mb-5">
              Start free. Scale with you.
            </h1>
            <p className="text-xl text-slate-500 mb-10">
              Transparent pricing. No hidden fees. Cancel anytime.
            </p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-3 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setAnnual(false)}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
                  !annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2',
                  annual ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700',
                )}
              >
                Annual
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 bg-white">
        <div className="container-xl">
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <PlanCard key={plan.name} plan={plan} annual={annual} />
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            All plans include UK GDPR compliance, secure file storage, and 2FA.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-slate-50">
        <div className="container-xl max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl font-display font-bold text-slate-900 text-center mb-10"
          >
            Frequently asked questions
          </motion.h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <FAQItem key={q} q={q} a={a} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
