
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CategoryForm } from '@/components/dashboard/category-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function CreateCategoryPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has admin permissions
  const allowedRoles = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC']
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/admin/categories">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tạo chuyên mục mới</h1>
          <p className="text-muted-foreground mt-1">
            Thêm chuyên mục mới cho tạp chí
          </p>
        </div>
      </div>

      <CategoryForm mode="create" />
    </div>
  )
}
