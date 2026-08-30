import { useState }    from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Users, AlertTriangle, CreditCard, Mail,
  CheckCircle2, XCircle, Search, Briefcase,
  Star, TrendingUp, Send, ChevronRight,
  UserCheck, Clock, ClipboardList,
} from 'lucide-react'
import api from '@/services/api'

interface AdminUser {
  id:              string
  name:            string
  email:           string
  role:            string
  emailVerified:   boolean
  profileComplete: boolean
  joinedAt:        string
  plan:            string
  planStatus:      string
  trialEnd:        string | null
  weeklyAppsUsed:      number
  weeklyAppsLimit:     number
  weeklyAppsRemaining: number
  totalApps:     number
  activeApps:    number
  appliedCount:  number
  interviewCount:number
  offerCount:    number
  appsByStatus:  Record<string, number>
  totalCVs:      number
  approvedCVs:   number
  cvsByStatus:   Record<string, number>
  gmail:         { email: string; lastSync: string | null } | null
  needs:         string[]
  features:      { weeklyApplications: number; coverLetters: boolean; linkedIn: boolean; interviewGuarantee: boolean; cvChanges: number }
}

interface AdminStats {
  total: number; explore: number; launch: number; momentum: number
  trialing: number; pastDue: number; needsAttention: number
  totalApplications: number; totalApplied: number; totalInterviews: number; totalOffers: number
}

const PLAN_COLOR: Record<string, string> = {
  EXPLORE:  'bg-slate-100 text-slate-600',
  LAUNCH:   'bg-blue-50 text-blue-700 border border-blue-200',
  MOMENTUM: 'bg-violet-50 text-violet-700 border border-violet-200',
}

const STATUS_DOT: Record<string, string> = {
  ACTIVE:     'bg-emerald-400',
  TRIALING:   'bg-blue-400',
  PAST_DUE:   'bg-red-400',
  CANCELED:   'bg-slate-300',
  INCOMPLETE: 'bg-amber-400',
}

const NEED_COLOR: Record<string, string> = {
  'Payment issue':      'bg-red-50 text-red-700 border-red-200',
  'Plan upgrade':       'bg-blue-50 text-blue-700 border-blue-200',
  'Trial → convert':    'bg-amber-50 text-amber-700 border-amber-200',
  'Email verification': 'bg-slate-100 text-slate-600 border-slate-200',
  'Profile setup':      'bg-slate-100 text-slate-600 border-slate-200',
  'Gmail sync':         'bg-slate-100 text-slate-600 border-slate-200',
  'First CV':           'bg-violet-50 text-violet-700 border-violet-200',
  'CV in review':       'bg-blue-50 text-blue-700 border-blue-200',
  'CV needs changes':   'bg-amber-50 text-amber-700 border-amber-200',
  'Start applying':     'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function initials(name: string) {
  const parts = name.trim().split(' ')
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}

// ─── Customer sidebar list item ──────────────────────────────────────────────
function CustomerListItem({ u, selected, onClick }: { u: AdminUser; selected: boolean; onClick: () => void }) {
  const isUrgent = u.needs.some(n => ['Payment issue', 'CV needs changes'].includes(n))
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-3 rounded-lg transition-colors flex items-center gap-3 ${
        selected
          ? 'bg-brand-50 border border-brand-200'
          : isUrgent
          ? 'hover:bg-red-50 border border-transparent hover:border-red-100'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
          selected ? 'bg-brand-600 text-white' : 'bg-brand-100 text-brand-700'
        }`}>
          {initials(u.name).toUpperCase()}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${STATUS_DOT[u.planStatus] ?? 'bg-slate-300'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
        <p className="text-xs text-slate-400 truncate">{u.email}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 ${PLAN_COLOR[u.plan]}`}>
          {u.plan}
        </span>
        {isUrgent && <AlertTriangle size={11} className="text-red-400" />}
      </div>
    </button>
  )
}

