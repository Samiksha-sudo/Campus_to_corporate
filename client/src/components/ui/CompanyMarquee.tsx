import { motion } from 'framer-motion'

const companies = [
  'Monzo', 'Revolut', 'Deliveroo', 'Starling Bank', 'Wise', 'ASOS',
  'Sky', 'Cazoo', 'Checkout.com', 'Farfetch', 'Thought Machine', 'GoCardless',
  'OakNorth', 'Chip', 'Freetrade', 'Cleo', 'Phoebe', 'Zopa',
]

const doubled = [...companies, ...companies]

export function CompanyMarquee() {
  return (
    <section className="py-12 bg-slate-50 border-y border-slate-100 overflow-hidden">
      <div className="container-xl mb-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
          Our members now work at
        </p>
      </div>

      <div className="relative">
        {/* Left fade */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none" />
        {/* Right fade */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none" />

        <motion.div
          className="flex gap-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
          style={{ width: 'max-content' }}
        >
          {doubled.map((name, i) => (
            <div
              key={`${name}-${i}`}
              className="shrink-0 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-semibold text-slate-600 shadow-xs whitespace-nowrap"
            >
              {name}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
