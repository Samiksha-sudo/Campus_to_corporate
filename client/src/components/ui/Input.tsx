import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:       string
  error?:       string
  helperText?:  string
  leftIcon?:    React.ReactNode
  rightIcon?:   React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-11 rounded-lg border bg-white px-3.5 text-base text-slate-900',
              'placeholder:text-slate-400',
              'transition-all duration-150',
              'focus:outline-none focus:ring-3 focus:ring-brand-100 focus:border-brand-500',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50',
              error
                ? 'border-red-400 focus:ring-red-100 focus:border-red-500'
                : 'border-slate-300',
              leftIcon  && 'pl-10',
              rightIcon && 'pr-10',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={
              error       ? `${inputId}-error`  :
              helperText  ? `${inputId}-helper`  :
              undefined
            }
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-500 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}

        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export { Input }
