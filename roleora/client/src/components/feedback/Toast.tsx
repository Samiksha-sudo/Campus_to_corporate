import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useUIStore } from '@/stores/ui.store'
import { cn }         from '@/utils/cn'

const icons = {
  success: <CheckCircle2  size={16} className="text-emerald-500" />,
  error:   <AlertCircle  size={16} className="text-red-500"     />,
  info:    <Info         size={16} className="text-blue-500"    />,
  warning: <AlertTriangle size={16} className="text-amber-500"  />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0,  scale: 1    }}
            exit={{   opacity: 0, x: 40,  scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3',
              'bg-white rounded-xl shadow-lifted border border-slate-200',
            )}
          >
            <span className="mt-0.5 shrink-0">{icons[t.type]}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900">{t.title}</p>
              {t.message && <p className="text-xs text-slate-500 mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
