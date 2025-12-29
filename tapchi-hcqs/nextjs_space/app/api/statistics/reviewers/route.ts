
/**
 * API: Reviewer metrics and statistics
 * GET /api/statistics/reviewers
 * GET /api/statistics/reviewers?reviewerId=xxx
 */

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from '@/lib/auth';
import { getServerSession } from '@/lib/auth';
import { 
  getReviewerMetrics, 
  getAllReviewersMetrics, 
  getTopReviewers 
} from '@/lib/reviewer-metrics';
import { errorResponse, successResponse } from '@/lib/responses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Chỉ editor trở lên và security auditor mới xem được
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'SECURITY_AUDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden', 403);
    }
    
    const { searchParams } = new URL(request.url);
    const reviewerId = searchParams.get('reviewerId');
    const topOnly = searchParams.get('top') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (reviewerId) {
      // Lấy metrics của một reviewer cụ thể
      const metrics = await getReviewerMetrics(reviewerId);
      
      if (!metrics) {
        return errorResponse('Reviewer not found', 404);
      }
      
      return successResponse(metrics);
    } else if (topOnly) {
      // Lấy top performers
      const topReviewers = await getTopReviewers(limit);
      return successResponse({ topReviewers });
    } else {
      // Lấy metrics của tất cả reviewers
      const allMetrics = await getAllReviewersMetrics();
      return successResponse({ 
        reviewers: allMetrics,
        count: allMetrics.length
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error fetching reviewer metrics:', error);
    return errorResponse(error.message || 'Failed to fetch metrics', 500);
  }
}
