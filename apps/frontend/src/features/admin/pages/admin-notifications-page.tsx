import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, Plus, Send, Search, Users, Globe, X,
  Loader2, ArrowLeft, UserPlus, ImageIcon, Library, Check,
} from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import { VirtuosoGrid } from 'react-virtuoso'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/cn'
import {
  listNotifications, createNotification, searchUsers,
  uploadNotificationImage, listNotificationImages,
  type AdminNotificationItem, type SearchUserResult, type NotificationImageItem,
} from '@/features/admin/api-notifications'
import { useAuth } from '@/providers/auth-provider'

// ---------- 编辑器样式覆盖：去掉蓝色聚焦环 ----------
const noRingInput = 'focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none'

// ========== 图片库弹窗 ==========
function ImageLibraryPopover({
  onSelect,
}: {
  onSelect: (url: string, filename: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [images, setImages] = useState<NotificationImageItem[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  const loadImages = useCallback(async (pg: number, append: boolean) => {
    setLoading(true)
    try {
      const res = await listNotificationImages({ page: pg, pageSize })
      if (append) {
        setImages((prev) => [...prev, ...res.list])
      } else {
        setImages(res.list)
      }
      setHasMore(res.list.length === pageSize)
    } catch {
      if (!append) setImages([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setPage(1)
      setImages([])
      setHasMore(true)
      loadImages(1, false)
    }
  }, [open, loadImages])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadImages(nextPage, true)
  }, [loading, hasMore, page, loadImages])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <Library className="h-3 w-3" />
          图片库
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-[380px] p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <span className="text-xs font-medium">已上传图片</span>
          <span className="text-[10px] text-muted-foreground">
            {images.length} 张 · 点击插入
          </span>
        </div>
        <div className="h-[320px]">
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-xs">暂无图片</p>
              <p className="text-[10px] mt-0.5">上传图片后会出现在这里</p>
            </div>
          ) : (
            <VirtuosoGrid
              style={{ height: '100%' }}
              totalCount={images.length}
              endReached={loadMore}
              overscan={200}
              components={{
                // eslint-disable-next-line react/display-name
                List: React.forwardRef((props, ref) => (
                  <div
                    ref={ref}
                    {...props}
                    className="grid grid-cols-3 gap-2 px-4"
                  />
                )),
              }}
              itemContent={(index) => {
                const img = images[index]
                return (
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(img.url, img.filename)
                      setOpen(false)
                    }}
                    className="group relative aspect-square rounded-lg overflow-hidden border border-border/60 bg-muted/30 hover:border-primary/40 transition-colors"
                    title={img.filename}
                  >
                    <img
                      src={img.url}
                      alt={img.filename}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <Check className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                )
              }}
            />
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

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

  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUserResult[]>([])
  const [selectedUsers, setSelectedUsers] = useState<SearchUserResult[]>([])
  const [searching, setSearching] = useState(false)

  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // ---- 图片上传处理 ----
  const handleImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingImage(true)
    try {
      const { url } = await uploadNotificationImage(file)
      const imageMd = `\n![${file.name}](${url})\n`
      setFormContent((prev) => prev + imageMd)
    } catch {
      // silently fail
    } finally {
      setUploadingImage(false)
    }
  }

  const handleToolbarImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageFile(file)
    e.target.value = ''
  }

  const handleSelectFromLibrary = (url: string, filename: string) => {
    const imageMd = `\n![${filename}](${url})\n`
    setFormContent((prev) => prev + imageMd)
  }

  const handleEditorPaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault()
        const file = items[i].getAsFile()
        if (file) await handleImageFile(file)
        return
      }
    }
  }, [])

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

      {/* ====== 新建通知弹窗 ====== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0">
          <DialogHeader className="flex-shrink-0 px-6 pt-5 pb-0">
            <DialogTitle>新建通知</DialogTitle>
            <DialogDescription>向用户发送系统通知，支持 Markdown 与图片嵌入</DialogDescription>
          </DialogHeader>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {/* 标题 */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium">标题</label>
              <Input
                placeholder="通知标题"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                maxLength={100}
                className={noRingInput}
              />
            </div>

            {/* Markdown 编辑器 */}
            <div className="space-y-1.5" onPaste={handleEditorPaste}>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium">内容（Markdown）</label>
                <div className="flex items-center gap-1.5">
                  {uploadingImage && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> 上传中...
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={handleToolbarImage}
                    disabled={uploadingImage}
                  >
                    <ImageIcon className="h-3 w-3" />
                    上传图片
                  </Button>
                  <ImageLibraryPopover onSelect={handleSelectFromLibrary} />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div data-color-mode="light" className="[&_.w-md-editor]:shadow-none [&_.w-md-editor]:border [&_.w-md-editor]:border-border [&_.w-md-editor]:rounded-lg [&_.w-md-editor-toolbar]:rounded-t-lg [&_.w-md-editor-text-pre>code]:!text-sm [&_.w-md-editor-text-input]:!text-sm">
                <MDEditor
                  value={formContent}
                  onChange={(val) => setFormContent(val || '')}
                  height={360}
                  preview="live"
                  visibleDragbar={false}
                  hideToolbar={false}
                />
              </div>
            </div>

            {/* 发送范围 */}
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
                      className={cn('pl-8 h-8 text-xs', noRingInput)}
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

          <DialogFooter className="flex-shrink-0 px-6 pb-5 pt-2">
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
