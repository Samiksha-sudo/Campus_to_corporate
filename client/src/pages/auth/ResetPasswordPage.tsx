import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { useState }      from 'react'
import { Button, Input } from '@/components/ui'
import { ROUTES }        from '@/config/routes'
import { useToast }      from '@/hooks/useToast'
import apiClient         from '@/services/api'

const schema = z.object({
  password:  z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirm:   z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [params]      = useSearchParams()
  const token         = params.get('token') ?? ''
  const navigate      = useNavigate()
  const toast         = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    if (!token) { toast.error('Invalid reset link'); return }
    setLoading(true)
    try {
      await apiClient.post('/auth/reset-password', { token, password: data.password })
      toast.success('Password reset successfully')
      navigate(ROUTES.LOGIN)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Reset failed. Your link may have expired.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-slate-500 mb-4">Invalid or missing reset token.</p>
        <Link to={ROUTES.FORGOT_PASSWORD} className="text-brand-600 font-medium hover:underline">
          Request a new link
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Choose a new password</h1>
      <p className="text-slate-500 mb-8 text-sm">Must be at least 8 characters.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirm?.message}
          {...register('confirm')}
        />
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Reset password
        </Button>
      </form>
    </div>
  )
}
