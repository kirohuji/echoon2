import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, CheckCheck, ArrowLeft } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import {
  getUserNotifications, markAsRead, markAllAsRead,
  type NotificationItem,
} from '@/features/notification/api'
import { useNotificationStore } from '@/features/notification/store'
import { useIsMobile } from '@/hooks/use-mobile'

export function NotificationListPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const resetUnread = useNotificationStore((s) => s.resetUnread)
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount)

  const [list, setList] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  const loadList = useCallback(async (pg: number) => {
    setLoading(true)
    try {
      const result = await getUserNotifications({ page: pg, pageSize })
      if (pg === 1) {
        setList(result.list)
      } else {
        setList((prev) => [...prev, ...result.list])
      }
      setHasMore(result.list.length === pageSize)
    } catch {
      if (pg === 1) setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadList(1) }, [loadList])

  const handleClickItem = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await markAsRead(item.id)
        setList((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        )
        fetchUnreadCount()
      } catch {}
    }
    navigate(`/notifications/${item.id}`, { state: { item } })
  }

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      setList((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      resetUnread()
    } catch {}
  }

  const hasUnread = list.some((n) => !n.isRead)
  const titleLine = isMobile ? (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/60 active:bg-muted"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
      <h1 className="text-base font-semibold">通知</h1>
    </div>
  ) : null

  return (
    <div className="space-y-4">
      {titleLine}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">全部通知</h2>
        {hasUnread && (
          <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={handleMarkAll}>
            <CheckCheck className="h-3.5 w-3.5" />
            全部已读
          </Button>
        )}
      </div>

      {loading && list.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Bell className="h-12 w-12 text-muted-foreground/20" />
          <p className="mt-4 text-sm font-medium text-muted-foreground">暂无通知</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map((item) => (
            <Card
              key={item.id}
              className={cn(
                'cursor-pointer transition-colors hover:bg-muted/40 active:scale-[0.99]',
                !item.isRead && 'border-primary/30 bg-primary/5'
              )}
              onClick={() => handleClickItem(item)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full',
                    item.isRead ? 'bg-muted' : 'bg-primary/10'
                  )}>
                    <Bell className={cn('h-4 w-4', item.isRead ? 'text-muted-foreground' : 'text-primary')} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn('text-sm', !item.isRead && 'font-semibold')}>{item.title}</p>
                      {!item.isRead && (
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                      {item.content.replace(/[#*`>\[\]()!\-]/g, '').substring(0, 120)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60">
                        {new Date(item.createdAt).toLocaleDateString('zh-CN', {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                      <Badge variant={item.type === 'broadcast' ? 'outline' : 'secondary'} className="text-[10px] h-4 px-1.5">
                        {item.type === 'broadcast' ? '广播' : '定向'}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="mt-2 h-4 w-4 flex-shrink-0 text-muted-foreground/40" />
                </div>
              </CardContent>
            </Card>
          ))}

          {hasMore && (
            <div className="pt-2 text-center">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                disabled={loading}
                onClick={() => {
                  const nextPage = page + 1
                  setPage(nextPage)
                  loadList(nextPage)
                }}
              >
                {loading ? '加载中...' : '加载更多'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
