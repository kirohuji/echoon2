import React from 'react'
import { Header } from './header'
import { Footer } from './footer'
import { BottomNav } from './bottom-nav'

interface RootLayoutProps {
  children: React.ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="hidden md:block">
        <Header />
      </div>
      <main className="flex-1 pt-0 pb-16 md:pt-14 md:pb-0">
        <div className="mx-auto max-w-[1480px] px-3 py-4 md:px-4 md:py-6">
          {children}
        </div>
      </main>
      <div className="hidden md:block">
        <Footer />
      </div>
      <BottomNav />
    </div>
  )
}
