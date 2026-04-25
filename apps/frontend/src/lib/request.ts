import axios from 'axios'

function getOrCreateDeviceId(): string {
  const key = 'guide-exam-device-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

const instance = axios.create({
  baseURL: '/api/v1/guide-exam',
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
