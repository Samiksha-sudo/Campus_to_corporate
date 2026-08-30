import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams }    from 'react-router-dom'
import { CreditCard, ExternalLink } from 'lucide-react'
import GmailSyncCard from '@/components/gmail/GmailSyncCard'
import { Button }    from '@/components/ui'
import { useToast }  from '@/hooks/useToast'
import api           from '@/services/api'
import { useAuthStore } from '@/stores/auth.store'

interface Subscription {
  plan:                    string
  status:                  string
  weeklyApplicationsUsed:  number
  weeklyApplicationsLimit: number
  currentPeriodEnd:        string | null
  cancelAtPeriodEnd:       number
  trialEnd:                string | null
}

const PLAN_ORDER = ['STARTER', 'EXPLORE', 'LAUNCH', 'MOMENTUM']

const PLAN_CONFIG: Record<string, { label: string; price: string; color: string; desc: string; features: string[] }> = {
  STARTER:  { label: 'Starter',  price: 'Free',    color: 'bg-slate-100 text-slate-600 border-slate-200',    desc: 'Guidance + free CV review', features: ['Career guidance & resources', '1 free CV review'] },
  EXPLORE:  { label: 'Explore',  price: '£10/mo',  color: 'bg-slate-100 text-slate-700 border-slate-200',    desc: 'Build your profile',        features: ['1 CV review + 1 CV change', 'Application tracker (10 jobs)', 'Application status tracking'] },
  LAUNCH:   { label: 'Launch',   price: '£20/mo',  color: 'bg-blue-50 text-blue-700 border-blue-200',        desc: 'Land your first interview', features: ['Unlimited CV changes', '50 applications/week', '1 guaranteed interview/month', 'LinkedIn optimisation'] },
  MOMENTUM: { label: 'Momentum', price: '£40/mo',  color: 'bg-violet-50 text-violet-700 border-violet-200',  desc: 'Multiple interviews/month', features: ['Unlimited CV changes', '200 applications/week', 'Multiple interviews/month', 'Cover letters + interview prep'] },
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:     'text-emerald-700 bg-emerald-50 border-emerald-200',
  TRIALING:   'text-blue-700   bg-blue-50   border-blue-200',
  PAST_DUE:   'text-amber-700  bg-amber-50  border-amber-200',
  CANCELED:   'text-slate-500  bg-slate-100 border-slate-200',
  INCOMPLETE: 'text-red-700    bg-red-50    border-red-200',
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(iso))
}

