import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Preferences {
  autoPlay: boolean
  theme: string
  language: string
}

interface PreferencesStore extends Preferences {
  setAutoPlay: (autoPlay: boolean) => void
  setTheme: (theme: string) => void
  setLanguage: (language: string) => void
}

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      autoPlay: false,
      theme: 'system',
      language: 'zh-CN',
      setAutoPlay: (autoPlay) => set({ autoPlay }),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => {
        set({ language })
        localStorage.setItem('guide-exam-language', language)
      },
    }),
    { name: 'guide-exam-preferences' }
  )
)
