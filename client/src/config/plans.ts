// Single source of truth for plan marketing copy on the client.
// Limits mirror server/src/config/plans.ts (PLAN_LIMITS) and must be kept in sync.
// `MOMENTUM` is the internal key for the plan marketed as "Pro".

export type PlanKey = 'STARTER' | 'EXPLORE' | 'LAUNCH' | 'MOMENTUM' | 'ELITE'

export interface PlanDef {
  key:        PlanKey
  name:       string
  pricePence: number
  price:      string
  period:     string
  tagline:    string
  cta:        string
  badge?:     string
  weekly:     number            // verified applications per week (0 = none)
  features:   string[]
  managed?:   boolean
}

export const PLAN_ORDER: PlanKey[] = ['STARTER', 'EXPLORE', 'LAUNCH', 'MOMENTUM', 'ELITE']

export const PLANS: Record<PlanKey, PlanDef> = {
  STARTER: {
    key: 'STARTER', name: 'Starter', pricePence: 0, price: '£0', period: 'forever',
    tagline: 'Start your career journey with confidence.',
    cta: 'Start Free', weekly: 0,
    features: [
      'Career guidance and resources',
      '1 free CV review',
      'Application tracker',
      'Application status tracking',
      'Basic Evidence Bank',
      'Basic career profile',
    ],
  },
  EXPLORE: {
    key: 'EXPLORE', name: 'Explore', pricePence: 1000, price: '£10', period: 'per month',
    tagline: 'Build your profile and start getting noticed.',
    cta: 'Start Explore', weekly: 50,
    features: [
      'Everything in Starter',
      '1 CV review',
      '1 CV change',
      'Tracker for up to 10 jobs',
      'Application status tracking',
      'Evidence Bank',
      'Up to 50 applications per week',
    ],
  },
  LAUNCH: {
    key: 'LAUNCH', name: 'Launch', pricePence: 2000, price: '£20', period: 'per month',
    tagline: 'Turn applications into opportunities.',
    cta: 'Start Launch', badge: 'Most Popular', weekly: 100,
    features: [
      'Everything in Explore',
      'Unlimited CV changes',
      'Up to 100 applications per week',
      'Application status tracking',
      'LinkedIn optimisation',
      'Unlimited Evidence Bank',
      'Career resources',
      'Interview preparation resources',
    ],
  },
  MOMENTUM: {
    key: 'MOMENTUM', name: 'Pro', pricePence: 4900, price: '£49', period: 'per month',
    tagline: 'Accelerate your career with personalised support.',
    cta: 'Start Pro', badge: 'Best Value', weekly: 100,
    features: [
      'Everything in Launch',
      'Up to 100 applications per week',
      'Unlimited CV changes',
      'Unlimited cover letters',
      'Personalised interview preparation',
      'Dedicated career specialist',
      'Priority CV and profile reviews',
      'Recruiter follow-up guidance',
      'Application status tracking',
    ],
  },
  ELITE: {
    key: 'ELITE', name: 'Elite Concierge', pricePence: 10000, price: '£100', period: 'per month',
    tagline: 'We handle your job search. You focus on the interviews.',
    cta: 'Get Elite Concierge', badge: 'Fully Managed', weekly: 200, managed: true,
    features: [
      'Everything in Pro',
      'Up to 200 applications per week',
      'Fully managed job search',
      'Job discovery and shortlisting',
      'CV tailoring',
      'Cover letters',
      'Application preparation and submission',
      'Recruiter and hiring-manager outreach',
      'Recruiter message management',
      'Follow-ups and response tracking',
      'Interview invitation monitoring',
      'Scheduling assistance',
      'Dedicated specialist and priority support',
      'Personalised interview preparation',
      'Regular progress reporting',
    ],
  },
}

export const planName = (key: string): string => PLANS[key as PlanKey]?.name ?? key
export const planWeekly = (key: string): number => PLANS[key as PlanKey]?.weekly ?? 0

export const isPlanKey = (v: unknown): v is PlanKey =>
  typeof v === 'string' && v in PLANS
