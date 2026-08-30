import { useState }    from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, AlertTriangle, CreditCard, Mail,
  CheckCircle2, XCircle, Search, Briefcase,
  Star, TrendingUp, Send, UserCheck, Clock,
  ClipboardList, ChevronRight, Activity,
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

const PLAN_GRADIENT: Record<string, string> = {
  EXPLORE:  'from-slate-500 to-slate-600',
  LAUNCH:   'from-blue-500 to-indigo-600',
  MOMENTUM: 'from-violet-500 to-purple-600',
}
const PLAN_BADGE: Record<string, string> = {
  EXPLORE:  'bg-slate-100 text-slate-600 ring-slate-200',
  LAUNCH:   'bg-blue-50 text-blue-700 ring-blue-200',
  MOMENTUM: 'bg-violet-50 text-violet-700 ring-violet-200',
}
const STATUS_DOT: Record<string, string> = {
  ACTIVE:     'bg-emerald-400',
  TRIALING:   'bg-blue-400',
  PAST_DUE:   'bg-red-400',
  CANCELED:   'bg-slate-300',
  INCOMPLETE: 'bg-amber-400',
}
const NEED_COLOR: Record<string, string> = {
  'Payment issue':      'bg-red-50 text-red-700 ring-red-200',
  'Plan upgrade':       'bg-blue-50 text-blue-700 ring-blue-200',
  'Trial → convert':    'bg-amber-50 text-amber-700 ring-amber-200',
  'Email verification': 'bg-slate-50 text-slate-600 ring-slate-200',
  'Profile setup':      'bg-slate-50 text-slate-600 ring-slate-200',
  'Gmail sync':         'bg-orange-50 text-orange-600 ring-orange-200',
  'First CV':           'bg-violet-50 text-violet-700 ring-violet-200',
  'CV in review':       'bg-blue-50 text-blue-700 ring-blue-200',
  'CV needs changes':   'bg-amber-50 text-amber-700 ring-amber-200',
  'Start applying':     'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

function initials(name: string) {
  const p = name.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] } }),
}
const slideIn = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit:    { opacity: 0, x: 24, transition: { duration: 0.2 } },
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, delay }: {
  label: string; value: number; icon: React.ElementType; gradient: string; delay: number
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={delay}
      className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3"
    >
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0 shadow-md`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-display font-extrabold text-slate-900 leading-none">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-tight">{label}</p>
      </div>
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-gradient-to-br ${gradient} opacity-5`} />
    </motion.div>
  )
}

// ─── Queue card ───────────────────────────────────────────────────────────────
function QueueCard({ icon: Icon, label, color, bg, items, renderItem }: {
  icon: React.ElementType; label: string; color: string; bg: string
  items: AdminUser[]; renderItem: (u: AdminUser) => React.ReactNode
}) {
  return (
    <div className={`flex-1 min-w-0 rounded-2xl border ${bg} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center`}>
          <Icon size={13} className="text-white" />
        </div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <span className="ml-auto text-xs font-bold text-slate-400 bg-white rounded-full px-2 py-0.5 shadow-sm">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium py-1">
          <CheckCircle2 size={12} /> All clear
        </div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 4).map((u, i) => (
            <motion.div key={u.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2 bg-white/70 rounded-lg px-2.5 py-1.5">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                {initials(u.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-700 truncate">{u.name}</p>
                {renderItem(u)}
              </div>
            </motion.div>
          ))}
          {items.length > 4 && <p className="text-[10px] text-slate-400 pl-1">+{items.length - 4} more</p>}
        </div>
      )}
    </div>
  )
}

