import { Link }   from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import {
  Star, FileText, Briefcase, BarChart2,
  ArrowRight, CheckCircle2, Upload, Pencil, Send, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { EvidenceCard, ApplicationCard, RoleFitCard, CVPreviewCard } from '@/components/ui/MockUI'
import { ROUTES } from '@/config/routes'

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden:  { opacity: 0, y: 32 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  }),
}

const fadeLeft = {
  hidden:  { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const fadeRight = {
  hidden:  { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.1 } },
}

const phases = [
  {
    number: '01',
    icon:   <Star size={28} />,
    color:  'bg-violet-100 text-violet-600',
    accent: 'from-violet-500 to-purple-600',
    bg:     'from-violet-50 to-brand-50',
    title:  'Build your Evidence Bank',
    summary:'Log everything — once. Use it forever.',
    body:   `Your Evidence Bank is the foundation of everything on Campus to Corporate. Add your work history, achievements,
certifications, projects, and skills. Our AI structures each entry using the STAR method (Situation, Task,
Action, Result) so your accomplishments are framed to land interviews.`,
    bullets: [
      'Import from LinkedIn in one click',
      'AI suggests metrics and impact statements',
      'Tag entries by skill, sector, or role type',
      'Never rewrite the same bullet point again',
    ],
    card: <EvidenceCard />,
  },
  {
    number: '02',
    icon:   <FileText size={28} />,
    color:  'bg-brand-100 text-brand-600',
    accent: 'from-brand-500 to-indigo-600',
    bg:     'from-brand-50 to-indigo-50',
    title:  'Get a CV that works',
    summary:'Human specialists. AI-enhanced. ATS-optimised.',
    body:   `Tell us the role you're targeting. Our CV writers pull the most relevant entries from your Evidence
Bank and craft a tailored, ATS-friendly CV. Every CV is reviewed by a human specialist — not just generated
by AI. You approve it before it's finalised.`,
    bullets: [
      'Specialist-reviewed, not auto-generated',
      'ATS score shown before you download',
      "Unlimited revisions until you're happy",
      'Word + PDF formats included',
    ],
    card: <CVPreviewCard />,
  },
  {
    number: '03',
    icon:   <Briefcase size={28} />,
    color:  'bg-emerald-100 text-emerald-600',
    accent: 'from-emerald-500 to-teal-600',
    bg:     'from-emerald-50 to-teal-50',
    title:  'Track your applications',
    summary:'Apply smarter. Miss nothing.',
    body:   `Save jobs, track every application through stages (Applied → Screen → Interview → Offer), and let
our AI score how well each role matches your profile before you apply. You decide what to apply to —
Campus to Corporate never applies on your behalf without your explicit approval.`,
    bullets: [
      'Role-fit score before every application',
      'Deadline reminders and follow-up nudges',
      'Notes and interview prep per application',
      'You approve every application — always',
    ],
    card: <ApplicationCard />,
  },
  {
    number: '04',
    icon:   <BarChart2 size={28} />,
    color:  'bg-amber-100 text-amber-700',
    accent: 'from-amber-500 to-orange-600',
    bg:     'from-amber-50 to-orange-50',
    title:  'Land the role',
    summary:'Insights to help you iterate and succeed.',
    body:   `See exactly where your job search stands — response rates, interview conversion, time-to-offer.
Use the data to refine your approach. Get interview prep tailored to the company and role.
And when an offer comes, we help you evaluate and negotiate it.`,
    bullets: [
      'Application funnel analytics',
      'Interview prep by role type',
      'Salary benchmark data for UK roles',
      'Offer evaluation and negotiation guidance',
    ],
    card: <RoleFitCard />,
  },
]

// ─── Phase row ────────────────────────────────────────────────────────────────
function PhaseRow({ phase, index }: { phase: typeof phases[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const cardY = useTransform(scrollYProgress, [0, 1], [30, -30])

  const reversed = index % 2 === 1

  return (
    <div
      ref={ref}
      className={`grid md:grid-cols-2 gap-12 lg:gap-20 items-center ${reversed ? 'md:grid-flow-dense' : ''}`}
    >
      {/* Text side */}
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={staggerContainer}
        className={reversed ? 'md:col-start-1' : ''}
      >
        {/* Step badge */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${phase.color} shrink-0`}>
            {phase.icon}
          </div>
          <div className="flex items-center gap-2">
            <div className={`h-px w-8 bg-gradient-to-r ${phase.accent}`} />
            <span className="text-xs font-bold tracking-[0.15em] text-slate-300 uppercase">
              Step {phase.number}
            </span>
          </div>
        </motion.div>

        <motion.h2
          variants={fadeUp}
          custom={1}
          className="text-3xl lg:text-4xl font-display font-bold text-slate-900 mb-2 leading-tight"
        >
          {phase.title}
        </motion.h2>

        <motion.p variants={fadeUp} custom={2} className="text-brand-600 font-semibold mb-4">
          {phase.summary}
        </motion.p>

        <motion.p variants={fadeUp} custom={3} className="text-slate-500 leading-relaxed mb-6 text-sm lg:text-base">
          {phase.body}
        </motion.p>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="space-y-2.5"
        >
          {phase.bullets.map((b, bi) => (
            <motion.li
              key={b}
              variants={fadeUp}
              custom={bi}
              className="flex items-start gap-2.5 text-sm text-slate-700"
            >
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: bi * 0.08 + 0.2, type: 'spring', stiffness: 200 }}
              >
                <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
              </motion.span>
              {b}
            </motion.li>
          ))}
        </motion.ul>
      </motion.div>

      {/* Card side */}
      <motion.div
        initial={reversed ? 'hidden' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        variants={reversed ? fadeRight : fadeLeft}
        className={`flex items-center justify-center ${reversed ? 'md:col-start-2' : ''}`}
      >
        <div className="relative w-full">
          {/* Gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${phase.bg} rounded-3xl`} />

          {/* Floating number watermark */}
          <div className="absolute top-4 right-6 text-8xl font-display font-extrabold text-slate-900/5 leading-none select-none pointer-events-none">
            {phase.number}
          </div>

          {/* Card */}
          <motion.div
            style={{ y: cardY }}
            className="relative z-10 flex items-center justify-center py-14 px-8"
          >
            {phase.card}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function HowItWorksPage() {
  const steps = [
    { icon: <Upload size={16} />,  label: 'Build Evidence Bank' },
    { icon: <Pencil size={16} />,  label: 'Get your CV written' },
    { icon: <Send size={16} />,    label: 'Track applications'  },
    { icon: <Trophy size={16} />,  label: 'Land the role'       },
  ]

  return (
    <>
      {/* ── Hero ── */}
      <section className="section-padding pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white text-center relative overflow-hidden">
        {/* Subtle radial */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/80 to-transparent pointer-events-none" />

        <div className="container-xl max-w-3xl mx-auto relative z-10">
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="eyebrow mb-4"
          >
            How It Works
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="text-5xl font-display font-extrabold text-slate-900 mb-5"
          >
            From Evidence to Offer
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            className="text-xl text-slate-500 leading-relaxed mb-8"
          >
            Campus to Corporate is a structured career operating system — not just another job board.
            Here's exactly what happens when you sign up.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.24 }}
          >
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
                Start for free
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Step strip ── */}
      <section className="bg-white border-y border-slate-100 py-6">
        <div className="container-xl">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-6 lg:gap-10"
          >
            {steps.map(({ icon, label }, i) => (
              <motion.div
                key={label}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-2 text-sm font-medium text-slate-600"
              >
                <span className="text-brand-500">{icon}</span>
                {label}
                {i < 3 && <ArrowRight size={12} className="text-slate-300 ml-2" />}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Phases ── */}
      <section className="section-padding bg-white">
        <div className="container-xl space-y-28 lg:space-y-36">
          {phases.map((phase, i) => (
            <PhaseRow key={phase.number} phase={phase} index={i} />
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="section-padding bg-gradient-to-b from-slate-50 to-white">
        <div className="container-xl">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 px-8 py-16 md:px-16 text-center"
          >
            <div className="absolute -top-16 -left-16 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="relative z-10"
            >
              <motion.p variants={fadeUp} className="eyebrow text-brand-200 mb-4">
                Get started today
              </motion.p>
              <motion.h2
                variants={fadeUp}
                custom={1}
                className="text-4xl md:text-5xl font-display font-extrabold text-white mb-5"
              >
                Ready to take control of your career?
              </motion.h2>
              <motion.p variants={fadeUp} custom={2} className="text-brand-200 text-lg mb-10">
                Free plan. No credit card. Start in 2 minutes.
              </motion.p>
              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link to={ROUTES.REGISTER}>
                  <Button variant="accent" size="lg" iconRight={<ArrowRight size={18} />}>
                    Start for free
                  </Button>
                </Link>
                <Link to={ROUTES.PRICING}>
                  <Button variant="dark" size="lg">View pricing</Button>
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
