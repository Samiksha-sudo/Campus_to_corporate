import { Link }   from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'

const values = [
  {
    icon: '🎯',
    title: 'You approve everything',
    body: 'Roleora never applies to a job on your behalf without your explicit say-so. You are always in control of your career.',
  },
  {
    icon: '🤝',
    title: 'Human + AI, not AI alone',
    body: 'Every CV that goes out is reviewed by a real human specialist. AI handles speed; specialists handle quality.',
  },
  {
    icon: '🔒',
    title: 'Your data is yours',
    body: 'We are UK GDPR compliant. We never sell your data. We never share your CV with employers without your consent.',
  },
  {
    icon: '📊',
    title: 'Honest about outcomes',
    body: 'We don\'t guarantee interviews or job offers. We give you better tools and specialist support to increase your chances.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="section-padding pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white">
        <div className="container-xl max-w-3xl">
          <p className="eyebrow mb-4">About Roleora</p>
          <h1 className="text-5xl font-display font-extrabold text-slate-900 mb-6">
            A better way to manage your career
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed">
            Roleora was built for UK professionals who are serious about their next move. We combine
            expert human specialists with AI to give you a structured, transparent, and honest process —
            from Evidence Bank to offer letter.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding bg-white">
        <div className="container-xl">
          <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-3xl font-display font-bold text-slate-900 mb-5">Why we built this</h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Job searching is exhausting. You update the same CV ten times, lose track of which version
                  you sent where, forget to follow up, and have no idea why some applications get responses
                  and others disappear into silence.
                </p>
                <p>
                  The problem isn't effort — it's the lack of a system. Most job seekers approach their search
                  reactively, without structure, without data, and without professional support.
                </p>
                <p>
                  Roleora gives you the structure, the AI tools, and the human specialists that were previously
                  only available to people who could afford £500+ for a career coach.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { icon: <Shield size={18} className="text-brand-600" />, label: 'UK-focused platform, built for UK hiring' },
                { icon: <Heart  size={18} className="text-brand-600" />, label: 'Specialists who have worked as recruiters and hiring managers' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-start gap-3 bg-brand-50 rounded-xl p-4">
                  <div className="mt-0.5">{icon}</div>
                  <p className="text-sm text-slate-700 font-medium">{label}</p>
                </div>
              ))}

              <div className="bg-slate-50 rounded-xl p-5">
                <p className="text-sm font-semibold text-slate-900 mb-1">We are not a recruitment agency.</p>
                <p className="text-sm text-slate-500">
                  Roleora does not place candidates or earn fees from employers. We work only for you.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding bg-slate-50">
        <div className="container-xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold text-slate-900 mb-3">What we stand for</h2>
            <p className="text-slate-500 max-w-xl mx-auto">The principles that guide every decision we make.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {values.map(({ icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white rounded-2xl border border-slate-200 p-6"
              >
                <span className="text-2xl mb-3 block">{icon}</span>
                <h3 className="font-display font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal note */}
      <section className="section-padding bg-white border-t border-slate-100">
        <div className="container-xl max-w-2xl mx-auto text-center">
          <p className="text-sm text-slate-400 leading-relaxed mb-8">
            Roleora is not a recruitment agency. We do not guarantee interviews, offers, or specific
            employment outcomes. Results vary based on individual circumstances, market conditions, and
            role availability. We do not fabricate experience, qualifications, or credentials in any
            application material.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={ROUTES.REGISTER}>
              <Button variant="primary" iconRight={<ArrowRight size={16} />}>Start your free account</Button>
            </Link>
            <Link to={ROUTES.SERVICES}>
              <Button variant="secondary">View our services</Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
