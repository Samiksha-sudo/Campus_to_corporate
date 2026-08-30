import { useState }             from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, Plus, Send, Star, MoreVertical,
  Clock, CheckCircle2, AlertCircle, Archive, X, ChevronDown,
} from 'lucide-react'
import api from '@/services/api'

interface CV {
  id:              string
  title:           string
  status:          'DRAFT' | 'IN_REVIEW' | 'REQUIRES_CHANGES' | 'APPROVED' | 'ARCHIVED'
  targetRole:      string | null
  targetSector:    string | null
  isPrimary:       number
  content:         string | null
  aiFeedback:      string | null
  specialistNotes: string | null
  atsScore:        string | null
  createdAt:       string
  updatedAt:       string
}

const STATUS_LABEL: Record<CV['status'], string> = {
  DRAFT:            'Draft',
  IN_REVIEW:        'In review',
  REQUIRES_CHANGES: 'Changes needed',
  APPROVED:         'Approved',
  ARCHIVED:         'Archived',
}

const STATUS_CLS: Record<CV['status'], string> = {
  DRAFT:            'bg-slate-100 text-slate-600',
  IN_REVIEW:        'bg-blue-50 text-blue-700',
  REQUIRES_CHANGES: 'bg-amber-50 text-amber-700',
  APPROVED:         'bg-emerald-50 text-emerald-700',
  ARCHIVED:         'bg-slate-50 text-slate-400',
}

const STATUS_ICON: Record<CV['status'], React.ElementType> = {
  DRAFT:            FileText,
  IN_REVIEW:        Clock,
  REQUIRES_CHANGES: AlertCircle,
  APPROVED:         CheckCircle2,
  ARCHIVED:         Archive,
}

