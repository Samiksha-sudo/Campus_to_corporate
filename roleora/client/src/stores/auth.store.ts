import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/auth.types'

interface AuthStore {
  user:        User | null
  accessToken: string | null
  setAuth:     (user: User, accessToken: string) => void
  setAccessToken: (token: string) => void
  clearAuth:   () => void
  isAuthenticated: () => boolean
  isAdmin:     () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user:        null,
      accessToken: null,

      setAuth: (user, accessToken) => set({ user, accessToken }),

      setAccessToken: (accessToken) => set({ accessToken }),

      clearAuth: () => set({ user: null, accessToken: null }),

      isAuthenticated: () => !!get().user && !!get().accessToken,

      isAdmin: () => {
        const role = get().user?.role
        return role === 'ADMIN' || role === 'SUPER_ADMIN'
      },
    }),
    {
      name:    'roleora-auth',
      partialize: (state) => ({ user: state.user }),
      // Only persist user object; access token lives in memory only
    },
  ),
)
