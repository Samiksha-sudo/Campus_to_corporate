import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Sparkles, CalendarCheck, MessageSquare, ClipboardList, UserCheck, CheckCircle2 } from 'lucide-react'
import { ROUTES }   from '@/config/routes'
import { useToast } from '@/hooks/useToast'
import api          from '@/services/api'

interface Allowance {
  limit: number; used: number; remaining: number; resetsAt: string
  outcomes: Record<'ATTEMPTED' | 'SUBMITTED' | 'FAILED' | 'DUPLICATE' | 'BLOCKED', number>
}
interface Profile {
  cvId: string | null; preferredRoles: string | null; locations: string | null
  salaryMin: number | null; salaryMax: number | null; workAuthorisation: string | null
  workModes: string | null; linkedinUrl: string | null; industries: string | null
  applicationNotes: string | null
}
interface Msg { id: string; direction: string; channel: string; status: string; subject?: string | null; followUpDueAt: string | null }
interface Action { id: string; description: string }
interface Invite { id: string; company: string; role: string; round: string; interviewType: string; scheduledAt: string | null }
interface Concierge {
  eligible: boolean; plan: string
  subscriptionStatus?: string; onboardingComplete?: boolean
  consents?: { apply: boolean; outreach: boolean }
  profile?: Profile | null
  allowance?: Allowance
  inProgress?: number
  recruiterMessages?: Msg[]
  followUpsDue?: number
  interviewInvitations?: Invite[]
  pendingActions?: Action[]
  specialist?: { name: string } | null
}

const fmtDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : 'To be confirmed'

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400'