function StatusBadge({ status }: { status: CV['status'] }) {
  const Icon = STATUS_ICON[status]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2.5 py-1 ${STATUS_CLS[status]}`}>
      <Icon size={11} />
      {STATUS_LABEL[status]}
    </span>
  )
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [title, setTitle]         = useState('')
  const [targetRole, setRole]     = useState('')
  const [targetSector, setSector] = useState('')
  const [content, setContent]     = useState('')

  const create = useMutation({
    mutationFn: (body: object) => api.post('/cvs', body).then(r => r.data.data.cv),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cvs'] }); onClose() },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-900">Create new CV</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">CV title *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Software Engineer — FinTech"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Target role</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="Software Engineer"
                value={targetRole}
                onChange={e => setRole(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Target sector</label>
              <input
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="FinTech, NHS, etc."
                value={targetSector}
                onChange={e => setSector(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">
              CV content <span className="text-slate-400">(paste your CV text)</span>
            </label>
            <textarea
              rows={8}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono text-xs"
              placeholder="Paste your CV content here…"
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>
          {create.error && (
            <p className="text-xs text-red-600">{(create.error as Error & { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Something went wrong'}</p>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="text-sm text-slate-600 hover:text-slate-900">Cancel</button>
          <button
            onClick={() => create.mutate({ title, targetRole: targetRole || undefined, targetSector: targetSector || undefined, content: content || undefined })}
            disabled={!title.trim() || create.isPending}
            className="px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating…' : 'Create CV'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CVCard({ cv }: { cv: CV }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenu] = useState(false)

  const submit = useMutation({
    mutationFn: () => api.post(`/cvs/${cv.id}/submit`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  })
  const archive = useMutation({
    mutationFn: () => api.delete(`/cvs/${cv.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  })
  const setPrimary = useMutation({
    mutationFn: () => api.patch(`/cvs/${cv.id}`, { isPrimary: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cvs'] }),
  })

  if (cv.status === 'ARCHIVED') return null

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <FileText size={16} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 truncate">{cv.title}</p>
            {!!cv.isPrimary && <Star size={12} className="text-amber-400 fill-amber-400 shrink-0" />}
          </div>
          {(cv.targetRole || cv.targetSector) && (
            <p className="text-xs text-slate-400 truncate">
              {[cv.targetRole, cv.targetSector].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>

        {cv.atsScore && (
          <div className="text-center shrink-0">
            <p className="text-lg font-bold text-brand-600">{cv.atsScore}</p>
            <p className="text-[10px] text-slate-400">ATS</p>
          </div>
        )}

        <StatusBadge status={cv.status} />

        <div className="relative" onClick={e => e.stopPropagation()}>
          <button
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            onClick={() => setMenu(m => !m)}
          >
            <MoreVertical size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 bg-white border border-slate-200 rounded-xl shadow-lg py-1 w-44">
              {!cv.isPrimary && (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => { setPrimary.mutate(); setMenu(false) }}
                >
                  <Star size={13} /> Set as primary
                </button>
              )}
              {(cv.status === 'DRAFT' || cv.status === 'REQUIRES_CHANGES') && (
                <button
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => { submit.mutate(); setMenu(false) }}
                >
                  <Send size={13} /> Submit for review
                </button>
              )}
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                onClick={() => { archive.mutate(); setMenu(false) }}
              >
                <Archive size={13} /> Archive
              </button>
            </div>
          )}
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-5 py-4 bg-slate-50 space-y-4 text-sm">
          {cv.specialistNotes && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Specialist notes</p>
              <p className="text-slate-700 whitespace-pre-wrap text-xs">{cv.specialistNotes}</p>
            </div>
          )}
          {cv.aiFeedback && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">AI feedback</p>
              <p className="text-slate-700 whitespace-pre-wrap text-xs">{cv.aiFeedback}</p>
            </div>
          )}
          {cv.content && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Content preview</p>
              <pre className="text-xs text-slate-600 whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto font-mono">
                {cv.content.slice(0, 800)}{cv.content.length > 800 ? '\n…' : ''}
              </pre>
            </div>
          )}
          {!cv.specialistNotes && !cv.aiFeedback && !cv.content && (
            <p className="text-slate-400 text-xs">No additional details yet.</p>
          )}

          {(cv.status === 'DRAFT' || cv.status === 'REQUIRES_CHANGES') && (
            <button
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              <Send size={13} />
              {submit.isPending ? 'Submitting…' : 'Submit for review'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function CVsPage() {
  const [showCreate, setCreate] = useState(false)

  const { data, isLoading } = useQuery<{ cvs: CV[] }>({
    queryKey: ['cvs'],
    queryFn:  () => api.get('/cvs').then(r => r.data.data),
  })

  const active   = (data?.cvs ?? []).filter(c => c.status !== 'ARCHIVED')
  const archived = (data?.cvs ?? []).filter(c => c.status === 'ARCHIVED')

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">My CVs</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Create and submit your CV — our specialists review and optimise it for ATS systems.
          </p>
        </div>
        <button
          onClick={() => setCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-xl hover:bg-brand-700"
        >
          <Plus size={15} /> New CV
        </button>
      </div>

      {/* Status guide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {(['DRAFT','IN_REVIEW','REQUIRES_CHANGES','APPROVED'] as CV['status'][]).map(s => (
          <div key={s} className={`text-center text-xs rounded-xl px-3 py-2 ${STATUS_CLS[s]}`}>
            {STATUS_LABEL[s]}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2].map(i => <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse h-16" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl">
          <FileText size={32} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No CVs yet</p>
          <p className="text-slate-400 text-sm mb-4">Upload your CV to get started.</p>
          <button
            onClick={() => setCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-brand-600 text-white rounded-xl hover:bg-brand-700"
          >
            <Plus size={15} /> Create CV
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {active.map(cv => <CVCard key={cv.id} cv={cv} />)}
        </div>
      )}

      {archived.length > 0 && (
        <details className="mt-6">
          <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-600">
            {archived.length} archived CV{archived.length > 1 ? 's' : ''}
          </summary>
          <div className="space-y-2 mt-2 opacity-60">
            {archived.map(cv => (
              <div key={cv.id} className="bg-white rounded-xl border border-slate-200 px-5 py-3 flex items-center gap-3">
                <Archive size={14} className="text-slate-400" />
                <span className="text-sm text-slate-500">{cv.title}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {showCreate && <CreateModal onClose={() => setCreate(false)} />}
    </div>
  )
}
