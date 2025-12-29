
"use client"

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 transition-colors">
      <Header />
      <main className="flex-1 min-h-screen">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}
