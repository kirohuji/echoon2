import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Star, BookOpen, TrendingUp, Calendar, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfigDataTable, type ColumnConfig } from '@/components/common/config-datatable'
import { BindingDialog } from '@/features/question-bank/components/binding-dialog'
import { getQuestionBankHome, type QuestionBankHome, type ScenicCard, type OtherTopic } from '@/features/question-bank/api'
import { useConfigStore } from '@/stores/config.store'
import { useAssetsStore } from '@/stores/assets.store'
import { cn } from '@/lib/cn'

type TabMode = 'practice' | 'study'

export function HomePage() {
  const { t } = useTranslation()
  const { isConfigured } = useConfigStore()
  const { isFavorite, addFavorite, removeFavorite } = useAssetsStore()

  const [showBinding, setShowBinding] = useState(false)
  const [homeData, setHomeData] = useState<QuestionBankHome | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [mode, setMode] = useState<TabMode>('practice')
  const [topicPage, setTopicPage] = useState(1)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchData = useCallback(async (kw?: string, m?: string) => {
    setIsLoading(true)
    setError('')
    try {
      const data = await getQuestionBankHome({ keyword: kw, mode: m })
      setHomeData(data)
    } catch {
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }, [t])

  useEffect(() => {
    if (!isConfigured) setShowBinding(true)
  }, [isConfigured])

  useEffect(() => {
    if (!isConfigured) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchData(keyword, mode)
    }, keyword ? 300 : 0)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [keyword, mode, isConfigured, fetchData])

  const otherTopicsColumns: ColumnConfig<OtherTopic>[] = [
    {
      key: 'name',
      header: t('home.columns.topic'),
      cell: (v, row) => (
        <span className="font-medium">{v}</span>
      ),
    },
    {
      key: 'questionCount',
      header: t('home.columns.count'),
      cell: (v) => <span className="text-muted-foreground">{v}</span>,
      width: 80,
    },
    {
      key: 'masteredCount',
      header: t('home.columns.mastered'),
      cell: (v) => <span className="text-green-600 dark:text-green-400">{v}</span>,
      width: 80,
    },
    {
      key: 'masteryRate',
      header: t('home.columns.progress'),
      cell: (v) => (
        <div className="flex items-center gap-2">
          <Progress value={v} className="h-1.5 w-20" />
          <span className="text-xs text-muted-foreground">{v}%</span>
        </div>
      ),
      width: 160,
    },
    {
      key: 'topicId',
      header: t('home.columns.action'),
      cell: (v) => (
        <Link to={`/practice/${v}`}>
          <Button size="sm" variant="outline" className="h-7 text-xs">
            {t('common.goTo')}
          </Button>
        </Link>
      ),
      width: 100,
    },
  ]

  const paginatedOtherTopics = homeData?.otherTopics.slice(
    (topicPage - 1) * 10,
    topicPage * 10
  ) || []

  const modeTabRow = (
    <div className="flex gap-2">
      {(['practice', 'study'] as TabMode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={cn(
            'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
            mode === m
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          )}
        >
          {t(`home.hero.${m}`)}
        </button>
      ))}
    </div>
  )

  return (
    <div className="space-y-5 md:space-y-8">
      <BindingDialog
        open={showBinding}
        onClose={() => setShowBinding(false)}
        forceOpen={!isConfigured}
      />

      {/* 搜索栏 — 手机置顶全宽，桌面保留在原位 */}
      <div className="relative md:hidden">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('home.hero.searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Hero — 手机端：紧凑横向数字条 */}
      <div className="md:hidden">
        {homeData?.bankName && (
          <p className="mb-2 text-xs text-muted-foreground">{homeData.bankName}</p>
        )}
        {modeTabRow}
        {isLoading ? (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-20 flex-shrink-0 rounded-xl" />
            ))}
          </div>
        ) : homeData ? (
          <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
            <MiniStatCard icon={Calendar} label={t('home.hero.practiceDays')} value={homeData.practiceDays} />
            <MiniStatCard icon={BookOpen} label={t('home.hero.totalQuestions')} value={homeData.totalQuestions} />
            <MiniStatCard icon={Target} label={t('home.hero.mastered')} value={homeData.masteredQuestions} />
            {homeData.lastMockScore !== undefined && (
              <MiniStatCard icon={TrendingUp} label={t('home.hero.lastMock')} value={`${homeData.lastMockScore}分`} />
            )}
          </div>
        ) : null}
      </div>

      {/* Hero — 桌面端：原有大卡片 */}
      <Card className="hidden md:block overflow-hidden bg-primary/[0.04] dark:bg-primary/[0.08]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t('home.title')}</h1>
              {homeData?.bankName && (
                <p className="mt-1 text-muted-foreground">{homeData.bankName}</p>
              )}
              <div className="mt-4">{modeTabRow}</div>
            </div>

            {isLoading ? (
              <div className="flex gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-14 w-20" />
                ))}
              </div>
            ) : homeData ? (
              <div className="flex flex-wrap gap-6">
                <StatItem icon={Calendar} label={t('home.hero.practiceDays')} value={homeData.practiceDays} />
                <StatItem icon={BookOpen} label={t('home.hero.totalQuestions')} value={homeData.totalQuestions} />
                <StatItem icon={Target} label={t('home.hero.mastered')} value={homeData.masteredQuestions} />
                {homeData.lastMockScore !== undefined && (
                  <StatItem icon={TrendingUp} label={t('home.hero.lastMock')} value={`${homeData.lastMockScore}分`} />
                )}
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {/* 搜索栏 — 桌面端 */}
      <div className="relative hidden max-w-md md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('home.hero.searchPlaceholder')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 景点介绍 */}
      <section>
        <div className="mb-3 flex items-center justify-between md:mb-4">
          <h2 className="text-base font-semibold md:text-lg">{t('home.scenic.title')}</h2>
          <Badge variant="secondary">{homeData?.scenicCards.length ?? 0} 个景点</Badge>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-40 md:h-48" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-destructive/10 p-8 text-center text-destructive">
            {error}
          </div>
        ) : homeData?.scenicCards.length === 0 ? (
          <div className="rounded-2xl bg-muted/40 py-12 text-center text-muted-foreground">
            {t('common.empty')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 md:gap-4">
            {(homeData?.scenicCards ?? []).map((card) => (
              <ScenicCardItem
                key={card.id}
                card={card}
                isFav={isFavorite(card.topicId)}
                onToggleFav={() => {
                  if (isFavorite(card.topicId)) {
                    removeFavorite(card.topicId)
                  } else {
                    addFavorite(card.topicId)
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* 其他题型 — 桌面端：表格；手机端：卡片列表 */}
      {(homeData?.otherTopics.length || 0) > 0 && (
        <section>
          <div className="mb-3 md:mb-4">
            <h2 className="text-base font-semibold md:text-lg">{t('home.otherTopics.title')}</h2>
          </div>

          {/* 手机端卡片列表 */}
          <div className="md:hidden space-y-2">
            {isLoading
              ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
              : (homeData?.otherTopics ?? []).map((topic) => (
                  <OtherTopicCard key={topic.topicId} topic={topic} />
                ))}
          </div>

          {/* 桌面端表格 */}
          <div className="hidden md:block">
            <ConfigDataTable
              data={paginatedOtherTopics}
              columns={otherTopicsColumns}
              total={homeData?.otherTopics.length || 0}
              page={topicPage}
              pageSize={10}
              onPageChange={setTopicPage}
              isLoading={isLoading}
              emptyMessage={t('common.empty')}
            />
          </div>
        </section>
      )}
    </div>
  )
}

function MiniStatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-muted/50 px-3 py-2.5">
      <Icon className="h-4 w-4 text-primary" />
      <div className="flex flex-col">
        <span className="text-base font-bold leading-tight">{value}</span>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <span className="text-xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function OtherTopicCard({ topic }: { topic: OtherTopic }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{topic.name}</p>
        <div className="mt-1 flex items-center gap-2">
          <Progress value={topic.masteryRate} className="h-1 flex-1" />
          <span className="flex-shrink-0 text-[10px] text-muted-foreground">
            {topic.masteredCount}/{topic.questionCount} · {topic.masteryRate}%
          </span>
        </div>
      </div>
      <Link to={`/practice/${topic.topicId}`}>
        <Button size="sm" variant="outline" className="h-7 flex-shrink-0 text-xs">
          {t('common.goTo')}
        </Button>
      </Link>
    </div>
  )
}

function ScenicCardItem({
  card,
  isFav,
  onToggleFav,
}: {
  card: ScenicCard
  isFav: boolean
  onToggleFav: () => void
}) {
  const { t } = useTranslation()

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_24px_rgba(0,0,0,0.10)] dark:hover:ring-white/[0.12]">
      <div className="relative h-24 bg-gradient-to-br from-muted to-muted/30 md:h-32">
        {card.coverImage ? (
          <img src={card.coverImage} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/40 md:h-10 md:w-10" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onToggleFav()
          }}
          className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 backdrop-blur-sm transition-opacity md:right-2 md:top-2"
        >
          <Star
            className={cn(
              'h-3.5 w-3.5 transition-colors md:h-4 md:w-4',
              isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        </button>
      </div>
      <CardContent className="p-2 md:p-3">
        <h3 className="text-xs font-medium leading-tight md:text-sm">{card.name}</h3>
        <div className="mt-1.5 space-y-1 md:mt-2">
          <div className="flex justify-between text-[10px] text-muted-foreground md:text-xs">
            <span>{card.masteredCount}/{card.questionCount} 题</span>
            <span>{card.masteryRate}%</span>
          </div>
          <Progress value={card.masteryRate} className="h-1" />
        </div>
        <Link to={`/practice/${card.topicId}`} className="mt-2 block md:mt-3">
          <Button size="sm" className="h-6 w-full text-[10px] md:h-7 md:text-xs">
            {t('common.goTo')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
