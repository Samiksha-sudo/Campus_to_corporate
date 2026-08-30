import { useRef, useState }   from 'react'
import { motion }              from 'framer-motion'
import { Quote }               from 'lucide-react'

interface Testimonial {
  quote:    string
  name:     string
  role:     string
  company:  string
  initials: string
  color:    string
}

const testimonials: Testimonial[] = [
  {
    quote:    "I got 3 interview calls in my first week. The CV they built was completely different to anything I'd tried before — actually tailored, not generic.",
    name:     'Priya Sharma',
    role:     'Software Engineer',
    company:  'Now at Monzo',
    initials: 'PS',
    color:    'from-violet-500 to-purple-600',
  },
  {
    quote:    'The Evidence Bank is genius. I logged everything once and now every application is just clicking the right achievements. Saved me hours every week.',
    name:     'James Okafor',
    role:     'Backend Developer',
    company:  'Now at Revolut',
    initials: 'JO',
    color:    'from-brand-500 to-indigo-600',
  },
  {
    quote:    "I'd been applying for 4 months with no callbacks. Two weeks on Campus to Corporate and I had my first senior engineering interview at a funded startup.",
    name:     'Aisha Patel',
    role:     'Senior Engineer',
    company:  'Now at Deliveroo',
    initials: 'AP',
    color:    'from-emerald-500 to-teal-600',
  },
  {
    quote:    'The role-fit score is addictive. I stopped wasting time on roles that were bad matches and my response rate jumped from 4% to nearly 30%.',
    name:     'Tom Williams',
    role:     'Full-Stack Engineer',
    company:  'Now at Starling Bank',
    initials: 'TW',
    color:    'from-amber-500 to-orange-600',
  },
  {
    quote:    'Graduating felt terrifying until I found this. The structured approach to tracking and the specialist CV review gave me genuine confidence.',
    name:     'Selin Yıldız',
    role:     'Graduate Engineer',
    company:  'Now at ASOS',
    initials: 'SY',
    color:    'from-rose-500 to-pink-600',
  },
  {
    quote:    'The analytics made me realise I was applying too broadly. Once I narrowed my target, my interview rate tripled in a fortnight.',
    name:     'Kieran Mehta',
    role:     'Platform Engineer',
    company:  'Now at Wise',
    initials: 'KM',
    color:    'from-cyan-500 to-sky-600',
  },
]

function SpotlightCard({ t }: { t: Testimonial }) {
  const ref  = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-sm p-6 flex flex-col gap-4 h-full"
    >
      {/* Spotlight */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, rgba(99,102,241,0.12), transparent 40%)`,
        }}
      />

      {/* Quote icon */}
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.color} flex items-center justify-center shrink-0`}>
        <Quote size={14} className="text-white" />
      </div>

      <p className="text-white/75 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
          {t.initials}
        </div>
        <div>
          <p className="text-white text-sm font-semibold leading-tight">{t.name}</p>
          <p className="text-white/40 text-xs">{t.role} · {t.company}</p>
        </div>
      </div>
    </div>
  )
}

export function Testimonials() {
  return (
    <section className="section-padding bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand-900/30 via-slate-950 to-slate-950 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '48px 48px' }}
      />

      <div className="container-xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="eyebrow text-brand-400 mb-3">Real results</p>
          <h2 className="text-4xl font-display font-bold text-white mb-4">
            UK professionals landing roles every week
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto">
            From graduate to senior — here's what people say after their first offer.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
              className="h-full"
            >
              <SpotlightCard t={t} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
