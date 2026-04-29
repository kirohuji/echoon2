import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, User, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import { useAuth } from '@/providers/auth-provider'

const navItems = [
  { key: 'library', path: '/' },
  { key: 'mock', path: '/mock' },
  { key: 'member', path: '/member' },
]

export function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const { theme, setTheme } = useTheme()
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { session } = useAuth()
  const isAdmin = session?.user?.role === 'admin'

  const currentPath = location.pathname

  const isActive = (path: string) => {
    if (path === '/') return currentPath === '/'
    return currentPath.startsWith(path)
  }

  const isAdminPage = currentPath.startsWith('/admin')

  const themeOptions = [
    { value: 'light', label: t('profile.themeLight'), icon: Sun },
    { value: 'dark', label: t('profile.themeDark'), icon: Moon },
    { value: 'system', label: t('profile.themeSystem'), icon: Monitor },
  ]

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/50 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50">
      <div className="mx-auto flex h-14 max-w-[1480px] items-center px-4">
        <Link to="/" className="mr-8 flex items-center gap-2">
          <span className="font-display text-lg font-bold tracking-tight text-foreground">导游口试</span>
        </Link>

        <nav className="flex items-center gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.key}
              to={item.path}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                isActive(item.path)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to={isAdminPage ? '/' : '/admin/users'}>
              <Button
                variant={isAdminPage ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <Shield className="h-3.5 w-3.5" />
                {isAdminPage ? '返回前台' : '后台管理'}
              </Button>
            </Link>
          )}

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setThemeMenuOpen(!themeMenuOpen)}
              className="h-8 w-8"
            >
              <ThemeIcon className="h-4 w-4" />
            </Button>
            {themeMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setThemeMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[120px] rounded-md border bg-popover p-1 shadow-md">
                  {themeOptions.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setTheme(value)
                        setThemeMenuOpen(false)
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted',
                        theme === value && 'font-medium text-primary'
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link to="/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <User className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
