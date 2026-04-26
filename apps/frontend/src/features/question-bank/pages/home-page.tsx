import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Star, BookOpen, TrendingUp, Calendar, Target } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

  return (
    <div className="space-y-8">
      <BindingDialog
        open={showBinding}
        onClose={() => setShowBinding(false)}
        forceOpen={!isConfigured}
      />

      {/* Hero */}
      <Card className="overflow-hidden bg-primary/[0.04] dark:bg-primary/[0.08]">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{t('home.title')}</h1>
              {homeData?.bankName && (
                <p className="mt-1 text-muted-foreground">{homeData.bankName}</p>
              )}
              <div className="mt-4 flex gap-2">
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

      {/* 搜索 */}
      <div className="relative max-w-md">
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('home.scenic.title')}</h2>
          <Badge variant="secondary">{homeData?.scenicCards.length ?? 0} 个景点</Badge>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-48" />
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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

      {/* 其他题型 */}
      {(homeData?.otherTopics.length || 0) > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold">{t('home.otherTopics.title')}</h2>
          </div>
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
        </section>
      )}
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
      <div className="relative h-32 bg-gradient-to-br from-muted to-muted/30">
        {card.coverImage ? (
          <img src={card.coverImage} alt={card.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault()
            onToggleFav()
          }}
          className="absolute right-2 top-2 rounded-full bg-background/80 p-1 backdrop-blur-sm transition-opacity"
        >
          <Star
            className={cn(
              'h-4 w-4 transition-colors',
              isFav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
            )}
          />
        </button>
      </div>
      <CardContent className="p-3">
        <h3 className="font-medium text-sm leading-tight">{card.name}</h3>
        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{card.masteredCount}/{card.questionCount} 题</span>
            <span>{card.masteryRate}%</span>
          </div>
          <Progress value={card.masteryRate} className="h-1" />
        </div>
        <Link to={`/practice/${card.topicId}`} className="mt-3 block">
          <Button size="sm" className="w-full h-7 text-xs">
            {t('common.goTo')}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