function SubscriptionCard() {
  const toast = useToast()
  const qc    = useQueryClient()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const { data: sub, isLoading } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn:  () => api.get('/stripe/subscription').then(r => r.data.data),
    refetchInterval: 10_000,
  })

  const portal = useMutation({
    mutationFn: () => api.post('/stripe/billing-portal').then(r => r.data.data.url as string),
    onSuccess:  (url) => { window.location.href = url },
    onError:    () => toast.error('Could not open billing portal'),
  })

  const upgrade = async (plan: string) => {
    setUpgrading(plan)
    try {
      const { data } = await api.post('/stripe/checkout', { plan })
      window.location.href = data.data.url
    } catch {
      toast.error('Could not start checkout')
      setUpgrading(null)
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
        <div className="h-4 bg-slate-100 rounded w-1/3 mb-3" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
    )
  }

  const plan      = sub?.plan ?? 'EXPLORE'
  const status    = sub?.status ?? 'ACTIVE'
  const isFree    = plan === 'STARTER'
  const cfg       = PLAN_CONFIG[plan] ?? PLAN_CONFIG.EXPLORE
  const planIdx   = PLAN_ORDER.indexOf(plan)
  const upgrades  = PLAN_ORDER.slice(planIdx + 1).filter(p => p !== 'STARTER')

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">

      {/* Current plan banner */}
      <div className={`px-5 py-4 border-b flex items-center justify-between ${cfg.color}`}>
        <div className="flex items-center gap-3">
          <CreditCard size={18} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">Current plan</p>
            <p className="text-lg font-display font-bold">{cfg.label} <span className="text-sm font-normal opacity-70">— {cfg.price}</span></p>
          </div>
        </div>
        <span className={`inline-flex items-center text-xs font-medium border rounded-full px-2.5 py-1 bg-white ${STATUS_COLOR[status] ?? STATUS_COLOR.ACTIVE}`}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Plan features */}
        <ul className="space-y-1">
          {cfg.features.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {/* Weekly usage for paid plans */}
        {!isFree && sub && sub.weeklyApplicationsLimit > 0 && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">Applications this week</span>
              <span className="font-medium text-slate-800">{sub.weeklyApplicationsUsed} / {sub.weeklyApplicationsLimit}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-brand-500"
                style={{ width: `${Math.min(100, Math.round((sub.weeklyApplicationsUsed / sub.weeklyApplicationsLimit) * 100))}%` }}
              />
            </div>
          </div>
        )}

        {/* Renewal / trial info */}
        {(sub?.trialEnd || sub?.currentPeriodEnd) && (
          <div className="text-xs text-slate-500 space-y-1">
            {sub.trialEnd && (
              <div className="flex justify-between">
                <span>Trial ends</span>
                <span className="font-medium text-slate-800">{fmt(sub.trialEnd)}</span>
              </div>
            )}
            {sub.currentPeriodEnd && (
              <div className="flex justify-between">
                <span>{sub.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}</span>
                <span className="font-medium text-slate-800">{fmt(sub.currentPeriodEnd)}</span>
              </div>
            )}
          </div>
        )}

        {/* Upgrade options — only plans above current */}
        {upgrades.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upgrade to</p>
            {upgrades.map(key => {
              const u = PLAN_CONFIG[key]
              return (
                <div key={key} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{u.label} <span className="text-slate-500 font-normal text-xs">— {u.price}</span></p>
                    <p className="text-xs text-slate-500">{u.desc}</p>
                  </div>
                  <Button variant="primary" size="xs" loading={upgrading === key} onClick={() => upgrade(key)}>
                    Upgrade
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Manage billing for paid plans */}
        {!isFree && (
          <Button variant="secondary" size="sm" loading={portal.isPending} onClick={() => portal.mutate()} className="flex items-center gap-1.5">
            <ExternalLink size={13} />
            Manage billing
          </Button>
        )}

        {/* Refresh hint after payment */}
        {isFree && (
          <button onClick={() => qc.invalidateQueries({ queryKey: ['subscription'] })} className="text-xs text-slate-400 hover:text-slate-600 underline">
            Already paid? Refresh plan status
          </button>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const toast        = useToast()
  const qc           = useQueryClient()
  const [params, setParams] = useSearchParams()
  const { user }     = useAuthStore()
  const isAdmin      = user?.role === 'ADMIN'

  useEffect(() => {
    const gmail   = params.get('gmail')
    const payment = params.get('payment')

    if (gmail === 'connected') {
      toast.success('Gmail connected successfully!')
      qc.invalidateQueries({ queryKey: ['gmail-status'] })
      setParams({}, { replace: true })
    } else if (gmail === 'error') {
      toast.error('Gmail connection failed. Please try again.')
      setParams({}, { replace: true })
    }

    if (payment === 'success') {
      toast.success('Payment successful! Your plan has been upgraded.')
      qc.invalidateQueries({ queryKey: ['subscription'] })
      setParams({}, { replace: true })
    } else if (payment === 'cancelled') {
      toast.error('Payment cancelled.')
      setParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Settings</h1>
      <p className="text-slate-500 text-sm mb-8">
        {isAdmin ? 'Manage your account and integrations.' : 'Manage your account, connections, and billing.'}
      </p>

      <div className="space-y-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Integrations</h2>
        <GmailSyncCard />

        {!isAdmin && (
          <>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-2">Billing</h2>
            <SubscriptionCard />
          </>
        )}
      </div>
    </div>
  )
}
