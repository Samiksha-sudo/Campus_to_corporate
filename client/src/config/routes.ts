export const ROUTES = {
  // Public
  HOME:           '/',
  HOW_IT_WORKS:   '/how-it-works',
  PRICING:        '/pricing',
  SERVICES:       '/services',
  ABOUT:          '/about',
  CONTACT:        '/contact',
  BLOG:           '/blog',

  // Auth
  LOGIN:          '/login',
  REGISTER:       '/register',
  FORGOT_PASSWORD:'/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL:   '/verify-email',

  // App
  APP:            '/app',
  DASHBOARD:      '/app/dashboard',
  EVIDENCE:       '/app/evidence',
  CVS:            '/app/cvs',
  ROLE_FIT:       '/app/role-fit',
  APPLICATIONS:   '/app/applications',
  OUTREACH:       '/app/outreach',
  INTERVIEWS:     '/app/interviews',
  ANALYTICS:      '/app/analytics',
  DOCUMENTS:      '/app/documents',
  ORDERS:         '/app/orders',
  SUBSCRIPTION:   '/app/subscription',
  NOTIFICATIONS:  '/app/notifications',
  PROFILE:        '/app/profile',
  SETTINGS:       '/app/settings',

  // Admin
  ADMIN:          '/admin',
  ADMIN_DASHBOARD:'/admin/dashboard',
  ADMIN_USERS:    '/admin/users',
  ADMIN_ORDERS:   '/admin/orders',
  ADMIN_LEADS:    '/admin/leads',
  ADMIN_ANALYTICS:'/admin/analytics',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_TASKS:    '/admin/tasks',
} as const

export type RouteKey = keyof typeof ROUTES
export type RoutePath = typeof ROUTES[RouteKey]
