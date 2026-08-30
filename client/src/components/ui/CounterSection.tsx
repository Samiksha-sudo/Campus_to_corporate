import { useEffect, useRef } from 'react'
import { motion, useInView, useMotionValue, useSpring, animate } from 'framer-motion'

function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const motionVal = useMotionValue(0)
  const spring    = useSpring(motionVal, { stiffness: 60, damping: 20 })

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, value, { duration: 1.8, ease: 'easeOut' })
    return controls.stop
  }, [inView, motionVal, value])

  useEffect(() => {
    return spring.on('change', (v) => {
      if (ref.current) ref.current.textContent = prefix + Math.round(v).toLocaleString() + suffix
    })
  }, [spring, prefix, suffix])

  return <span ref={ref}>{prefix}0{suffix}</span>
}

const stats = [
  { value: 94,   suffix: '%',   prefix: '',  label: 'CV approval rate',           sublabel: 'of CVs pass ATS on first submit' },
  { value: 14,   suffix: '',    prefix: '',  label: 'Days to first interview',     sublabel: 'average across all plans'        },
  { value: 3,    suffix: '×',   prefix: '',  label: 'More interview callbacks',    sublabel: 'vs self-managed search'          },
  { value: 200,  suffix: '+',   prefix: '',  label: 'Applications per week',       sublabel: 'on the Momentum plan'           },
]

export function CounterSection() {
  return (
    <section className="bg-white border-y border-slate-100 py-16">
      <div className="container-xl">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map(({ value, suffix, prefix, label, sublabel }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="text-center"
            >
              <p className="text-4xl lg:text-5xl font-display font-extrabold text-slate-900 mb-1.5">
                <AnimatedNumber value={value} suffix={suffix} prefix={prefix} />
              </p>
              <p className="font-semibold text-slate-800 text-sm mb-0.5">{label}</p>
              <p className="text-slate-400 text-xs">{sublabel}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
