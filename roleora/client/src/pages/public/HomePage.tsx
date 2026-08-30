import { Link }            from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef }          from 'react'
import {
  ArrowRight, CheckCircle2, FileText, Briefcase,
  Star, BarChart2, Shield, Zap, Sparkles,
} from 'lucide-react'
import { Button }          from '@/components/ui'
import {
  EvidenceCard, ApplicationCard, RoleFitCard,
  CVPreviewCard, DashboardPanel,
} from '@/components/ui/MockUI'
import { ROUTES }          from '@/config/routes'

// ─── Animated blob ────────────────────────────────────────────────────────────
function Blob({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ scale: [1, 1.12, 1], rotate: [0, 8, -4, 0] }}
      transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute rounded-full blur-3xl pointer-events-none opacity-50 ${className}`}
    />
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const heroY    = useTransform(scrollYProgress, [0, 1], [0, 80])
  const cardsY   = useTransform(scrollYProgress, [0, 1], [0, -50])

  const textVariants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.12 } },
  }
  const item = {
    hidden:  { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <section ref={ref} className="relative overflow-hidden min-h-screen flex items-center bg-gradient-to-br from-slate-950 via-brand-950 to-slate-950 pt-16">
      {/* Animated gradient blobs */}
      <Blob className="w-[700px] h-[700px] bg-brand-600/25 -top-40 -left-40" />
      <Blob className="w-[500px] h-[500px] bg-violet-600/20 top-1/2 -right-32" />
      <Blob className="w-[400px] h-[400px] bg-accent-500/20 bottom-0 left-1/3" />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div className="container-xl relative z-10 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            style={{ y: heroY }}
            initial="hidden"
            animate="visible"
            variants={textVariants}
          >
            <motion.div variants={item} className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
              <Sparkles size={13} className="text-accent-400" />
              <span className="text-xs font-semibold text-white/80">UK Career Platform</span>
            </motion.div>

            <motion.h1 variants={item}
              className="text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.05] tracking-tight mb-6"
            >
              Your career,{' '}
              <span className="relative">
                <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
                  managed.
                </span>
                <motion.span
                  className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-brand-400 to-violet-400 rounded-full"
                  initial={{ scaleX: 0, originX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.7, duration: 0.6, ease: 'easeOut' }}
                />
              </span>
            </motion.h1>

            <motion.p variants={item}
              className="text-lg text-white/60 leading-relaxed max-w-lg mb-10"
            >
              Roleora combines expert career specialists with AI to help UK professionals
              build standout CVs, track applications, and land the roles they deserve.
            </motion.p>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
              <Link to={ROUTES.REGISTER}>
                <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                  Start for free
                </Button>
              </Link>
              <Link to={ROUTES.HOW_IT_WORKS}>
                <Button variant="dark" size="lg">See how it works</Button>
              </Link>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-4 mt-8">
              {['Free plan available', 'No credit card', 'UK-focused'].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-sm text-white/50">
                  <CheckCircle2 size={13} className="text-brand-400" />
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — floating mock UI cards */}
          <motion.div style={{ y: cardsY }} className="relative h-[520px] hidden lg:block">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/10 to-violet-600/10 rounded-3xl blur-2xl" />

            {/* Cards positioned */}
            <motion.div
              initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute top-0 right-0"
            >
              <EvidenceCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.55, duration: 0.6 }}
              className="absolute top-40 left-0"
            >
              <ApplicationCard />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.6 }}
              className="absolute bottom-0 right-8"
            >
              <RoleFitCard />
            </motion.div>

            {/* Connecting line decoration */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 400 520">
              <motion.path
                d="M 290 80 Q 160 200 100 260 Q 50 320 220 440"
                fill="none" stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="6 4"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                transition={{ delay: 1, duration: 1.5, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </div>

        {/* Stats strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: '3×',     label: 'More interview callbacks',    color: 'text-brand-400'  },
            { value: '14 days', label: 'Avg. time to first interview', color: 'text-violet-400' },
            { value: '94%',    label: 'CV approval rate',             color: 'text-emerald-400'},
            { value: '£0',     label: 'To get started',               color: 'text-accent-400' },
          ].map(({ value, label, color }) => (
            <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-4 text-center">
              <p className={`text-3xl font-display font-extrabold ${color}`}>{value}</p>
              <p className="text-sm text-white/50 mt-1">{label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { step: '01', icon: <Star size={20} />,      title: 'Build your Evidence Bank',  body: 'Log achievements once. AI structures them in STAR format. Reuse across every application forever.',   color: 'from-violet-500 to-purple-600' },
    { step: '02', icon: <FileText size={20} />,  title: 'Get a specialist-reviewed CV', body: 'Target a role, our CV writers craft a tailored ATS-optimised CV. Human-reviewed before delivery.', color: 'from-brand-500 to-indigo-600' },
    { step: '03', icon: <Briefcase size={20} />, title: 'Track every application',    body: 'AI role-fit scoring. Kanban pipeline. You approve every application — we never apply without you.',    color: 'from-emerald-500 to-teal-600'  },
    { step: '04', icon: <BarChart2 size={20} />, title: 'Land the role',              body: 'Career analytics, interview prep, offer evaluation. See exactly where your job search stands.',          color: 'from-amber-500 to-orange-600'  },
  ]

  return (
    <section className="section-padding bg-white relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/60 to-transparent pointer-events-none" />

      <div className="container-xl relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="eyebrow mb-3">The Process</p>
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">From Evidence to Offer</h2>
          <p className="text-lg text-slate-500 max-w-xl mx-auto">
            A structured 4-step system that turns your experience into interviews.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ step, icon, title, body, color }, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="group relative bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:shadow-brand transition-all duration-300 cursor-default"
            >
              {/* Gradient icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                {icon}
              </div>

              <span className="absolute top-5 right-5 text-2xl font-display font-extrabold text-slate-100 group-hover:text-slate-200 transition-colors">
                {step}
              </span>

              <h3 className="font-display font-bold text-slate-900 mb-2 leading-snug">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>

              {/* Bottom accent line */}
              <motion.div
                className={`absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r ${color} rounded-full`}
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 + 0.3, duration: 0.5 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Product showcase ─────────────────────────────────────────────────────────
function Showcase() {
  return (
    <section className="section-padding bg-slate-950 relative overflow-hidden">
      <Blob className="w-[600px] h-[600px] bg-brand-700/20 -top-40 -right-40" />
      <Blob className="w-[400px] h-[400px] bg-violet-700/15 bottom-0 left-0" />

      <div className="container-xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — dashboard panel */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center"
          >
            <div className="relative">
              {/* Glow behind dashboard */}
              <div className="absolute -inset-4 bg-gradient-to-br from-brand-600/30 to-violet-600/20 rounded-3xl blur-xl" />
              <div className="relative">
                <DashboardPanel />
                {/* Floating CV card */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-16 -bottom-8 hidden xl:block"
                >
                  <CVPreviewCard />
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Right — copy */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow text-brand-400 mb-4">Your Dashboard</p>
            <h2 className="text-4xl font-display font-bold text-white mb-5">
              See your whole job search in one place
            </h2>
            <p className="text-white/60 leading-relaxed mb-8">
              Real-time application funnel, interview conversion rate, response analytics —
              all in one dashboard. No more spreadsheets. No more guessing.
            </p>

            <div className="space-y-4">
              {[
                { icon: <BarChart2 size={16} />, text: 'Application funnel with stage-by-stage breakdown' },
                { icon: <Zap       size={16} />, text: 'AI role-fit score before every application' },
                { icon: <Shield    size={16} />, text: 'You approve every application — always' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/20 text-brand-400 flex items-center justify-center shrink-0 mt-0.5">
                    {icon}
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>

            <Link to={ROUTES.REGISTER} className="inline-block mt-8">
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Get started free
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ─── Features ─────────────────────────────────────────────────────────────────
function Features() {
  const features = [
    { icon: <FileText size={20} />, title: 'Specialist-written CVs',  body: 'Real humans review every CV before delivery. No auto-generated garbage.', gradient: 'from-brand-500 to-indigo-500' },
    { icon: <Zap      size={20} />, title: 'AI role-fit scoring',     body: 'Paste a JD and instantly see how well your profile matches — broken down by skill.', gradient: 'from-violet-500 to-purple-500' },
    { icon: <Briefcase size={20}/>, title: 'Application tracker',     body: 'Kanban pipeline to track every application from Saved to Offer.', gradient: 'from-emerald-500 to-teal-500' },
    { icon: <Star     size={20} />, title: 'Evidence Bank',           body: 'Log once, reuse everywhere. Every achievement, structured and searchable.', gradient: 'from-amber-500 to-orange-500' },
    { icon: <BarChart2 size={20}/>, title: 'Career analytics',        body: 'Response rates, interview conversion, time-to-offer — all visualised.', gradient: 'from-rose-500 to-pink-500' },
    { icon: <Shield   size={20} />, title: 'UK GDPR compliant',       body: 'Your data stays yours. We never share your CV with employers without consent.', gradient: 'from-slate-500 to-slate-700' },
  ]

  return (
    <section className="section-padding bg-white relative overflow-hidden">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="eyebrow mb-3">Everything you need</p>
          <h2 className="text-4xl font-display font-bold text-slate-900">
            One platform for your whole job search
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map(({ icon, title, body, gradient }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lifted transition-all duration-300 overflow-hidden relative"
            >
              {/* Hover gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />

              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-110 transition-transform duration-200`}>
                {icon}
              </div>
              <h3 className="font-display font-semibold text-slate-900 mb-1.5">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── CTA ──────────────────────────────────────────────────────────────────────
function CTA() {
  return (
    <section className="section-padding bg-white">
      <div className="container-xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 px-8 py-16 md:px-16 text-center"
        >
          {/* Blobs inside CTA */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <p className="eyebrow text-brand-200 mb-4">Get started today</p>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold text-white mb-5">
              Ready to land your next role?
            </h2>
            <p className="text-brand-200 text-lg max-w-xl mx-auto mb-10">
              Free plan. No credit card. Set up in 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.REGISTER}>
                <Button variant="accent" size="lg" iconRight={<ArrowRight size={18} />}>
                  Start for free
                </Button>
              </Link>
              <Link to={ROUTES.PRICING}>
                <Button variant="dark" size="lg">View pricing</Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-brand-300">
              {['Free plan available', 'Cancel anytime', 'No hidden fees', 'UK-based specialists'].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-brand-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Showcase />
      <Features />
      <CTA />
    </>
  )
}