// ─── Customer list item ───────────────────────────────────────────────────────
function CustomerItem({ u, selected, onClick, index }: {
  u: AdminUser; selected: boolean; onClick: () => void; index: number
}) {
  const isUrgent = u.needs.some(n => ['Payment issue', 'CV needs changes'].includes(n))
  return (
    <motion.button
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={index * 0.04}
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3 group ${
        selected
          ? 'bg-gradient-to-r from-brand-600 to-indigo-600 shadow-md'
          : isUrgent
          ? 'hover:bg-red-50 border border-red-100'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      <div className="relative shrink-0">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
          selected
            ? 'bg-white/20 text-white'
            : `bg-gradient-to-br ${PLAN_GRADIENT[u.plan] ?? 'from-slate-400 to-slate-500'} text-white`
        }`}>
          {initials(u.name)}
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${selected ? 'border-brand-600' : 'border-white'} ${STATUS_DOT[u.planStatus] ?? 'bg-slate-300'}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-white' : 'text-slate-800'}`}>{u.name}</p>
        <p className={`text-xs truncate ${selected ? 'text-white/70' : 'text-slate-400'}`}>{u.email}</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span className={`text-[9px] font-bold rounded-full px-1.5 py-0.5 ring-1 ${selected ? 'bg-white/20 text-white ring-white/30' : PLAN_BADGE[u.plan] ?? 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
          {u.plan}
        </span>
        {isUrgent && <AlertTriangle size={10} className={selected ? 'text-yellow-300' : 'text-red-400'} />}
      </div>
    </motion.button>
  )
}

// ─── Customer detail ──────────────────────────────────────────────────────────
function CustomerDetail({ u }: { u: AdminUser }) {
  const qc = useQueryClient()
  const changePlan = useMutation({
    mutationFn: (plan: string) => api.patch(`/admin/users/${u.id}/plan`, { plan }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const PIPELINE = [
    { key: 'RECRUITER_OUTREACH', label: 'Outreach', color: 'bg-slate-400' },
    { key: 'APPLIED',            label: 'Applied',  color: 'bg-violet-500' },
    { key: 'SCREENING',          label: 'Screen',   color: 'bg-amber-400' },
    { key: 'ASSESSMENT',         label: 'Assess',   color: 'bg-orange-400' },
    { key: 'HIRING_MANAGER_INTERVIEW', label: 'HM Int', color: 'bg-orange-500' },
    { key: 'TECHNICAL_INTERVIEW',      label: 'Tech',   color: 'bg-orange-600' },
    { key: 'FINAL_ROUND',        label: 'Final',    color: 'bg-red-500' },
    { key: 'OFFER',              label: 'Offer',    color: 'bg-emerald-500' },
    { key: 'OFFER_ACCEPTED',     label: 'Accepted', color: 'bg-emerald-600' },
    { key: 'REJECTED',           label: 'Rejected', color: 'bg-red-300' },
    { key: 'WITHDRAWN',          label: 'Withdrawn',color: 'bg-slate-300' },
    { key: 'NO_RESPONSE',        label: 'No reply', color: 'bg-slate-200' },
  ]
  const activePipeline = PIPELINE.filter(s => (u.appsByStatus[s.key] ?? 0) > 0)
  const weekPct = u.weeklyAppsLimit > 0 ? Math.min(100, Math.round((u.weeklyAppsUsed / u.weeklyAppsLimit) * 100)) : 0

  return (
    <motion.div variants={slideIn} initial="hidden" animate="visible" exit="exit" className="space-y-4">

      {/* Header card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${PLAN_GRADIENT[u.plan] ?? 'from-slate-500 to-slate-700'} p-5 text-white shadow-lg`}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(45deg, #fff 1px, transparent 1px), linear-gradient(-45deg, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold shrink-0 ring-2 ring-white/30">
            {initials(u.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-display font-bold">{u.name}</h2>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">{u.plan}</span>
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[u.planStatus] ?? 'bg-slate-300'}`} />
              <span className="text-xs text-white/70">{u.planStatus}</span>
            </div>
            <p className="text-sm text-white/70 truncate">{u.email}</p>
            <p className="text-xs text-white/50 mt-0.5">Joined {new Date(u.joinedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <a href={`mailto:${u.email}`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg">
            <Mail size={12} /> Email
          </a>
        </div>

        {/* What's needed badges */}
        {u.needs.length > 0 && (
          <div className="relative flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-white/20">
            <p className="text-xs text-white/60 w-full mb-1 font-medium">Needs</p>
            {u.needs.map(n => {
              const cls = NEED_COLOR[n] ?? 'bg-white/20 text-white ring-white/20'
              return (
                <span key={n} className={`inline-flex items-center text-xs font-medium ring-1 rounded-full px-2 py-0.5 ${cls}`}>{n}</span>
              )
            })}
          </div>
        )}
      </div>

      {/* 3-col grid */}
      <div className="grid md:grid-cols-3 gap-4">

        {/* Account setup */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account setup</p>
          <div className="space-y-2.5">
            {[
              { label: 'Email verified',  ok: u.emailVerified },
              { label: 'Profile complete',ok: u.profileComplete },
              { label: 'Gmail connected', ok: !!u.gmail },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{label}</span>
                {ok
                  ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <CheckCircle2 size={16} className="text-emerald-500" />
                    </motion.div>
                  : <XCircle size={16} className="text-red-400" />}
              </div>
            ))}
            {u.gmail && <p className="text-xs text-slate-400 bg-slate-50 rounded-lg px-2 py-1 truncate">{u.gmail.email}</p>}
          </div>
        </div>

        {/* Weekly apps */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">This week</p>
          {u.weeklyAppsLimit === 0 ? (
            <p className="text-sm text-slate-400">No quota — upgrade plan</p>
          ) : (
            <>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-600">Applications</span>
                <span className="font-bold text-slate-900">{u.weeklyAppsUsed}<span className="text-slate-400 font-normal">/{u.weeklyAppsLimit}</span></span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${weekPct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className={`h-2 rounded-full ${weekPct >= 100 ? 'bg-red-400' : weekPct > 70 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                />
              </div>
              <p className={`text-xs font-semibold ${u.weeklyAppsRemaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {u.weeklyAppsRemaining} slots remaining
              </p>
            </>
          )}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-slate-500">Total ever</span><span className="font-semibold text-slate-800">{u.totalApps}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Applied</span><span className="font-semibold text-slate-800">{u.appliedCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Interviews</span><span className="font-semibold text-amber-600">{u.interviewCount}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Offers</span><span className="font-semibold text-emerald-600">{u.offerCount}</span></div>
          </div>
        </div>

        {/* CVs + plan control */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">CVs ({u.totalCVs})</p>
            {u.totalCVs === 0 ? (
              <p className="text-sm text-slate-400">No CVs yet</p>
            ) : (
              <div className="space-y-1.5 text-xs">
                {[
                  ['DRAFT',            'Draft',          'text-slate-500'],
                  ['IN_REVIEW',        'In review',      'text-blue-600'],
                  ['REQUIRES_CHANGES', 'Needs changes',  'text-amber-600'],
                  ['APPROVED',         'Approved',       'text-emerald-600'],
                ].filter(([k]) => (u.cvsByStatus[k] ?? 0) > 0).map(([k, label, color]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-500">{label}</span>
                    <span className={`font-bold ${color}`}>{u.cvsByStatus[k]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-auto pt-3 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Change plan</p>
            <div className="flex gap-1.5">
              {['EXPLORE','LAUNCH','MOMENTUM'].map(plan => (
                <button key={plan} onClick={() => changePlan.mutate(plan)}
                  disabled={u.plan === plan || changePlan.isPending}
                  className={`flex-1 text-xs py-1.5 rounded-lg font-semibold transition-all ${
                    u.plan === plan
                      ? `bg-gradient-to-br ${PLAN_GRADIENT[plan]} text-white shadow-md cursor-default`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {plan[0] + plan.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline */}
      {activePipeline.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Application pipeline</p>
          <div className="flex flex-wrap gap-2">
            {activePipeline.map((s, i) => (
              <motion.span key={s.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 text-white ${s.color} shadow-sm`}
              >
                {s.label}
                <span className="bg-white/30 rounded-full px-1.5 font-bold">{u.appsByStatus[s.key]}</span>
              </motion.span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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
    const q = search.toLowerCase()
    return (q === '' || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
        && (planFilter === 'ALL' || u.plan === planFilter)
  })
  const selected = allUsers.find(u => u.id === selectedId) ?? null

  const appsToSubmit   = allUsers.filter(u => u.weeklyAppsRemaining > 0 && u.weeklyAppsLimit > 0)
  const missingDetails = allUsers.filter(u => !u.profileComplete || !u.emailVerified || !u.gmail)
  const cvsToReview    = allUsers.filter(u => (u.cvsByStatus['IN_REVIEW'] ?? 0) > 0)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="w-72 shrink-0 flex flex-col bg-white border-r border-slate-200 shadow-sm">

        {/* Sidebar header */}
        <div className="px-4 pt-5 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-md">
              <Users size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-display font-bold text-slate-900">Customers</p>
              <p className="text-[10px] text-slate-400">{allUsers.length} total</p>
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:bg-white transition-colors"
              placeholder="Search customers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-1">
            {(['ALL','EXPLORE','LAUNCH','MOMENTUM'] as const).map(p => (
              <button key={p} onClick={() => setPlan(p)}
                className={`flex-1 text-[10px] font-semibold rounded-lg py-1 transition-all ${
                  planFilter === p
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {p === 'ALL' ? 'All' : p[0] + p.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Customer list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {isLoading ? (
            [1,2,3,4,5].map(i => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users size={24} className="text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No customers found</p>
            </div>
          ) : (
            filtered.map((u, i) => (
              <CustomerItem
                key={u.id} u={u} index={i}
                selected={selectedId === u.id}
                onClick={() => setSelected(selectedId === u.id ? null : u.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-5 max-w-5xl">

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 md:grid-cols-7 gap-3">
              {[
                { label: 'Users',       value: stats.total,             icon: Users,         gradient: 'from-slate-500 to-slate-700' },
                { label: 'Applications',value: stats.totalApplications, icon: Send,          gradient: 'from-brand-500 to-indigo-600' },
                { label: 'Applied',     value: stats.totalApplied,      icon: Briefcase,     gradient: 'from-violet-500 to-purple-600' },
                { label: 'Interviews',  value: stats.totalInterviews,   icon: TrendingUp,    gradient: 'from-amber-500 to-orange-600' },
                { label: 'Offers',      value: stats.totalOffers,       icon: Star,          gradient: 'from-emerald-500 to-teal-600' },
                { label: 'Attention',   value: stats.needsAttention,    icon: AlertTriangle, gradient: 'from-amber-400 to-orange-500' },
                { label: 'Payments',    value: stats.pastDue,           icon: CreditCard,    gradient: 'from-red-500 to-rose-600' },
              ].map((s, i) => <StatCard key={s.label} {...s} delay={i} />)}
            </div>
          )}

          {/* This week queue */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.3}>
            <div className="flex items-center gap-2 mb-3">
              <Clock size={13} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">This week's queue</p>
              <Activity size={11} className="text-emerald-400 ml-1" />
            </div>
            <div className="flex gap-3">
              <QueueCard
                icon={Send} label="Apps to submit"
                color="bg-emerald-500" bg="bg-emerald-50/60 border-emerald-100"
                items={appsToSubmit}
                renderItem={u => <p className="text-[10px] text-emerald-600 font-medium">{u.weeklyAppsRemaining} slots left</p>}
              />
              <QueueCard
                icon={ClipboardList} label="Missing details"
                color="bg-amber-500" bg="bg-amber-50/60 border-amber-100"
                items={missingDetails}
                renderItem={u => {
                  const m = [!u.emailVerified && 'email', !u.profileComplete && 'profile', !u.gmail && 'Gmail'].filter(Boolean)
                  return <p className="text-[10px] text-amber-600 font-medium">{m.join(', ')}</p>
                }}
              />
              <QueueCard
                icon={UserCheck} label="CVs to review"
                color="bg-blue-500" bg="bg-blue-50/60 border-blue-100"
                items={cvsToReview}
                renderItem={u => <p className="text-[10px] text-blue-600 font-medium">{u.cvsByStatus['IN_REVIEW']} CV in review</p>}
              />
            </div>
          </motion.div>

          {/* Customer detail or empty state */}
          <AnimatePresence mode="wait">
            {selected ? (
              <motion.div key={selected.id} variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0, y: -8 }}>
                <div className="flex items-center gap-2 mb-3">
                  <ChevronRight size={13} className="text-slate-400" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer details</p>
                </div>
                <CustomerDetail u={selected} />
              </motion.div>
            ) : (
              <motion.div key="empty" variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-100 to-indigo-100 flex items-center justify-center mb-4">
                  <Users size={28} className="text-brand-400" />
                </div>
                <p className="text-slate-600 font-semibold mb-1">Select a customer</p>
                <p className="text-slate-400 text-sm">Click any name in the sidebar to view full details</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
