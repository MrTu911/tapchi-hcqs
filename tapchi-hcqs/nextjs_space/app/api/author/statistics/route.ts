
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all submissions by author
    const submissions = await prisma.submission.findMany({
      where: {
        createdBy: session.uid
      },
      include: {
        reviews: true,
        decisions: true,
        category: true
      }
    })

    // Calculate statistics
    const stats = {
      total: submissions.length,
      draft: submissions.filter(s => s.status === 'NEW').length,
      underReview: submissions.filter(s => s.status === 'UNDER_REVIEW').length,
      revision: submissions.filter(s => s.status === 'REVISION').length,
      accepted: submissions.filter(s => s.status === 'ACCEPTED').length,
      rejected: submissions.filter(s => s.status === 'REJECTED' || s.status === 'DESK_REJECT').length,
      inProduction: submissions.filter(s => s.status === 'IN_PRODUCTION').length,
      published: submissions.filter(s => s.status === 'PUBLISHED').length,
      
      // Additional stats
      totalReviews: submissions.reduce((sum, s) => sum + s.reviews.length, 0),
      averageReviewTime: 0, // Calculate if needed
      acceptanceRate: submissions.length > 0 
        ? ((submissions.filter(s => s.status === 'ACCEPTED' || s.status === 'PUBLISHED').length / submissions.length) * 100).toFixed(1)
        : 0
    }

    // Get recent activity
    const recentSubmissions = submissions
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        title: s.title,
        status: s.status,
        updatedAt: s.createdAt,
        category: s.category?.name
      }))

    // Chart data for status distribution
    const chartData = [
      { name: 'Bản nháp', value: stats.draft, color: '#94A3B8' },
      { name: 'Đang phản biện', value: stats.underReview, color: '#FBBF24' },
      { name: 'Cần chỉnh sửa', value: stats.revision, color: '#F97316' },
      { name: 'Đã chấp nhận', value: stats.accepted, color: '#34D399' },
      { name: 'Từ chối', value: stats.rejected, color: '#EF4444' },
      { name: 'Đang xuất bản', value: stats.inProduction, color: '#8B5CF6' },
      { name: 'Đã xuất bản', value: stats.published, color: '#60A5FA' }
    ].filter(item => item.value > 0)

    return NextResponse.json({
      stats,
      recentSubmissions,
      chartData
    })
  } catch (error) {
    console.error('Error fetching author statistics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
