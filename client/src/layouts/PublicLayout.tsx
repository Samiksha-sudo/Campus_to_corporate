import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'
import { useAuthStore } from '@/stores/auth.store'

const navLinks = [
  { label: 'How It Works', href: ROUTES.HOW_IT_WORKS },
  { label: 'Services',     href: ROUTES.SERVICES      },
  { label: 'Pricing',      href: ROUTES.PRICING       },
  { label: 'About',        href: ROUTES.ABOUT         },
]

export default function PublicLayout() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-200',
        scrolled
          ? 'bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs'
          : 'bg-transparent',
      )}>
        <nav className="container-xl flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={ROUTES.HOME} className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="h-10 w-auto" />
            <span className="font-display font-bold text-lg text-slate-900 hidden sm:block">Campus to Corporate</span>
          </Link>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-8">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  to={href}
                  className={cn(
                    'text-sm font-medium transition-colors',
                    location.pathname === href
                      ? 'text-brand-600'
                      : 'text-slate-600 hover:text-slate-900',
                  )}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated() ? (
              <Button variant="primary" size="sm" onClick={() => window.location.href = ROUTES.DASHBOARD}>
                Dashboard
              </Button>
            ) : (
              <>
                <Link to={ROUTES.LOGIN}>
                  <Button variant="ghost" size="sm">Log in</Button>
                </Link>
                <Link to={ROUTES.REGISTER}>
                  <Button variant="primary" size="sm">Get Started Free</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-slate-600 hover:text-slate-900"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="md:hidden bg-white border-b border-slate-200 px-4 pb-4"
            >
              <ul className="space-y-1 pt-2">
                {navLinks.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      to={href}
                      className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-100">
                <Link to={ROUTES.LOGIN}><Button variant="secondary" className="w-full">Log in</Button></Link>
                <Link to={ROUTES.REGISTER}><Button variant="primary" className="w-full">Get Started Free</Button></Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Page content */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="container-xl">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to={ROUTES.HOME} className="flex items-center gap-2.5 mb-4">
                <img src="/logo.png" alt="Campus to Corporate" className="h-10 w-auto rounded-xl" />
                <span className="font-display font-bold text-white">Campus to Corporate</span>
              </Link>
              <p className="text-sm leading-relaxed">Your career, managed.</p>
            </div>
            {[
              { heading: 'Platform',  links: ['How It Works', 'Pricing', 'Services'] },
              { heading: 'Resources', links: ['Blog', 'Career Guides', 'FAQ'] },
              { heading: 'Company',   links: ['About', 'Contact'] },
              { heading: 'Legal',     links: ['Privacy Policy', 'Terms of Service', 'Cookie Policy'] },
            ].map(({ heading, links }) => (
              <div key={heading}>
                <h3 className="text-sm font-semibold text-white mb-4">{heading}</h3>
                <ul className="space-y-2">
                  {links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm hover:text-white transition-colors">{l}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © {new Date().getFullYear()} Campus to Corporate Ltd. Campus to Corporate is not a recruitment agency. We do not guarantee interviews or offers.
            </p>
            <p className="text-xs text-slate-600">UK-focused career platform</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
