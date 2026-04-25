import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Crown, Star, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
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

export function MemberPage() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<MemberPlan[]>([])
  const [current, setCurrent] = useState<CurrentMembership | null>(null)
  const [benefits, setBenefits] = useState<MemberBenefit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getMemberPlans(), getCurrentMembership(), getMemberBenefits()]).then(
      ([plansRes, curRes, benRes]) => {
        if (plansRes.status === 'fulfilled') setPlans(plansRes.value)
        if (curRes.status === 'fulfilled') setCurrent(curRes.value)
        if (benRes.status === 'fulfilled') setBenefits(benRes.value)
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('member.title')}</h1>
        <p className="mt-1 text-muted-foreground">升级会员，解锁更多备考资源</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左列：套餐 + 权益表 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 套餐卡片 */}
          <section>
            <h2 className="mb-4 text-base font-semibold">选择套餐</h2>
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-64" />)}
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-lg border py-12 text-center text-muted-foreground">
                {t('common.empty')}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.planId} plan={plan} isCurrent={current?.planId === plan.planId} />
                ))}
              </div>
            )}
          </section>

          {/* 权益对比表 */}
          <section>
            <h2 className="mb-4 text-base font-semibold">{t('member.benefits')}</h2>
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
          </section>
        </div>

        {/* 右列：当前会员 + 服务说明 */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('member.currentPlan')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : current ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <span className="font-semibold">{current.planName}</span>
                    <Badge variant={current.isActive ? 'success' : 'outline'} className="text-xs">
                      {current.isActive ? '生效中' : '已过期'}
                    </Badge>
                  </div>
                  {current.expireDate && (
                    <p className="text-sm text-muted-foreground">
                      {t('member.expireDate')}：{new Date(current.expireDate).toLocaleDateString('zh-CN')}
                    </p>
                  )}
                  {current.boundBanks.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('member.bindBank')}</p>
                      {current.boundBanks.map((bank) => (
                        <Badge key={bank.bankId} variant="outline" className="mr-1 text-xs">
                          {bank.bankName}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无会员信息</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t('member.service')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• 购买后立即生效，自然月计算有效期</p>
              <p>• 每个账号最多绑定 3 套题库</p>
              <p>• 到期前 7 天系统发送续费提醒</p>
              <p>• 如有问题请联系在线客服</p>
              <Separator className="my-3" />
              <p className="text-xs">购买即代表同意《用户协议》和《隐私政策》</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PlanCard({ plan, isCurrent }: { plan: MemberPlan; isCurrent: boolean }) {
  const { t } = useTranslation()

  const levelIcons: Record<string, React.ElementType> = {
    free: Star,
    standard: Crown,
    advanced: Zap,
  }
  const Icon = levelIcons[plan.level] || Star

  return (
    <Card
      className={cn(
        'relative transition-shadow hover:shadow-md',
        plan.highlighted && 'border-primary shadow-md',
        isCurrent && 'ring-2 ring-primary'
      )}
    >
      {plan.highlighted && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className="text-xs px-3">推荐</Badge>
        </div>
      )}
      {isCurrent && (
        <div className="absolute -top-2.5 right-3">
          <Badge variant="secondary" className="text-xs">当前</Badge>
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">{plan.name}</CardTitle>
        </div>
        {plan.description && (
          <CardDescription className="text-xs">{plan.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">¥{plan.price}</span>
          {plan.originalPrice && plan.originalPrice > plan.price && (
            <span className="text-sm text-muted-foreground line-through">¥{plan.originalPrice}</span>
          )}
          <span className="text-xs text-muted-foreground">/ {plan.durationDays}天</span>
        </div>
        <ul className="space-y-1.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-1.5 text-xs">
              <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={plan.level === 'free' ? 'outline' : 'default'}
          disabled={isCurrent || plan.level === 'free'}
          size="sm"
        >
          {isCurrent ? '当前套餐' : plan.level === 'free' ? '免费使用' : t('member.upgrade')}
        </Button>
      </CardFooter>
    </Card>
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
