import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, X, Crown, Star, Zap, Shield } from 'lucide-react'
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

// 静态兜底权益（后端接口不存在时使用）
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
  const [plans, setPlans] = useState<MemberPlan[]>([])
  const [current, setCurrent] = useState<CurrentMembership | null>(null)
  const [benefits, setBenefits] = useState<MemberBenefit[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getMemberPlans(), getCurrentMembership(), getMemberBenefits()]).then(
      ([plansRes, curRes, benRes]) => {
        if (plansRes.status === 'fulfilled') setPlans(plansRes.value)
        if (curRes.status === 'fulfilled') setCurrent(curRes.value)
        // 若接口不存在或返回空，使用静态兜底数据
        setBenefits(benRes.status === 'fulfilled' && benRes.value.length > 0 ? benRes.value : FALLBACK_BENEFITS)
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
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold lg:text-2xl">{t('member.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">升级会员，解锁更多备考资源</p>
      </div>

      {/* 手机/iPad：当前会员状态卡 */}
      <div className="rounded-2xl bg-card p-4 shadow-sm lg:hidden">
        {isLoading ? (
          <Skeleton className="h-16" />
        ) : current ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{current.planName}</p>
                {current.expireDate ? (
                  <p className="text-xs text-muted-foreground">
                    {new Date(current.expireDate).toLocaleDateString('zh-CN')} 到期
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">永久有效</p>
                )}
              </div>
            </div>
            <Badge variant={current.isActive ? 'default' : 'outline'} className="text-xs">
              {current.isActive ? '生效中' : '已过期'}
            </Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">免费用户</p>
                <p className="text-xs text-muted-foreground">升级解锁更多功能</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">免费</Badge>
          </div>
        )}
      </div>

      {/* 套餐卡片 */}
      <div className="rounded-2xl bg-card p-4 shadow-sm lg:bg-transparent lg:p-0 lg:shadow-none">
        <h2 className="mb-3 text-base font-bold lg:mb-4 lg:text-base lg:font-semibold">选择套餐</h2>
        {isLoading ? (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-xl border py-12 text-center text-muted-foreground text-sm">
            {t('common.empty')}
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            {plans.map((plan) => (
              <PlanCard key={plan.planId} plan={plan} isCurrent={current?.planId === plan.planId} />
            ))}
          </div>
        )}
      </div>

      {/* 权益对比 */}
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

      {/* 服务说明 */}
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
