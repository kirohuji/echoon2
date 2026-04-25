import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft, ArrowRight, Star, Eye, EyeOff, Languages, ChevronLeft, ChevronRight,
  Plus, Minus, SlidersHorizontal, Mic2, Loader2, AlertCircle, RotateCcw,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { AudioPlayer } from '@/components/common/audio-player'
import { TtsSettingsDialog } from '@/components/common/tts-settings-dialog'
import { getTopicQuestions, recordAction, type Question, type TopicQuestionsResult } from '@/features/practice/api'
import { addFavorite as apiFavorite, removeFavorite as apiUnfavorite } from '@/features/assets/api'
import { useAssetsStore, useWordsStore } from '@/stores/assets.store'
import { usePreferencesStore } from '@/stores/preferences.store'
import { synthesizeQuestion, getAudioUrl, type TtsWordTimestamp } from '@/lib/tts-api'
import { cn } from '@/lib/cn'

// ---------- 音频状态 ----------
type AudioState =
  | { status: 'idle' }
  | { status: 'generating' }
  | { status: 'ready'; audioId: string; wordTimestamps: TtsWordTimestamp[] | null; provider: string }
  | { status: 'error'; message: string }

export function PracticePage() {
  const { topicId } = useParams<{ topicId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { isFavorite, addFavorite, removeFavorite } = useAssetsStore()
  const { hasWord, addWord, removeWord } = useWordsStore()
  const { autoPlay, ttsBackend } = usePreferencesStore()

  const [topicData, setTopicData] = useState<TopicQuestionsResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [mode, setMode] = useState<'practice' | 'study'>('practice')
  const [ttsSettingsOpen, setTtsSettingsOpen] = useState(false)
  const [audioState, setAudioState] = useState<AudioState>({ status: 'idle' })

  const currentQuestion: Question | undefined = topicData?.questions[currentIndex]

  // 加载题目
  useEffect(() => {
    if (!topicId) return
    setIsLoading(true)
    getTopicQuestions(topicId)
      .then((data) => setTopicData(data))
      .catch(() => setError(t('common.error')))
      .finally(() => setIsLoading(false))
  }, [topicId, t])

  // 切题时重置音频状态
  useEffect(() => {
    setAudioState({ status: 'idle' })
  }, [currentIndex, currentQuestion?.questionId])

  // TTS 配置变更时也重置（让用户用新配置重新生成）
  useEffect(() => {
    setAudioState({ status: 'idle' })
  }, [ttsBackend.provider, ttsBackend.model, ttsBackend.voiceId])

  const handleGenerateAudio = useCallback(async () => {
    if (!currentQuestion) return
    setAudioState({ status: 'generating' })
    try {
      const result = await synthesizeQuestion({
        questionId: currentQuestion.questionId,
        provider: ttsBackend.provider,
        model: ttsBackend.model,
        voiceId: ttsBackend.voiceId,
        params: ttsBackend.params,
      })
      setAudioState({
        status: 'ready',
        audioId: result.id,
        wordTimestamps: result.wordTimestamps as TtsWordTimestamp[] | null,
        provider: ttsBackend.provider,
      })
    } catch (e: any) {
      setAudioState({
        status: 'error',
        message: e?.response?.data?.message || e?.message || '音频生成失败，请检查 API Key 配置',
      })
    }
  }, [currentQuestion, ttsBackend])

  const goToQuestion = useCallback(
    (index: number) => {
      if (!topicData) return
      const clamped = Math.max(0, Math.min(topicData.questions.length - 1, index))
      setCurrentIndex(clamped)
      setShowAnswer(false)
      setShowTranslation(false)
    },
    [topicData]
  )

  const handlePrev = useCallback(() => goToQuestion(currentIndex - 1), [currentIndex, goToQuestion])
  const handleNext = useCallback(() => goToQuestion(currentIndex + 1), [currentIndex, goToQuestion])

  const handleToggleFavorite = useCallback(async () => {
    if (!currentQuestion) return
    const qid = currentQuestion.questionId
    if (isFavorite(qid)) {
      removeFavorite(qid)
      try { await apiUnfavorite(qid) } catch {}
    } else {
      addFavorite(qid)
      try { await apiFavorite(qid) } catch {}
    }
    try {
      await recordAction({ questionId: qid, actionType: 'favorite', payload: { isFavorite: !isFavorite(qid) } })
    } catch {}
  }, [currentQuestion, isFavorite, addFavorite, removeFavorite])

  // 快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return
      switch (e.key) {
        case 'a': case 'A': setShowAnswer((v) => !v); break
        case 't': case 'T': setShowTranslation((v) => !v); break
        case 'f': case 'F': handleToggleFavorite(); break
        case 'ArrowLeft': handlePrev(); break
        case 'ArrowRight': case 'Enter': handleNext(); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handlePrev, handleNext, handleToggleFavorite])

  // ---------- Render ----------
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error) {
    return <div className="rounded-2xl bg-destructive/10 p-8 text-center text-destructive">{error}</div>
  }

  if (!topicData || topicData.questions.length === 0) {
    return <div className="py-20 text-center text-muted-foreground">{t('practice.noQuestions')}</div>
  }

  const total = topicData.questions.length
  const progress = Math.round(((currentIndex + 1) / total) * 100)
  const isFav = currentQuestion ? isFavorite(currentQuestion.questionId) : false

  return (
    <div className="space-y-4">
      <TtsSettingsDialog open={ttsSettingsOpen} onOpenChange={setTtsSettingsOpen} />

      {/* 顶部操作条 */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-1">
          <ArrowLeft className="h-4 w-4" />
          {t('practice.back')}
        </Button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{t('practice.mode')}：</span>
            {(['practice', 'study'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  mode === m
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {t(`practice.${m}Mode`)}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => setTtsSettingsOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            语音设置
          </Button>
        </div>
      </div>

      {/* 进度卡 */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{t('practice.progress')}</span>
                <span className="text-sm text-muted-foreground">{currentIndex + 1} / {total}</span>
              </div>
              <Progress value={progress} className="h-1.5 w-48" />
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === total - 1} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 题目大卡 */}
      {currentQuestion && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{currentIndex + 1}/{total}</Badge>
                {currentQuestion.difficulty && (
                  <Badge variant="secondary" className="text-xs">{currentQuestion.difficulty}</Badge>
                )}
                {currentQuestion.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost" size="sm"
                  onClick={handleToggleFavorite}
                  className={cn('gap-1.5', isFav && 'text-yellow-500')}
                >
                  <Star className={cn('h-4 w-4', isFav && 'fill-yellow-400')} />
                  {isFav ? t('practice.unfavorite') : t('practice.favorite')}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 题目文本 */}
            <div className="rounded-xl bg-muted/50 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{t('practice.question')}</p>
              <p className="text-base leading-relaxed">{currentQuestion.questionText}</p>
            </div>

            {/* 翻译 */}
            {currentQuestion.translation && (
              <div>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="gap-1.5 text-muted-foreground"
                >
                  <Languages className="h-4 w-4" />
                  {showTranslation ? t('practice.hideTranslation') : t('practice.showTranslation')}
                </Button>
                {showTranslation && (
                  <div className="mt-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 p-3 text-sm text-blue-700 dark:text-blue-300">
                    {currentQuestion.translation}
                  </div>
                )}
              </div>
            )}

            {/* 参考答案 */}
            {currentQuestion.referenceAnswer && (
              <div>
                <Button
                  variant="ghost" size="sm"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="gap-1.5"
                >
                  {showAnswer
                    ? <><EyeOff className="h-4 w-4" />{t('practice.hideAnswer')}</>
                    : <><Eye className="h-4 w-4" />{t('practice.showAnswer')}</>
                  }
                </Button>
                <div className={cn('mt-2 relative rounded-xl bg-muted/30 p-4', !showAnswer && mode === 'practice' && 'select-none')}>
                  {!showAnswer && mode === 'practice' && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-muted/80 backdrop-blur-sm z-10">
                      <span className="text-sm text-muted-foreground">点击「显示答案」查看</span>
                    </div>
                  )}
                  <p className="mb-1 text-xs font-medium text-muted-foreground">{t('practice.answer')}</p>
                  <p className="text-sm leading-relaxed">{currentQuestion.referenceAnswer}</p>
                </div>
              </div>
            )}

            {/* TTS 音频区块 */}
            <div className="border-t border-border/50 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  AI 语音朗读
                </span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono">
                    {ttsBackend.provider} · {ttsBackend.model}
                  </span>
                  {audioState.status === 'ready' && (
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      onClick={handleGenerateAudio}
                      title="用当前设置重新生成"
                    >
                      <RotateCcw className="size-3" />
                      重新生成
                    </button>
                  )}
                </div>
              </div>

              {audioState.status === 'idle' && (
                <button
                  type="button"
                  onClick={handleGenerateAudio}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-8 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  <Mic2 className="size-5" />
                  点击生成 AI 语音
                </button>
              )}

              {audioState.status === 'generating' && (
                <div className="flex items-center justify-center gap-2 rounded-2xl bg-muted/30 py-8 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  合成语音中，请稍候…
                </div>
              )}

              {audioState.status === 'error' && (
                <div className="rounded-2xl bg-destructive/10 p-4">
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{audioState.message}</span>
                  </div>
                  <Button
                    size="sm" variant="outline"
                    className="mt-3 h-7 text-xs"
                    onClick={handleGenerateAudio}
                  >
                    <RotateCcw className="mr-1.5 size-3" />
                    重试
                  </Button>
                </div>
              )}

              {audioState.status === 'ready' && (
                <AudioPlayer
                  audioUrl={getAudioUrl(audioState.audioId)}
                  wordTimestamps={audioState.wordTimestamps}
                  audioProvider={audioState.provider}
                />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部三列信息 */}
      {currentQuestion && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('practice.info')}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-muted-foreground">
              <div className="flex justify-between">
                <span>题目 ID</span>
                <span className="font-mono text-xs">{currentQuestion.questionId.slice(-8)}</span>
              </div>
              {currentQuestion.difficulty && (
                <div className="flex justify-between">
                  <span>难度</span>
                  <span>{currentQuestion.difficulty}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>序号</span>
                <span>{currentQuestion.orderIndex}</span>
              </div>
            </CardContent>
          </Card>

          {(currentQuestion.keywords?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('practice.keywords')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {currentQuestion.keywords?.map((kw) => (
                    <Badge
                      key={kw} variant="secondary" className="text-xs cursor-pointer"
                      onClick={() => { if (hasWord(kw)) removeWord(kw); else addWord(kw) }}
                    >
                      {kw}
                      {hasWord(kw) ? <Minus className="ml-1 h-2.5 w-2.5" /> : <Plus className="ml-1 h-2.5 w-2.5" />}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {(currentQuestion.vocabulary?.length || 0) > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t('practice.vocabulary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {currentQuestion.vocabulary?.map((v) => (
                  <div key={v.word} className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{v.word}</span>
                        {v.phonetic && <span className="text-xs text-muted-foreground">[{v.phonetic}]</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{v.meaning}</p>
                    </div>
                    <Button
                      variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                      onClick={() => { if (hasWord(v.word)) removeWord(v.word); else addWord(v.word) }}
                    >
                      {hasWord(v.word)
                        ? <Minus className="h-3.5 w-3.5 text-destructive" />
                        : <Plus className="h-3.5 w-3.5 text-primary" />
                      }
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* 底部导航 */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('practice.prev')}
        </Button>
        <span className="text-sm text-muted-foreground">
          <span className="font-medium">{currentIndex + 1}</span> / {total}
        </span>
        <Button onClick={handleNext} disabled={currentIndex === total - 1} className="gap-2">
          {t('practice.next')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="text-center text-xs text-muted-foreground pb-4">
        A: 答案 &nbsp;|&nbsp; T: 翻译 &nbsp;|&nbsp; F: 收藏 &nbsp;|&nbsp; ←/→: 切题
      </div>
    </div>
  )
}
