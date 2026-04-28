import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, FileText, User } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useLayoutStore } from '@/stores/layout.store'

const navItems = [
  { label: '题库', path: '/', icon: BookOpen },
  { label: '模考', path: '/mock', icon: FileText },
  { label: '我的', path: '/profile', icon: User },
]

export function BottomNav() {
  const location = useLocation()
  const visible = useLayoutStore((s) => s.bottomNavVisible)

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  if (!visible) return null

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-14 items-center justify-around">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = isActive(path)
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'stroke-[2.2]')} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
