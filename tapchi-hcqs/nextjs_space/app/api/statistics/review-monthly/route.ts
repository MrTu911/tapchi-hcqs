
/**
 * 📊 API: Review Statistics by Month
 * GET /api/statistics/review-monthly
 * 
 * Thống kê số lượng phản biện hoàn thành theo tháng (6 tháng gần nhất)
 * Dùng cho biểu đồ đường hoặc cột
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { getCachedData } from '@/lib/cache';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

interface MonthlyReviewData {
  month: string;
  monthLabel: string;
  completed: number;
  pending: number;
  declined: number;
  avgResponseDays: number;
}

async function fetchMonthlyReviewStats(): Promise<MonthlyReviewData[]> {
  const months = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i); // 6 tháng gần nhất
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      month: format(date, 'yyyy-MM'),
      monthLabel: format(date, 'MMM yyyy', { locale: vi })
    };
  });

  const data = await Promise.all(months.map(async ({ start, end, month, monthLabel }) => {
    const [completed, pending, declined, avgDaysResult] = await Promise.all([
      // Completed reviews in this month
      prisma.review.count({
        where: {
          submittedAt: {
            gte: start,
            lte: end
          }
        }
      }),
      
      // Reviews invited in this month but still pending
      prisma.review.count({
        where: {
          invitedAt: {
            gte: start,
            lte: end
          },
          submittedAt: null,
          declinedAt: null
        }
      }),
      
      // Reviews declined in this month
      prisma.review.count({
        where: {
          declinedAt: {
            gte: start,
            lte: end
          }
        }
      }),
      
      // Average response days for completed reviews
      prisma.$queryRaw<Array<{ avg: number | null }>>`
        SELECT AVG(
          EXTRACT(EPOCH FROM ("submittedAt" - "invitedAt")) / 86400
        )::numeric as avg
        FROM "Review"
        WHERE "submittedAt" IS NOT NULL
          AND "submittedAt" >= ${start}
          AND "submittedAt" <= ${end}
      `
    ]);

    return {
      month,
      monthLabel,
      completed,
      pending,
      declined,
      avgResponseDays: avgDaysResult[0]?.avg 
        ? Math.round(Number(avgDaysResult[0].avg) * 10) / 10 
        : 0
    };
  }));

  return data;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ ADMIN, MANAGING_EDITOR, EIC mới xem được
    if (!['SYSADMIN', 'MANAGING_EDITOR', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden' },
        { status: 403 }
      );
    }

    // Lấy từ cache hoặc tính toán (cache 1 giờ)
    const stats = await getCachedData(
      'stats:review-monthly',
      fetchMonthlyReviewStats,
      3600 // 1 giờ
    );

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Error fetching monthly review statistics:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

