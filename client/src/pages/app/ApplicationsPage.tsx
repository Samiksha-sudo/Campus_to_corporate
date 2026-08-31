import { useState }             from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase, RefreshCw, X, CheckCircle2,
  MapPin, ChevronLeft, ChevronRight, Building2,
  Banknote, Wifi, Monitor, Users,
} from 'lucide-react'
import api          from '@/services/api'
import { useToast } from '@/hooks/useToast'

interface Application {
  id:           string
  companyName:  string
  jobTitle:     string
  location:     string | null
  salaryRange:  string | null
  workMode:     'REMOTE' | 'HYBRID' | 'ONSITE' | null
  status:       AppStatus
  userApproved: number
  appliedAt:    string | null
  createdAt:    string
  roleFitScore: number | null
}

type AppStatus =
  | 'RECRUITER_OUTREACH' | 'APPLIED' | 'UNDER_REVIEW' | 'SCREENING'
  | 'ASSESSMENT' | 'ASSESSMENT_SUBMITTED'
  | 'HIRING_MANAGER_INTERVIEW' | 'TECHNICAL_INTERVIEW' | 'SYSTEM_DESIGN_INTERVIEW' | 'CODING_INTERVIEW'
  | 'SECOND_ROUND' | 'THIRD_ROUND' | 'FINAL_ROUND'
  | 'WAITING_FOR_RESPONSE' | 'REFERENCE_CHECK' | 'BACKGROUND_CHECK' | 'RIGHT_TO_WORK_CHECK'
  | 'SALARY_DISCUSSION' | 'OFFER_PENDING' | 'OFFER' | 'OFFER_ACCEPTED' | 'OFFER_DECLINED'
  | 'REJECTED' | 'WITHDRAWN' | 'ROLE_CLOSED' | 'ON_HOLD' | 'TALENT_POOL' | 'NO_RESPONSE' | 'UNKNOWN'

