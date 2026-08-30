import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

const variants = {
  primary:     'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 shadow-sm hover:shadow-accent active:bg-brand-800',
  secondary:   'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-brand-500',
  ghost:       'bg-transparent text-brand-600 hover:bg-brand-50 focus-visible:ring-brand-500',
  destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500 shadow-sm',
  accent:      'bg-accent-500 text-slate-900 hover:bg-accent-600 focus-visible:ring-accent-500 shadow-sm',
  dark:        'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700',
} as const

const sizes = {
  xs:  'h-7  px-3   text-xs  gap-1.5',
  sm:  'h-8  px-3.5 text-sm  gap-1.5',
  md:  'h-10 px-5   text-sm  gap-2',
  lg:  'h-11 px-6   text-base gap-2',
  xl:  'h-13 px-8   text-base gap-2.5',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants
  size?:    keyof typeof sizes
  loading?: boolean
  icon?:    React.ReactNode
  iconRight?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, iconRight, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-semibold rounded-lg',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  ),
)

Button.displayName = 'Button'
export { Button }
