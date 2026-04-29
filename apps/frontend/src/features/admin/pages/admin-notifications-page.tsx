import React, { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Plus, Send, Trash2, Search, Users, Globe, X,
  Loader2, ArrowLeft, CheckCircle2, UserPlus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { cn } from '@/lib/cn'
import {
  listNotifications, createNotification, searchUsers,
  type AdminNotificationItem, type SearchUserResult,
} from '@/features/admin/api-notifications'
import { useAuth } from '@/providers/auth-provider'

export function AdminNotificationsPage() {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [data, setData] = useState<AdminNotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 15

  const [createOpen, setCreateOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formType, setFormType] = useState<'broadcast' | 'targeted'>('broadcast')

  // Targeted user selection
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SearchUserResult[]>([])
  const [searching, setSearching] = useState(false)

  const fetchList = useCallback(async () => {
    setLoading(true)
    try {
      const result = await listNotifications({ page, pageSize })
      setData(result.list)
      setTotal(result.total)
    } catch { setData([]) }
    finally { setLoading(false) }
  }, [page])

  useEffect(() => { fetchList() }, [fetchList])

  const handleSearchUsers = async () => {
    if (!searchKeyword.trim()) return
    setSearching(true)
    try {
      const results = await searchUsers(searchKeyword.trim())
      setSearchResults(results.filter((u) => !selectedUsers.find((s) => s.id === u.id)))
    } catch { setSearchResults([]) }
    finally { setSearching(false) }
  }

  const addUser = (user: SearchUserResult) => {
    setSelectedUsers((prev) => [...prev, user])
    setSearchResults((prev) => prev.filter((u) => u.id !== user.id))
  }

  const removeUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== userId))
  }

  const handleCreate = async () => {
    if (!formTitle.trim() || !formContent.trim()) return
    setSending(true)
    try {
      await createNotification({
        title: formTitle.trim(),
        content: formContent.trim(),
        type: formType,
        targetUserIds: formType === 'targeted' ? selectedUsers.map((u) => u.id) : undefined,
      })
      setCreateOpen(false)
      resetForm()
      fetchList()
    } catch {}
    finally { setSending(false) }
  }

  const resetForm = () => {
    setFormTitle('')
    setFormContent('')
    setFormType('broadcast')
    setSelectedUsers([])
    setSearchKeyword('')
    setSearchResults([])
  }

  if (session && session.user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <p className="text-lg font-semibold text-muted-foreground">需要管理员权限</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />返回首页
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">消息通知管理</h1>
          <p className="text-sm text-muted-foreground">创建和管理系统通知</p>
        </div>
        <Button onClick={() => { resetForm(); setCreateOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          新建通知
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">通知列表</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">{[1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <Bell className="h-12 w-12 opacity-20" />
              <p className="mt-3 text-sm">暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.map((item) => (
                <div key={item.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <Badge variant={item.type === 'broadcast' ? 'default' : 'secondary'} className="text-[10px]">
                          {item.type === 'broadcast' ? <Globe className="mr-0.5 h-3 w-3 inline" /> : <Users className="mr-0.5 h-3 w-3 inline" />}
                          {item.type === 'broadcast' ? '广播' : '定向'}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                        {item.content.replace(/[#*`>\[\]()!\-]/g, '').substring(0, 100)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground/60">
                        <span>
                          阅读 {item._count.reads} · 目标 {item.type === 'broadcast' ? '全部用户' : `${item._count.targets} 人`}
                        </span>
                        <span>发送者 {item.sentBy.name || item.sentBy.email}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建通知弹窗 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>新建通知</DialogTitle>
            <DialogDescription>向用户发送系统通知，支持 Markdown 格式</DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">标题</label>
              <Input
                placeholder="通知标题"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">内容（支持 Markdown）</label>
              <Textarea
                placeholder="通知内容，支持 Markdown 格式..."
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium">发送范围</label>
              <div className="flex rounded-lg bg-muted p-0.5">
                {([
                  { value: 'broadcast', label: '全部用户', icon: Globe },
                  { value: 'targeted', label: '指定用户', icon: Users },
                ] as const).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFormType(value)}
                    className={cn(
                      'flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-xs font-medium transition-all',
                      formType === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {formType === 'targeted' && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户邮箱或姓名..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Button size="sm" onClick={handleSearchUsers} disabled={searching} className="h-8 text-xs">
                    {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : '搜索'}
                  </Button>
                </div>

                {selectedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUsers.map((u) => (
                      <Badge key={u.id} variant="secondary" className="gap-1 pr-1 text-xs">
                        {u.name || u.email}
                        <button type="button" onClick={() => removeUser(u.id)}>
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="rounded-lg border border-border/60 max-h-40 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => addUser(u)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors border-b border-border/40 last:border-b-0"
                      >
                        <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{u.name || u.email}</span>
                        <span className="text-xs text-muted-foreground">{u.email}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={sending || !formTitle.trim() || !formContent.trim()}>
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              发送通知
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
