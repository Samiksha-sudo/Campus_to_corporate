import { Link }           from 'react-router-dom'
import { useForm }        from 'react-hook-form'
import { zodResolver }    from '@hookform/resolvers/zod'
import { z }              from 'zod'
import { useState }       from 'react'
import { Button, Input }  from '@/components/ui'
import { ROUTES }         from '@/config/routes'
import { useAuth }        from '@/hooks/useAuth'
import { useToast }       from '@/hooks/useToast'

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const { login }  = useAuth()
  const toast      = useToast()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await login(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Welcome back</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Don't have an account?{' '}
        <Link to={ROUTES.REGISTER} className="text-brand-600 font-medium hover:underline">Sign up free</Link>
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
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="flex justify-end">
          <Link to={ROUTES.FORGOT_PASSWORD} className="text-sm text-brand-600 hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Log in
        </Button>
      </form>
    </div>
  )
}
