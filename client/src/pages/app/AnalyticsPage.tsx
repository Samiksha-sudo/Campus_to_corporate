import { useQuery } from '@tanstack/react-query'
import { Briefcase, Star, XCircle, Clock, CheckCircle2, BarChart2, TrendingUp } from 'lucide-react'
import api from '@/services/api'

interface Application {
  id: string; companyName: string; jobTitle: string
  status: string; appliedAt: string | null; createdAt: string
  workMode: string | null; location: string | null; salaryRange: string | null
}

const STATUS_LABEL: Record<string, string> = {
  RECRUITER_OUTREACH:       'Outreach',
  APPLIED:                  'Applied',
  UNDER_REVIEW:             'Under Review',
  SCREENING:                'Screening',
  ASSESSMENT:               'Assessment',
  ASSESSMENT_SUBMITTED:     'Assessment Done',
  HIRING_MANAGER_INTERVIEW: 'HM Interview',
  TECHNICAL_INTERVIEW:      'Technical',
  SYSTEM_DESIGN_INTERVIEW:  'System Design',
  CODING_INTERVIEW:         'Coding',
  SECOND_ROUND:             '2nd Round',
  THIRD_ROUND:              '3rd Round',
  FINAL_ROUND:              'Final Round',
  WAITING_FOR_RESPONSE:     'Waiting',
  REFERENCE_CHECK:          'Reference',
  BACKGROUND_CHECK:         'Background',
  RIGHT_TO_WORK_CHECK:      'Right to Work',
  SALARY_DISCUSSION:        'Salary',
  OFFER_PENDING:            'Offer Pending',
  OFFER:                    'Offer',
  OFFER_ACCEPTED:           'Accepted',
  OFFER_DECLINED:           'Declined',
  REJECTED:                 'Rejected',
  WITHDRAWN:                'Withdrawn',
  ROLE_CLOSED:              'Role Closed',
  ON_HOLD:                  'On Hold',
  TALENT_POOL:              'Talent Pool',
  NO_RESPONSE:              'No Response',
  UNKNOWN:                  'Unknown',
}

const PIPELINE_STAGES = [
  { key: 'RECRUITER_OUTREACH',       color: '#c084fc', bg: 'bg-purple-400'  },
  { key: 'APPLIED',                  color: '#60a5fa', bg: 'bg-blue-400'    },
  { key: 'UNDER_REVIEW',             color: '#818cf8', bg: 'bg-indigo-400'  },
  { key: 'SCREENING',                color: '#22d3ee', bg: 'bg-cyan-400'    },
  { key: 'ASSESSMENT',               color: '#a78bfa', bg: 'bg-violet-400'  },
  { key: 'ASSESSMENT_SUBMITTED',     color: '#8b5cf6', bg: 'bg-violet-500'  },
  { key: 'HIRING_MANAGER_INTERVIEW', color: '#fbbf24', bg: 'bg-amber-400'   },
  { key: 'TECHNICAL_INTERVIEW',      color: '#fb923c', bg: 'bg-orange-400'  },
  { key: 'SYSTEM_DESIGN_INTERVIEW',  color: '#f97316', bg: 'bg-orange-500'  },
  { key: 'CODING_INTERVIEW',         color: '#ea580c', bg: 'bg-orange-600'  },
  { key: 'SECOND_ROUND',             color: '#d97706', bg: 'bg-amber-600'   },
  { key: 'THIRD_ROUND',              color: '#b45309', bg: 'bg-amber-700'   },
  { key: 'FINAL_ROUND',              color: '#e11d48', bg: 'bg-rose-600'    },
  { key: 'WAITING_FOR_RESPONSE',     color: '#94a3b8', bg: 'bg-slate-400'   },
  { key: 'REFERENCE_CHECK',          color: '#2dd4bf', bg: 'bg-teal-400'    },
  { key: 'BACKGROUND_CHECK',         color: '#14b8a6', bg: 'bg-teal-500'    },
  { key: 'RIGHT_TO_WORK_CHECK',      color: '#0d9488', bg: 'bg-teal-600'    },
  { key: 'SALARY_DISCUSSION',        color: '#10b981', bg: 'bg-emerald-500' },
  { key: 'OFFER_PENDING',            color: '#059669', bg: 'bg-emerald-600' },
  { key: 'OFFER',                    color: '#22c55e', bg: 'bg-green-500'   },
  { key: 'OFFER_ACCEPTED',           color: '#16a34a', bg: 'bg-green-600'   },
  { key: 'OFFER_DECLINED',           color: '#64748b', bg: 'bg-slate-500'   },
  { key: 'REJECTED',                 color: '#f87171', bg: 'bg-red-400'     },
  { key: 'ON_HOLD',                  color: '#fbbf24', bg: 'bg-amber-400'   },
  { key: 'TALENT_POOL',              color: '#93c5fd', bg: 'bg-blue-300'    },
  { key: 'NO_RESPONSE',              color: '#cbd5e1', bg: 'bg-slate-300'   },
]

