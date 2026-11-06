import { useState }         from 'react'
import { Link }             from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, ChevronDown, Check, Minus, Sparkles } from 'lucide-react'
import { cn }               from '@/utils/cn'
import { ROUTES }           from '@/config/routes'
import { PLANS, PLAN_ORDER, type PlanDef, type PlanKey } from '@/config/plans'
import { useAuthStore }     from '@/stores/auth.store'

// ─── CTA destination ──────────────────────────────────────────────────────────
// Logged-out visitors register (carrying the chosen plan); logged-in customers go
// straight to the billing page, which starts Stripe checkout for the chosen plan.
function ctaHref(key: PlanKey, authed: boolean): string {
  if (key === 'STARTER') return authed ? ROUTES.DASHBOARD : ROUTES.REGISTER
  return authed ? `${ROUTES.SETTINGS}?upgrade=${key}` : `${ROUTES.REGISTER}?plan=${key}`
}

// ─── Comparison table ─────────────────────────────────────────────────────────
type Cell = boolean | string
const COMPARISON: { group: string; rows: { label: string; values: Record<PlanKey, Cell> }[] }[] = [
  {
    group: 'Self-service tools',
    rows: [
      { label: 'Career guidance and resources', values: { STARTER: true, EXPLORE: true, LAUNCH: true, MOMENTUM: true, ELITE: true } },
      { label: 'CV review',                     values: { STARTER: '1 free', EXPLORE: '1', LAUNCH: true, MOMENTUM: 'Priority', ELITE: 'Priority' } },
      { label: 'CV changes',                    values: { STARTER: false, EXPLORE: '1', LAUNCH: 'Unlimited', MOMENTUM: 'Unlimited', ELITE: 'Unlimited' } },
      { label: 'Application tracker',           values: { STARTER: true, EXPLORE: 'Up to 10 jobs', LAUNCH: 'Unlimited', MOMENTUM: 'Unlimited', ELITE: 'Unlimited' } },
      { label: 'Status tracking',               values: { STARTER: true, EXPLORE: true, LAUNCH: true, MOMENTUM: true, ELITE: true } },
      { label: 'Evidence Bank',                 values: { STARTER: 'Basic', EXPLORE: true, LAUNCH: 'Unlimited', MOMENTUM: 'Unlimited', ELITE: 'Unlimited' } },
      { label: 'LinkedIn optimisation',         values: { STARTER: false, EXPLORE: false, LAUNCH: true, MOMENTUM: true, ELITE: true } },
      { label: 'Interview prep resources',      values: { STARTER: false, EXPLORE: false, LAUNCH: true, MOMENTUM: 'Personalised', ELITE: 'Personalised' } },
      { label: 'Cover letters',                 values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: 'Unlimited', ELITE: true } },
    ],
  },
  {
    group: 'Weekly application allowance',
    rows: [
      { label: 'Applications per week',         values: { STARTER: false, EXPLORE: 'Up to 50', LAUNCH: 'Up to 100', MOMENTUM: 'Up to 100', ELITE: 'Up to 200' } },
    ],
  },
  {
    group: 'Personal support',
    rows: [
      { label: 'Dedicated career specialist',   values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: true, ELITE: true } },
      { label: 'Recruiter follow-up guidance',  values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: true, ELITE: true } },
      { label: 'Priority support',              values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: 'Priority reviews', ELITE: true } },
    ],
  },
  {
    group: 'Fully managed (we do it for you)',
    rows: [
      { label: 'Job discovery and shortlisting',                 values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
      { label: 'CV tailoring per role',                          values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
      { label: 'Application preparation and submission',         values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
      { label: 'Recruiter and hiring-manager outreach',          values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
      { label: 'Follow-ups and response tracking',               values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
      { label: 'Interview invitation monitoring and scheduling', values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
      { label: 'Regular progress reporting',                     values: { STARTER: false, EXPLORE: false, LAUNCH: false, MOMENTUM: false, ELITE: true } },
    ],
  },
]

function CellView({ v }: { v: Cell }) {
  if (v === true)  return <><Check size={16} className="mx-auto text-emerald-600" aria-hidden /><span className="sr-only">Included</span></>
  if (v === false) return <><Minus size={16} className="mx-auto text-slate-300" aria-hidden /><span className="sr-only">Not included</span></>
  return <span className="text-xs font-medium text-slate-700">{v}</span>
}

function ComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[820px] text-sm">
        <caption className="sr-only">Feature comparison across Starter, Explore, Launch, Pro and Elite Concierge</caption>
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th scope="col" className="text-left px-4 py-3 font-semibold text-slate-500 w-[28%]">Feature</th>
            {PLAN_ORDER.map(k => (
              <th key={k} scope="col" className={cn('px-3 py-3 text-center font-semibold', k === 'ELITE' ? 'text-amber-700 bg-amber-50' : 'text-slate-900')}>
                {PLANS[k].name}
                <span className="block text-xs font-normal text-slate-500">{PLANS[k].price}{PLANS[k].pricePence ? '/mo' : ''}</span>
              </th>
            ))}
          </tr>
        </thead>
        {COMPARISON.map(g => (
          <tbody key={g.group}>
            <tr><th colSpan={6} scope="colgroup" className="text-left px-4 pt-5 pb-2 text-xs font-bold uppercase tracking-wider text-brand-700">{g.group}</th></tr>
            {g.rows.map(r => (
              <tr key={r.label} className="border-t border-slate-100">
                <th scope="row" className="text-left px-4 py-2.5 font-medium text-slate-700">{r.label}</th>
                {PLAN_ORDER.map(k => (
                  <td key={k} className={cn('px-3 py-2.5 text-center', k === 'ELITE' && 'bg-amber-50/50')}>
                    <CellView v={r.values[k]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </div>
  )
}

// ─── Plan card ────────────────────────────────────────────────────────────────
function PlanCard({ plan, authed }: { plan: PlanDef; authed: boolean }) {
  const elite   = plan.key === 'ELITE'
  const popular = plan.key === 'LAUNCH'
  const free    = plan.pricePence === 0

  return (
    <article
      aria-labelledby={`plan-${plan.key}`}
      className={cn(
        'relative flex flex-col rounded-2xl border p-6',
        elite   && 'bg-slate-900 border-amber-400/60 text-white shadow-xl shadow-amber-500/10 sm:col-span-2 xl:col-span-1',
        popular && 'bg-white border-brand-500 ring-2 ring-brand-500/30 shadow-lg',
        !elite && !popular && 'bg-white border-slate-200',
      )}
    >
      {plan.badge && (
        <span className={cn(
          'absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold',
          elite ? 'bg-amber-400 text-slate-900' : popular ? 'bg-brand-600 text-white' : 'bg-violet-600 text-white',
        )}>
          {elite && <Sparkles size={12} aria-hidden />}{plan.badge}
        </span>
      )}

      <h3 id={`plan-${plan.key}`} className={cn('text-lg font-display font-bold', elite ? 'text-white' : 'text-slate-900')}>
        {plan.name}
      </h3>
      <p className={cn('mt-1 text-sm min-h-[3.5rem]', elite ? 'text-slate-300' : 'text-slate-500')}>{plan.tagline}</p>

      <div className="mt-4 mb-5">
        <span className={cn('text-4xl font-display font-extrabold', elite ? 'text-white' : 'text-slate-900')}>{plan.price}</span>
        <span className={cn('ml-1 text-sm', elite ? 'text-slate-400' : 'text-slate-500')}>{plan.period}</span>
        {plan.weekly > 0 && (
          <p className={cn('mt-2 text-sm font-semibold', elite ? 'text-amber-300' : 'text-brand-700')}>
            Up to {plan.weekly} applications per week
          </p>
        )}
      </div>

      <Link
        to={ctaHref(plan.key, authed)}
        className={cn(
          'block w-full text-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          elite   ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 focus-visible:ring-amber-300 focus-visible:ring-offset-slate-900'
          : popular ? 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500'
          : free ? 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-400'
          : 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-500',
        )}
      >
        {plan.cta}
      </Link>

      <ul className="mt-6 space-y-2.5">
        {plan.features.map(f => (
          <li key={f} className={cn('flex items-start gap-2 text-sm', elite ? 'text-slate-200' : 'text-slate-700')}>
            <CheckCircle2 size={16} className={cn('mt-0.5 shrink-0', elite ? 'text-amber-400' : 'text-emerald-500')} aria-hidden />
            {f}
          </li>
        ))}
      </ul>
    </article>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'What is the difference between the self-service plans and Elite Concierge?',
    a: 'Starter, Explore, Launch and Pro give you tools, resources and (on Pro) a dedicated career specialist — you run your own search. Elite Concierge is a managed service: our team finds and shortlists roles, tailors your CV, prepares and submits applications, manages recruiter communication and helps coordinate interviews on your behalf.',
  },
  {
    q: 'How do weekly application limits work?',
    a: 'Each paid plan has a weekly allowance — the maximum number of applications that can be submitted for you in a week. The week runs Monday 00:00 to Monday 00:00 UK time. Only applications confirmed as submitted count towards it; failed, duplicate or blocked attempts do not. Unused applications do not roll over. The allowance is a ceiling, not a promise of volume — the number submitted depends on suitable roles being available.',
  },
  {
    q: 'Do you guarantee interviews or job offers?',
    a: 'No. We cannot guarantee interviews, offers or particular outcomes — those depend on employers and the market. Elite Concierge manages the work of your search, so that your only job is to show up ready for the interview.',
  },
  {
    q: 'What does Elite Concierge do on my behalf?',
    a: 'Only what you authorise. During onboarding you tell us your target roles, locations, salary range, work authorisation and preferences, and you choose whether we may submit applications and contact recruiters for you. Recruiter messages are drafted and approved before sending, and we never act on your private accounts without your explicit permission.',
  },
  {
    q: 'Can I upgrade, downgrade or cancel?',
    a: 'Yes. You can change plan or cancel at any time from Settings via the secure billing portal. Changes take effect according to Stripe billing rules and cancellation stops future renewals.',
  },
  {
    q: 'Which plan should I choose?',
    a: 'Start free for guidance and a CV review. Choose Explore or Launch to build and send applications yourself, Pro for personal support from a career specialist, and Elite Concierge if you would rather hand the whole search to us.',
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-slate-900 text-sm pr-4">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.22 }} className="shrink-0 text-slate-400">
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
            <p className="px-5 pb-5 text-slate-500 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PricingPage() {
  const authed = useAuthStore((s) => !!s.user && !!s.accessToken)

  return (
    <>
      <section className="section-padding pt-24 pb-14 bg-gradient-to-b from-slate-50 to-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/80 to-transparent pointer-events-none" />
        <div className="container-xl max-w-2xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="eyebrow mb-4">Pricing</p>
            <h1 className="text-5xl font-display font-extrabold text-slate-900 mb-5">
              Choose how much support you need.
            </h1>
            <p className="text-xl text-slate-500">
              From free career guidance to a fully managed job search, find the right plan for your next opportunity.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="pb-16 bg-white" aria-label="Plans">
        <div className="container-xl">
          <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-5 max-w-[88rem] mx-auto pt-3">
            {PLAN_ORDER.map((k) => <PlanCard key={k} plan={PLANS[k]} authed={authed} />)}
          </div>
          <p className="text-center text-sm text-slate-400 mt-6">
            Prices are per month in GBP. Weekly limits are maximum allowances, not guaranteed volumes. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Elite spotlight */}
      <section className="pb-16 bg-white">
        <div className="container-xl max-w-4xl mx-auto">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 text-center border border-amber-400/40">
            <p className="text-amber-300 text-xs font-bold uppercase tracking-widest mb-3">Elite Concierge</p>
            <h2 className="text-3xl sm:text-4xl font-display font-extrabold mb-4">Your next career move, managed for you.</h2>
            <p className="text-slate-300 mb-4 leading-relaxed">
              From finding opportunities and submitting applications to recruiter communication and interview coordination,
              our team manages your job search so you can concentrate on preparing for your next interview.
            </p>
            <p className="text-slate-400 text-sm mb-7">Your only job is to show up ready for the interview.</p>
            <Link
              to={ctaHref('ELITE', authed)}
              className="inline-block rounded-xl bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-amber-300 transition-colors"
            >
              {PLANS.ELITE.cta}
            </Link>
          </div>
        </div>
      </section>

      {/* Self-service vs managed */}
      <section className="pb-16 bg-white">
        <div className="container-xl max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
          <div className="rounded-2xl border border-slate-200 p-6">
            <h2 className="font-display font-bold text-slate-900 text-lg mb-2">Self-service &middot; Starter to Pro</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              You stay in control. Use our CV tools, Evidence Bank, tracker and guidance to run your own search, with
              weekly application allowances that grow by plan and personal support from a career specialist on Pro.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6">
            <h2 className="font-display font-bold text-slate-900 text-lg mb-2">Fully managed &middot; Elite Concierge</h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              We do the work. Our team handles discovery, tailoring, applications, recruiter messages, follow-ups and
              interview scheduling &mdash; with your permission at every step &mdash; and keeps you updated with regular progress reports.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 bg-white" aria-label="Compare plans">
        <div className="container-xl max-w-6xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-8">Compare plans</h2>
          <ComparisonTable />
        </div>
      </section>

      <section className="section-padding bg-slate-50">
        <div className="container-xl max-w-2xl mx-auto">
          <h2 className="text-3xl font-display font-bold text-slate-900 text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </section>
    </>
  )
}
