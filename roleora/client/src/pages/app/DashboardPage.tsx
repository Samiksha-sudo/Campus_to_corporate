import { useAuthStore } from '@/stores/auth.store'

export default function DashboardPage() {
  const { user } = useAuthStore()
  return (
    <div>
      <h1 className="text-2xl font-display font-bold text-slate-900 mb-1">
        Welcome back, {user?.firstName ?? 'there'}
      </h1>
      <p className="text-slate-500">Your career dashboard — coming in Stage 8.</p>
    </div>
  )
}
