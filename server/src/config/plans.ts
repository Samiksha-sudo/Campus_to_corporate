export const PLAN_LIMITS = {
  STARTER: {
    cvChanges:          1,
    weeklyApplications: 0,
    coverLetters:       false,
    linkedIn:           false,
    interviewGuarantee: false,
  },
  EXPLORE: {
    cvChanges:          1,
    weeklyApplications: 10,
    coverLetters:       false,
    linkedIn:           false,
    interviewGuarantee: false,
  },
  LAUNCH: {
    cvChanges:          Infinity,
    weeklyApplications: 50,
    coverLetters:       false,
    linkedIn:           true,
    interviewGuarantee: true,   // 1/month guaranteed
  },
  MOMENTUM: {
    cvChanges:          Infinity,
    weeklyApplications: 200,
    coverLetters:       true,
    linkedIn:           true,
    interviewGuarantee: true,   // multiple/month
  },
} as const

export type PlanKey = keyof typeof PLAN_LIMITS
