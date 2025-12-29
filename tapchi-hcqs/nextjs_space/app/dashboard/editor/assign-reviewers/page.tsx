
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import AssignReviewersForm from '@/components/dashboard/assign-reviewers-form'
import { notFound } from 'next/navigation'

interface PageProps {
  searchParams: {
    submissionId?: string
  }
}

export default async function AssignReviewersPage({ searchParams }: PageProps) {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  const submissionId = searchParams.submissionId

  if (!submissionId) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gán phản biện viên</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              Vui lòng chọn một bài nộp từ danh sách để gán phản biện viên.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get submission
  const submission = await prisma.submission.findUnique({
    where: {
      id: submissionId
    },
    include: {
      category: true,
      author: {
        select: {
          fullName: true,
          email: true,
          org: true
        }
      },
      reviews: {
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  })

  if (!submission) {
    notFound()
  }

  // Get available reviewers
  const reviewers = await prisma.user.findMany({
    where: {
      role: {
        in: ['REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC']
      },
      isActive: true,
      // Exclude the author
      id: {
        not: submission.createdBy
      }
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      org: true,
      role: true,
      _count: {
        select: {
          reviews: true
        }
      }
    },
    orderBy: {
      fullName: 'asc'
    }
  })

  // Get current reviewers
  const currentReviewerIds = submission.reviews.map(r => r.reviewerId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gán phản biện viên</h1>
        <p className="text-muted-foreground mt-1">
          Chọn các phản biện viên phù hợp cho bài nộp
        </p>
      </div>

      {/* Submission Info */}
      <Card>
        <CardHeader>
          <CardTitle>{submission.title}</CardTitle>
          <CardDescription>
            Mã bài: {submission.code} | Tác giả: {submission.author.fullName} | 
            Chuyên mục: {submission.category?.name || 'Chưa phân loại'}
          </CardDescription>
        </CardHeader>
        {submission.abstractVn && (
          <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {submission.abstractVn}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Assign Form */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn phản biện viên</CardTitle>
          <CardDescription>
            Chọn ít nhất 2 phản biện viên cho bài nộp này
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AssignReviewersForm 
            submission={submission} 
            reviewers={reviewers}
            currentReviewerIds={currentReviewerIds}
          />
        </CardContent>
      </Card>
    </div>
  )
}
