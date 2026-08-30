import { useCallback }    from 'react'
import { useNavigate }   from 'react-router-dom'
import { useAuthStore }  from '@/stores/auth.store'
import apiClient         from '@/services/api'
import { ROUTES }        from '@/config/routes'
import type { LoginCredentials, RegisterCredentials } from '@/types/auth.types'

export function useAuth() {
  const { user, setAuth, clearAuth, isAuthenticated, isAdmin } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await apiClient.post('/auth/login', credentials)
    setAuth(res.data.data.user, res.data.data.accessToken)
    navigate(ROUTES.DASHBOARD)
  }, [setAuth, navigate])

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const res = await apiClient.post('/auth/register', credentials)
    setAuth(res.data.data.user, res.data.data.accessToken)
    navigate(ROUTES.DASHBOARD)
  }, [setAuth, navigate])

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      clearAuth()
      navigate(ROUTES.LOGIN)
    }
  }, [clearAuth, navigate])

  return { user, login, register, logout, isAuthenticated, isAdmin }
}
