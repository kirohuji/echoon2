import { useState, useEffect, useCallback } from 'react'
import { MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectItem } from '@/components/ui/select'
import { getAllFeedbacks, updateFeedback } from '@/features/feedback/api'
import type { FeedbackResult } from '@/features/feedback/api'
import { cn } from '@/lib/cn'

const STATUS_MAP: Record<string, { label: string; variant: 'outline' | 'secondary' | 'default' }> = {
  pending: { label: '待处理', variant: 'secondary' },
  resolved: { label: '已解决', variant: 'default' },
  closed: { label: '已关闭', variant: 'outline' },
}

const TYPE_MAP: Record<string, string> = {
  bug: '问题反馈', suggestion: '功能建议', other: '其他',
}

export function AdminFeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<(FeedbackResult & { user?: { name: string; email: string } })[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState<typeof feedbacks[0] | null>(null)

  const fetchData = useCallback(async () => {
    const data = await getAllFeedbacks({ status: filter || undefined })
    setFeedbacks(data.items)
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const handleResolve = async (id: string) => {
    await updateFeedback(id, { status: 'resolved' })
    fetchData()
    setSelected(null)
  }

  const handleClose = async (id: string) => {
    await updateFeedback(id, { status: 'closed' })
    fetchData()
    setSelected(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">反馈管理</h1>
        <p className="text-xs text-muted-foreground">查看和处理用户反馈</p>
      </div>

      <div className="flex gap-2">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-40">
          <SelectItem value="">全部</SelectItem>
          <SelectItem value="pending">待处理</SelectItem>
          <SelectItem value="resolved">已解决</SelectItem>
          <SelectItem value="closed">已关闭</SelectItem>
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (<Skeleton key={i} className="h-24 w-full rounded-xl" />))}
        </div>
      ) : feedbacks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">暂无反馈</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <Card
              key={fb.id}
              className="cursor-pointer hover:border-border transition-colors"
              onClick={() => setSelected(fb)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px]">{TYPE_MAP[fb.type] || fb.type}</Badge>
                      <Badge variant={STATUS_MAP[fb.status]?.variant || 'outline'} className="text-[10px]">
                        {STATUS_MAP[fb.status]?.label || fb.status}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-2">{fb.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {fb.user?.name || '未知用户'} · {new Date(fb.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* detail dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>反馈详情</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{TYPE_MAP[selected.type] || selected.type}</Badge>
                <Badge variant={STATUS_MAP[selected.status]?.variant || 'outline'} className="text-[10px]">
                  {STATUS_MAP[selected.status]?.label || selected.status}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">用户</p>
                <p className="text-sm">{selected.user?.name || '未知'} ({selected.user?.email || '-'})</p>
              </div>
              {selected.contact && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">联系方式</p>
                  <p className="text-sm">{selected.contact}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground mb-1">内容</p>
                <p className="text-sm whitespace-pre-wrap">{selected.content}</p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                {selected.status === 'pending' && (
                  <>
                    <Button size="sm" onClick={() => handleResolve(selected.id)} className="gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> 标记已解决
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleClose(selected.id)} className="gap-1.5">
                      <XCircle className="h-4 w-4" /> 关闭
                    </Button>
                  </>
                )}
                {selected.status === 'resolved' && (
                  <Button size="sm" variant="outline" onClick={() => handleClose(selected.id)} className="gap-1.5">
                    <XCircle className="h-4 w-4" /> 关闭
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
