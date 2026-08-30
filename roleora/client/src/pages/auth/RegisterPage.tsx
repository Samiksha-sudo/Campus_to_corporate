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
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName:  z.string().min(1, 'Last name is required').max(100),
  email:     z.string().email('Enter a valid email'),
  password:  z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const toast                      = useToast()
  const [loading, setLoading]      = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await registerUser(data)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message ?? 'Registration failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">Create your account</h1>
      <p className="text-slate-500 mb-8 text-sm">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="text-brand-600 font-medium hover:underline">Log in</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            autoComplete="given-name"
            placeholder="Jane"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last name"
            autoComplete="family-name"
            placeholder="Smith"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

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
          autoComplete="new-password"
          placeholder="At least 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Create account
        </Button>

        <p className="text-xs text-slate-500 text-center">
          By signing up you agree to our{' '}
          <a href="#" className="underline">Terms of Service</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      </form>
    </div>
  )
}
