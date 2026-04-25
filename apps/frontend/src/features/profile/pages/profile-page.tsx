import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, ClipboardList, Star, BookMarked, Settings, User, Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { ConfigDataTable, type ColumnConfig } from '@/components/common/config-datatable'
import { BindingDialog } from '@/features/question-bank/components/binding-dialog'
import {
  getProfileOverview,
  getActivityHeatmap,
  getPracticeRecords,
  type ProfileOverview,
  type ActivityDay,
  type PracticeRecord,
  type PracticeRecordsResult,
} from '@/features/profile/api'
import { getFavorites, type FavoriteItem } from '@/features/assets/api'
import { usePreferencesStore } from '@/stores/preferences.store'
import { useWordsStore } from '@/stores/assets.store'
import { useConfigStore } from '@/stores/config.store'
import { cn } from '@/lib/cn'
import i18n from '@/lib/i18n'

type Tab = 'overview' | 'records' | 'favorites' | 'words' | 'settings'

const tabs: { key: Tab; icon: React.ElementType }[] = [
  { key: 'overview', icon: LayoutDashboard },
  { key: 'records', icon: ClipboardList },
  { key: 'favorites', icon: Star },
  { key: 'words', icon: BookMarked },
  { key: 'settings', icon: Settings },
]

export function ProfilePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      {/* 左侧边栏 */}
      <div className="md:col-span-1">
        <Card>
          <CardContent className="p-4">
            <div className="mb-4 flex flex-col items-center gap-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold">导游备考者</p>
              <Badge variant="secondary" className="text-xs">免费用户</Badge>
            </div>
            <Separator className="mb-4" />
            <nav className="space-y-1">
              {tabs.map(({ key, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                    activeTab === key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(`profile.${key}`)}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* 右侧内容 */}
      <div className="md:col-span-3">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'records' && <RecordsTab />}
        {activeTab === 'favorites' && <FavoritesTab />}
        {activeTab === 'words' && <WordsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function OverviewTab() {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<ProfileOverview | null>(null)
  const [heatmap, setHeatmap] = useState<ActivityDay[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([getProfileOverview(), getActivityHeatmap()]).then(([ovRes, hmRes]) => {
      if (ovRes.status === 'fulfilled') setOverview(ovRes.value)
      if (hmRes.status === 'fulfilled') setHeatmap(hmRes.value)
      setIsLoading(false)
    })
  }, [])

  const stats = overview
    ? [
        { label: '练习天数', value: overview.totalPracticeDays },
        { label: '累计做题', value: overview.totalQuestionsAnswered },
        { label: '收藏题目', value: overview.totalFavorites },
        { label: '生词本', value: overview.totalWords },
        { label: '连续打卡', value: `${overview.streakDays}天` },
        { label: '日均做题', value: overview.avgDailyQuestions },
      ]
    : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile.practiceStats')}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {stats.map(({ label, value }) => (
                <div key={label} className="rounded-xl bg-muted/50 p-3 text-center">
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{label}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {overview?.currentBank && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('profile.currentBank')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{overview.currentBank.bankName}</p>
            <p className="text-xs text-muted-foreground">ID: {overview.currentBank.bankId}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('profile.activityHeatmap')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityHeatmap days={heatmap} />
        </CardContent>
      </Card>
    </div>
  )
}

function ActivityHeatmap({ days }: { days: ActivityDay[] }) {
  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无活跃记录</p>
  }

  const levelColors = [
    'bg-muted',
    'bg-green-200 dark:bg-green-900',
    'bg-green-400 dark:bg-green-700',
    'bg-green-500 dark:bg-green-600',
    'bg-green-600 dark:bg-green-500',
  ]

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-0.5 flex-wrap">
        {days.map((day) => (
          <div
            key={day.date}
            title={`${day.date}: ${day.count} 次`}
            className={cn('h-3 w-3 rounded-sm', levelColors[day.level])}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
        <span>少</span>
        {levelColors.map((c, i) => (
          <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />
        ))}
        <span>多</span>
      </div>
    </div>
  )
}

function RecordsTab() {
  const { t } = useTranslation()
  const [data, setData] = useState<PracticeRecordsResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 15

  useEffect(() => {
    setIsLoading(true)
    getPracticeRecords({ page, pageSize })
      .then(setData)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [page])

  const columns: ColumnConfig<PracticeRecord>[] = [
    {
      key: 'topicName',
      header: t('profile.columns.topic'),
      cell: (v) => <span className="text-sm font-medium">{v}</span>,
    },
    {
      key: 'questionText',
      header: t('profile.columns.question'),
      cell: (v) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-[300px]">{v}</span>
      ),
    },
    {
      key: 'practiceCount',
      header: t('profile.columns.count'),
      cell: (v) => <Badge variant="secondary" className="text-xs">{v} 次</Badge>,
      width: 80,
    },
    {
      key: 'lastPracticeAt',
      header: t('profile.columns.date'),
      cell: (v) => (
        <span className="text-xs text-muted-foreground">
          {new Date(v).toLocaleDateString('zh-CN')}
        </span>
      ),
      width: 100,
    },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold">{t('profile.records')}</h2>
      <ConfigDataTable
        data={data?.list || []}
        columns={columns}
        total={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        isLoading={isLoading}
        emptyMessage={t('common.empty')}
      />
    </div>
  )
}

function FavoritesTab() {
  const { t } = useTranslation()
  const [data, setData] = useState<FavoriteItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getFavorites()
      .then((res) => setData(res?.list ?? []))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    )
  }

  if ((data ?? []).length === 0) {
    return (
      <div className="rounded-2xl bg-muted/40 py-20 text-center text-muted-foreground">
        <Star className="mx-auto mb-3 h-10 w-10 opacity-30" />
        {t('profile.noFavorites')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold">{t('profile.favorites')}</h2>
      {data.map((item) => (
        <Card key={item.questionId}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge variant="outline" className="mb-1 text-xs">{item.topicName}</Badge>
                <p className="text-sm">{item.questionText}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  收藏于 {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function WordsTab() {
  const { t } = useTranslation()
  const { words, removeWord } = useWordsStore()

  if (words.length === 0) {
    return (
      <div className="rounded-2xl bg-muted/40 py-20 text-center text-muted-foreground">
        <BookMarked className="mx-auto mb-3 h-10 w-10 opacity-30" />
        {t('profile.noWords')}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">{t('profile.words')}</h2>
        <Badge variant="secondary">{words.length} 个词</Badge>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {words.map((word) => (
          <div
            key={word}
            className="flex items-center justify-between rounded-xl bg-card px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.04)] dark:ring-1 dark:ring-white/[0.07]"
          >
            <span className="text-sm font-medium">{word}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => removeWord(word)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

function SettingsTab() {
  const { t } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { autoPlay, setAutoPlay, language, setLanguage } = usePreferencesStore()
  const { config } = useConfigStore()
  const [showBinding, setShowBinding] = useState(false)

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <div className="space-y-6">
      <BindingDialog open={showBinding} onClose={() => setShowBinding(false)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('profile.settings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('profile.autoPlay')}</Label>
              <p className="text-xs text-muted-foreground">进入练习页自动播放题目音频</p>
            </div>
            <Switch checked={autoPlay} onCheckedChange={setAutoPlay} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t('profile.theme')}</Label>
            <Select
              value={theme || 'system'}
              onChange={(e) => setTheme(e.target.value)}
              className="w-48"
            >
              <SelectItem value="light">{t('profile.themeLight')}</SelectItem>
              <SelectItem value="dark">{t('profile.themeDark')}</SelectItem>
              <SelectItem value="system">{t('profile.themeSystem')}</SelectItem>
            </Select>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>{t('profile.language')}</Label>
            <Select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="w-48"
            >
              <SelectItem value="zh-CN">{t('profile.langZh')}</SelectItem>
              <SelectItem value="en">{t('profile.langEn')}</SelectItem>
            </Select>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('profile.currentBank')}</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config?.bankName || '未配置题库'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowBinding(true)}>
                {t('profile.adjustBinding')}
              </Button>
            </div>
            {config && (
              <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <div>省份：{config.province}</div>
                <div>语种：{config.language}</div>
                <div>考试类型：{config.examType}</div>
                <div>面试形式：{config.interviewForm}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
