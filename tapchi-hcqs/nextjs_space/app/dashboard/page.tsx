
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { can } from '@/lib/rbac'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Redirect to appropriate dashboard based on role
  const role = session.role as any

  if (can.admin(role)) {
    if (role === 'SYSADMIN') {
      redirect('/dashboard/admin')
    } else if (role === 'EIC') {
      redirect('/dashboard/eic')
    } else if (role === 'MANAGING_EDITOR') {
      redirect('/dashboard/managing')
    }
  } else if (can.decide(role)) {
    redirect('/dashboard/editor')
  } else if (can.review(role)) {
    redirect('/dashboard/reviewer')
  } else if (can.submit(role)) {
    redirect('/dashboard/author')
  } else if (can.securityAudit(role)) {
    redirect('/dashboard/security')
  } else if (can.layout(role)) {
    redirect('/dashboard/layout')
  }

  // Default fallback
  redirect('/dashboard/author')
}