function Onboarding({ data }: { data: Concierge }) {
  const toast = useToast()
  const qc    = useQueryClient()
  const p     = data.profile
  const { data: cvs } = useQuery<{ id: string; title: string }[]>({
    queryKey: ['cvs'], queryFn: () => api.get('/cvs').then(r => r.data.data),
  })

  const [f, setF] = useState({
    cvId: p?.cvId ?? '', preferredRoles: p?.preferredRoles ?? '', locations: p?.locations ?? '',
    salaryMin: p?.salaryMin?.toString() ?? '', salaryMax: p?.salaryMax?.toString() ?? '',
    workAuthorisation: p?.workAuthorisation ?? '', linkedinUrl: p?.linkedinUrl ?? '',
    industries: p?.industries ?? '', applicationNotes: p?.applicationNotes ?? '',
    workModes: (p?.workModes ? p.workModes.split(',') : []) as string[],
    consentApply: !!data.consents?.apply, consentOutreach: !!data.consents?.outreach,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF(s => ({ ...s, [k]: v }))

  const save = useMutation({
    mutationFn: () => api.put('/concierge/profile', {
      cvId: f.cvId || null,
      preferredRoles: f.preferredRoles, locations: f.locations,
      salaryMin: f.salaryMin ? Number(f.salaryMin) : null,
      salaryMax: f.salaryMax ? Number(f.salaryMax) : null,
      workAuthorisation: f.workAuthorisation, workModes: f.workModes,
      linkedinUrl: f.linkedinUrl, industries: f.industries, applicationNotes: f.applicationNotes,
      consentApply: f.consentApply, consentOutreach: f.consentOutreach,
    }),
    onSuccess: () => { toast.success('Preferences saved'); qc.invalidateQueries({ queryKey: ['concierge'] }) },
    onError:   () => toast.error('Could not save — please check the fields'),
  })

  const toggleMode = (m: string) =>
    set('workModes', f.workModes.includes(m) ? f.workModes.filter(x => x !== m) : [...f.workModes, m])

  return (
    <form
      onSubmit={e => { e.preventDefault(); save.mutate() }}
      className="rounded-2xl border border-amber-300 bg-amber-50/40 p-5 space-y-4"
    >
      <div>
        <h2 className="font-display font-bold text-slate-900">
          {data.onboardingComplete ? 'Your search preferences' : 'Set up your managed search'}
        </h2>
        <p className="text-xs text-slate-600">Our team cannot start until a CV, target roles, locations and work authorisation are set.</p>
      </div>

      <label className="block text-sm font-medium text-slate-700">CV to use
        <select className={inputCls} value={f.cvId} onChange={e => set('cvId', e.target.value)} required>
          <option value="">Select a CV…</option>
          {cvs?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {cvs?.length === 0 && <span className="text-xs text-amber-700">No CV yet — <Link className="underline" to={ROUTES.CVS}>upload one</Link> first.</span>}
      </label>
      <label className="block text-sm font-medium text-slate-700">Target roles
        <textarea className={inputCls} rows={2} value={f.preferredRoles} onChange={e => set('preferredRoles', e.target.value)} required />
      </label>
      <label className="block text-sm font-medium text-slate-700">Locations
        <input className={inputCls} value={f.locations} onChange={e => set('locations', e.target.value)} required />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm font-medium text-slate-700">Minimum salary (£)
          <input type="number" min={0} className={inputCls} value={f.salaryMin} onChange={e => set('salaryMin', e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">Maximum salary (£)
          <input type="number" min={0} className={inputCls} value={f.salaryMax} onChange={e => set('salaryMax', e.target.value)} />
        </label>
      </div>
      <label className="block text-sm font-medium text-slate-700">Work authorisation
        <input className={inputCls} placeholder="e.g. UK citizen, Skilled Worker visa" value={f.workAuthorisation} onChange={e => set('workAuthorisation', e.target.value)} required />
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-slate-700 mb-1">Work modes</legend>
        <div className="flex gap-4">
          {['REMOTE', 'HYBRID', 'ONSITE'].map(m => (
            <label key={m} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input type="checkbox" checked={f.workModes.includes(m)} onChange={() => toggleMode(m)} />
              {m.charAt(0) + m.slice(1).toLowerCase()}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm font-medium text-slate-700">LinkedIn profile URL
        <input type="url" className={inputCls} value={f.linkedinUrl} onChange={e => set('linkedinUrl', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">Industries
        <input className={inputCls} value={f.industries} onChange={e => set('industries', e.target.value)} />
      </label>
      <label className="block text-sm font-medium text-slate-700">Other preferences or companies to avoid
        <textarea className={inputCls} rows={2} value={f.applicationNotes} onChange={e => set('applicationNotes', e.target.value)} />
      </label>

      <fieldset className="rounded-xl bg-white border border-slate-200 p-4 space-y-3">
        <legend className="px-1 text-sm font-semibold text-slate-800">Permissions</legend>
        <p className="text-xs text-slate-500">We only act on what you tick. You can change these at any time.</p>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={f.consentApply} onChange={e => set('consentApply', e.target.checked)} />
          I authorise Campus to Corporate to prepare and submit job applications on my behalf using my CV and details.
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={f.consentOutreach} onChange={e => set('consentOutreach', e.target.checked)} />
          I authorise contacting recruiters and hiring managers on my behalf. Messages are drafted and approved before sending.
        </label>
      </fieldset>

      <button
        type="submit" disabled={save.isPending}
        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {save.isPending ? 'Saving…' : 'Save preferences'}
      </button>
    </form>
  )
}

export default function ConciergePage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery<Concierge>({
    queryKey: ['concierge'],
    queryFn:  () => api.get('/concierge/me').then(r => r.data.data),
  })
  const done = useMutation({
    mutationFn: (id: string) => api.post(`/concierge/actions/${id}/done`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['concierge'] }),
  })

  useEffect(() => { document.title = 'Elite Concierge · Campus to Corporate' }, [])

  if (isLoading) return <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />

  if (!data?.eligible) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Sparkles className="mx-auto text-amber-500 mb-3" />
        <h1 className="text-xl font-display font-bold text-slate-900 mb-2">Elite Concierge</h1>
        <p className="text-sm text-slate-600 mb-5">Your next career move, managed for you. Available on the Elite Concierge plan.</p>
        <Link to={`${ROUTES.SETTINGS}?upgrade=ELITE`} className="inline-block rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-amber-300">
          Get Elite Concierge
        </Link>
      </div>
    )
  }

  const a = data.allowance!
  const messages = data.recruiterMessages ?? []
  const invites  = data.interviewInvitations ?? []
  const actions  = data.pendingActions ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
          <Sparkles size={20} className="text-amber-500" /> Elite Concierge
        </h1>
        <p className="text-sm text-slate-500">Subscription: {data.subscriptionStatus?.toLowerCase()} · Specialist: {data.specialist?.name ?? 'being assigned'}</p>
      </div>

      {(!data.onboardingComplete || !data.consents?.apply) && (
        <div role="alert" className="rounded-xl bg-amber-100 border border-amber-300 px-4 py-3 text-sm text-amber-900">
          Complete the setup below{!data.consents?.apply ? ' and authorise applications' : ''} so we can start your search. No applications are submitted until you do.
        </div>
      )}

      <section aria-label="Weekly allowance" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Weekly allowance" value={a.limit} sub={`per week · resets ${fmtDate(a.resetsAt)}`} />
        <Stat label="Submitted this week" value={a.used} sub="verified only" />
        <Stat label="Remaining this week" value={a.remaining} />
        <Stat label="In progress" value={data.inProgress ?? 0} />
      </section>
      <p className="text-xs text-slate-400 -mt-3">
        The allowance is a weekly maximum, not a promise of volume. Failed ({a.outcomes.FAILED}), duplicate ({a.outcomes.DUPLICATE}) and blocked ({a.outcomes.BLOCKED}) attempts are not counted.
      </p>

      <div className="grid lg:grid-cols-2 gap-5">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-3"><CalendarCheck size={16} /> Interview invitations</h2>
          {invites.length === 0 ? <p className="text-sm text-slate-500">No interviews scheduled yet.</p> : (
            <ul className="space-y-2">{invites.map(i => (
              <li key={i.id} className="text-sm"><span className="font-medium">{i.company}</span> — {i.role}
                <span className="block text-xs text-slate-500">{i.round} · {i.interviewType} · {fmtDate(i.scheduledAt)}</span></li>
            ))}</ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-3"><ClipboardList size={16} /> Needs your attention</h2>
          {actions.length === 0 ? <p className="text-sm text-slate-500">Nothing is waiting on you.</p> : (
            <ul className="space-y-2">{actions.map(x => (
              <li key={x.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="font-medium">{x.description}</span>
                <button onClick={() => done.mutate(x.id)} className="shrink-0 text-xs font-semibold text-emerald-700 hover:underline">
                  <CheckCircle2 size={14} className="inline mr-1" />Done
                </button>
              </li>
            ))}</ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900 mb-1"><MessageSquare size={16} /> Recruiter messages</h2>
          <p className="text-xs text-slate-500 mb-3">{messages.length} message{messages.length === 1 ? '' : 's'} · {data.followUpsDue ?? 0} follow-up{data.followUpsDue === 1 ? '' : 's'} due soon</p>
          {messages.length === 0 ? <p className="text-sm text-slate-500">No recruiter outreach yet.</p> : (
            <ul className="divide-y divide-slate-100">{messages.slice(0, 10).map(m => (
              <li key={m.id} className="py-2 flex items-center justify-between text-sm">
                <span>{m.subject ?? `${m.direction.toLowerCase()} ${m.channel.toLowerCase()} message`}</span>
                <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{m.status.toLowerCase()}</span>
              </li>
            ))}</ul>
          )}
        </section>
      </div>

      <Onboarding data={data} />

      <p className="text-xs text-slate-400 flex items-center gap-1"><UserCheck size={12} /> We never guarantee interviews or offers; we manage the work of your search.</p>
    </div>
  )
}
