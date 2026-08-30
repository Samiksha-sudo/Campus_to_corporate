import { Link } from 'react-router-dom'
import { Button } from '@/components/ui'
import { ROUTES } from '@/config/routes'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-display font-extrabold text-brand-100 mb-4">404</p>
        <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 mb-8">The page you're looking for doesn't exist.</p>
        <Link to={ROUTES.HOME}>
          <Button variant="primary">Go home</Button>
        </Link>
      </div>
    </div>
  )
}
