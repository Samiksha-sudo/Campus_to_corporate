import { motion } from 'framer-motion'
import { CheckCircle2, Briefcase, Star, TrendingUp, FileText, Zap, Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

export function FloatCard({
  children, delay = 0, className,
}: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      animate={{ y: [0, -12, 0] }}
      transition={{ duration: 4 + delay, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={cn('rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-white/40', className)}
    >
      {children}
    </motion.div>
  )
}

export function EvidenceCard() {
  return (
    <FloatCard delay={0} className="bg-gradient-to-br from-violet-500 to-purple-600 p-4 w-68 text-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Star size={13} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Achievement</span>
        <span className="ml-auto text-[10px] bg-white/20 px-2 py-0.5 rounded-full">STAR ✓</span>
      </div>
      <p className="text-sm font-bold mb-1 leading-snug">Led platform migration to microservices</p>
      <p className="text-xs opacity-80 leading-relaxed">
        Cut deployment time by <span className="font-black text-yellow-300">74%</span> · Saved{' '}
        <span className="font-black text-yellow-300">£40k/yr</span>
      </p>
      <div className="flex gap-1.5 mt-3">
        {['Node.js', 'AWS', 'Docker'].map((t) => (
          <span key={t} className="text-[10px] bg-white/20 font-medium px-2 py-0.5 rounded-full">{t}</span>
        ))}
      </div>
    </FloatCard>
  )
}

export function ApplicationCard() {
  const apps = [
    { company: 'Monzo',     role: 'Senior Eng',     status: '🎙 Interview', bg: 'bg-emerald-400/30' },
    { company: 'Revolut',   role: 'Backend Eng',    status: '📨 Applied',   bg: 'bg-sky-400/30'     },
    { company: 'Deliveroo', role: 'Staff Eng',      status: '🎉 Offer!',    bg: 'bg-yellow-400/30'  },
  ]
  return (
    <FloatCard delay={1} className="bg-gradient-to-br from-brand-500 to-indigo-600 p-4 w-68 text-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Briefcase size={13} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Pipeline</span>
        <span className="ml-auto text-xs font-black text-yellow-300">3 active</span>
      </div>
      <div className="space-y-2">
        {apps.map(({ company, role, status, bg }) => (
          <div key={company} className={cn('flex items-center justify-between px-2 py-1.5 rounded-lg', bg)}>
            <div>
              <p className="text-xs font-bold">{company}</p>
              <p className="text-[10px] opacity-70">{role}</p>
            </div>
            <span className="text-[10px] font-semibold">{status}</span>
          </div>
        ))}
      </div>
    </FloatCard>
  )
}

export function RoleFitCard() {
  const score = 87
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <FloatCard delay={2} className="bg-gradient-to-br from-emerald-400 to-teal-500 p-4 w-60 text-white">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
          <Zap size={13} />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">Role Fit</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="72" height="72" className="-rotate-90">
            <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
            <motion.circle
              cx="36" cy="36" r={radius} fill="none"
              stroke="white" strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-display font-extrabold">
            {score}%
          </span>
        </div>
        <div className="space-y-2 flex-1">
          {[['Skills', 92], ['Seniority', 85], ['Keywords', 78]].map(([label, pct]) => (
            <div key={label}>
              <div className="flex justify-between text-[10px] opacity-80 mb-0.5">
                <span>{label}</span><span className="font-bold">{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </FloatCard>
  )
}

export function CVPreviewCard() {
  return (
    <FloatCard delay={0.5} className="bg-white p-4 w-52">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center">
          <FileText size={13} className="text-brand-600" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">Sarah.pdf</p>
          <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 size={9} /> ATS 94%
          </p>
        </div>
      </div>
      <div className="space-y-1.5">
        {[3, 4, 3.5, 3, 0, 3, 3.5, 2.5, 3, 2].map((w, i) => (
          <div key={i} className={cn(
            'h-1.5 rounded-full',
            i === 0 ? 'bg-slate-800 w-3/4' :
            i === 4 ? 'opacity-0' :
            i % 3 === 0 ? 'bg-brand-200' : 'bg-slate-200',
          )} style={{ width: w === 0 ? '0' : `${w * 22}%` }} />
        ))}
      </div>
    </FloatCard>
  )
}

export function DashboardPanel() {
  const stages = [
    { label: 'Saved',     count: 12, color: 'bg-slate-300' },
    { label: 'Applied',   count: 8,  color: 'bg-sky-400'   },
    { label: 'Interview', count: 3,  color: 'bg-violet-500' },
    { label: 'Offer',     count: 1,  color: 'bg-amber-400'  },
  ]
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lifted overflow-hidden w-full max-w-sm">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <span className="ml-3 text-[10px] text-slate-400 font-mono">roleora.co.uk/app</span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-700">Application funnel</p>
          <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
            ↑ 38% interview rate
          </span>
        </div>
        <div className="flex items-end gap-2 h-20">
          {stages.map(({ label, count, color }, i) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-slate-700">{count}</span>
              <motion.div
                className={cn('w-full rounded-t-lg', color)}
                initial={{ height: 0 }}
                animate={{ height: `${(count / 12) * 64}px` }}
                transition={{ delay: i * 0.15, duration: 0.7, ease: 'easeOut' }}
              />
              <span className="text-[9px] text-slate-400">{label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <TrendingUp size={12} className="text-emerald-500" />
          <span className="text-xs text-emerald-600 font-semibold">3 interviews this week</span>
        </div>
      </div>
    </div>
  )
}

export function SparkleIcon() {
  return (
    <motion.span
      animate={{ rotate: [0, 20, -10, 0], scale: [1, 1.2, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      className="inline-block"
    >
      <Sparkles size={20} className="text-yellow-400" />
    </motion.span>
  )
}
