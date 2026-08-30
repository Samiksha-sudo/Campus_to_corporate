import { useState }    from 'react'
import { useQuery }    from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2, Circle, Send, ClipboardList,
  UserCheck, AlertTriangle, ChevronDown, ChevronUp,
  TrendingUp,
} from 'lucide-react'
import api from '@/services/api'

interface AdminUser {
  id:              string
  name:            string
  email:           string
  plan:            string
  planStatus:      string
  weeklyAppsUsed:      number
  weeklyAppsLimit:     number
  weeklyAppsRemaining: number
  totalApps:     number
  appliedCount:  number
  interviewCount:number
  offerCount:    number
  emailVerified:   boolean
  profileComplete: boolean
  gmail:           { email: string; lastSync: string | null } | null
  cvsByStatus:     Record<string, number>
  needs:           string[]
}

interface AdminStats {
  total: number
  totalApplications: number
  totalApplied: number
  totalInterviews: number
  totalOffers: number
  needsAttention: number
}

function initials(name: string) {
  const p = name.trim().split(' ')
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase()
}

const PLAN_GRADIENT: Record<string, string> = {
  EXPLORE:  'from-slate-500 to-slate-600',
  LAUNCH:   'from-blue-500 to-indigo-600',
  MOMENTUM: 'from-violet-500 to-purple-600',
}

const fadeUp = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] } }),
}