// ─── This week queue ─────────────────────────────────────────────────────────
function WeekQueue({ users }: { users: AdminUser[] }) {
  const appsToSubmit  = users.filter(u => u.weeklyAppsRemaining > 0 && u.weeklyAppsLimit > 0)
  const missingDetails = users.filter(u =>
    !u.profileComplete || !u.emailVerified || !u.gmail
  )
  const cvsToReview = users.filter(u => (u.cvsByStatus['IN_REVIEW'] ?? 0) > 0)

  const Section = ({
    icon: Icon, label, color, items, renderItem,
  }: {
    icon: React.ElementType
    label: string
    color: string
    items: AdminUser[]
    renderItem: (u: AdminUser) => React.ReactNode
  }) => (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex-1 min-w-0">
      <div className={`flex items-center gap-2 mb-3 pb-2 border-b border-slate-100`}>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={14} />
        </div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <span className="ml-auto text-xs font-bold text-slate-500">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">All clear ✓</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 5).map(u => (
            <div key={u.id} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                {initials(u.name).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-700 truncate">{u.name}</p>
                {renderItem(u)}
              </div>
            </div>
          ))}
          {items.length > 5 && (
            <p className="text-xs text-slate-400 pt-1">+{items.length - 5} more</p>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="mb-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Clock size={12} /> This week's queue
      </p>
      <div className="flex gap-3">
        <Section
          icon={Send}
          label="Apps to submit"
          color="bg-emerald-100 text-emerald-600"
          items={appsToSubmit}
          renderItem={u => (
            <p className="text-[10px] text-emerald-600">{u.weeklyAppsRemaining} slots left this week</p>
          )}
        />
        <Section
          icon={ClipboardList}
          label="Missing details"
          color="bg-amber-100 text-amber-600"
          items={missingDetails}
          renderItem={u => {
            const missing = []
            if (!u.emailVerified) missing.push('email')
            if (!u.profileComplete) missing.push('profile')
            if (!u.gmail) missing.push('Gmail')
            return <p className="text-[10px] text-amber-600">{missing.join(', ')}</p>
          }}
        />
        <Section
          icon={UserCheck}
          label="CVs to review"
          color="bg-blue-100 text-blue-600"
          items={cvsToReview}
          renderItem={u => (
            <p className="text-[10px] text-blue-600">{u.cvsByStatus['IN_REVIEW']} CV in review</p>
          )}
        />
      </div>
    </div>
  )
}

