export interface ApiResponse<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code:     string
    message:  string
    details?: Record<string, string>
  }
  requestId?: string
}

export interface PaginationMeta {
  page:       number
  perPage:    number
  total:      number
  totalPages: number
}

export type ApplicationStatus =
  | 'SAVED'
  | 'PREPARING'
  | 'APPLIED'
  | 'RECRUITER_SCREEN'
  | 'FIRST_INTERVIEW'
  | 'TECHNICAL_INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'

export type SubscriptionPlan = 'EXPLORE' | 'LAUNCH' | 'MOMENTUM' | 'GUIDED'

export type UserRole =
  | 'CUSTOMER'
  | 'CAREER_SPECIALIST'
  | 'CV_WRITER'
  | 'APPLICATION_SPECIALIST'
  | 'ADMIN'
  | 'SUPER_ADMIN'
