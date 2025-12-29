
import { getServerSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import SubmissionFormEnhanced from '@/components/dashboard/submission-form-enhanced'

export default async function AuthorSubmitPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  // Get categories for the form
  const categories = await prisma.category.findMany({
    orderBy: {
      name: 'asc'
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nộp bài nghiên cứu</h1>
        <p className="text-muted-foreground mt-1">
          Điền đầy đủ thông tin và tải lên bản thảo của bạn
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thông tin bài viết</CardTitle>
          <CardDescription>
            Vui lòng điền đầy đủ và chính xác các thông tin bắt buộc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubmissionFormEnhanced categories={categories} />
        </CardContent>
      </Card>

      {/* Guidelines Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Hướng dẫn nộp bài</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p>• <strong>Tiêu đề:</strong> Ngắn gọn, súc tích, phản ánh đúng nội dung nghiên cứu</p>
          <p>• <strong>Tóm tắt:</strong> Từ 150-250 từ, nêu rõ mục đích, phương pháp, kết quả và kết luận</p>
          <p>• <strong>Từ khóa:</strong> 3-5 từ khóa, ngăn cách bởi dấu phẩy</p>
          <p>• <strong>File bản thảo:</strong> Định dạng DOC, DOCX hoặc PDF, dung lượng tối đa 10MB</p>
          <p>• <strong>Quy trình:</strong> Sau khi nộp, bài viết sẽ được biên tập viên xem xét và gán cho phản biện viên</p>
        </CardContent>
      </Card>
    </div>
  )
}
