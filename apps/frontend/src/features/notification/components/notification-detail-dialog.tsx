import React from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { NotificationItem } from '@/features/notification/api'

interface Props {
  item: NotificationItem | null
  open: boolean
  onClose: () => void
}

export function NotificationDetailDialog({ item, open, onClose }: Props) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-base">{item.title}</DialogTitle>
            <Badge variant={item.type === 'broadcast' ? 'outline' : 'secondary'} className="text-xs">
              {item.type === 'broadcast' ? '广播' : '定向'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed whitespace-pre-wrap">
            {item.content}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span>
            {new Date(item.createdAt).toLocaleString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric',
              hour: '2-digit', minute: '2-digit',
            })}
          </span>
          {item.isRead && (
            <span className="text-primary">
              已读 {item.readAt ? new Date(item.readAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
