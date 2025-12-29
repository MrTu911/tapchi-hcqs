
'use client'

import { useState, ReactNode } from 'react'
import DashboardHeader from '@/components/dashboard/header'
import DashboardSidebar from '@/components/dashboard/sidebar'

interface DashboardLayoutClientProps {
  session: {
    fullName: string
    email: string
    role: string
  }
  children: ReactNode
}

export default function DashboardLayoutClient({ session, children }: DashboardLayoutClientProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <>
      <DashboardHeader 
        session={session} 
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />
      <div className="flex flex-1">
        <DashboardSidebar 
          role={session.role}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </main>
      </div>
    </>
  )
}
