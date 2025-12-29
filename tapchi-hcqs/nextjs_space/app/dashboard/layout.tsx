import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardLayoutClient from '@/components/dashboard/layout-client'
import { AccessDeniedAlert } from '@/components/dashboard/access-denied-alert'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-military-950 dark:via-military-900 dark:to-military-950 flex flex-col transition-colors">
      <AccessDeniedAlert />
      <DashboardLayoutClient session={session}>
        {children}
      </DashboardLayoutClient>
    </div>
  )
}
