import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard, ClipboardList, Star, BookMarked, Settings, User, Trash2,
  Search, X, Volume2, Loader2, ChevronLeft, ChevronRight, Calendar, SortAsc,
  Plus, Sparkles, BookOpen, Link2, ExternalLink, Brain, BarChart2,
  GraduationCap, CheckCircle2, Lightbulb,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectItem } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
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
import { useWordsStore, type WordEntry } from '@/stores/assets.store'
import { useConfigStore } from '@/stores/config.store'
import {
  lookupWord, getBestPhonetic, getFirstAudio,
  type DictEntry, type Meaning,
} from '@/lib/dictionary-api'
import { enrichWord, type WordEnrichmentResult, type WordExampleItem } from '@/lib/practice-ai-api'
import { synthesizeText } from '@/lib/tts-api'
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
      {data.map((item, idx) => (
        <Card key={`${item.questionId}-${idx}`}>
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

// ═══════════════════════════════════════════════════════════════
// 生词本 Tab — 完整实现
// ═══════════════════════════════════════════════════════════════

type GroupMode = 'date' | 'alpha'

function getDateLabel(iso: string): string {
  const d = new Date(iso)
  const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (diffDays === 0) return '今天'
  if (diffDays === 1) return '昨天'
  if (diffDays < 7) return `${diffDays} 天前`
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

function groupEntries(entries: WordEntry[], mode: GroupMode) {
  if (mode === 'alpha') {
    const map = new Map<string, WordEntry[]>()
    for (const e of [...entries].sort((a, b) => a.word.localeCompare(b.word))) {
      const letter = e.word[0]?.toUpperCase() ?? '#'
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(e)
    }
    return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
  }
  const map = new Map<string, WordEntry[]>()
  for (const e of [...entries].sort(
    (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
  )) {
    const label = getDateLabel(e.addedAt)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(e)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

const POS_COLORS: Record<string, string> = {
  noun: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  verb: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  adjective: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  adverb: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  pronoun: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  preposition: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  conjunction: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
}


function MeaningSection({ meaning, chineseGloss }: { meaning: Meaning; chineseGloss?: string }) {
  const posColor = POS_COLORS[meaning.partOfSpeech] ?? 'bg-muted text-muted-foreground'
  const [playingIdx, setPlayingIdx] = useState<number | null>(null)

  const speakExample = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = 'en-US'; utt.rate = 0.9
    setPlayingIdx(idx)
    utt.onend = () => setPlayingIdx(null)
    window.speechSynthesis.speak(utt)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', posColor)}>
          {meaning.partOfSpeech}
        </span>
        {chineseGloss && (
          <span className="text-sm text-muted-foreground">{chineseGloss}</span>
        )}
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="space-y-3">
        {meaning.definitions.slice(0, 5).map((def, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed">{def.definition}</p>
            </div>
            {def.example && (
              <div className="ml-7 flex items-start gap-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 px-3 py-2 border border-blue-100 dark:border-blue-900/30">
                <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                <p className="flex-1 text-sm italic text-blue-800 dark:text-blue-300 leading-relaxed">"{def.example}"</p>
                <button type="button" onClick={() => speakExample(def.example!, i)}
                  className="shrink-0 text-blue-400 hover:text-blue-600 transition-colors">
                  {playingIdx === i ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            {(def.synonyms.length > 0 || def.antonyms.length > 0) && (
              <div className="ml-7 flex flex-wrap gap-3 text-xs">
                {def.synonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground">近义：</span>
                    {def.synonyms.slice(0, 5).map((s) => (
                      <span key={s} className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{s}</span>
                    ))}
                  </div>
                )}
                {def.antonyms.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground">反义：</span>
                    {def.antonyms.slice(0, 4).map((a) => (
                      <span key={a} className="rounded-md bg-red-50 px-1.5 py-0.5 text-red-700 dark:bg-red-900/20 dark:text-red-300">{a}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const LEVEL_CONFIG = {
  basic: { label: '基础', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  intermediate: { label: '进阶', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  advanced: { label: '高级', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
}

function ExampleCard({ ex, idx }: { ex: WordExampleItem; idx: number }) {
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle')
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cachedUrlRef = useRef<string | null>(null)
  const { ttsBackend } = usePreferencesStore()
  const cfg = LEVEL_CONFIG[ex.level]

  const handleSpeak = async () => {
    if (state === 'loading') return

    // 已缓存，直接播放
    if (cachedUrlRef.current) {
      audioRef.current?.play()
      return
    }

    setState('loading')
    try {
      const result = await synthesizeText({
        text: ex.en,
        provider: ttsBackend.provider,
        model: ttsBackend.model,
        voiceId: ttsBackend.voiceId,
        params: ttsBackend.params,
      })
      const url = `data:${result.mimeType};base64,${result.audioBase64}`
      cachedUrlRef.current = url
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onplay = () => setState('playing')
      audio.onended = () => setState('idle')
      audio.onerror = () => setState('error')
      await audio.play()
    } catch {
      setState('error')
    }
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/30">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">例句 {idx + 1}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', cfg.color)}>{cfg.label}</span>
        </div>
        <button type="button" onClick={handleSpeak}
          disabled={state === 'loading'}
          className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors disabled:opacity-60">
          {state === 'loading'
            ? <><Loader2 className="h-3 w-3 animate-spin" />合成中</>
            : state === 'playing'
            ? <><Volume2 className="h-3 w-3" />朗读中</>
            : state === 'error'
            ? <><Volume2 className="h-3 w-3 text-destructive" />重试</>
            : <><Volume2 className="h-3 w-3" />朗读</>}
        </button>
      </div>
      <div className="px-4 py-3 space-y-2">
        <p className="text-sm font-medium leading-relaxed">{ex.en}</p>
        <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-3">{ex.zh}</p>
        {ex.note && (
          <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
            <Lightbulb className="h-3.5 w-3.5 shrink-0 mt-0.5" />{ex.note}
          </p>
        )}
      </div>
    </div>
  )
}

function WordDetailDialog({
  entry, onClose, onPrev, onNext, hasPrev, hasNext,
}: {
  entry: WordEntry | null
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  const { removeWord } = useWordsStore()
  const [dictData, setDictData] = useState<DictEntry[] | null | 'loading'>(null)
  const [enrichData, setEnrichData] = useState<WordEnrichmentResult | null | 'loading'>(null)
  const [enrichError, setEnrichError] = useState('')
  const [activeTab, setActiveTab] = useState<'meanings' | 'examples' | 'synonyms'>('meanings')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!entry) return
    setDictData('loading')
    setEnrichData('loading')
    setEnrichError('')
    setActiveTab('meanings')

    lookupWord(entry.word).then((data) => {
      setDictData(data)
      const summary = data
        ? data.flatMap(e => e.meanings).slice(0, 3)
            .map(m => `${m.partOfSpeech}: ${m.definitions[0]?.definition ?? ''}`)
            .join(' | ')
        : undefined
      enrichWord(entry.word, summary)
        .then(setEnrichData)
        .catch((e) => { setEnrichData(null); setEnrichError(e?.message ?? '加载失败') })
    })
  }, [entry?.word])

  const playAudio = useCallback((url: string) => {
    audioRef.current?.pause()
    const a = new Audio(url.startsWith('//') ? 'https:' + url : url)
    audioRef.current = a
    a.play().catch(() => {})
  }, [])

  if (!entry) return null

  const dictEntries = Array.isArray(dictData) ? dictData : []
  const mainEntry = dictEntries[0]
  const phonetic = mainEntry ? getBestPhonetic(mainEntry) : null
  const phonetics = mainEntry?.phonetics.filter(p => p.text || p.audio) ?? []
  const audioUrl = mainEntry ? getFirstAudio(mainEntry.phonetics) : null
  const enriched = enrichData !== 'loading' && enrichData !== null ? enrichData : null
  const allMeanings = dictEntries.flatMap(e => e.meanings)

  const posGlossMap = new Map(
    (enriched?.meanings ?? []).map(m => [m.partOfSpeech, m.chineseGloss])
  )

  const allSynonyms = [...new Set(allMeanings.flatMap(m => [...m.synonyms, ...m.definitions.flatMap(d => d.synonyms)]))]
  const allAntonyms = [...new Set(allMeanings.flatMap(m => [...m.antonyms, ...m.definitions.flatMap(d => d.antonyms)]))]

  return (
    <Dialog open={!!entry} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl">

        {/* Header */}
        <div className="relative border-b border-border/50 bg-gradient-to-br from-primary/5 to-background px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight">{entry.word}</h1>
                {enriched?.chineseTranslation ? (
                  <span className="text-lg text-muted-foreground">{enriched.chineseTranslation}</span>
                ) : enrichData === 'loading' ? (
                  <Skeleton className="h-6 w-24 inline-block" />
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {phonetics.length > 0 ? phonetics.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    {p.text && <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-md">{p.text}</span>}
                    {p.audio && (
                      <button type="button" onClick={() => playAudio(p.audio!)}
                        className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary hover:bg-primary/20 transition-colors">
                        <Volume2 className="h-3 w-3" />{i === 0 ? 'UK' : i === 1 ? 'US' : '发音'}
                      </button>
                    )}
                  </div>
                )) : phonetic ? (
                  <span className="font-mono text-sm text-muted-foreground">{phonetic}</span>
                ) : null}
                {audioUrl && !phonetics.some(p => p.audio) && (
                  <button type="button" onClick={() => playAudio(audioUrl)}
                    className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary hover:bg-primary/20 transition-colors">
                    <Volume2 className="h-3.5 w-3.5" />发音
                  </button>
                )}
              </div>

              {enriched?.memoryTip && (
                <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 px-3 py-2 w-fit">
                  <Brain className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs text-amber-800 dark:text-amber-300">{enriched.memoryTip}</span>
                </div>
              )}
            </div>

            <button type="button" onClick={() => { removeWord(entry.word); onClose() }}
              className="shrink-0 rounded-xl p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="从生词本移除">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {mainEntry?.origin && (
            <div className="mt-3 flex items-start gap-2">
              <Link2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-medium">词源：</span>{mainEntry.origin}
              </p>
            </div>
          )}
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-1 border-b border-border/50 px-6 bg-muted/20">
          {([
            { key: 'meanings', icon: BookOpen, label: '释义', count: allMeanings.length },
            { key: 'examples', icon: GraduationCap, label: 'AI 例句', count: enriched?.examples.length ?? 0 },
            { key: 'synonyms', icon: BarChart2, label: '近反义词', count: allSynonyms.length + allAntonyms.length },
          ] as const).map(({ key, icon: Icon, label, count }) => (
            <button key={key} type="button" onClick={() => setActiveTab(key)}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
                activeTab === key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              )}>
              <Icon className="h-3.5 w-3.5" />{label}
              {count > 0 && (
                <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                  activeTab === key ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground')}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <ScrollArea className="flex-1">
          <div className="px-6 py-5">
            {activeTab === 'meanings' && (
              dictData === 'loading' ? (
                <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /></div>)}</div>
              ) : !mainEntry ? (
                <div className="py-12 text-center text-muted-foreground">
                  <BookOpen className="mx-auto mb-3 h-10 w-10 opacity-20" />
                  <p className="text-sm">未找到词典数据</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {allMeanings.map((meaning, mi) => (
                    <MeaningSection key={mi} meaning={meaning} chineseGloss={posGlossMap.get(meaning.partOfSpeech)} />
                  ))}
                  {mainEntry.sourceUrls?.map(url => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <ExternalLink className="h-3 w-3" />查看完整词条
                    </a>
                  ))}
                </div>
              )
            )}

            {activeTab === 'examples' && (
              enrichData === 'loading' ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="rounded-2xl border border-border/60 p-4 space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>)}</div>
              ) : enrichError ? (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{enrichError}</div>
              ) : !enriched?.examples.length ? (
                <div className="py-10 text-center text-muted-foreground">
                  <GraduationCap className="mx-auto mb-2 h-8 w-8 opacity-20" />
                  <p className="text-sm">AI 例句需要配置 DEEPSEEK_API_KEY</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                    AI 生成 · 覆盖基础、进阶、高级三个难度 · 点击朗读可播放
                  </p>
                  {enriched.examples.map((ex, i) => <ExampleCard key={i} ex={ex} idx={i} />)}
                </div>
              )
            )}

            {activeTab === 'synonyms' && (
              <div className="space-y-5">
                {allSynonyms.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />近义词
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allSynonyms.slice(0, 20).map(s => (
                        <span key={s} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {allAntonyms.length > 0 && (
                  <div>
                    <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />反义词
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {allAntonyms.slice(0, 20).map(a => (
                        <span key={a} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                {allSynonyms.length === 0 && allAntonyms.length === 0 && (
                  <div className="py-10 text-center text-muted-foreground text-sm">暂无近反义词数据</div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-muted/10">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPrev} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" />上一个
          </Button>
          <span className="text-xs text-muted-foreground">
            {new Date(entry.addedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}添加 · ←→ 切换
          </span>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNext} className="gap-1.5">
            下一个<ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 单词小卡片
function WordCard({
  entry, isSelected, onClick, onRemove,
}: {
  entry: WordEntry
  isSelected: boolean
  onClick: () => void
  onRemove: () => void
}) {
  const [dictData, setDictData] = useState<DictEntry[] | null | 'loading'>('loading')

  useEffect(() => { lookupWord(entry.word).then(setDictData) }, [entry.word])

  const first = Array.isArray(dictData) ? dictData[0] : null
  const phonetic = first ? getBestPhonetic(first) : null
  const firstMeaning = first?.meanings[0]
  const firstDef = firstMeaning?.definitions[0]?.definition

  return (
    <Card
      className={cn(
        'group relative cursor-pointer transition-all hover:shadow-md active:scale-[0.98]',
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{entry.word}</p>
            {phonetic && <p className="text-[10px] text-muted-foreground font-mono">{phonetic}</p>}
          </div>
          <button type="button"
            className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
            onClick={(e) => { e.stopPropagation(); onRemove() }}>
            <X className="h-3 w-3" />
          </button>
        </div>
        {firstMeaning && <Badge variant="outline" className="text-[10px] h-4">{firstMeaning.partOfSpeech}</Badge>}
        {dictData === 'loading' ? (
          <div className="space-y-1"><Skeleton className="h-2.5 w-full" /><Skeleton className="h-2.5 w-3/4" /></div>
        ) : firstDef ? (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{firstDef}</p>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic">暂无定义</p>
        )}
      </CardContent>
    </Card>
  )
}

function WordsTab() {
  const { t } = useTranslation()
  const { entries, removeWord, addWord } = useWordsStore()
  const [search, setSearch] = useState('')
  const [groupMode, setGroupMode] = useState<GroupMode>('date')
  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [addInput, setAddInput] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return entries
    const q = search.toLowerCase()
    return entries.filter((e) => e.word.toLowerCase().includes(q))
  }, [entries, search])

  const flatList = useMemo(
    () => [...filtered].sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()),
    [filtered]
  )

  const groups = useMemo(() => groupEntries(filtered, groupMode), [filtered, groupMode])

  const selectedEntry = flatList.find((e) => e.word === selectedWord) ?? null
  const selectedIdx = selectedEntry ? flatList.indexOf(selectedEntry) : -1

  const openWord = useCallback((word: string) => setSelectedWord(word), [])
  const closeDialog = useCallback(() => setSelectedWord(null), [])
  const gotoPrev = useCallback(() => {
    if (selectedIdx > 0) setSelectedWord(flatList[selectedIdx - 1].word)
  }, [selectedIdx, flatList])
  const gotoNext = useCallback(() => {
    if (selectedIdx < flatList.length - 1) setSelectedWord(flatList[selectedIdx + 1].word)
  }, [selectedIdx, flatList])

  const handleAdd = () => {
    const w = addInput.trim().toLowerCase()
    if (!w) return
    addWord(w)
    setAddInput('')
  }

  // 键盘 ← → 在 dialog 里切换
  useEffect(() => {
    if (!selectedWord) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') gotoPrev()
      else if (e.key === 'ArrowRight') gotoNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedWord, gotoPrev, gotoNext])

  if (entries.length === 0 && !search) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Input
            placeholder="手动添加单词"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8 max-w-xs text-sm"
          />
          <Button size="sm" className="h-8 gap-1.5" onClick={handleAdd} disabled={!addInput.trim()}>
            <Plus className="h-3.5 w-3.5" />添加
          </Button>
        </div>
        <div className="rounded-2xl bg-muted/40 py-16 text-center text-muted-foreground">
          <BookMarked className="mx-auto mb-3 h-10 w-10 opacity-30" />
          <p>{t('profile.noWords')}</p>
          <p className="mt-1 text-xs opacity-70">在练习页面点击单词旁的 ＋ 按钮添加</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base font-semibold">{t('profile.words')}</h2>
          <Badge variant="secondary">{entries.length}</Badge>
        </div>

        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        {/* 分组 */}
        <div className="flex rounded-lg bg-muted p-0.5">
          {([
            { mode: 'date', icon: Calendar, label: '按日期' },
            { mode: 'alpha', icon: SortAsc, label: '字母序' },
          ] as const).map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              onClick={() => setGroupMode(mode)}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all',
                groupMode === mode
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3 w-3" />{label}
            </button>
          ))}
        </div>

        {/* 手动添加 */}
        <div className="flex items-center gap-1">
          <Input
            placeholder="添加单词"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="h-8 w-24 text-sm"
          />
          <Button size="sm" className="h-8 w-8 p-0" onClick={handleAdd} disabled={!addInput.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* 分组卡片 */}
      {filtered.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          <Search className="mx-auto mb-2 h-7 w-7 opacity-30" />
          没有找到匹配的单词
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-2.5 flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </span>
                <Badge variant="outline" className="text-[10px] h-4">{group.items.length}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((e) => (
                  <WordCard
                    key={e.word}
                    entry={e}
                    isSelected={selectedWord === e.word}
                    onClick={() => openWord(e.word)}
                    onRemove={() => removeWord(e.word)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 单词详情 Dialog */}
      <WordDetailDialog
        entry={selectedEntry}
        onClose={closeDialog}
        onPrev={gotoPrev}
        onNext={gotoNext}
        hasPrev={selectedIdx > 0}
        hasNext={selectedIdx < flatList.length - 1}
      />
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