// ─── Application task row ─────────────────────────────────────────────────────
function AppTaskRow({ u, index }: { u: AdminUser; index: number }) {
  const [done, setDone] = useState(false)
  const pct = u.weeklyAppsLimit > 0 ? Math.min(100, Math.round((u.weeklyAppsUsed / u.weeklyAppsLimit) * 100)) : 0

  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible" custom={index * 0.07}
      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${done ? 'border-emerald-200 opacity-60' : 'border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5'}`}
    >
      <div className="p-4 flex items-center gap-4">
        {/* Check toggle */}
        <button onClick={() => setDone(d => !d)} className="shrink-0 transition-transform active:scale-90">
          {done
            ? <CheckCircle2 size={22} className="text-emerald-500" />
            : <Circle size={22} className="text-slate-300 hover:text-brand-400 transition-colors" />}
        </button>

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAN_GRADIENT[u.plan] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md`}>
          {initials(u.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className={`text-sm font-semibold ${done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{u.name}</p>
            <span className="text-xs text-slate-400 truncate hidden sm:inline">{u.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: index * 0.07, ease: 'easeOut' }}
                className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-400' : pct > 60 ? 'bg-amber-400' : 'bg-brand-500'}`}
              />
            </div>
            <span className="text-xs text-slate-500 shrink-0">{u.weeklyAppsUsed}/{u.weeklyAppsLimit}</span>
          </div>
        </div>

        {/* Slots badge */}
        <div className="shrink-0 text-right">
          <p className={`text-lg font-display font-extrabold ${u.weeklyAppsRemaining === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
            {u.weeklyAppsRemaining}
          </p>
          <p className="text-[10px] text-slate-400 leading-tight">slots left</p>
        </div>
      </div>

      {/* Task detail */}
      {!done && (
        <div className="px-4 pb-3 pt-0 flex items-center gap-2 border-t border-slate-50">
          <Send size={11} className="text-brand-400 shrink-0" />
          <p className="text-xs text-slate-500">
            Submit <span className="font-semibold text-slate-700">{u.weeklyAppsRemaining}</span> more application{u.weeklyAppsRemaining !== 1 ? 's' : ''} this week for {u.name.split(' ')[0]}
          </p>
          <a href={`mailto:${u.email}`} className="ml-auto text-xs text-brand-600 hover:underline font-medium shrink-0">
            Contact
          </a>
        </div>
      )}
    </motion.div>
  )
}

// ─── Setup task row ───────────────────────────────────────────────────────────
function SetupTaskRow({ u, index }: { u: AdminUser; index: number }) {
  const [open, setOpen] = useState(false)
  const missing: { label: string; done: boolean }[] = [
    { label: 'Email verified',   done: u.emailVerified },
    { label: 'Profile complete', done: u.profileComplete },
    { label: 'Gmail connected',  done: !!u.gmail },
    { label: 'CV uploaded',      done: u.totalApps > 0 || (u.cvsByStatus?.['APPROVED'] ?? 0) > 0 },
  ]
  const doneCount = missing.filter(m => m.done).length

  return (
    <motion.div
      variants={fadeUp} initial="hidden" animate="visible" custom={index * 0.07}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAN_GRADIENT[u.plan] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md`}>
          {initials(u.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800">{u.name}</p>
          <p className="text-xs text-slate-400 truncate">{u.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-1">
            {missing.map((m, i) => (
              <span key={i} className={`w-2 h-2 rounded-full ${m.done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-500">{doneCount}/{missing.length}</span>
          {open ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-slate-100 grid grid-cols-2 gap-2 mt-0">
              {missing.map(m => (
                <div key={m.label} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
                  m.done ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                }`}>
                  {m.done
                    ? <CheckCircle2 size={13} />
                    : <AlertTriangle size={13} />}
                  {m.label}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminTasksPage() {
  const [tab, setTab] = useState<'apps' | 'setup' | 'cvs'>('apps')

  const { data, isLoading } = useQuery<{ users: AdminUser[]; stats: AdminStats }>({
    queryKey: ['admin-users'],
    queryFn:  () => api.get('/admin/users').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const allUsers   = data?.users ?? []
  const stats      = data?.stats
  const appsQueue  = allUsers.filter(u => u.weeklyAppsRemaining > 0 && u.weeklyAppsLimit > 0)
                             .sort((a, b) => b.weeklyAppsRemaining - a.weeklyAppsRemaining)
  const setupQueue = allUsers.filter(u => !u.profileComplete || !u.emailVerified || !u.gmail)
  const cvsQueue   = allUsers.filter(u => (u.cvsByStatus?.['IN_REVIEW'] ?? 0) > 0)

  const TABS = [
    { key: 'apps',  label: 'Applications to submit', icon: Send,          count: appsQueue.length,  color: 'from-emerald-500 to-teal-600' },
    { key: 'setup', label: 'Setup incomplete',        icon: ClipboardList, count: setupQueue.length, color: 'from-amber-500 to-orange-600' },
    { key: 'cvs',   label: 'CVs to review',           icon: UserCheck,     count: cvsQueue.length,   color: 'from-blue-500 to-indigo-600' },
  ] as const

  const totalAppsLeft = appsQueue.reduce((sum, u) => sum + u.weeklyAppsRemaining, 0)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Page header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Tasks</h1>
        <p className="text-slate-500 text-sm">Your weekly action list — applications to submit and customers to onboard.</p>
      </motion.div>

      {/* Summary stat */}
      {stats && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.1}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Apps left this week', value: totalAppsLeft,          gradient: 'from-emerald-500 to-teal-600',  icon: Send },
            { label: 'Customers to onboard',value: setupQueue.length,       gradient: 'from-amber-500 to-orange-600', icon: ClipboardList },
            { label: 'CVs awaiting review', value: cvsQueue.length,         gradient: 'from-blue-500 to-indigo-600',  icon: UserCheck },
            { label: 'Total interviews',    value: stats.totalInterviews,   gradient: 'from-violet-500 to-purple-600',icon: TrendingUp },
          ].map((s, i) => (
            <motion.div key={s.label} variants={fadeUp} initial="hidden" animate="visible" custom={i * 0.08}
              className="relative overflow-hidden bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-2 shadow-md`}>
                <s.icon size={15} className="text-white" />
              </div>
              <p className="text-2xl font-display font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">{s.label}</p>
              <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full bg-gradient-to-br ${s.gradient} opacity-5`} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Tab switcher */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0.2}
        className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key
                ? `bg-gradient-to-r ${t.color} text-white shadow-md`
                : 'text-slate-600 hover:bg-white/60'
            }`}
          >
            <t.icon size={13} />
            <span className="hidden sm:inline">{t.label}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-white/25' : 'bg-slate-200 text-slate-600'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Task list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }} className="space-y-3">

            {tab === 'apps' && (
              appsQueue.length === 0 ? (
                <EmptyState icon={Send} title="All applications submitted!" body="Every customer's weekly quota is used up." />
              ) : (
                appsQueue.map((u, i) => <AppTaskRow key={u.id} u={u} index={i} />)
              )
            )}

            {tab === 'setup' && (
              setupQueue.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="All customers onboarded!" body="Every customer has completed their setup." />
              ) : (
                setupQueue.map((u, i) => <SetupTaskRow key={u.id} u={u} index={i} />)
              )
            )}

            {tab === 'cvs' && (
              cvsQueue.length === 0 ? (
                <EmptyState icon={UserCheck} title="No CVs pending review!" body="All submitted CVs have been reviewed." />
              ) : (
                cvsQueue.map((u, i) => (
                  <motion.div key={u.id} variants={fadeUp} initial="hidden" animate="visible" custom={i * 0.07}
                    className="bg-white rounded-2xl border border-blue-100 shadow-sm p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PLAN_GRADIENT[u.plan] ?? 'from-slate-400 to-slate-600'} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md`}>
                      {initials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-display font-extrabold text-blue-600">{u.cvsByStatus['IN_REVIEW']}</p>
                      <p className="text-[10px] text-slate-400">CV{(u.cvsByStatus['IN_REVIEW'] ?? 0) !== 1 ? 's' : ''} to review</p>
                    </div>
                  </motion.div>
                ))
              )
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4">
        <Icon size={28} className="text-emerald-500" />
      </div>
      <p className="text-slate-700 font-semibold mb-1">{title}</p>
      <p className="text-slate-400 text-sm">{body}</p>
    </motion.div>
  )
}
