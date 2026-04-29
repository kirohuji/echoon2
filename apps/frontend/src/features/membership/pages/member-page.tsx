import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Crown, Star, Zap, Shield, ChevronLeft, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  getMemberPlans,
  getCurrentMembership,
  getMemberBenefits,
  type MemberPlan,
  type CurrentMembership,
  type MemberBenefit,
} from '@/features/membership/api'
import { cn } from '@/lib/cn'

const FALLBACK_BENEFITS: MemberBenefit[] = [
  { benefitId: '1', name: '题库使用数量', freeSupport: '1 套', standardSupport: '3 套', advancedSupport: '无限' },
  { benefitId: '2', name: 'AI 练习反馈', freeSupport: false, standardSupport: true, advancedSupport: true },
  { benefitId: '3', name: '模拟考试', freeSupport: '5 次/月', standardSupport: '30 次/月', advancedSupport: '无限' },
  { benefitId: '4', name: '练习记录', freeSupport: true, standardSupport: true, advancedSupport: true },
  { benefitId: '5', name: '收藏题目', freeSupport: true, standardSupport: true, advancedSupport: true },
  { benefitId: '6', name: '生词本', freeSupport: true, standardSupport: true, advancedSupport: true },
  { benefitId: '7', name: '客服支持', freeSupport: false, standardSupport: '工作日', advancedSupport: '全天' },
]

const planIcons: Record<string, React.ElementType> = {
  free: Star,
  standard: Crown,
  advanced: Zap,
}

