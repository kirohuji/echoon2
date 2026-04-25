import { post } from './request'
import instance from './request'

export type AiFeedback = {
  score: number
  level: string
  summary: string
  strengths: string[]
  improvements: string[]
  languageNotes: string[]
  pronunciationNotes: string[] | null
  revisedAnswer: string
  keywordsUsed: string[]
  keywordsMissed: string[]
}

export type TranscribeRecordingResult = {
  audioBase64: string
  mimeType: string
  text: string | null
  wordTimestamps: Array<{ text: string; start_time: number; end_time?: number }> | null
}

/** 上传录音 → Whisper 转写（若未配置 Whisper 则仅返回音频 base64） */
export const transcribeRecording = (audioBlob: Blob, filename = 'recording.webm'): Promise<TranscribeRecordingResult> => {
  const form = new FormData()
  form.append('audio', audioBlob, filename)
  return instance.post('/tts/transcribe-recording', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120_000,
  }) as any
}

/** 提交用户作答获取 AI 结构化评分 */
export const getAiFeedback = (payload: {
  questionId: string
  userAnswer: string
  isVoice?: boolean
}): Promise<AiFeedback> => post('/practice-ai/feedback', payload)
