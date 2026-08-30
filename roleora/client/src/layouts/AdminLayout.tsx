import { Outlet, NavLink } from 'react-router-dom'
import { Users, BarChart2, Settings, Shield } from 'lucide-react'
import { cn }         from '@/utils/cn'
import { ROUTES }     from '@/config/routes'

const adminNav = [
  { label: 'Users',     href: ROUTES.ADMIN_USERS,     icon: Users     },
  { label: 'Analytics', href: ROUTES.ADMIN_ANALYTICS, icon: BarChart2 },
  { label: 'Settings',  href: ROUTES.ADMIN_SETTINGS,  icon: Settings  },
]

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col">
      {/* Admin top bar */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center gap-3">
        <Shield size={14} className="text-brand-400" />
        <span className="text-xs font-semibold tracking-wide text-slate-300">ADMIN CONSOLE</span>
        <div className="flex items-center gap-4 ml-6">
          {adminNav.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 text-xs font-medium transition-colors py-0.5',
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200',
              )}
            >
              <Icon size={13} />
              {label}
            </NavLink>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
