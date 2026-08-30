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
  | 'RECRUITER_OUTREACH'
  | 'APPLIED'
  | 'UNDER_REVIEW'
  | 'SCREENING'
  | 'ASSESSMENT'
  | 'ASSESSMENT_SUBMITTED'
  | 'HIRING_MANAGER_INTERVIEW'
  | 'TECHNICAL_INTERVIEW'
  | 'SYSTEM_DESIGN_INTERVIEW'
  | 'CODING_INTERVIEW'
  | 'SECOND_ROUND'
  | 'THIRD_ROUND'
  | 'FINAL_ROUND'
  | 'WAITING_FOR_RESPONSE'
  | 'REFERENCE_CHECK'
  | 'BACKGROUND_CHECK'
  | 'RIGHT_TO_WORK_CHECK'
  | 'SALARY_DISCUSSION'
  | 'OFFER_PENDING'
  | 'OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ROLE_CLOSED'
  | 'ON_HOLD'
  | 'TALENT_POOL'
  | 'NO_RESPONSE'
  | 'UNKNOWN'

export type SubscriptionPlan = 'EXPLORE' | 'LAUNCH' | 'MOMENTUM'

export type UserRole =
  | 'CUSTOMER'
  | 'CAREER_SPECIALIST'
  | 'CV_WRITER'
  | 'APPLICATION_SPECIALIST'
  | 'ADMIN'
  | 'SUPER_ADMIN'
