import { get } from '@/lib/request'

export interface MemberPlan {
  planId: string
  name: string
  level: 'free' | 'standard' | 'advanced'
  price: number
  originalPrice?: number
  durationDays: number
  description: string
  features: string[]
  highlighted?: boolean
}

export interface CurrentMembership {
  planId: string
  planName: string
  level: 'free' | 'standard' | 'advanced'
  expireDate?: string
  isActive: boolean
  boundBanks: { bankId: string; bankName: string }[]
}

export interface MemberBenefit {
  benefitId: string
  name: string
  freeSupport: boolean | string
  standardSupport: boolean | string
  advancedSupport: boolean | string
}

export const getMemberPlans = (): Promise<MemberPlan[]> => get('/membership/plans')

export const getCurrentMembership = (): Promise<CurrentMembership> =>
  get('/membership/current')

export const getMemberBenefits = (): Promise<MemberBenefit[]> => get('/membership/benefits')
