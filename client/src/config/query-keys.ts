export const queryKeys = {
  auth: {
    me: () => ['auth', 'me'] as const,
  },
  profile: {
    all: () => ['profile'] as const,
  },
  evidence: {
    all:    () => ['evidence'] as const,
    detail: (id: string) => ['evidence', id] as const,
  },
  cvs: {
    all:      () => ['cvs'] as const,
    detail:   (id: string) => ['cvs', id] as const,
    versions: (id: string) => ['cvs', id, 'versions'] as const,
  },
  applications: {
    all:    (filters?: Record<string, unknown>) => ['applications', filters] as const,
    detail: (id: string) => ['applications', id] as const,
    history:(id: string) => ['applications', id, 'history'] as const,
    notes:  (id: string) => ['applications', id, 'notes'] as const,
  },
  roleFit: {
    all:    () => ['role-fit'] as const,
    detail: (id: string) => ['role-fit', id] as const,
  },
  dashboard: {
    all: () => ['dashboard'] as const,
  },
  analytics: {
    campaign: () => ['analytics', 'campaign'] as const,
    health:   () => ['analytics', 'health'] as const,
  },
  notifications: {
    all: () => ['notifications'] as const,
  },
  orders: {
    all:    () => ['orders'] as const,
    detail: (id: string) => ['orders', id] as const,
  },
  subscription: {
    current: () => ['subscription'] as const,
  },
  interviews: {
    all:    () => ['interviews'] as const,
    detail: (id: string) => ['interviews', id] as const,
  },
  admin: {
    users:    (filters?: Record<string, unknown>) => ['admin', 'users', filters] as const,
    orders:   (filters?: Record<string, unknown>) => ['admin', 'orders', filters] as const,
    leads:    (filters?: Record<string, unknown>) => ['admin', 'leads', filters] as const,
    analytics:() => ['admin', 'analytics'] as const,
  },
} as const
