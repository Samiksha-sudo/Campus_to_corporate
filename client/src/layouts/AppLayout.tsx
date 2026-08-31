import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Briefcase, BarChart2,
  Bell, Settings, ChevronLeft, LogOut, Menu, ShieldCheck,
} from 'lucide-react'
import { cn }           from '@/utils/cn'
import { ROUTES }       from '@/config/routes'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore }   from '@/stores/ui.store'
import { useAuth }      from '@/hooks/useAuth'

const navItems = [
  { label: 'Dashboard',    href: ROUTES.DASHBOARD,    icon: LayoutDashboard },
  { label: 'My CVs',       href: ROUTES.CVS,          icon: FileText        },
  { label: 'Applications', href: ROUTES.APPLICATIONS, icon: Briefcase       },
  { label: 'Analytics',    href: ROUTES.ANALYTICS,    icon: BarChart2       },
]

const adminItems = [
  { label: 'Admin Console', href: ROUTES.ADMIN_USERS, icon: ShieldCheck },
]

export default function AppLayout() {
  const { user }                     = useAuthStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { logout }                   = useAuth()
  const navigate                     = useNavigate()

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '?'

  return (
    <div className="min-h-screen bg-[var(--bg)] flex">
      {/* Sidebar */}
      <aside className={cn(
        'fixed top-0 left-0 h-full z-40 bg-white border-r border-slate-200',
        'transition-all duration-250 ease-out flex flex-col',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}>
        {/* Logo row */}
        <div className="flex items-center justify-between h-16 px-3 border-b border-slate-100 shrink-0">
          {!sidebarCollapsed && (
            <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-9 w-auto shrink-0" />
              <span className="font-display font-bold text-sm text-slate-900 truncate">Campus to Corporate</span>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 ml-auto"
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ label, href, icon: Icon }) => (
            <NavLink
              key={href}
              to={href}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
              )}
              title={sidebarCollapsed ? label : undefined}
            >
              <Icon size={18} className="shrink-0" />
              {!sidebarCollapsed && <span>{label}</span>}
            </NavLink>
          ))}

          {/* Admin section */}
          {user?.role === 'ADMIN' && (
            <>
              {!sidebarCollapsed && (
                <p className="px-2.5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Admin
                </p>
              )}
              {sidebarCollapsed && <div className="my-2 border-t border-slate-100" />}
              {adminItems.map(({ label, href, icon: Icon }) => (
                <NavLink
                  key={href}
                  to={href}
                  className={({ isActive }) => cn(
                    'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!sidebarCollapsed && <span>{label}</span>}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Bottom controls */}
        <div className="px-2 py-3 border-t border-slate-100 space-y-1 shrink-0">
          <NavLink
            to={ROUTES.NOTIFICATIONS}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
            )}
            title={sidebarCollapsed ? 'Notifications' : undefined}
          >
            <Bell size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Notifications</span>}
          </NavLink>
          <NavLink
            to={ROUTES.SETTINGS}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
            )}
            title={sidebarCollapsed ? 'Settings' : undefined}
          >
            <Settings size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Settings</span>}
          </NavLink>

          {/* User row */}
          <div className={cn(
            'flex items-center gap-2 px-2 py-2 mt-1 rounded-lg',
            sidebarCollapsed ? 'justify-center' : '',
          )}>
            <button
              className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0"
              onClick={() => navigate(ROUTES.PROFILE)}
            >
              {initials}
            </button>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-900 truncate">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={logout}
                className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                aria-label="Log out"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <div className={cn(
        'flex-1 flex flex-col min-h-screen transition-all duration-250',
        sidebarCollapsed ? 'ml-16' : 'ml-60',
      )}>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
