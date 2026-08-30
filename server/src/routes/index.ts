import { Router }          from 'express'
import authRoutes          from './v1/auth.routes.js'
import gmailRoutes         from './v1/gmail.routes.js'
import stripeRoutes        from './v1/stripe.routes.js'
import adminRoutes         from './v1/admin.routes.js'
import cvsRoutes           from './v1/cvs.routes.js'
import applicationsRoutes  from './v1/applications.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

router.use('/auth',         authRoutes)
router.use('/gmail',        gmailRoutes)
router.use('/stripe',       stripeRoutes)
router.use('/admin',        adminRoutes)
router.use('/cvs',          cvsRoutes)
router.use('/applications', applicationsRoutes)

export default router
