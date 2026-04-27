import React from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './header'
import { Footer } from './footer'
import { BottomNav } from './bottom-nav'

interface RootLayoutProps {
  children: React.ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  const { pathname } = useLocation()
  const isAuthPage = pathname === '/auth/login' || pathname === '/auth/register'

  return (
    <div className="flex min-h-screen flex-col pt-safe">
      {!isAuthPage && (
        <div className="hidden lg:block">
          <Header />
        </div>
      )}
      <main className={`flex-1 pt-0 ${isAuthPage ? 'pb-0 lg:pt-0 lg:pb-0' : 'pb-[calc(4rem+env(safe-area-inset-bottom,0px))] lg:pt-14 lg:pb-0'}`}>
        <div className={isAuthPage ? 'h-full max-w-none px-0 py-0' : 'mx-auto max-w-[1480px] px-3 py-4 lg:px-4 lg:py-6'}>
          {children}
        </div>
      </main>
      {!isAuthPage && (
        <div className="hidden lg:block">
          <Footer />
        </div>
      )}
      {!isAuthPage && <BottomNav />}
    </div>
  )
}
