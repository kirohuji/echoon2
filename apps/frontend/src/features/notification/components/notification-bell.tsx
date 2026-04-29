import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import {
  getUserNotifications, markAsRead, markAllAsRead, getUnreadCount,
  type NotificationItem,
} from '@/features/notification/api'
import { useNotificationStore } from '@/features/notification/store'
import { useAuth } from '@/providers/auth-provider'
import { NotificationDetailDialog } from './notification-detail-dialog'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [list, setList] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [detailItem, setDetailItem] = useState<NotificationItem | null>(null)

  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount)
  const resetUnread = useNotificationStore((s) => s.resetUnread)
  const initSocket = useNotificationStore((s) => s.initSocket)
  const { session } = useAuth()

  // Init socket connection when user is authenticated
  useEffect(() => {
    if (session?.user?.id) {
      initSocket(session.user.id)
      fetchUnreadCount()
    }
  }, [session?.user?.id, initSocket, fetchUnreadCount])

  const loadList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getUserNotifications({ page: 1, pageSize: 10 })
      setList(result.list)
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadList()
  }, [open, loadList])

  const handleClickItem = async (item: NotificationItem) => {
    setDetailItem(item)
    if (!item.isRead) {
      try {
        await markAsRead(item.id)
        fetchUnreadCount()
      } catch {}
    }
  }

  const handleMarkAll = async () => {
    try {
      await markAllAsRead()
      setList((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
      resetUnread()
    } catch {}
  }

  const hasUnread = list.some((n) => !n.isRead)

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <p className="text-sm font-semibold">通知</p>
            {hasUnread && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleMarkAll}>
                <CheckCheck className="h-3.5 w-3.5" />
                全部已读
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[360px]">
            {loading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">暂无通知</p>
              </div>
            ) : (
              <div className="p-2">
                {list.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      handleClickItem(item)
                      setOpen(false)
                    }}
                    className={cn(
                      'w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted',
                      !item.isRead && 'bg-primary/5'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!item.isRead && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm line-clamp-1', !item.isRead && 'font-semibold')}>
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                          {item.content.replace(/[#*`>\[\]()!\-]/g, '').substring(0, 100)}
                        </p>
                        <p className="mt-1 text-[10px] text-muted-foreground/60">
                          {new Date(item.createdAt).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="border-t border-border/40 px-4 py-2">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              查看全部通知
            </Link>
          </div>
        </PopoverContent>
      </Popover>


      <NotificationDetailDialog
        item={detailItem}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </>
  )
}
