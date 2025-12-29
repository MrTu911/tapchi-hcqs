
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CategoryForm } from '@/components/dashboard/category-form'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CategoryDeleteButton } from '@/components/dashboard/category-delete-button'

export default async function EditCategoryPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Check if user has admin permissions
  const allowedRoles = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC']
  if (!allowedRoles.includes(session.role)) {
    redirect('/dashboard')
  }

  const category = await prisma.category.findUnique({
    where: { id: params.id },
    include: {
      _count: {
        select: {
          submissions: true
        }
      }
    }
  })

  if (!category) {
    redirect('/dashboard/admin/categories')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/admin/categories">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Chỉnh sửa chuyên mục</h1>
            <p className="text-muted-foreground mt-1">
              Cập nhật thông tin chuyên mục: {category.name}
            </p>
          </div>
        </div>
        
        <CategoryDeleteButton 
          categoryId={category.id} 
          categoryName={category.name}
          submissionCount={category._count.submissions}
        />
      </div>

      <CategoryForm 
        mode="edit" 
        initialData={{
          id: category.id,
          code: category.code,
          name: category.name,
          slug: category.slug,
          description: category.description
        }} 
      />
    </div>
  )
}
