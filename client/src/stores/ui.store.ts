import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Toast {
  id:      string
  type:    'success' | 'error' | 'info' | 'warning'
  title:   string
  message?: string
}

interface UIStore {
  sidebarCollapsed: boolean
  darkMode:         boolean
  toasts:           Toast[]
  toggleSidebar:    () => void
  setSidebarCollapsed: (v: boolean) => void
  toggleDarkMode:   () => void
  addToast:         (toast: Omit<Toast, 'id'>) => void
  removeToast:      (id: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      darkMode:         false,
      toasts:           [],

      toggleSidebar: () =>
        set({ sidebarCollapsed: !get().sidebarCollapsed }),

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      toggleDarkMode: () => {
        const next = !get().darkMode
        document.documentElement.classList.toggle('dark', next)
        set({ darkMode: next })
      },

      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2)
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        const duration = toast.type === 'error' ? 0 : 4000
        if (duration > 0) {
          setTimeout(() => get().removeToast(id), duration)
        }
      },

      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name:       'campus-to-corporate-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed, darkMode: s.darkMode }),
    },
  ),
)
