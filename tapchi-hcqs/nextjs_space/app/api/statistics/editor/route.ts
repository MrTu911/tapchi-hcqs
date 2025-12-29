
/**
 * API: Editor analytics dashboard
 * GET /api/statistics/editor
 */

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from '@/lib/auth';
import { getServerSession } from '@/lib/auth';
import { getEditorAnalytics, getSubmissionTrend } from '@/lib/editor-analytics';
import { errorResponse, successResponse } from '@/lib/responses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Chỉ editor trở lên mới xem được analytics
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden', 403);
    }
    
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const trendMonths = parseInt(searchParams.get('trendMonths') || '12');
    
    let dateRange: { from: Date; to: Date } | undefined;
    if (fromDate && toDate) {
      dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate)
      };
    }
    
    const analytics = await getEditorAnalytics(dateRange);
    const trend = await getSubmissionTrend(trendMonths);
    
    return successResponse({
      analytics,
      trend
    });
    
  } catch (error: any) {
    console.error('❌ Error fetching editor analytics:', error);
    return errorResponse(error.message || 'Failed to fetch analytics', 500);
  }
}
