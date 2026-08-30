import { useState }          from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Mail, CheckCircle2, XCircle, RefreshCw, Unlink } from 'lucide-react'
import api          from '@/services/api'
import { Button }   from '@/components/ui'
import { useToast } from '@/hooks/useToast'

interface GmailStatus {
  connected:    boolean
  email:        string | null
  lastSyncedAt: string | null
  tokenExpired?: boolean
}

function formatTime(iso: string | null) {
  if (!iso) return 'Never'
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
}

export default function GmailSyncCard() {
  const toast        = useToast()
  const qc           = useQueryClient()
  const [connecting, setConnecting] = useState(false)

  const { data, isLoading } = useQuery<GmailStatus>({
    queryKey: ['gmail-status'],
    queryFn:  () => api.get('/gmail/status').then(r => r.data.data),
    refetchInterval: 30_000,
  })

  const disconnect = useMutation({
    mutationFn: () => api.delete('/gmail/disconnect'),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['gmail-status'] })
      toast.success('Gmail disconnected')
    },
    onError: () => toast.error('Failed to disconnect Gmail'),
  })

  const handleConnect = async () => {
    setConnecting(true)
    try {
      const { data: res } = await api.get('/gmail/connect')
      window.location.href = res.data.url
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Could not start Gmail connection'
      toast.error(msg)
      setConnecting(false)
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

  const status = data ?? { connected: false, email: null, lastSyncedAt: null }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">
            <Mail size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Gmail</p>
            <p className="text-xs text-slate-500">Sync your job-related emails</p>
          </div>
        </div>

        {/* Status badge */}
        {status.connected ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
            <CheckCircle2 size={12} />
            Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
            <XCircle size={12} />
            Not connected
          </span>
        )}
      </div>

      {/* Detail rows */}
      <div className="space-y-2 mb-5 text-sm">
        {status.connected && (
          <>
            <div className="flex justify-between">
              <span className="text-slate-500">Account</span>
              <span className="text-slate-800 font-medium">{status.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last synced</span>
              <span className="text-slate-800 flex items-center gap-1">
                <RefreshCw size={11} className="text-slate-400" />
                {formatTime(status.lastSyncedAt)}
              </span>
            </div>
            {status.tokenExpired && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
                Token expired — reconnect to resume sync.
              </p>
            )}
          </>
        )}

        {!status.connected && (
          <p className="text-slate-500 text-xs leading-relaxed">
            Connect your Gmail so Campus to Corporate can track application replies,
            interview invites, and recruiter emails automatically.
          </p>
        )}
      </div>

      {/* CTA */}
      <div className="flex gap-2">
        {status.connected ? (
          <>
            <Button
              variant="secondary"
              size="sm"
              loading={connecting}
              onClick={handleConnect}
            >
              Reconnect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={disconnect.isPending}
              onClick={() => disconnect.mutate()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Unlink size={13} className="mr-1" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="sm"
            loading={connecting}
            onClick={handleConnect}
            className="flex items-center gap-2"
          >
            <Mail size={14} />
            Connect Gmail
          </Button>
        )}
      </div>
    </div>
  )
}