function StatCard({ icon: Icon, label, value, sub, gradient }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; gradient: string
}) {
  return (
    <div className={`rounded-2xl p-5 text-white ${gradient} shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
          <Icon size={17} />
        </div>
      </div>
      <p className="text-3xl font-bold mb-0.5">{value}</p>
      <p className="text-sm font-medium opacity-80">{label}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  )
}

function PipelineChart({ apps }: { apps: Application[] }) {
  const counts: Record<string, number> = {}
  for (const a of apps) counts[a.status] = (counts[a.status] ?? 0) + 1
  const max = Math.max(...PIPELINE_STAGES.map(s => counts[s.key] ?? 0), 1)
  const active = PIPELINE_STAGES.filter(s => (counts[s.key] ?? 0) > 0)

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
          <BarChart2 size={15} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Pipeline Breakdown</h2>
          <p className="text-xs text-slate-400">Applications by stage</p>
        </div>
      </div>

      {active.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">No applications yet</p>
      ) : (
        <div className="space-y-3">
          {PIPELINE_STAGES.filter(s => (counts[s.key] ?? 0) > 0).map(s => {
            const pct = Math.round(((counts[s.key] ?? 0) / max) * 100)
            return (
              <div key={s.key} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 shrink-0 font-medium">{STATUS_LABEL[s.key]}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: s.color }}
                  />
                </div>
                <span className="text-sm font-bold text-slate-700 w-6 text-right">{counts[s.key] ?? 0}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FunnelChart({ apps }: { apps: Application[] }) {
  const total     = apps.length
  const applied   = apps.filter(a => !['RECRUITER_OUTREACH','WITHDRAWN','ROLE_CLOSED','NO_RESPONSE','UNKNOWN'].includes(a.status)).length
  const interview = apps.filter(a => ['SCREENING','ASSESSMENT','ASSESSMENT_SUBMITTED','HIRING_MANAGER_INTERVIEW','TECHNICAL_INTERVIEW','SYSTEM_DESIGN_INTERVIEW','CODING_INTERVIEW','SECOND_ROUND','THIRD_ROUND','FINAL_ROUND'].includes(a.status)).length
  const offer     = apps.filter(a => ['OFFER','OFFER_ACCEPTED','OFFER_PENDING'].includes(a.status)).length

  const steps = [
    { label: 'Added',        value: total,     color: 'from-slate-400 to-slate-500',         pctOfTotal: 100 },
    { label: 'Applied',      value: applied,   color: 'from-violet-400 to-violet-500',       pctOfTotal: total ? Math.round((applied / total) * 100) : 0 },
    { label: 'Interviews',   value: interview, color: 'from-amber-400 to-orange-500',        pctOfTotal: total ? Math.round((interview / total) * 100) : 0 },
    { label: 'Offers',       value: offer,     color: 'from-emerald-400 to-emerald-600',     pctOfTotal: total ? Math.round((offer / total) * 100) : 0 },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
          <TrendingUp size={15} className="text-amber-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Conversion Funnel</h2>
          <p className="text-xs text-slate-400">How far applications progress</p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map(s => (
          <div key={s.label}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-slate-600">{s.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{s.pctOfTotal}%</span>
                <span className="text-sm font-bold text-slate-800 w-6 text-right">{s.value}</span>
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
              <div
                className={`h-4 rounded-full bg-gradient-to-r ${s.color} transition-all duration-700`}
                style={{ width: `${s.pctOfTotal}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {total > 0 && offer > 0 && (
        <div className="mt-4 bg-emerald-50 rounded-xl px-3 py-2 text-xs text-emerald-700 font-medium">
          🎉 {Math.round((offer / total) * 100)}% offer rate — great work!
        </div>
      )}
    </div>
  )
}

function WorkModeDonut({ apps }: { apps: Application[] }) {
  const counts: Record<string, number> = { REMOTE: 0, HYBRID: 0, ONSITE: 0 }
  for (const a of apps) {
    const key = a.workMode ?? 'HYBRID'
    if (key in counts) counts[key]++
  }
  const total = Object.values(counts).reduce((s, v) => s + v, 0) || 1

  const modes = [
    { key: 'REMOTE', label: 'Remote', color: 'bg-violet-400', text: 'text-violet-600', light: 'bg-violet-50' },
    { key: 'HYBRID', label: 'Hybrid', color: 'bg-blue-400',   text: 'text-blue-600',   light: 'bg-blue-50'   },
    { key: 'ONSITE', label: 'Onsite', color: 'bg-amber-400',  text: 'text-amber-600',  light: 'bg-amber-50'  },
  ]

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Briefcase size={15} className="text-blue-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Work Mode</h2>
          <p className="text-xs text-slate-400">Remote vs hybrid vs onsite</p>
        </div>
      </div>
      <div className="space-y-3">
        {modes.map(m => {
          const count = counts[m.key]
          const pct   = Math.round((count / total) * 100)
          return (
            <div key={m.key} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${m.light}`}>
              <div className={`w-2.5 h-2.5 rounded-full ${m.color}`} />
              <span className={`text-xs font-semibold flex-1 ${m.text}`}>{m.label}</span>
              <div className="w-24 bg-white/60 rounded-full h-1.5 overflow-hidden">
                <div className={`h-1.5 rounded-full ${m.color}`} style={{ width: `${pct}%` }} />
              </div>
              <span className={`text-xs font-bold w-6 text-right ${m.text}`}>{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RecentList({ apps }: { apps: Application[] }) {
  const recent = [...apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
  const stageColor = (s: string) => PIPELINE_STAGES.find(p => p.key === s)?.color ?? '#94a3b8'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
          <Clock size={15} className="text-emerald-600" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Recent Applications</h2>
          <p className="text-xs text-slate-400">Latest activity</p>
        </div>
      </div>
      {recent.length === 0
        ? <p className="text-sm text-slate-400 text-center py-4">No applications yet</p>
        : (
          <div className="space-y-0 divide-y divide-slate-50">
            {recent.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: stageColor(a.status) }}>
                  {a.companyName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-800 truncate">{a.companyName}</p>
                  <p className="text-xs text-slate-400 truncate">{a.jobTitle}</p>
                </div>
                <span className="text-xs font-medium rounded-full px-2 py-0.5 text-white shrink-0"
                  style={{ backgroundColor: stageColor(a.status) }}>
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: ['applications'],
    queryFn:  () => api.get('/applications').then(r => r.data.data),
  })

  const apps       = data?.applications ?? []
  const total      = apps.length
  const active     = apps.filter(a => !['REJECTED','WITHDRAWN'].includes(a.status)).length
  const interviews = apps.filter(a => ['SCREENING','ASSESSMENT','ASSESSMENT_SUBMITTED','HIRING_MANAGER_INTERVIEW','TECHNICAL_INTERVIEW','SYSTEM_DESIGN_INTERVIEW','CODING_INTERVIEW','SECOND_ROUND','THIRD_ROUND','FINAL_ROUND'].includes(a.status)).length
  const offers     = apps.filter(a => a.status === 'OFFER').length
  const rejected   = apps.filter(a => a.status === 'REJECTED').length
  const offerRate  = total > 0 ? Math.round((offers / total) * 100) : 0

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 rounded-2xl bg-slate-100 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm">Your job search performance at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <StatCard icon={Briefcase}    label="Total"       value={total}           gradient="bg-gradient-to-br from-slate-600 to-slate-800"   />
        <StatCard icon={Clock}        label="Active"      value={active}          gradient="bg-gradient-to-br from-blue-500 to-blue-700"      />
        <StatCard icon={Star}         label="Interviews"  value={interviews}      gradient="bg-gradient-to-br from-amber-500 to-orange-600"   />
        <StatCard icon={CheckCircle2} label="Offers"      value={offers}          gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"/>
        <StatCard icon={TrendingUp}   label="Offer rate"  value={`${offerRate}%`} gradient="bg-gradient-to-br from-violet-500 to-purple-700"  />
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BarChart2 size={28} className="text-slate-300" />
          </div>
          <p className="text-slate-600 font-semibold mb-1">No data yet</p>
          <p className="text-slate-400 text-sm">Add your first application to see analytics.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <PipelineChart apps={apps} />
            <FunnelChart   apps={apps} />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <WorkModeDonut apps={apps} />
            <RecentList    apps={apps} />
          </div>
          {rejected > 0 && (
            <div className="mt-4 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                <XCircle size={15} className="text-red-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{rejected} rejection{rejected !== 1 ? 's' : ''} so far</p>
                <p className="text-xs text-slate-400">Every rejection is one step closer to the right role. Keep going.</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