const STATUS: Record<AppStatus, { label: string; bg: string; text: string; dot: string }> = {
  RECRUITER_OUTREACH:       { label: 'Recruiter Outreach',   bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-400'  },
  APPLIED:                  { label: 'Applied',              bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500'    },
  UNDER_REVIEW:             { label: 'Under Review',         bg: 'bg-indigo-50',   text: 'text-indigo-700',  dot: 'bg-indigo-400'  },
  SCREENING:                { label: 'Screening',            bg: 'bg-cyan-50',     text: 'text-cyan-700',    dot: 'bg-cyan-500'    },
  ASSESSMENT:               { label: 'Assessment',           bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-500'  },
  ASSESSMENT_SUBMITTED:     { label: 'Assessment Submitted', bg: 'bg-violet-50',   text: 'text-violet-700',  dot: 'bg-violet-400'  },
  HIRING_MANAGER_INTERVIEW: { label: 'HM Interview',         bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500'   },
  TECHNICAL_INTERVIEW:      { label: 'Technical Interview',  bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-500'  },
  SYSTEM_DESIGN_INTERVIEW:  { label: 'System Design',        bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400'  },
  CODING_INTERVIEW:         { label: 'Coding Interview',     bg: 'bg-orange-50',   text: 'text-orange-700',  dot: 'bg-orange-400'  },
  SECOND_ROUND:             { label: '2nd Round',            bg: 'bg-amber-50',    text: 'text-amber-800',   dot: 'bg-amber-600'   },
  THIRD_ROUND:              { label: '3rd Round',            bg: 'bg-amber-50',    text: 'text-amber-800',   dot: 'bg-amber-600'   },
  FINAL_ROUND:              { label: 'Final Round',          bg: 'bg-rose-50',     text: 'text-rose-700',    dot: 'bg-rose-500'    },
  WAITING_FOR_RESPONSE:     { label: 'Waiting',              bg: 'bg-slate-50',    text: 'text-slate-600',   dot: 'bg-slate-300'   },
  REFERENCE_CHECK:          { label: 'Reference Check',      bg: 'bg-teal-50',     text: 'text-teal-700',    dot: 'bg-teal-400'    },
  BACKGROUND_CHECK:         { label: 'Background Check',     bg: 'bg-teal-50',     text: 'text-teal-700',    dot: 'bg-teal-400'    },
  RIGHT_TO_WORK_CHECK:      { label: 'Right to Work',        bg: 'bg-teal-50',     text: 'text-teal-700',    dot: 'bg-teal-400'    },
  SALARY_DISCUSSION:        { label: 'Salary Discussion',    bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  OFFER_PENDING:            { label: 'Offer Pending',        bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-400' },
  OFFER:                    { label: 'Offer!',               bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-600' },
  OFFER_ACCEPTED:           { label: 'Offer Accepted',       bg: 'bg-emerald-100', text: 'text-emerald-900', dot: 'bg-emerald-700' },
  OFFER_DECLINED:           { label: 'Offer Declined',       bg: 'bg-slate-100',   text: 'text-slate-500',   dot: 'bg-slate-300'   },
  REJECTED:                 { label: 'Rejected',             bg: 'bg-red-50',      text: 'text-red-600',     dot: 'bg-red-400'     },
  WITHDRAWN:                { label: 'Withdrawn',            bg: 'bg-slate-100',   text: 'text-slate-400',   dot: 'bg-slate-300'   },
  ROLE_CLOSED:              { label: 'Role Closed',          bg: 'bg-slate-100',   text: 'text-slate-400',   dot: 'bg-slate-300'   },
  ON_HOLD:                  { label: 'On Hold',              bg: 'bg-amber-50',    text: 'text-amber-600',   dot: 'bg-amber-400'   },
  TALENT_POOL:              { label: 'Talent Pool',          bg: 'bg-blue-50',     text: 'text-blue-600',    dot: 'bg-blue-300'    },
  NO_RESPONSE:              { label: 'No Response',          bg: 'bg-slate-50',    text: 'text-slate-400',   dot: 'bg-slate-200'   },
  UNKNOWN:                  { label: 'Unknown',              bg: 'bg-slate-50',    text: 'text-slate-400',   dot: 'bg-slate-200'   },
}

const WORK_MODE_ICON: Record<string, React.ReactNode> = {
  REMOTE: <Wifi size={11} />,
  HYBRID: <Users size={11} />,
  ONSITE: <Monitor size={11} />,
}

const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function fmtDate(iso: string | null) {
  if (!iso) return null
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
}

function fitColor(score: number) {
  if (score >= 80) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-500'
}

const PER_PAGE = 8

interface SyncEmail { subject: string; company: string; detectedStatus: string; matched: boolean; updated: boolean }
interface SyncData  { matched: number; updated: number; emails: SyncEmail[] }

export default function ApplicationsPage() {
  const toast = useToast()
  const qc    = useQueryClient()
  const [page, setPage]             = useState(1)
  const [filter, setFilter]         = useState<'ALL' | 'APPLIED' | 'INTERVIEW' | 'REJECTED'>('ALL')
  const [syncResult, setSyncResult] = useState<SyncData | null>(null)

  const { data, isLoading } = useQuery<{ applications: Application[] }>({
    queryKey: ['applications'],
    queryFn:  () => api.get('/applications').then(r => r.data.data),
  })

  const syncGmail = useMutation({
    mutationFn: () => api.post('/gmail/sync').then(r => r.data.data),
    onSuccess: (result) => {
      setSyncResult(result)
      qc.invalidateQueries({ queryKey: ['applications'] })
      toast.success(
        result.updated > 0
          ? `Synced — ${result.updated} application${result.updated > 1 ? 's' : ''} updated`
          : 'Synced — no new status changes'
      )
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ?? 'Sync failed'
      toast.error(msg)
    },
  })

  const INTERVIEW_STATUSES: AppStatus[] = [
    'SCREENING','ASSESSMENT','ASSESSMENT_SUBMITTED',
    'HIRING_MANAGER_INTERVIEW','TECHNICAL_INTERVIEW','SYSTEM_DESIGN_INTERVIEW','CODING_INTERVIEW',
    'SECOND_ROUND','THIRD_ROUND','FINAL_ROUND',
  ]

  const apps = data?.applications ?? []

  const counts = {
    all:       apps.length,
    applied:   apps.filter(a => a.status === 'APPLIED').length,
    interview: apps.filter(a => INTERVIEW_STATUSES.includes(a.status)).length,
    rejected:  apps.filter(a => a.status === 'REJECTED').length,
    offers:    apps.filter(a => a.status === 'OFFER').length,
  }

  const filtered = apps.filter(a => {
    if (filter === 'APPLIED')   return a.status === 'APPLIED'
    if (filter === 'INTERVIEW') return INTERVIEW_STATUSES.includes(a.status)
    if (filter === 'REJECTED')  return a.status === 'REJECTED'
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(page, totalPages)
  const visible    = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  return (
    <div className="p-6 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Applications</h1>
          <p className="text-slate-500 text-sm mt-0.5">Track every application our team submits on your behalf.</p>
        </div>
        <button
          onClick={() => syncGmail.mutate()}
          disabled={syncGmail.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-200 bg-white text-slate-700 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={syncGmail.isPending ? 'animate-spin' : ''} />
          {syncGmail.isPending ? 'Syncing…' : 'Sync Gmail'}
        </button>
      </div>

      {/* Stats strip */}
      {apps.length > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total',      value: counts.all,       color: 'bg-slate-900 text-white' },
            { label: 'Applied',    value: counts.applied,   color: 'bg-violet-50 text-violet-800 border border-violet-100' },
            { label: 'Interviews', value: counts.interview, color: 'bg-amber-50 text-amber-800 border border-amber-100' },
            { label: 'Offers',     value: counts.offers,    color: 'bg-emerald-50 text-emerald-800 border border-emerald-100' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
              <span className="text-2xl font-display font-extrabold">{s.value}</span>
              <span className="text-sm font-medium opacity-70">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sync result banner */}
      {syncResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
            <span className="text-sm text-emerald-800 font-medium">
              {syncResult.emails.length} email{syncResult.emails.length !== 1 ? 's' : ''} scanned · {syncResult.updated} application{syncResult.updated !== 1 ? 's' : ''} updated
            </span>
          </div>
          <button onClick={() => setSyncResult(null)} className="text-slate-400 hover:text-slate-600 ml-4">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filter tabs */}
      {apps.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {([
            { key: 'ALL',       label: 'All',        count: counts.all       },
            { key: 'APPLIED',   label: 'Applied',    count: counts.applied   },
            { key: 'INTERVIEW', label: 'Interview',  count: counts.interview },
            { key: 'REJECTED',  label: 'Rejected',   count: counts.rejected  },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); setPage(1) }}
              className={`inline-flex items-center gap-2 text-xs font-semibold rounded-lg px-3 py-1.5 border transition-colors ${
                filter === f.key
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filter === f.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 h-24 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 border-2 border-dashed border-slate-200 rounded-2xl">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase size={24} className="text-slate-400" />
          </div>
          {apps.length === 0 ? (
            <>
              <p className="text-slate-700 font-semibold text-base">No applications yet</p>
              <p className="text-slate-400 text-sm mt-1">Your applications will appear here once our team starts applying.</p>
            </>
          ) : (
            <>
              <p className="text-slate-700 font-semibold text-base">No results</p>
              <p className="text-slate-400 text-sm mt-1">No applications match this filter.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {visible.map(app => {
              const s   = STATUS[app.status]
              const ac  = avatarColor(app.companyName)
              const date = app.appliedAt ? fmtDate(app.appliedAt) : fmtDate(app.createdAt)
              const inactive = ['REJECTED', 'WITHDRAWN'].includes(app.status)

              return (
                <div
                  key={app.id}
                  className={`bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 hover:border-brand-200 hover:shadow-sm transition-all ${inactive ? 'opacity-55' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-display font-bold shrink-0 ${ac}`}>
                    {app.companyName.charAt(0).toUpperCase()}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{app.companyName}</p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{app.jobTitle}</p>
                      </div>
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 ${s.bg} ${s.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {app.location && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin size={11} />
                          {app.location}
                        </span>
                      )}
                      {app.workMode && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          {WORK_MODE_ICON[app.workMode]}
                          {app.workMode.charAt(0) + app.workMode.slice(1).toLowerCase()}
                        </span>
                      )}
                      {app.salaryRange && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                          <Banknote size={11} />
                          {app.salaryRange}
                        </span>
                      )}
                      {app.roleFitScore != null && (
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${fitColor(app.roleFitScore)}`}>
                          {app.roleFitScore}% fit
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right — date + company icon placeholder */}
                  <div className="shrink-0 text-right hidden sm:block">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-1">
                      <Building2 size={14} className="text-slate-300" />
                    </div>
                    {date && <p className="text-[10px] text-slate-400">{date}</p>}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-slate-400">
                Showing {(safePage - 1) * PER_PAGE + 1}–{Math.min(safePage * PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={15} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                      n === safePage
                        ? 'bg-slate-900 text-white border border-slate-900'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
