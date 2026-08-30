import { Outlet, Link } from 'react-router-dom'
import { ROUTES } from '@/config/routes'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left brand panel — hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-600 flex-col justify-between p-12">
        <Link to={ROUTES.HOME} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">R</span>
          </div>
          <span className="font-display font-bold text-xl text-white">Roleora</span>
        </Link>
        <div>
          <blockquote className="text-white/90 text-xl font-display leading-relaxed mb-6">
            "Your career, managed."
          </blockquote>
          <p className="text-brand-200 text-sm">
            UK career professionals trust Roleora to manage their job search from CV to offer.
          </p>
        </div>
        <p className="text-brand-300 text-xs">Roleora is not a recruitment agency. We do not guarantee interviews or job offers.</p>
      </div>

      {/* Right auth form panel */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to={ROUTES.HOME} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">R</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-900">Roleora</span>
          </Link>
        </div>

        <div className="max-w-md w-full mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
