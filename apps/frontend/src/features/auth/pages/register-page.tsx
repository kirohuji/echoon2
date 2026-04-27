import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUpWithEmailPassword } from '@/features/auth/api'
import { cn } from '@/lib/cn'

export function RegisterPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const validate = () => {
    if (!name.trim()) { setMessage('请输入用户名'); return false }
    if (!email.trim()) { setMessage('请输入邮箱'); return false }
    if (password.length < 8) { setMessage('密码至少8位'); return false }
    if (password !== confirmPassword) { setMessage('两次密码不一致'); return false }
    return true
  }

  const onRegister = async () => {
    if (!validate()) return
    try {
      setLoading(true)
      setMessage('')
      await signUpWithEmailPassword(email, password, name.trim())
      setMessage('注册成功，正在跳转个人中心')
      setTimeout(() => navigate('/profile'), 1200)
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const strengthColor = (p: string) => {
    if (p.length < 8) return 'bg-red-400'
    if (p.length < 12) return 'bg-yellow-400'
    return 'bg-green-400'
  }

  const strengthLabel = (p: string) => {
    if (p.length === 0) return null
    if (p.length < 8) return '弱'
    if (p.length < 12) return '中'
    return '强'
  }

  return (
    <div className="mx-auto max-w-5xl">
      {/* 品牌标题区 */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">创建账号</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          已有账号？
          <Link to="/auth/login" className="ml-1 text-primary hover:underline font-medium">
            去登录
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 左侧品牌装饰 */}
        <div className="hidden lg:flex lg:col-span-2 flex-col justify-center">
          <div className="rounded-2xl bg-primary/5 p-8 border border-primary/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary fill-primary/30" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">加入导游备考</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              免费注册，解锁全部功能。题库练习、模拟考试、TTS 训练，全部尽在掌握。
            </p>
            <div className="mt-6 space-y-3">
              {[
                { label: '免费题库', desc: '历年真题持续更新' },
                { label: '智能模考', desc: 'AI 评分即时反馈' },
                { label: 'TTS 听力', desc: '支持口语听说训练' },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="mt-0.5 h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-primary fill-primary" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧注册表单 */}
        <div className="lg:col-span-3">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <Label className="text-sm">用户名</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="你的显示名称"
                  className="h-11"
                  autoComplete="name"
                  maxLength={30}
                />
                <p className="text-xs text-muted-foreground">将显示在你的个人中心和练习记录中</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">邮箱</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11"
                  autoComplete="email"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">密码</Label>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="至少8位字符"
                  className="h-11"
                  autoComplete="new-password"
                />
                {password.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-300', strengthColor(password))} style={{ width: `${Math.min(100, (password.length / 16) * 100)}%` }} />
                    </div>
                    <span className={cn('text-xs font-medium', password.length < 8 ? 'text-red-500' : password.length < 12 ? 'text-yellow-500' : 'text-green-600')}>
                      {strengthLabel(password)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm">确认密码</Label>
                <Input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="再次输入密码"
                  className="h-11"
                  autoComplete="new-password"
                />
              </div>

              <Button
                className="w-full h-11 text-base font-medium shadow-sm"
                disabled={loading}
                onClick={onRegister}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '立即注册'}
              </Button>

              {message && (
                <p className={cn(
                  'text-sm text-center rounded-lg px-4 py-3',
                  message.includes('成功') ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
                )}>
                  {message}
                </p>
              )}

              <p className="text-xs text-center text-muted-foreground leading-relaxed">
                注册即表示同意
                <Link to="/terms" className="text-primary hover:underline">服务条款</Link>
                和
                <Link to="/privacy" className="text-primary hover:underline">隐私政策</Link>
              </p>
            </CardContent>
          </Card>
        </div>
              </div>
    </div>
  )
}