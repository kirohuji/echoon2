import { X } from 'lucide-react'
import { Drawer, DrawerContent } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MarkdownContent } from './markdown-content'

interface SystemDocumentDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  content: string
}

export function SystemDocumentDrawer({ open, onClose, title, content }: SystemDocumentDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent className="h-[100dvh] w-full max-w-full rounded-none border-0">
        {/* 顶部导航栏 — 与设置页子视图对齐 */}
        <div className="relative flex items-center justify-center border-b border-border/50 bg-background px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="absolute left-0 inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted/60 active:bg-muted"
            aria-label="关闭"
          >
            <X className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold">{title}</h1>
        </div>

        {/* 内容区 */}
        <ScrollArea className="flex-1">
          <div className="px-4 py-5">
            <MarkdownContent content={content} />
          </div>
          <div className="h-8" />
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  )
}
