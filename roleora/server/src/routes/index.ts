import { Router }    from 'express'
import authRoutes   from './v1/auth.routes.js'

const router = Router()

router.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

router.use('/auth', authRoutes)

export default router
