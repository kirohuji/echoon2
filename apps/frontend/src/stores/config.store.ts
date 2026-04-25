import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ExamConfig {
  province: string
  language: string
  examType: string
  interviewForm: string
  bankId?: string
  bankName?: string
}

interface ConfigStore {
  config: ExamConfig | null
  isConfigured: boolean
  setConfig: (config: ExamConfig) => void
  clearConfig: () => void
}

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set) => ({
      config: null,
      isConfigured: false,
      setConfig: (config) => set({ config, isConfigured: true }),
      clearConfig: () => set({ config: null, isConfigured: false }),
    }),
    { name: 'guide-exam-config' }
  )
)
