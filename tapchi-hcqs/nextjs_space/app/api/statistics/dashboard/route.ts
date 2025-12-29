
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * API thống kê tổng quan cho Dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const role = user.role
    const userId = user.id
    
    // Thống kê chung cho tất cả roles
    const [
      totalSubmissions,
      newSubmissions,
      underReview,
      inRevision,
      accepted,
      rejected,
      published,
      overdueSubmissions
    ] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'NEW' } }),
      prisma.submission.count({ where: { status: 'UNDER_REVIEW' } }),
      prisma.submission.count({ where: { status: 'REVISION' } }),
      prisma.submission.count({ where: { status: 'ACCEPTED' } }),
      prisma.submission.count({ where: { status: 'REJECTED' } }),
      prisma.submission.count({ where: { status: 'PUBLISHED' } }),
      prisma.submission.count({ where: { isOverdue: true } })
    ])
    
    const stats: any = {
      overview: {
        total: totalSubmissions,
        new: newSubmissions,
        underReview,
        inRevision,
        accepted,
        rejected,
        published,
        overdue: overdueSubmissions
      }
    }
    
    // Thống kê theo role
    if (role === 'AUTHOR') {
      const mySubmissions = await prisma.submission.count({
        where: { createdBy: userId }
      })
      const myAccepted = await prisma.submission.count({
        where: { createdBy: userId, status: 'ACCEPTED' }
      })
      const myPublished = await prisma.submission.count({
        where: { createdBy: userId, status: 'PUBLISHED' }
      })
      
      stats.author = {
        mySubmissions,
        myAccepted,
        myPublished,
        acceptanceRate: mySubmissions > 0 ? (myAccepted / mySubmissions * 100).toFixed(1) : '0'
      }
    }
    
    if (role === 'REVIEWER') {
      const myReviews = await prisma.review.count({
        where: { reviewerId: userId }
      })
      const completed = await prisma.review.count({
        where: { reviewerId: userId, submittedAt: { not: null } }
      })
      const pending = await prisma.review.count({
        where: { reviewerId: userId, submittedAt: null, declinedAt: null }
      })
      
      stats.reviewer = {
        totalReviews: myReviews,
        completed,
        pending,
        completionRate: myReviews > 0 ? (completed / myReviews * 100).toFixed(1) : '0'
      }
    }
    
    if (['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC'].includes(role)) {
      const pendingDecisions = await prisma.submission.count({
        where: {
          status: {
            in: ['NEW', 'UNDER_REVIEW']
          }
        }
      })
      
      const avgReviewTime = await prisma.$queryRaw<Array<{avg: number}>>`
        SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(r."submittedAt", NOW()) - r."invitedAt")) / 86400) as avg
        FROM "Review" r
        WHERE r."submittedAt" IS NOT NULL
      `
      
      stats.editor = {
        pendingDecisions,
        overdueSubmissions,
        avgReviewDays: avgReviewTime[0]?.avg ? Math.round(avgReviewTime[0].avg) : 0
      }
    }
    
    // Recent activities
    const recentSubmissions = await prisma.submission.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            fullName: true,
            email: true
          }
        },
        category: {
          select: {
            name: true
          }
        }
      }
    })
    
    stats.recent = recentSubmissions
    
    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    console.error('Error fetching dashboard statistics:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
