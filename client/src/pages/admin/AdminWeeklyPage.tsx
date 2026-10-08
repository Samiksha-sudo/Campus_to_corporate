import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, RefreshCw } from 'lucide-react'
import api from '@/services/api'

interface Customer {
  id: string; name: string; email: string; plan: string
  weeklyLimit: number; thisWeek: number; perWeek: number[]
}
interface WeeklyData { weeks: string[]; resetsAt: string; customers: Customer[] }

const PLAN_STYLE: Record<string, string> = {
  STARTER:  'bg-slate-100 text-slate-600',
  EXPLORE:  'bg-slate-200 text-slate-700',
  LAUNCH:   'bg-blue-100 text-blue-700',
  MOMENTUM: 'bg-violet-100 text-violet-700',
}

function UsageSlider({ c }: { c: Customer }) {
  const qc = useQueryClient()
  const max = c.weeklyLimit >= 9999 ? 200 : c.weeklyLimit
  const [val, setVal] = useState(c.thisWeek)
  useEffect(() => setVal(c.thisWeek), [c.thisWeek])

  const save = useMutation({
    mutationFn: async (count: number) => (await api.patch(`/admin/users/${c.id}/weekly`, { count })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
    onError: () => setVal(c.thisWeek),
  })

  if (max === 0) return <p className="text-xs text-slate-400">No applications on this plan</p>
  const pct = Math.min(100, Math.round((val / max) * 100))
  return (
    <div className="w-48">
      <div className="flex items-baseline justify-between mb-1">
        <p className="font-semibold text-slate-800">{val} <span className="text-slate-400 font-normal">/ {c.weeklyLimit >= 9999 ? '∞' : c.weeklyLimit}</span></p>
        {save.isPending && <span className="text-[10px] text-slate-400">saving…</span>}
        {save.isError && <span className="text-[10px] text-red-500">failed</span>}
      </div>
      <input
        type="range" min={0} max={max} step={1} value={Math.min(val, max)}
        onChange={e => setVal(Number(e.target.value))}
        onMouseUp={() => val !== c.thisWeek && save.mutate(val)}
        onTouchEnd={() => val !== c.thisWeek && save.mutate(val)}
        onKeyUp={() => val !== c.thisWeek && save.mutate(val)}
        aria-label={`Applications completed this week for ${c.name}`}
        className="w-full accent-emerald-600 cursor-pointer"
        style={{ background: `linear-gradient(to right,#10b981 ${pct}%,#e2e8f0 ${pct}%)`, height: 6, borderRadius: 9999, appearance: 'none' }}
      />
    </div>
  )
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })

export default function AdminWeeklyPage() {
  const [weeks, setWeeks] = useState(8)
  const [hideIdle, setHideIdle] = useState(false)

  const { data, isLoading, refetch, isFetching } = useQuery<WeeklyData>({
    queryKey: ['admin', 'weekly', weeks],
    queryFn: async () => (await api.get(`/admin/weekly?weeks=${weeks}`)).data.data,
    refetchInterval: 60_000,
  })

  const customers = (data?.customers ?? []).filter(c => !hideIdle || c.perWeek.some(n => n > 0))
  const max = Math.max(1, ...customers.flatMap(c => c.perWeek))
  const totalThisWeek = customers.reduce((s, c) => s + c.thisWeek, 0)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">Weekly Applications</h1>
          <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
            <CalendarClock size={14} />
            Resets every Sunday midnight (UK){data && <> — next reset {new Date(data.resetsAt).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })}</>}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <label className="flex items-center gap-1.5 text-slate-600">
            <input type="checkbox" checked={hideIdle} onChange={e => setHideIdle(e.target.checked)} /> Hide idle
          </label>
          <select value={weeks} onChange={e => setWeeks(Number(e.target.value))} className="border border-slate-200 rounded-lg px-2 py-1 bg-white">
            {[4, 8, 12, 26].map(n => <option key={n} value={n}>{n} weeks</option>)}
          </select>
          <button onClick={() => refetch()} className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50" aria-label="Refresh">
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">This week</p>
          <p className="text-2xl font-bold text-slate-900">{totalThisWeek}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Active customers</p>
          <p className="text-2xl font-bold text-slate-900">{customers.filter(c => c.thisWeek > 0).length}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">This week (drag to set)</th>
              <th className="px-4 py-3">History (oldest → newest)</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Loading…</td></tr>}
            {customers.map(c => {
              return (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${PLAN_STYLE[c.plan] ?? PLAN_STYLE.STARTER}`}>{c.plan}</span>
                  </td>
                  <td className="px-4 py-3">
                    <UsageSlider c={c} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-end gap-1 h-10">
                      {c.perWeek.map((n, i) => (
                        <div key={i} className="flex-1 min-w-[10px] max-w-[28px] bg-slate-100 rounded-sm flex items-end h-full"
                             title={`Week of ${fmt(data!.weeks[i])}: ${n}`}>
                          <div className={`w-full rounded-sm ${i === c.perWeek.length - 1 ? 'bg-brand-500' : 'bg-slate-400'}`}
                               style={{ height: `${n === 0 ? 0 : Math.max(8, (n / max) * 100)}%` }} />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              )
            })}
            {!isLoading && customers.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No customers</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
