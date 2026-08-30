import { cn } from '@/utils/cn'

interface CardProps {
  children:   React.ReactNode
  className?: string
  hover?:     boolean
  onClick?:   () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl border border-slate-200 shadow-xs',
        hover && 'transition-all duration-250 ease-out cursor-pointer hover:shadow-lifted hover:-translate-y-1 hover:border-brand-200',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  children:    React.ReactNode
  className?:  string
  border?:     boolean
}

export function CardHeader({ children, className, border = true }: CardHeaderProps) {
  return (
    <div className={cn('px-6 py-4', border && 'border-b border-slate-100', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/50 rounded-b-xl', className)}>
      {children}
    </div>
  )
}

interface MetricCardProps {
  label:       string
  value:       string | number
  change?:     number
  icon?:       React.ReactNode
  className?:  string
}

export function MetricCard({ label, value, change, icon, className }: MetricCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-200 shadow-xs p-5', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        {icon && (
          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600">
            {icon}
          </div>
        )}
      </div>
      <p className="text-3xl font-bold text-slate-900 font-display">{value}</p>
      {change !== undefined && (
        <p className={cn('text-sm mt-1 font-medium', change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last week
        </p>
      )}
    </div>
  )
}
