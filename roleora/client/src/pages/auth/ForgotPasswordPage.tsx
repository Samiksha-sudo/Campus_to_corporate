import { Link }          from 'react-router-dom'
import { useForm }       from 'react-hook-form'
import { zodResolver }   from '@hookform/resolvers/zod'
import { z }             from 'zod'
import { useState }      from 'react'
import { Button, Input } from '@/components/ui'
import { ROUTES }        from '@/config/routes'
import { useToast }      from '@/hooks/useToast'
import apiClient         from '@/services/api'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await apiClient.post('/auth/forgot-password', data)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-brand-600 text-2xl">✓</span>
        </div>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Check your inbox</h1>
        <p className="text-slate-500 text-sm mb-6">
          If that email is registered, we've sent a password reset link. It expires in 1 hour.
        </p>
        <Link to={ROUTES.LOGIN} className="text-brand-600 font-medium text-sm hover:underline">
          Back to log in
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Reset your password</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Send reset link
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link to={ROUTES.LOGIN} className="text-sm text-slate-500 hover:text-slate-700">
          Back to log in
        </Link>
      </div>
    </div>
  )
}
