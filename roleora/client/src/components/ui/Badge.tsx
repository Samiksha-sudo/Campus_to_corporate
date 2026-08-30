import { cn } from '@/utils/cn'
import type { ApplicationStatus, SubscriptionPlan } from '@/types/api.types'

const variants = {
  default:  'bg-slate-100 text-slate-700',
  brand:    'bg-brand-100 text-brand-700',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-amber-100 text-amber-700',
  error:    'bg-red-100 text-red-600',
  info:     'bg-blue-100 text-blue-700',
} as const

interface BadgeProps {
  children: React.ReactNode
  variant?: keyof typeof variants
  dot?:     boolean
  className?: string
}

export function Badge({ children, variant = 'default', dot, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
      variants[variant],
      className,
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full bg-current opacity-70')} />}
      {children}
    </span>
  )
}

const statusConfig: Record<ApplicationStatus, { label: string; className: string }> = {
  SAVED:               { label: 'Saved',               className: 'bg-indigo-100  text-indigo-700' },
  PREPARING:           { label: 'Preparing',           className: 'bg-violet-100  text-violet-700' },
  APPLIED:             { label: 'Applied',             className: 'bg-blue-100    text-blue-700'   },
  RECRUITER_SCREEN:    { label: 'Recruiter Screen',    className: 'bg-cyan-100    text-cyan-700'   },
  FIRST_INTERVIEW:     { label: 'First Interview',     className: 'bg-emerald-100 text-emerald-700'},
  TECHNICAL_INTERVIEW: { label: 'Technical Interview', className: 'bg-teal-100    text-teal-700'   },
  FINAL_INTERVIEW:     { label: 'Final Interview',     className: 'bg-amber-100   text-amber-800'  },
  OFFER:               { label: 'Offer',               className: 'bg-amber-100   text-amber-700'  },
  REJECTED:            { label: 'Rejected',            className: 'bg-red-100     text-red-600'    },
  WITHDRAWN:           { label: 'Withdrawn',           className: 'bg-slate-100   text-slate-600'  },
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = statusConfig[status]
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
      cfg.className,
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {cfg.label}
    </span>
  )
}

const planConfig: Record<SubscriptionPlan, { label: string; className: string }> = {
  EXPLORE:  { label: 'Explore',  className: 'bg-slate-100  text-slate-600'  },
  LAUNCH:   { label: 'Launch',   className: 'bg-brand-100  text-brand-700'  },
  MOMENTUM: { label: 'Momentum', className: 'bg-brand-600  text-white'      },
  GUIDED:   { label: 'Guided',   className: 'bg-amber-100  text-amber-800'  },
}

export function PlanBadge({ plan }: { plan: SubscriptionPlan }) {
  const cfg = planConfig[plan]
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      cfg.className,
    )}>
      {cfg.label}
    </span>
  )
}
