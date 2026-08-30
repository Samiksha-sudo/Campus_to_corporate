import { Link }   from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Star, FileText, Briefcase, BarChart2,
  ArrowRight, CheckCircle2, Upload, Pencil, Send, Trophy,
} from 'lucide-react'
import { Button } from '@/components/ui'
import { EvidenceCard, ApplicationCard, RoleFitCard, CVPreviewCard } from '@/components/ui/MockUI'
import { ROUTES } from '@/config/routes'

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.45 } }),
}

const phases = [
  {
    number: '01',
    icon: <Star size={28} />,
    color: 'bg-violet-100 text-violet-600',
    title: 'Build your Evidence Bank',
    summary: 'Log everything — once. Use it forever.',
    body: `Your Evidence Bank is the foundation of everything on Roleora. Add your work history, achievements,
    certifications, projects, and skills. Our AI structures each entry using the STAR method (Situation, Task,
    Action, Result) so your accomplishments are framed to land interviews.`,
    bullets: [
      'Import from LinkedIn in one click',
      'AI suggests metrics and impact statements',
      'Tag entries by skill, sector, or role type',
      'Never rewrite the same bullet point again',
    ],
    imgPlaceholder: true,
  },
  {
    number: '02',
    icon: <FileText size={28} />,
    color: 'bg-brand-100 text-brand-600',
    title: 'Get a CV that works',
    summary: 'Human specialists. AI-enhanced. ATS-optimised.',
    body: `Tell us the role you're targeting. Our CV writers pull the most relevant entries from your Evidence
    Bank and craft a tailored, ATS-friendly CV. Every CV is reviewed by a human specialist — not just generated
    by AI. You approve it before it's finalised.`,
    bullets: [
      'Specialist-reviewed, not auto-generated',
      'ATS score shown before you download',
      "Unlimited revisions until you're happy",
      'Word + PDF formats included',
    ],
    imgPlaceholder: true,
  },
  {
    number: '03',
    icon: <Briefcase size={28} />,
    color: 'bg-emerald-100 text-emerald-600',
    title: 'Track your applications',
    summary: 'Apply smarter. Miss nothing.',
    body: `Save jobs, track every application through stages (Applied → Screen → Interview → Offer), and let
    our AI score how well each role matches your profile before you apply. You decide what to apply to —
    Roleora never applies on your behalf without your explicit approval.`,
    bullets: [
      'Role-fit score before every application',
      'Deadline reminders and follow-up nudges',
      'Notes and interview prep per application',
      'You approve every application — always',
    ],
    imgPlaceholder: true,
  },
  {
    number: '04',
    icon: <BarChart2 size={28} />,
    color: 'bg-amber-100 text-amber-700',
    title: 'Land the role',
    summary: 'Insights to help you iterate and succeed.',
    body: `See exactly where your job search stands — response rates, interview conversion, time-to-offer.
    Use the data to refine your approach. Get interview prep tailored to the company and role.
    And when an offer comes, we help you evaluate and negotiate it.`,
    bullets: [
      'Application funnel analytics',
      'Interview prep by role type',
      'Salary benchmark data for UK roles',
      'Offer evaluation and negotiation guidance',
    ],
    imgPlaceholder: true,
  },
]

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white text-center">
        <div className="container-xl max-w-3xl mx-auto">
          <p className="eyebrow mb-4">How It Works</p>
          <h1 className="text-5xl font-display font-extrabold text-slate-900 mb-5">
            From Evidence to Offer
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-8">
            Roleora is a structured career operating system — not just another job board. Here's exactly what happens when you sign up.
          </p>
          <Link to={ROUTES.REGISTER}>
            <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>
              Start for free
            </Button>
          </Link>
        </div>
      </section>

      {/* Quick steps strip */}
      <section className="bg-white border-y border-slate-100 py-6">
        <div className="container-xl">
          <div className="flex flex-wrap justify-center gap-8">
            {[
              { icon: <Upload size={16} />,  label: 'Build Evidence Bank' },
              { icon: <Pencil size={16} />,  label: 'Get your CV written' },
              { icon: <Send size={16} />,    label: 'Track applications' },
              { icon: <Trophy size={16} />,  label: 'Land the role' },
            ].map(({ icon, label }, i) => (
              <div key={label} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="text-brand-500">{icon}</span>
                {label}
                {i < 3 && <ArrowRight size={12} className="text-slate-300 ml-2" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed phases */}
      <section className="section-padding bg-white">
        <div className="container-xl space-y-24">
          {phases.map(({ number, icon, color, title, summary, body, bullets }, i) => (
            <motion.div
              key={number}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={fadeUp}
              className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? 'md:grid-flow-dense' : ''}`}
            >
              {/* Text */}
              <div className={i % 2 === 1 ? 'md:col-start-1' : ''}>
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
                    {icon}
                  </div>
                  <span className="text-xs font-bold tracking-widest text-slate-300">{number}</span>
                </div>
                <h2 className="text-3xl font-display font-bold text-slate-900 mb-2">{title}</h2>
                <p className="text-brand-600 font-medium mb-4">{summary}</p>
                <p className="text-slate-600 leading-relaxed mb-6">{body}</p>
                <ul className="space-y-2">
                  {bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-700">
                      <CheckCircle2 size={16} className="text-brand-500 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual panel */}
              <div className={`flex items-center justify-center ${i % 2 === 1 ? 'md:col-start-2' : ''}`}>
                <div className="relative flex items-center justify-center w-full h-72">
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    i === 0 ? 'from-violet-50 to-brand-50' :
                    i === 1 ? 'from-brand-50 to-indigo-50' :
                    i === 2 ? 'from-emerald-50 to-teal-50'  :
                              'from-amber-50 to-orange-50'
                  } rounded-3xl`} />
                  <div className="relative z-10">
                    {i === 0 && <EvidenceCard />}
                    {i === 1 && <CVPreviewCard />}
                    {i === 2 && <ApplicationCard />}
                    {i === 3 && <RoleFitCard />}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="section-padding bg-slate-50">
        <div className="container-xl text-center max-w-2xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-slate-900 mb-4">
            Ready to take control of your career?
          </h2>
          <p className="text-slate-500 mb-8">Free plan. No credit card. Start in 2 minutes.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" size="lg" iconRight={<ArrowRight size={18} />}>Start for free</Button>
            </Link>
            <Link to={ROUTES.PRICING}>
              <Button variant="secondary" size="lg">View pricing</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
