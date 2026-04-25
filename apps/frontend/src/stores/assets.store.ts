import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AssetsStore {
  favoriteIds: string[]
  words: string[]
  addFavorite: (id: string) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  addWord: (word: string) => void
  removeWord: (word: string) => void
  hasWord: (word: string) => boolean
}

export const useAssetsStore = create<AssetsStore>()(
  persist(
    (set, get) => ({
      favoriteIds: [],
      words: [],

      addFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.includes(id)
            ? state.favoriteIds
            : [...state.favoriteIds, id],
        })),

      removeFavorite: (id) =>
        set((state) => ({
          favoriteIds: state.favoriteIds.filter((fid) => fid !== id),
        })),

      isFavorite: (id) => get().favoriteIds.includes(id),

      addWord: (word) =>
        set((state) => ({
          words: state.words.includes(word) ? state.words : [...state.words, word],
        })),

      removeWord: (word) =>
        set((state) => ({
          words: state.words.filter((w) => w !== word),
        })),

      hasWord: (word) => get().words.includes(word),
    }),
    {
      name: 'guide-exam-favorites',
      partialize: (state) => ({ favoriteIds: state.favoriteIds }),
    }
  )
)

interface WordsStore {
  words: string[]
  addWord: (word: string) => void
  removeWord: (word: string) => void
  hasWord: (word: string) => boolean
}

export const useWordsStore = create<WordsStore>()(
  persist(
    (set, get) => ({
      words: [],
      addWord: (word) =>
        set((state) => ({
          words: state.words.includes(word) ? state.words : [...state.words, word],
        })),
      removeWord: (word) =>
        set((state) => ({ words: state.words.filter((w) => w !== word) })),
      hasWord: (word) => get().words.includes(word),
    }),
    { name: 'guide-exam-words' }
  )
)
