import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES }        from '@/config/routes'
import { useAuthStore }  from '@/stores/auth.store'
import { ToastContainer } from '@/components/feedback/Toast'

// Layouts
import PublicLayout  from '@/layouts/PublicLayout'
import AuthLayout    from '@/layouts/AuthLayout'
import AppLayout     from '@/layouts/AppLayout'
import AdminLayout   from '@/layouts/AdminLayout'

// Public pages
import HomePage        from '@/pages/public/HomePage'
import HowItWorksPage  from '@/pages/public/HowItWorksPage'
import ServicesPage    from '@/pages/public/ServicesPage'
import PricingPage     from '@/pages/public/PricingPage'
import AboutPage       from '@/pages/public/AboutPage'

// Auth pages
import LoginPage          from '@/pages/auth/LoginPage'
import RegisterPage       from '@/pages/auth/RegisterPage'
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage'
import ResetPasswordPage  from '@/pages/auth/ResetPasswordPage'
import VerifyEmailPage    from '@/pages/auth/VerifyEmailPage'

// App pages
import DashboardPage     from '@/pages/app/DashboardPage'
import EvidencePage      from '@/pages/app/EvidencePage'
import CVsPage           from '@/pages/app/CVsPage'
import ApplicationsPage  from '@/pages/app/ApplicationsPage'
import AnalyticsPage     from '@/pages/app/AnalyticsPage'
import NotificationsPage from '@/pages/app/NotificationsPage'
import SettingsPage      from '@/pages/app/SettingsPage'
import ProfilePage          from '@/pages/app/ProfilePage'
import PaymentSuccessPage   from '@/pages/app/PaymentSuccessPage'

// Admin pages
import AdminUsersPage     from '@/pages/admin/AdminUsersPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'
import AdminSettingsPage  from '@/pages/admin/AdminSettingsPage'

// Common
import NotFoundPage from '@/pages/NotFoundPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuthStore()
  if (!isAuthenticated()) return <Navigate to={ROUTES.LOGIN} replace />
  if (!isAdmin())         return <Navigate to={ROUTES.DASHBOARD} replace />
  return <>{children}</>
}

function RedirectIfAuthed({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated() ? <Navigate to={ROUTES.DASHBOARD} replace /> : <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME}          element={<HomePage />}       />
          <Route path={ROUTES.HOW_IT_WORKS}  element={<HowItWorksPage />} />
          <Route path={ROUTES.SERVICES}      element={<ServicesPage />}   />
          <Route path={ROUTES.PRICING}       element={<PricingPage />}    />
          <Route path={ROUTES.ABOUT}         element={<AboutPage />}      />
        </Route>

        {/* Auth */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN}           element={<RedirectIfAuthed><LoginPage /></RedirectIfAuthed>}           />
          <Route path={ROUTES.REGISTER}        element={<RedirectIfAuthed><RegisterPage /></RedirectIfAuthed>}        />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<RedirectIfAuthed><ForgotPasswordPage /></RedirectIfAuthed>}  />
          <Route path={ROUTES.RESET_PASSWORD}  element={<ResetPasswordPage />}  />
          <Route path={ROUTES.VERIFY_EMAIL}    element={<VerifyEmailPage />}    />
        </Route>

        {/* Protected app */}
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index path={ROUTES.APP}    element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD}    element={<DashboardPage />}     />
          <Route path={ROUTES.EVIDENCE}     element={<EvidencePage />}      />
          <Route path={ROUTES.CVS}          element={<CVsPage />}           />
          <Route path={ROUTES.APPLICATIONS} element={<ApplicationsPage />}  />
          <Route path={ROUTES.ANALYTICS}    element={<AnalyticsPage />}     />
          <Route path={ROUTES.NOTIFICATIONS}element={<NotificationsPage />} />
          <Route path={ROUTES.SETTINGS}          element={<SettingsPage />}       />
          <Route path={ROUTES.PROFILE}           element={<ProfilePage />}        />
          <Route path="/app/payment-success"     element={<PaymentSuccessPage />} />
        </Route>

        {/* Admin */}
        <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
          <Route path={ROUTES.ADMIN}          element={<Navigate to={ROUTES.ADMIN_USERS} replace />} />
          <Route path={ROUTES.ADMIN_USERS}    element={<AdminUsersPage />}     />
          <Route path={ROUTES.ADMIN_ANALYTICS}element={<AdminAnalyticsPage />} />
          <Route path={ROUTES.ADMIN_SETTINGS} element={<AdminSettingsPage />}  />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <ToastContainer />
    </>
  )
}
