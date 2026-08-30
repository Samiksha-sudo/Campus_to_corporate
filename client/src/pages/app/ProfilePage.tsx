import { useState, useEffect } from 'react'
import { useForm }             from 'react-hook-form'
import { zodResolver }         from '@hookform/resolvers/zod'
import { z }                   from 'zod'
import { useMutation }         from '@tanstack/react-query'
import { Save, User }          from 'lucide-react'
import { useAuthStore }        from '@/stores/auth.store'
import { Input }               from '@/components/ui'
import api                     from '@/services/api'
import { useToast }            from '@/hooks/useToast'

const schema = z.object({
  firstName:         z.string().min(1, 'Required'),
  lastName:          z.string().min(1, 'Required'),
  phone:             z.string().optional(),
  location:          z.string().optional(),
  jobTitle:          z.string().optional(),
  linkedinUrl:       z.string().url('Must be a valid URL').optional().or(z.literal('')),
  yearsExperience:   z.coerce.number().min(0).max(50).optional(),
  targetSalaryMin:   z.coerce.number().min(0).optional(),
  targetSalaryMax:   z.coerce.number().min(0).optional(),
  bio:               z.string().max(500).optional(),
})

type FormData = z.infer<typeof schema>

export default function ProfilePage() {
  const { user, setAuth } = useAuthStore()
  const toast             = useToast()
  const [saved, setSaved] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName:       user?.firstName ?? '',
      lastName:        user?.lastName  ?? '',
      phone:           user?.phone     ?? '',
      location:        user?.location  ?? '',
      jobTitle:        user?.jobTitle  ?? '',
      linkedinUrl:     user?.linkedinUrl ?? '',
      yearsExperience: user?.yearsExperience ?? undefined,
      targetSalaryMin: user?.targetSalaryMin ?? undefined,
      targetSalaryMax: user?.targetSalaryMax ?? undefined,
      bio:             user?.bio ?? '',
    },
  })

  useEffect(() => {
    if (user) reset({
      firstName:       user.firstName ?? '',
      lastName:        user.lastName  ?? '',
      phone:           user.phone     ?? '',
      location:        user.location  ?? '',
      jobTitle:        user.jobTitle  ?? '',
      linkedinUrl:     user.linkedinUrl ?? '',
      yearsExperience: user.yearsExperience ?? undefined,
      targetSalaryMin: user.targetSalaryMin ?? undefined,
      targetSalaryMax: user.targetSalaryMax ?? undefined,
      bio:             user.bio ?? '',
    })
  }, [user, reset])

  const save = useMutation({
    mutationFn: (data: FormData) => api.patch('/auth/profile', data).then(r => r.data.data),
    onSuccess: (updated) => {
      if (user) setAuth({ ...user, ...updated }, useAuthStore.getState().accessToken!)
      toast.success('Profile updated')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    },
    onError: () => toast.error('Failed to save profile'),
  })

  const initials = user ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : '?'

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900">My Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Keep your profile up to date so we can tailor applications for you.</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-white rounded-xl border border-slate-200">
        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl">
          {initials}
        </div>
        <div>
          <p className="font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
          <p className="text-sm text-slate-500">{user?.email}</p>
          {!user?.emailVerified && (
            <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
              Email not verified — check your inbox
            </p>
          )}
        </div>
        <div className="ml-auto">
          <User size={20} className="text-slate-300" />
        </div>
      </div>

      <form onSubmit={handleSubmit(data => save.mutate(data))} className="space-y-6">

        {/* Basic info */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Basic information</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="First name" error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name"  error={errors.lastName?.message}  {...register('lastName')} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input label="Phone"    placeholder="+44 7700 900000" {...register('phone')} />
            <Input label="Location" placeholder="London, UK"      {...register('location')} />
          </div>
        </div>

        {/* Career info */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Career details</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current / target job title" placeholder="Software Engineer" {...register('jobTitle')} />
            <Input label="Years of experience" type="number" min="0" max="50" {...register('yearsExperience')} />
          </div>
          <div className="mt-4">
            <Input
              label="LinkedIn URL"
              placeholder="https://linkedin.com/in/yourprofile"
              error={errors.linkedinUrl?.message}
              {...register('linkedinUrl')}
            />
          </div>
        </div>

        {/* Salary */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Target salary (£/year)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Minimum" type="number" placeholder="40000" {...register('targetSalaryMin')} />
            <Input label="Maximum" type="number" placeholder="60000" {...register('targetSalaryMax')} />
          </div>
        </div>

        {/* Bio */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Short bio</p>
          <textarea
            rows={4}
            placeholder="Tell us a bit about yourself and what you're looking for…"
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            {...register('bio')}
          />
          <p className="text-xs text-slate-400 mt-1">Max 500 characters — used to personalise cover letters.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && <p className="text-sm text-emerald-600 font-medium">Saved ✓</p>}
          <button
            type="submit"
            disabled={!isDirty || save.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-brand-600 text-white rounded-xl hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Save size={14} />
            {save.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
