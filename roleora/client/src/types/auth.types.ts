import type { SubscriptionPlan, UserRole } from './api.types'

export interface User {
  id:               string
  email:            string
  firstName:        string
  lastName:         string
  role:             UserRole
  emailVerified:    boolean
  subscriptionPlan?: SubscriptionPlan
  avatarUrl?:       string | null
  createdAt:        string
}

export interface AuthState {
  user:        User | null
  accessToken: string | null
  isLoading:   boolean
}

export interface LoginCredentials {
  email:    string
  password: string
}

export interface RegisterCredentials {
  firstName: string
  lastName:  string
  email:     string
  password:  string
}

export interface LoginResponse {
  accessToken: string
  user:        User
}
