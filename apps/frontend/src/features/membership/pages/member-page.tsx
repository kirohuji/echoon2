import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Crown, Star, Zap, Shield, ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ConfigDataTable, type ColumnConfig } from '@/components/common/config-datatable'
import {
  getMemberPlans,
  getCurrentMembership,
  getMemberBenefits,
  type MemberPlan,
  type CurrentMembership,
  type MemberBenefit,
} from '@/features/membership/api'
import { cn } from '@/lib/cn'

// 静态兜底权益（后端接口异常时使用）
const FALLBACK_BENEFITS: MemberBenefit[] = [
  { benefitId: '1', name: '题库使用数量', freeSupport: '1 套', standardSupport: '3 套', advancedSupport: '无限' },
  { benefitId: '2', name: 'AI 练习反馈', freeSupport: false, standardSupport: true, advancedSupport: true },
  { benefitId: '3', name: '模拟考试', freeSupport: '5 次/月', standardSupport: '30 次/月', advancedSupport: '无限' },
  { benefitId: '4', name: '练习记录', freeSupport: true, standardSupport: true, advancedSupport: true },
  { benefitId: '5', name: '收藏题目', freeSupport: true, standardSupport: true, advancedSupport: true },
  { benefitId: '6', name: '生词本', freeSupport: true, standardSupport: true, advancedSupport: true },
  { benefitId: '7', name: '客服支持', freeSupport: false, standardSupport: '工作日', advancedSupport: '全天' },
]

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

  const benefitColumns: ColumnConfig<MemberBenefit>[] = [
    {
      key: 'name',
      header: t('member.columns.benefit'),
      cell: (v) => <span className="font-medium text-sm">{v}</span>,
    },
    {
      key: 'freeSupport',
      header: t('member.columns.free'),
      cell: (v) => <SupportCell value={v} />,
      width: 80,
      align: 'center',
    },
    {
      key: 'standardSupport',
      header: t('member.columns.standard'),
      cell: (v) => <SupportCell value={v} />,
      width: 80,
      align: 'center',
    },
    {
      key: 'advancedSupport',
      header: t('member.columns.advanced'),
      cell: (v) => <SupportCell value={v} highlighted />,
      width: 80,
      align: 'center',
    },
  ]

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* 移动端：独立布局（不影响平板/PC） */}
      <div className="space-y-4 md:hidden">
        <div className="relative flex items-center justify-center">
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

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          {isLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-100 dark:bg-yellow-900/30">
                  {current?.isActive ? (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold">{current?.planName || '免费用户'}</p>
                  <p className="text-xs text-muted-foreground">
                    {current?.expireDate
                      ? `${new Date(current.expireDate).toLocaleDateString('zh-CN')} 到期`
                      : '升级解锁更多功能'}
                  </p>
                </div>
              </div>
              <Badge variant={current?.isActive ? 'default' : 'secondary'} className="text-xs">
                {current?.isActive ? '生效中' : '免费'}
              </Badge>
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <div className="mb-4 space-y-3">
            <h2 className="text-lg font-bold">选择套餐</h2>
            <div className="inline-flex rounded-xl bg-muted p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  billingCycle === 'monthly' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                月付
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                  billingCycle === 'yearly' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                年付
              </button>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
              {t('common.empty')}
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.planId}
                  plan={plan}
                  isCurrent={current?.planId === plan.planId}
                  billingCycle={billingCycle}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-base font-bold">{t('member.benefits')}</h2>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
            </div>
          ) : benefits.length === 0 ? (
            <div className="rounded-xl border py-10 text-center text-sm text-muted-foreground">
              {t('common.empty')}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              {benefits.map((item, index) => (
                <div
                  key={item.benefitId}
                  className={cn(
                    'grid grid-cols-4 items-center gap-2 px-3 py-2.5 text-xs',
                    index !== benefits.length - 1 && 'border-b'
                  )}
                >
                  <span className="col-span-1 font-medium text-foreground">{item.name}</span>
                  <SupportCell value={item.freeSupport} />
                  <SupportCell value={item.standardSupport} />
                  <SupportCell value={item.advancedSupport} highlighted />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 平板/PC：Claude 风格布局 */}
      <div className="hidden rounded-3xl bg-muted/30 p-4 md:block lg:space-y-6 lg:p-6">
        <div>
          <h1 className="text-center text-2xl font-bold tracking-tight lg:text-4xl">Plans that grow with you</h1>
          <p className="mt-2 text-center text-sm text-muted-foreground">升级会员，解锁更多备考资源</p>
          <div className="mt-4 flex justify-center">
            <div className="inline-flex rounded-xl border bg-card p-1">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition',
                  billingCycle === 'monthly' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-sm font-medium transition',
                  billingCycle === 'yearly' ? 'bg-background shadow-sm' : 'text-muted-foreground'
                )}
              >
                Yearly · Save 17%
              </button>
            </div>
          </div>
        </div>

        <div>
          {isLoading ? (
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52" />)}
            </div>
          ) : plans.length === 0 ? (
            <div className="rounded-xl border py-12 text-center text-muted-foreground text-sm">
              {t('common.empty')}
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.planId}
                  plan={plan}
                  isCurrent={current?.planId === plan.planId}
                  billingCycle={billingCycle}
                />
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm lg:bg-transparent lg:p-0 lg:shadow-none">
          <h2 className="mb-3 text-base font-bold lg:mb-4 lg:font-semibold">{t('member.benefits')}</h2>
          <ConfigDataTable
            data={benefits}
            columns={benefitColumns}
            total={benefits.length}
            page={1}
            pageSize={benefits.length || 10}
            onPageChange={() => {}}
            isLoading={isLoading}
            emptyMessage={t('common.empty')}
          />
        </div>

        <div className="rounded-2xl bg-card p-4 shadow-sm lg:bg-transparent lg:p-0 lg:shadow-none">
          <h2 className="mb-3 text-base font-bold lg:mb-4 lg:font-semibold">{t('member.service')}</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 购买后立即生效，自然月计算有效期</p>
            <p>• 每个账号最多绑定 3 套题库</p>
            <p>• 到期前 7 天系统发送续费提醒</p>
            <p>• 如有问题请联系在线客服</p>
            <Separator className="my-3" />
            <p className="text-xs">购买即代表同意《用户协议》和《隐私政策》</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  isCurrent,
  billingCycle,
}: {
  plan: MemberPlan
  isCurrent: boolean
  billingCycle: 'monthly' | 'yearly'
}) {
  const { t } = useTranslation()

  const levelIcons: Record<string, React.ElementType> = {
    free: Star,
    standard: Crown,
    advanced: Zap,
  }
  const Icon = levelIcons[plan.level] || Star
  const planDescription =
    plan.description ||
    (plan.level === 'free'
      ? '适合初次备考，先用基础功能'
      : plan.level === 'standard'
        ? '适合稳定练习，覆盖核心能力'
        : '适合高强度冲刺，解锁全部权益')
  const displayPrice =
    billingCycle === 'yearly' && plan.level !== 'free'
      ? Math.round((plan.price * 12 * 0.83) / 12)
      : plan.price

  return (
    <div
      className={cn(
        'relative h-full rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md',
        plan.highlighted && 'shadow-md',
        isCurrent && 'ring-1 ring-border'
      )}
    >
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-background">
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-[18px] font-semibold leading-none tracking-tight">{plan.name}</p>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{planDescription}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5">
              {plan.highlighted && (
                <Badge variant="outline" className="text-[10px]">推荐</Badge>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-end justify-end gap-1">
                <span className="text-[22px] font-bold leading-none">${displayPrice}</span>
                <span className="pb-0.5 text-[11px] text-muted-foreground">/ month</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                billed {billingCycle === 'yearly' ? 'annually' : 'monthly'}
              </p>
            </div>
          </div>
        </div>
        {plan.originalPrice && plan.originalPrice > displayPrice && (
          <p className="mb-4 text-right text-xs text-muted-foreground line-through">
            原价 ${plan.originalPrice}
          </p>
        )}

        <Button
          variant={plan.level === 'free' ? 'outline' : 'default'}
          size="lg"
          className={cn(
            'mb-2 h-10 w-[78%] self-center rounded-xl text-sm font-medium',
            plan.level !== 'free' && 'bg-foreground text-background hover:bg-foreground/90'
          )}
          disabled={isCurrent || plan.level === 'free'}
        >
          {isCurrent ? '当前套餐' : plan.level === 'free' ? '免费使用' : t('member.upgrade')}
        </Button>
        {plan.level !== 'free' && (
          <p className="mb-3 text-center text-[11px] text-muted-foreground">No commitment · Cancel anytime</p>
        )}

        <div className="mt-auto space-y-2.5 border-t pt-3.5">
          <p className="text-[15px] font-medium">
            {plan.level === 'free' ? '基础功能：' : `Everything in ${plan.level === 'standard' ? 'Free' : 'Pro'} and:`}
          </p>
          <ul className="space-y-1.5">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[15px] leading-5">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function SupportCell({ value, highlighted }: { value: boolean | string; highlighted?: boolean }) {
  if (typeof value === 'boolean') {
    return value ? (
      <Check className={cn('mx-auto h-4 w-4', highlighted ? 'text-green-500 font-bold' : 'text-green-500')} />
    ) : (
      <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
    )
  }
  return (
    <span className={cn('text-xs text-center block', highlighted && 'font-medium text-primary')}>
      {value}
    </span>
  )
}
