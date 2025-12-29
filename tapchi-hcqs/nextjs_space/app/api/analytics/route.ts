import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/analytics
 * Trả về thống kê tổng quan hệ thống
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Thống kê tổng quan
    const [totalSubmissions, publishedArticles, activeReviews, pendingReviews] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.count({ where: { status: 'PUBLISHED' } }),
      prisma.review.count({ where: { submittedAt: { not: null } } }),
      prisma.review.count({ where: { submittedAt: null } }),
    ]);

    // Thống kê theo tháng (6 tháng gần nhất)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const submissionsByMonth = await prisma.$queryRaw<Array<{ month: string; count: bigint }>>` 
      SELECT TO_CHAR("createdAt", 'YYYY-MM') as month, COUNT(*)::bigint as count
      FROM "Submission"
      WHERE "createdAt" >= ${sixMonthsAgo}
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month DESC
    `;

    // Thống kê theo trạng thái
    const statusStats = await prisma.submission.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Thống kê thời gian review trung bình
    const reviewStats = await prisma.review.aggregate({
      where: { submittedAt: { not: null } },
      _avg: {
        // This is a placeholder - in real scenario, calculate days between invitedAt and submittedAt
      },
    });

    // Thống kê bình luận
    const totalComments = await prisma.articleComment.count();
    const approvedComments = await prisma.articleComment.count({ where: { isApproved: true } });

    // Top categories
    const topCategories = await prisma.submission.groupBy({
      by: ['categoryId'],
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: 'desc' } },
      take: 5,
    });

    const categoriesWithNames = await Promise.all(
      topCategories.map(async (cat) => {
        if (!cat.categoryId) return { name: 'Unknown', count: cat._count.categoryId };
        const category = await prisma.category.findUnique({ where: { id: cat.categoryId } });
        return {
          name: category?.name || 'Unknown',
          count: cat._count.categoryId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalSubmissions,
          publishedArticles,
          activeReviews,
          pendingReviews,
          totalComments,
          approvedComments,
        },
        submissionsByMonth: submissionsByMonth.map((item) => ({
          month: item.month,
          count: Number(item.count),
        })),
        statusStats: statusStats.map((item) => ({
          status: item.status,
          count: item._count.status,
        })),
        topCategories: categoriesWithNames,
      },
    });
  } catch (error: any) {
    console.error('GET /api/analytics error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
