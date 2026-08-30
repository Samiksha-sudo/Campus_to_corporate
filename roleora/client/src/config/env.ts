const env = {
  API_URL:     import.meta.env.VITE_API_URL     ?? '/api',
  APP_NAME:    import.meta.env.VITE_APP_NAME    ?? 'Roleora',
  APP_URL:     import.meta.env.VITE_APP_URL     ?? 'http://localhost:5173',
  IS_DEV:      import.meta.env.DEV,
  IS_PROD:     import.meta.env.PROD,
} as const

export default env
