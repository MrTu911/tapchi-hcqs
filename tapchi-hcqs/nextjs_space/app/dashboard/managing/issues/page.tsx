
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, Plus } from 'lucide-react'

export default async function IssuesManagementPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const issues = await prisma.issue.findMany({
    include: {
      volume: true,
      _count: {
        select: {
          articles: true
        }
      }
    },
    orderBy: [
      { year: 'desc' },
      { number: 'desc' }
    ]
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý số tạp chí</h1>
          <p className="text-muted-foreground mt-1">
            Tạo và quản lý các số tạp chí
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/managing/issues/create">
            <Plus className="mr-2 h-4 w-4" />
            Tạo số mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách số tạp chí ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Chưa có số tạp chí nào</p>
              <p className="text-sm mb-4">Bắt đầu bằng cách tạo số đầu tiên</p>
              <Button asChild>
                <Link href="/dashboard/managing/issues/create">
                  Tạo số mới
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue) => (
                <div 
                  key={issue.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-lg">
                        Tập {issue.volume?.volumeNo || "N/A"}, Số {issue.number} ({issue.year})
                      </h4>
                      <Badge variant={issue.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                        {issue.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Nháp'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {issue._count.articles} bài viết
                      {issue.publishDate && ` • Xuất bản: ${new Date(issue.publishDate).toLocaleDateString('vi-VN')}`}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/managing/issues/${issue.id}`}>
                      Chi tiết
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