// ─── Customer detail panel ────────────────────────────────────────────────────
function CustomerDetail({ u }: { u: AdminUser }) {
  const qc = useQueryClient()
  const changePlan = useMutation({
    mutationFn: (plan: string) => api.patch(`/admin/users/${u.id}/plan`, { plan }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const PIPELINE_STAGES = [
    { key: 'RECRUITER_OUTREACH',       label: 'Outreach',    color: 'bg-slate-400' },
    { key: 'APPLIED',                  label: 'Applied',     color: 'bg-violet-400' },
    { key: 'SCREENING',                label: 'Screen',      color: 'bg-amber-400' },
    { key: 'ASSESSMENT',               label: 'Assessment',  color: 'bg-orange-400' },
    { key: 'HIRING_MANAGER_INTERVIEW', label: 'HM Int',      color: 'bg-orange-500' },
    { key: 'TECHNICAL_INTERVIEW',      label: 'Tech Int',    color: 'bg-orange-500' },
    { key: 'FINAL_ROUND',              label: 'Final',       color: 'bg-orange-600' },
    { key: 'OFFER',                    label: 'Offer',       color: 'bg-emerald-500' },
    { key: 'OFFER_ACCEPTED',           label: 'Accepted',    color: 'bg-emerald-600' },
    { key: 'REJECTED',                 label: 'Rejected',    color: 'bg-red-300' },
    { key: 'WITHDRAWN',                label: 'Withdrawn',   color: 'bg-slate-300' },
    { key: 'ON_HOLD',                  label: 'On hold',     color: 'bg-slate-300' },
    { key: 'NO_RESPONSE',              label: 'No response', color: 'bg-slate-200' },
  ]
  const hasApps = PIPELINE_STAGES.some(s => (u.appsByStatus[s.key] ?? 0) > 0)

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-brand-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
          {initials(u.name).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-display font-bold text-slate-900">{u.name}</h2>
            <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${PLAN_COLOR[u.plan]}`}>{u.plan}</span>
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[u.planStatus] ?? 'bg-slate-300'}`} />
            <span className="text-xs text-slate-500">{u.planStatus}</span>
          </div>
          <p className="text-sm text-slate-500">{u.email}</p>
        </div>
        <a href={`mailto:${u.email}`} className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline">
          <Mail size={13} /> Email
        </a>
      </div>

      <div className="p-5 grid md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Account setup */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account setup</p>
          <div className="space-y-2">
            {[
              { label: 'Email verified',    ok: u.emailVerified },
              { label: 'Profile complete',  ok: u.profileComplete },
              { label: 'Gmail connected',   ok: !!u.gmail },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{label}</span>
                {ok
                  ? <CheckCircle2 size={15} className="text-emerald-500" />
                  : <XCircle      size={15} className="text-red-400" />}
              </div>
            ))}
            {u.gmail && (
              <p className="text-xs text-slate-400 mt-1">Synced: {u.gmail.email}</p>
            )}
            {u.trialEnd && (
              <div className="flex justify-between mt-2">
                <span className="text-sm text-slate-600">Trial ends</span>
                <span className="text-sm text-amber-600 font-medium">{new Date(u.trialEnd).toLocaleDateString('en-GB')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Applications this week */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Applications</p>
          {u.weeklyAppsLimit === 0 ? (
            <p className="text-sm text-slate-400">No application quota (upgrade plan)</p>
          ) : (
            <>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">This week</span>
                <span className="font-semibold text-slate-800">{u.weeklyAppsUsed} / {u.weeklyAppsLimit}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-1">
                <div
                  className={`h-2 rounded-full ${u.weeklyAppsRemaining === 0 ? 'bg-red-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.min(100, Math.round((u.weeklyAppsUsed / u.weeklyAppsLimit) * 100))}%` }}
                />
              </div>
              <p className={`text-xs font-semibold mb-3 ${u.weeklyAppsRemaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {u.weeklyAppsRemaining} slots remaining this week
              </p>
            </>
          )}
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Total ever</span><span className="font-medium text-slate-800">{u.totalApps}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Formally applied</span><span className="font-medium text-slate-800">{u.appliedCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">In interviews</span><span className="font-medium text-amber-600">{u.interviewCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Offers received</span><span className="font-medium text-emerald-600">{u.offerCount}</span></div>
          </div>
        </div>

        {/* CVs */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">CVs ({u.totalCVs})</p>
          {u.totalCVs === 0 ? (
            <p className="text-sm text-slate-400">No CVs yet</p>
          ) : (
            <div className="space-y-1.5 text-xs">
              {[
                ['DRAFT',           'Draft',          'text-slate-600'],
                ['IN_REVIEW',       'In review',       'text-blue-600'],
                ['REQUIRES_CHANGES','Needs changes',   'text-amber-600'],
                ['APPROVED',        'Approved',        'text-emerald-600'],
                ['ARCHIVED',        'Archived',        'text-slate-400'],
              ].filter(([key]) => (u.cvsByStatus[key] ?? 0) > 0).map(([key, label, color]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-semibold ${color}`}>{u.cvsByStatus[key]}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Application pipeline */}
        <div className="md:col-span-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Application pipeline</p>
          {!hasApps ? (
            <p className="text-sm text-slate-400">No applications yet</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.filter(s => (u.appsByStatus[s.key] ?? 0) > 0).map(s => (
                <span key={s.key} className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 text-white ${s.color}`}>
                  {s.label} <strong>{u.appsByStatus[s.key]}</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* What's needed + plan control */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What's needed</p>
          {u.needs.length === 0 ? (
            <p className="text-sm text-emerald-600 font-medium">All set ✓</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {u.needs.map(n => {
                const cls = NEED_COLOR[n] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                return (
                  <span key={n} className={`inline-flex items-center text-xs font-medium border rounded-full px-2 py-0.5 ${cls}`}>
                    {n}
                  </span>
                )
              })}
            </div>
          )}

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Set plan</p>
          <div className="flex gap-1.5">
            {['EXPLORE','LAUNCH','MOMENTUM'].map(plan => (
              <button
                key={plan}
                onClick={() => changePlan.mutate(plan)}
                disabled={u.plan === plan || changePlan.isPending}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                  u.plan === plan
                    ? 'bg-slate-900 text-white border-slate-900 cursor-default'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-600'
                }`}
              >
                {plan.charAt(0) + plan.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const [search, setSearch]       = useState('')
  const [planFilter, setPlan]     = useState('ALL')
  const [selectedId, setSelected] = useState<string | null>(null)

  const { data, isLoading } = useQuery<{ users: AdminUser[]; stats: AdminStats }>({
    queryKey: ['admin-users'],
    queryFn:  () => api.get('/admin/users').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const allUsers = data?.users ?? []
  const stats    = data?.stats

  const filtered = allUsers.filter(u => {
    const matchSearch = search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchPlan = planFilter === 'ALL' || u.plan === planFilter
    return matchSearch && matchPlan
  })

  const selected = allUsers.find(u => u.id === selectedId) ?? null

  return (
    <div className="flex h-full min-h-screen bg-[var(--bg)]">

      {/* ── Left customer sidebar ── */}
      <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0">
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-slate-500" />
            <h2 className="text-sm font-semibold text-slate-700">Customers</h2>
            <span className="ml-auto text-xs font-bold text-slate-400">{allUsers.length}</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Plan filter */}
          <div className="flex gap-1 mt-2 flex-wrap">
            {(['ALL','EXPLORE','LAUNCH','MOMENTUM'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={`text-[10px] font-semibold rounded px-1.5 py-0.5 transition-colors ${
                  planFilter === p ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {p === 'ALL' ? 'All' : p.charAt(0) + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">No customers found</p>
          ) : (
            filtered.map(u => (
              <CustomerListItem
                key={u.id}
                u={u}
                selected={selectedId === u.id}
                onClick={() => setSelected(selectedId === u.id ? null : u.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 overflow-auto p-6">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
            {[
              { label: 'Total users',   value: stats.total,              icon: Users,         color: 'bg-slate-100 text-slate-600' },
              { label: 'Applications',  value: stats.totalApplications,  icon: Send,          color: 'bg-brand-50 text-brand-600' },
              { label: 'Applied',       value: stats.totalApplied,       icon: Briefcase,     color: 'bg-violet-50 text-violet-600' },
              { label: 'Interviews',    value: stats.totalInterviews,    icon: TrendingUp,    color: 'bg-amber-50 text-amber-600' },
              { label: 'Offers',        value: stats.totalOffers,        icon: Star,          color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Need attention',value: stats.needsAttention,     icon: AlertTriangle, color: 'bg-amber-100 text-amber-600' },
              { label: 'Payment issues',value: stats.pastDue,            icon: CreditCard,    color: 'bg-red-50 text-red-600' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon size={13} />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 leading-none">{s.value}</p>
                  <p className="text-[10px] text-slate-400 leading-tight mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* This week's queue */}
        {allUsers.length > 0 && <WeekQueue users={allUsers} />}

        {/* Selected customer detail */}
        {selected ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <ChevronRight size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer details</p>
            </div>
            <CustomerDetail u={selected} />
          </>
        ) : (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <Users size={28} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-medium">Select a customer from the sidebar</p>
            <p className="text-slate-300 text-xs mt-1">to see their full details and action items</p>
          </div>
        )}
      </div>
    </div>
  )
}
