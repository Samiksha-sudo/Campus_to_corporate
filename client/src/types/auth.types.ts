import type { SubscriptionPlan, UserRole } from './api.types'

export interface User {
  id:               string
  email:            string
  firstName:        string
  lastName:         string
  role:             UserRole
  emailVerified:    boolean | number
  profileComplete:  boolean | number
  subscriptionPlan?: SubscriptionPlan
  avatarUrl?:        string | null
  phone?:            string | null
  location?:         string | null
  jobTitle?:         string | null
  linkedinUrl?:      string | null
  yearsExperience?:  number | null
  targetSalaryMin?:  number | null
  targetSalaryMax?:  number | null
  bio?:              string | null
  stripeCustomerId?: string | null
  createdAt:        string
  updatedAt?:       string
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
