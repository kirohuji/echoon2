import { get } from '@/lib/request'

export interface ProfileOverview {
  userId: string
  nickname?: string
  avatar?: string
  currentBank?: { bankId: string; bankName: string }
  totalPracticeDays: number
  totalQuestionsAnswered: number
  totalFavorites: number
  totalWords: number
  streakDays: number
  avgDailyQuestions: number
}

export interface ActivityDay {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

export interface PracticeRecord {
  recordId: string
  topicId: string
  topicName: string
  questionId: string
  questionText: string
  practiceCount: number
  lastPracticeAt: string
}

export interface PracticeRecordsResult {
  list: PracticeRecord[]
  total: number
  page: number
  pageSize: number
}

export const getProfileOverview = (): Promise<ProfileOverview> => get('/profile/overview')

export const getActivityHeatmap = (year?: number): Promise<ActivityDay[]> =>
  get('/profile/activity', { year: year || new Date().getFullYear() })

export const getPracticeRecords = (params: {
  page?: number
  pageSize?: number
  topicId?: string
}): Promise<PracticeRecordsResult> => get('/profile/practice-records', params)
