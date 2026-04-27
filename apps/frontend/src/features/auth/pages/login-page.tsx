import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  sendEmailOtp,
  sendPhoneOtp,
  signInWithEmailOtp,
  signInWithEmailPassword,
  signInWithWechat,
  verifyPhoneOtp,
} from '@/features/auth/api'
import { cn } from '@/lib/cn'

type AuthTab = 'password' | 'email-otp' | 'phone-otp'

export function LoginPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AuthTab>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [phoneOtp, setPhoneOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpsent, setOtpsent] = useState(false)
  const [phoneOtpSent, setPhoneOtpSent] = useState(false)
  const [message, setMessage] = useState('')

  const runAction = async (
    task: () => Promise<any>,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    try {
      setLoading(true)
      setMessage('')
      await task()
      setMessage(successMessage)
      if (onSuccess) onSuccess()
    } catch (error: any) {
      setMessage(error?.response?.data?.message || error?.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmailOtp = async () => {
    if (!email) { setMessage('请先输入邮箱'); return }
    await runAction(
      () => sendEmailOtp(email),
      '验证码已发送（开发环境请看后端日志）',
      () => setOtpsent(true),
    )
  }

  const handleSendPhoneOtp = async () => {
    if (!phoneNumber) { setMessage('请先输入手机号'); return }
    await runAction(
      () => sendPhoneOtp(phoneNumber),
      '验证码已发送（开发环境请看后端日志）',
      () => setPhoneOtpSent(true),
    )
  }

  const tabButtonClass = (tab: AuthTab) =>
    cn(
      'flex-1 h-10 text-sm font-medium rounded-md transition-all duration-200',
      activeTab === tab
        ? 'bg-primary text-primary-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    )

  return (
    <div className="mx-auto max-w-5xl">
      {/* 品牌标题区 */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">登录导游备考</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          还没有账号？
          <Link to="/auth/register" className="ml-1 text-primary hover:underline font-medium">
            立即注册
          </Link>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* 左侧品牌/装饰区 */}
        <div className="hidden lg:flex lg:col-span-2 flex-col justify-center">
          <div className="rounded-2xl bg-primary/5 p-8 border border-primary/10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-primary fill-primary/30" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">随时随地，高效备考</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              整合题库、模拟考试、TTS 听力训练，帮助你在碎片化时间里稳步提升。
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { label: '题库', sub: '精选历年真题' },
                { label: '模考', sub: '智能评估报告' },
                { label: 'TTS', sub: '听说读写全覆盖' },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-background/80 p-3 text-center shadow-sm">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧表单区 */}
        <div className="lg:col-span-3">
          <Card className="shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.06)]">
            <CardContent className="p-6 space-y-5">
              {/* Tab 切换 */}
              <div className="flex rounded-md bg-muted/60 p-1">
                <button type="button" onClick={() => setActiveTab('password')} className={tabButtonClass('password')}>
                  密码登录
                </button>
                <button type="button" onClick={() => setActiveTab('email-otp')} className={tabButtonClass('email-otp')}>
                  邮箱验证码
                </button>
                <button type="button" onClick={() => setActiveTab('phone-otp')} className={tabButtonClass('phone-otp')}>
                  手机验证码
                </button>
              </div>

              {/* 密码登录 */}
              {activeTab === 'password' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">邮箱</Label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="h-11"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">密码</Label>
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type="password"
                      placeholder="请输入密码"
                      className="h-11"
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    className="w-full h-11 text-base font-medium shadow-sm"
                    disabled={loading}
                    onClick={() => runAction(() => signInWithEmailPassword(email, password), '登录成功，即将跳转', () => navigate('/profile'))}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '登录'}
                  </Button>

                  <div className="flex items-center justify-between text-sm">
                    <Link to="/auth/register" className="text-muted-foreground hover:text-primary transition-colors">
                      忘记密码？
                    </Link>
                    <Link to="/auth/register" className="text-muted-foreground hover:text-primary transition-colors">
                      注册账号
                    </Link>
                  </div>
                </div>
              )}

              {/* 邮箱验证码登录 */}
              {activeTab === 'email-otp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">邮箱</Label>
                    <Input
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setOtpsent(false) }}
                      placeholder="you@example.com"
                      className="h-11"
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">验证码</Label>
                    <div className="flex gap-2">
                      <Input
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value)}
                        placeholder="6位验证码"
                        className="h-11 flex-1"
                        maxLength={6}
                      />
                      <Button
                        variant="outline"
                        className="h-11 shrink-0 px-4"
                        disabled={loading || otpsent}
                        onClick={handleSendEmailOtp}
                      >
                        {otpsent ? '已发送' : '发送验证码'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full h-11 text-base font-medium shadow-sm"
                    disabled={loading || !otpsent || !emailOtp}
                    onClick={() => runAction(() => signInWithEmailOtp(email, emailOtp), '登录成功，即将跳转', () => navigate('/profile'))}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证并登录'}
                  </Button>
                </div>
              )}

              {/* 手机验证码登录 */}
              {activeTab === 'phone-otp' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">手机号</Label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => { setPhoneNumber(e.target.value); setPhoneOtpSent(false) }}
                      placeholder="+8613800000000"
                      className="h-11"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">验证码</Label>
                    <div className="flex gap-2">
                      <Input
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value)}
                        placeholder="6位验证码"
                        className="h-11 flex-1"
                        maxLength={6}
                      />
                      <Button
                        variant="outline"
                        className="h-11 shrink-0 px-4"
                        disabled={loading || phoneOtpSent}
                        onClick={handleSendPhoneOtp}
                      >
                        {phoneOtpSent ? '已发送' : '发送验证码'}
                      </Button>
                    </div>
                  </div>
                  <Button
                    className="w-full h-11 text-base font-medium shadow-sm"
                    disabled={loading || !phoneOtpSent || !phoneOtp}
                    onClick={() => runAction(() => verifyPhoneOtp(phoneNumber, phoneOtp), '登录成功，即将跳转', () => navigate('/profile'))}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '验证并登录'}
                  </Button>
                </div>
              )}

              {/* 分割线 + 微信登录 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-3 text-xs text-muted-foreground">其他登录方式</span>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full h-11 gap-2 shadow-sm"
                disabled={loading}
                onClick={() => runAction(() => signInWithWechat(), '正在跳转微信登录')}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                  <path d="M8.5 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm7 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM12 2C6.48 2 2 6.03 2 11c0 2.76 1.36 5.22 3.57 6.87L2 20l3.89-2.14A9.36 9.36 0 0012 22c5.52 0 10-4.03 10-9S17.52 2 12 2z" />
                </svg>
                微信登录
              </Button>

              {message && (
                <p className={cn(
                  'text-sm text-center rounded-lg px-4 py-3',
                  message.includes('成功') ? 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400',
                )}>
                  {message}
                </p>
              )}
            </CardContent>
          </Card>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            登录即表示同意
            <Link to="/terms" className="text-primary hover:underline mx-1">服务条款</Link>
            和
            <Link to="/privacy" className="text-primary hover:underline mx-1">隐私政策</Link>
          </p>
        </div>
      </div>
    </div>
  )
}