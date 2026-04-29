import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { NotificationItem } from '@/features/notification/api'
import { useIsMobile } from '@/hooks/use-mobile'

export function NotificationDetailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const item = (location.state as any)?.item as NotificationItem | undefined

  if (!item) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <Bell className="h-12 w-12 text-muted-foreground/20" />
        <p className="mt-4 text-sm text-muted-foreground">通知不存在</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/notifications')}>
          返回列表
        </Button>
      </div>
    )
  }

  const mobileHeader = isMobile ? (
    <div className="relative flex items-center justify-center mb-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/60 active:bg-muted"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-base font-semibold">通知详情</h1>
    </div>
  ) : (
    <div className="flex items-center gap-3 mb-4">
      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate('/notifications')}>
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <h1 className="text-lg font-bold">通知详情</h1>
    </div>
  )

  return (
    <div>
      {mobileHeader}

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{item.title}</h2>
          <Badge variant={item.type === 'broadcast' ? 'outline' : 'secondary'} className="text-xs">
            {item.type === 'broadcast' ? '广播' : '定向'}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {new Date(item.createdAt).toLocaleString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {item.content}
          </div>
        </div>
      </div>
    </div>
  )
}
