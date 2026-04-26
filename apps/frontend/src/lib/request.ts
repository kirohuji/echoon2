import axios from 'axios'

function createDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `device-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

function getOrCreateDeviceId(): string {
  const key = 'guide-exam-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = createDeviceId()
    localStorage.setItem(key, id)
  }
  return id
}

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1/guide-exam',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

instance.interceptors.request.use((config) => {
  config.headers['x-device-id'] = getOrCreateDeviceId()
  return config
})

instance.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data
    }
    return data
  },
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      '请求失败'
    console.error('[API Error]', msg, error)
    return Promise.reject(error)
  }
)

export const get = <T = any>(url: string, params?: Record<string, any>): Promise<T> =>
  instance.get(url, { params }) as any

export const post = <T = any>(url: string, data?: any): Promise<T> =>
  instance.post(url, data) as any

export const put = <T = any>(url: string, data?: any): Promise<T> =>
  instance.put(url, data) as any

export const del = <T = any>(url: string): Promise<T> =>
  instance.delete(url) as any

export default instance
