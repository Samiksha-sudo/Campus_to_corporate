import { useQuery }     from '@tanstack/react-query'
import { Link }         from 'react-router-dom'
import {
  FileText, Briefcase, CheckCircle2, ArrowRight,
  TrendingUp, Clock, AlertCircle, Star,
} from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { ROUTES }       from '@/config/routes'
import api              from '@/services/api'

interface CV          { id: string; title: string; status: string; isPrimary: number }
interface Application { id: string; companyName: string; jobTitle: string; status: string; userApproved: number }
interface SubData     { plan: string; status: string; weeklyApplicationsUsed: number; trialEnd: string | null }

const PLAN_LABEL: Record<string, string> = {
  STARTER:  'Starter (Free)',
  EXPLORE:  'Explore · £10/mo',
  LAUNCH:   'Launch · £20/mo',
  MOMENTUM: 'Momentum · £40/mo',
}

const PLAN_COLOR: Record<string, string> = {
  STARTER:  'bg-slate-100 text-slate-600',
  EXPLORE:  'bg-slate-100 text-slate-700',
  LAUNCH:   'bg-blue-50 text-blue-700',
  MOMENTUM: 'bg-violet-50 text-violet-700',
}

const WEEKLY_LIMIT: Record<string, number> = {
  STARTER: 0, EXPLORE: 0, LAUNCH: 50, MOMENTUM: 200,
}

function StatCard({ icon: Icon, label, value, sub, href, color = 'bg-brand-50 text-brand-600' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; href?: string; color?: string
}) {
  const card = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center gap-4 group hover:border-brand-200 hover:shadow-sm transition-all">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}{sub ? ` · ${sub}` : ''}</p>
      </div>
      {href && <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-400 transition-colors shrink-0" />}
    </div>
  )
  return href ? <Link to={href}>{card}</Link> : card
}

