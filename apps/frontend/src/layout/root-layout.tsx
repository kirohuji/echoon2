import React from 'react'
import { Header } from './header'
import { Footer } from './footer'

interface RootLayoutProps {
  children: React.ReactNode
}

export function RootLayout({ children }: RootLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pt-14">
        <div className="mx-auto max-w-[1480px] px-4 py-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
