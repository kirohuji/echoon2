import instance from './request'

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

const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3000'

/**
 * 流式 AI 评分反馈 —— 返回 ReadableStream<string>
 * 后端用 Vercel AI SDK pipeTextStreamToResponse，响应为 chunked plain text
 */
export async function streamFeedback(
  payload: { questionId: string; userAnswer: string; isVoice?: boolean },
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(`${API_BASE}/practice-ai/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok) throw new Error(`AI 评分失败 ${res.status}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    // Vercel AI SDK text stream：每个 chunk 是原始文本
    // 过滤掉 "0:" 前缀（data stream 格式）和换行
    const cleaned = chunk.replace(/^\d+:/gm, '').replace(/^"(.*)"$/gm, '$1')
    onChunk(cleaned)
  }
}

/**
 * 流式 AI 教学指导 —— 返回 ReadableStream<string>
 */
export async function streamTeaching(
  payload: { questionId: string; userDraft?: string },
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(`${API_BASE}/practice-ai/teach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })
  if (!res.ok) throw new Error(`教学指导失败 ${res.status}`)
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    const cleaned = chunk.replace(/^\d+:/gm, '').replace(/^"(.*)"$/gm, '$1')
    onChunk(cleaned)
  }
}
