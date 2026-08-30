import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Loader2 }   from 'lucide-react'
import { Button }    from '@/components/ui'
import { ROUTES }    from '@/config/routes'
import apiClient     from '@/services/api'

export default function VerifyEmailPage() {
  const [params]  = useSearchParams()
  const token     = params.get('token') ?? ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); setMessage('No verification token provided.'); return }

    apiClient.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? 'Verification failed. The link may have expired.'
        setStatus('error')
        setMessage(msg)
      })
  }, [token])

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="animate-spin text-brand-600 mx-auto mb-4" size={36} />
        <p className="text-slate-600">Verifying your email…</p>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-brand-600 text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Email verified!</h1>
        <p className="text-slate-500 text-sm mb-6">Your account is now active. Welcome to Roleora.</p>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="primary">Go to dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-red-500 text-2xl">✕</span>
      </div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Verification failed</h1>
      <p className="text-slate-500 text-sm mb-6">{message}</p>
      <Link to={ROUTES.LOGIN}>
        <Button variant="secondary">Back to log in</Button>
      </Link>
    </div>
  )
}