export function MemberPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<MemberPlan[]>([])
  const [current, setCurrent] = useState<CurrentMembership | null>(null)
  const [benefits, setBenefits] = useState<MemberBenefit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')

  useEffect(() => {
    Promise.allSettled([getMemberPlans(), getCurrentMembership(), getMemberBenefits()]).then(
      ([plansRes, curRes, benRes]) => {
        if (plansRes.status === 'fulfilled') setPlans(plansRes.value)
        if (curRes.status === 'fulfilled') setCurrent(curRes.value)
        if (benRes.status === 'fulfilled' && benRes.value.length > 0) {
          setBenefits(benRes.value)
        } else {
          setBenefits(FALLBACK_BENEFITS)
        }
        setIsLoading(false)
      }
    )
  }, [])

  return (
    <div className="space-y-5 lg:space-y-6">
      {/* 手机端返回栏 */}
      <div className="relative flex items-center justify-center lg:hidden">
        <button
          type="button"
          aria-label="返回"
          onClick={() => navigate(-1)}
          className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/60 active:bg-muted"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold">{t('member.title')}</h1>
      </div>

      {/* 当前套餐 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('member.currentPlan')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[72px] rounded-xl" />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl',
                  current?.isActive ? 'bg-amber-500/10' : 'bg-muted'
                )}>
                  {current?.isActive ? (
                    <Crown className="h-5 w-5 text-amber-500" />
                  ) : (
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{current?.planName || t('member.freeUser')}</p>
                    <Badge variant={current?.isActive ? 'default' : 'secondary'} className="text-xs">
                      {current?.isActive ? '生效中' : '免费'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {current?.expireDate
                      ? `${new Date(current.expireDate).toLocaleDateString('zh-CN')} 到期`
                      : '升级解锁更多功能'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 选择套餐 */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">选择套餐</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{t('member.subtitle')}</p>
            </div>
            <div className="inline-flex rounded-xl bg-muted p-1 self-start">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  billingCycle === 'monthly'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('member.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all',
                  billingCycle === 'yearly'
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t('member.yearlySave')}
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[320px] rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border py-12 text-center text-sm text-muted-foreground">
              {t('common.empty')}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PricingCard
                  key={plan.planId}
                  plan={plan}
                  isCurrent={current?.planId === plan.planId}
                  billingCycle={billingCycle}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 权益对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('member.benefits')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
            </div>
          ) : benefits.length === 0 ? (
            <div className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
              {t('common.empty')}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              {/* 表头 */}
              <div className="grid grid-cols-4 items-center gap-2 bg-muted/50 px-4 py-2.5">
                <span className="text-xs font-semibold text-muted-foreground">{t('member.columns.benefit')}</span>
                <span className="text-center text-xs font-semibold text-muted-foreground">{t('member.columns.free')}</span>
                <span className="text-center text-xs font-semibold text-muted-foreground">{t('member.columns.standard')}</span>
                <span className="text-center text-xs font-semibold text-muted-foreground">{t('member.columns.advanced')}</span>
              </div>
              {benefits.map((item, idx) => (
                <div
                  key={item.benefitId}
                  className={cn(
                    'grid grid-cols-4 items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-muted/30',
                    idx !== benefits.length - 1 && 'border-b border-border/50'
                  )}
                >
                  <span className="font-medium">{item.name}</span>
                  <SupportCell value={item.freeSupport} />
                  <SupportCell value={item.standardSupport} />
                  <SupportCell value={item.advancedSupport} highlighted />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 服务说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('member.service')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/50" />
              {t('member.serviceItem1')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/50" />
              {t('member.serviceItem2')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/50" />
              {t('member.serviceItem3')}
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/50" />
              {t('member.serviceItem4')}
            </li>
          </ul>
          <Separator className="my-4" />
          <p className="text-xs text-muted-foreground">{t('member.serviceFooter')}</p>
        </CardContent>
      </Card>
    </div>
  )
}

function PricingCard({
  plan,
  isCurrent,
  billingCycle,
}: {
  plan: MemberPlan
  isCurrent: boolean
  billingCycle: 'monthly' | 'yearly'
}) {
  const { t } = useTranslation()
  const Icon = planIcons[plan.level] || Star

  const displayPrice =
    billingCycle === 'yearly' && plan.level !== 'free'
      ? Math.round((plan.price * 12 * 0.83) / 12)
      : plan.price

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-xl border bg-card p-5 transition-all',
        plan.highlighted && 'shadow-lg',
        isCurrent && 'shadow-sm',
        !plan.highlighted && !isCurrent && 'border-border hover:shadow-sm'
      )}
    >
      {/* 推荐标签 */}
      {plan.highlighted && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground shadow-sm">
            <Sparkles className="mr-1 h-3 w-3" />
            {t('member.recommended')}
          </Badge>
        </div>
      )}

      {/* 头部 */}
      <div className="mb-4">
        <div className="mb-3 flex items-center gap-2.5">
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-xl border',
            plan.highlighted ? 'border-border bg-muted/50' : 'border-border bg-muted/50'
          )}>
            <Icon className={cn('h-5 w-5', plan.highlighted ? 'text-primary' : 'text-foreground')} />
          </div>
          <p className="text-lg font-bold">{plan.name}</p>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {plan.level === 'free'
            ? t('member.freeDesc')
            : plan.level === 'standard'
              ? t('member.standardDesc')
              : t('member.advancedDesc')}
        </p>
      </div>

      {/* 价格 */}
      <div className="mb-4">
        <div className="flex items-end gap-0.5">
          <span className="text-3xl font-bold tracking-tight">¥{displayPrice}</span>
          <span className="mb-1 text-xs text-muted-foreground">{t('member.perMonth')}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {billingCycle === 'yearly' ? t('member.billedYearly') : t('member.billedMonthly')}
        </p>
      </div>

      {/* 按钮 */}
      <Button
        variant={plan.level === 'free' ? 'outline' : plan.highlighted ? 'default' : 'outline'}
        size="lg"
        className="mb-4 w-full rounded-xl"
        disabled={isCurrent || plan.level === 'free'}
      >
        {isCurrent ? t('member.currentPlan') : plan.level === 'free' ? t('member.useFree') : t('member.upgrade')}
      </Button>

      {/* 功能列表 */}
      <div className="mt-auto space-y-2.5 border-t pt-4">
        <p className="text-sm font-semibold">{t('member.featureTitle')}</p>
        <ul className="space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm leading-5">
              <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
              <span className="text-muted-foreground">{f}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function SupportCell({ value, highlighted }: { value: boolean | string; highlighted?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <div className="flex justify-center">
        <Check className={cn('h-4 w-4', highlighted ? 'text-primary' : 'text-green-500')} />
      </div>
    ) : (
      <div className="flex justify-center">
        <X className="h-4 w-4 text-muted-foreground/30" />
      </div>
    )
  }
  return (
    <span className={cn('text-center text-sm', highlighted && 'font-semibold text-primary')}>
      {value}
    </span>
  )
}