function PlanBanner({ plan, status, weeklyUsed, trialEnd }: SubData & { weeklyUsed: number }) {
  const limit = WEEKLY_LIMIT[plan] ?? 0
  const pct   = limit > 0 ? Math.min(100, Math.round((weeklyUsed / limit) * 100)) : 0

  if (plan === 'EXPLORE') {
    return (
      <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold opacity-80 mb-1">You're on the free plan</p>
            <h2 className="text-xl font-display font-bold mb-2">Upgrade to start getting interviews</h2>
            <p className="text-sm opacity-80">Launch gives you 50 job applications per week + 1 guaranteed interview per month.</p>
          </div>
          <Link
            to={ROUTES.SETTINGS}
            className="shrink-0 bg-white text-brand-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-brand-50 transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${PLAN_COLOR[plan]}`}>
            {PLAN_LABEL[plan] ?? plan}
          </span>
          {status === 'TRIALING' && (
            <span className="ml-2 text-xs text-amber-600 font-medium">
              Trial{trialEnd ? ` ends ${new Date(trialEnd).toLocaleDateString('en-GB')}` : ''}
            </span>
          )}
        </div>
        <Link to={ROUTES.SETTINGS} className="text-xs text-brand-600 hover:underline">Manage plan</Link>
      </div>
      {limit > 0 && (
        <div>
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>Applications this week</span>
            <span className="font-medium">{weeklyUsed} / {limit}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${pct > 80 ? 'bg-amber-500' : 'bg-brand-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()

  const { data: cvsData }  = useQuery<{ cvs: CV[] }>({
    queryKey: ['cvs'],
    queryFn:  () => api.get('/cvs').then(r => r.data.data),
  })
  const { data: appsData } = useQuery<{ applications: Application[] }>({
    queryKey: ['applications'],
    queryFn:  () => api.get('/applications').then(r => r.data.data),
  })
  const { data: stripeData } = useQuery<{ plan: string; status: string; weeklyApplicationsUsed: number; trialEnd: string | null }>({
    queryKey: ['subscription'],
    queryFn:  () => api.get('/stripe/subscription').then(r => r.data.data).catch(() => ({
      plan: 'EXPLORE', status: 'ACTIVE', weeklyApplicationsUsed: 0, trialEnd: null,
    })),
  })

  const cvs  = cvsData?.cvs  ?? []
  const apps = appsData?.applications ?? []
  const sub  = stripeData ?? { plan: 'EXPLORE', status: 'ACTIVE', weeklyApplicationsUsed: 0, trialEnd: null }

  const primaryCV       = cvs.find(c => c.isPrimary)
  const approvedCVs     = cvs.filter(c => c.status === 'APPROVED').length
  const activeApps      = apps.filter(a => !['REJECTED','WITHDRAWN'].includes(a.status)).length
  const pendingApproval = apps.filter(a => !a.userApproved && !['REJECTED','WITHDRAWN'].includes(a.status)).length
  const interviews      = apps.filter(a => ['SCREENING','ASSESSMENT','ASSESSMENT_SUBMITTED','HIRING_MANAGER_INTERVIEW','TECHNICAL_INTERVIEW','SYSTEM_DESIGN_INTERVIEW','CODING_INTERVIEW','SECOND_ROUND','THIRD_ROUND','FINAL_ROUND'].includes(a.status)).length

  const hour  = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900">
          {greeting}, {user?.firstName ?? 'there'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Here's where your job search stands today.</p>
      </div>

      {/* Plan banner — hide for admins */}
      {user?.role !== 'ADMIN' && (
        <PlanBanner
          plan={sub.plan}
          status={sub.status}
          weeklyApplicationsUsed={sub.weeklyApplicationsUsed}
          weeklyUsed={sub.weeklyApplicationsUsed}
          trialEnd={sub.trialEnd}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText}   label="CVs"         value={cvs.length}    sub={approvedCVs > 0 ? `${approvedCVs} approved` : undefined} href={ROUTES.CVS}          color="bg-brand-50 text-brand-600"   />
        <StatCard icon={Briefcase}  label="Applications" value={activeApps}   sub="active"                    href={ROUTES.APPLICATIONS} color="bg-violet-50 text-violet-600" />
        <StatCard icon={Star}       label="Interviews"   value={interviews}   sub="in progress"               href={ROUTES.APPLICATIONS} color="bg-amber-50 text-amber-600"   />
        <StatCard icon={TrendingUp} label="Offers"       value={apps.filter(a => a.status === 'OFFER').length} href={ROUTES.APPLICATIONS} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Action items — hide for admins */}
      {user?.role !== 'ADMIN' && (pendingApproval > 0 || !primaryCV || cvs.filter(c => c.status === 'REQUIRES_CHANGES').length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Needs your attention</p>

          {pendingApproval > 0 && (
            <Link to={ROUTES.APPLICATIONS} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 hover:bg-amber-100 transition-colors">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800 flex-1">
                <strong>{pendingApproval} application{pendingApproval > 1 ? 's' : ''}</strong> waiting for your approval
              </p>
              <ArrowRight size={14} className="text-amber-400 shrink-0" />
            </Link>
          )}

          {!primaryCV && cvs.length === 0 && (
            <Link to={ROUTES.CVS} className="flex items-center gap-3 bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 hover:bg-brand-100 transition-colors">
              <FileText size={16} className="text-brand-600 shrink-0" />
              <p className="text-sm text-brand-800 flex-1">Add your CV to get started with applications</p>
              <ArrowRight size={14} className="text-brand-400 shrink-0" />
            </Link>
          )}

          {cvs.filter(c => c.status === 'REQUIRES_CHANGES').length > 0 && (
            <Link to={ROUTES.CVS} className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 hover:bg-red-100 transition-colors">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm text-red-800 flex-1">
                A CV needs your changes — check specialist feedback
              </p>
              <ArrowRight size={14} className="text-red-400 shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* Recent applications */}
      {apps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Recent applications</p>
            <Link to={ROUTES.APPLICATIONS} className="text-xs text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {apps.slice(0, 4).map(app => (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                  {app.companyName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{app.jobTitle}</p>
                  <p className="text-xs text-slate-400 truncate">{app.companyName}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!app.userApproved && (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <Clock size={11} /> Needs approval
                    </span>
                  )}
                  {app.userApproved && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={11} /> Approved
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {apps.length === 0 && cvs.length > 0 && sub.plan !== 'EXPLORE' && (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <Briefcase size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No applications yet</p>
          <p className="text-slate-400 text-sm mb-4">Add jobs and we'll apply on your behalf once you approve them.</p>
          <Link
            to={ROUTES.APPLICATIONS}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-xl hover:bg-brand-700"
          >
            <Briefcase size={15} /> Add first job
          </Link>
        </div>
      )}
    </div>
  )
}
