import { Router }      from 'express'
import { z }           from 'zod'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { validate }    from '../../middleware/validate.js'
import { authenticate } from '../../middleware/auth.js'
import { asyncHandler } from '../../utils/asyncHandler.js'
import * as ctrl        from '../../controllers/auth.controller.js'

const router = Router()

const registerSchema = z.object({
  firstName: z.string().min(1).max(100).trim(),
  lastName:  z.string().min(1).max(100).trim(),
  email:     z.string().email().toLowerCase(),
  password:  z.string().min(8, 'Password must be at least 8 characters').max(128),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

const forgotSchema = z.object({
  email: z.string().email(),
})

const resetSchema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).max(128),
})

const verifySchema = z.object({
  token: z.string().min(1),
})

const profileSchema = z.object({
  firstName:       z.string().min(1).max(100).trim().optional(),
  lastName:        z.string().min(1).max(100).trim().optional(),
  phone:           z.string().max(30).optional(),
  location:        z.string().max(255).optional(),
  jobTitle:        z.string().max(255).optional(),
  linkedinUrl:     z.string().url().optional().or(z.literal('')),
  yearsExperience: z.coerce.number().min(0).max(50).optional(),
  targetSalaryMin: z.coerce.number().min(0).optional(),
  targetSalaryMax: z.coerce.number().min(0).optional(),
  bio:             z.string().max(500).optional(),
})

router.post('/register',       authLimiter, validate({ body: registerSchema }), asyncHandler(ctrl.register))
router.post('/login',          authLimiter, validate({ body: loginSchema }),    asyncHandler(ctrl.login))
router.post('/refresh',        asyncHandler(ctrl.refresh))
router.post('/logout',         authenticate, asyncHandler(ctrl.logout))
router.get ('/me',             authenticate, asyncHandler(ctrl.me))
router.patch('/profile',       authenticate, asyncHandler(ctrl.updateProfile))
router.post('/verify-email',   validate({ body: verifySchema }),               asyncHandler(ctrl.verifyEmail))
router.post('/forgot-password',authLimiter, validate({ body: forgotSchema }),  asyncHandler(ctrl.forgotPassword))
router.post('/reset-password', authLimiter, validate({ body: resetSchema }),   asyncHandler(ctrl.resetPassword))

export default router
