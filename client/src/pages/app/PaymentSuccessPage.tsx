import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ROUTES } from '@/config/routes'
import api from '@/services/api'

const PLAN_CONFIG: Record<string, { label: string; price: string; color: string; features: string[] }> = {
  LAUNCH: {
    label: 'Launch',
    price: '£20/month',
    color: 'from-blue-500 to-blue-600',
    features: ['50 job applications per week', 'Unlimited CV changes', '1 guaranteed interview per month', 'LinkedIn optimisation'],
  },
  MOMENTUM: {
    label: 'Momentum',
    price: '£40/month',
    color: 'from-violet-500 to-violet-600',
    features: ['200 job applications per week', 'Unlimited CV changes', 'Multiple interviews per month', 'Cover letters + interview prep', 'Dedicated career specialist'],
  },
}

export default function PaymentSuccessPage() {
  const [params]   = useSearchParams()
  const navigate   = useNavigate()
  const qc         = useQueryClient()
  const [count, setCount] = useState(5)

  const plan = (params.get('plan') ?? 'LAUNCH').toUpperCase()
  const cfg  = PLAN_CONFIG[plan] ?? PLAN_CONFIG.LAUNCH

  useEffect(() => {
    // Sync plan from Stripe into DB (handles case where webhook didn't fire on localhost)
    api.post('/stripe/sync-plan').then(() => {
      qc.invalidateQueries({ queryKey: ['subscription'] })
      qc.invalidateQueries({ queryKey: ['admin-users'] })
    }).catch(() => {
      qc.invalidateQueries({ queryKey: ['subscription'] })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (count <= 0) {
      navigate(ROUTES.DASHBOARD, { replace: true })
      return
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [count, navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">

        {/* Header gradient */}
        <div className={`bg-gradient-to-r ${cfg.color} px-8 py-10 text-center text-white`}>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-1">Payment Successful!</h1>
          <p className="text-white/80 text-sm">Welcome to {cfg.label}</p>
        </div>

        {/* Plan details */}
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Your new plan</p>
              <p className="text-xl font-display font-bold text-slate-900">{cfg.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Price</p>
              <p className="text-lg font-bold text-slate-900">{cfg.price}</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What's included</p>
            <ul className="space-y-2">
              {cfg.features.map(f => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                  <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          <button
            onClick={() => navigate(ROUTES.DASHBOARD, { replace: true })}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl py-3 font-semibold text-sm hover:bg-slate-800 transition-colors"
          >
            Go to Dashboard
            <ArrowRight size={16} />
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            Redirecting automatically in {count}s…
          </p>
        </div>
      </div>
    </div>
  )
}
