
/**
 * 🧠 API: Advanced Reviewer Analytics
 * GET /api/statistics/reviewers-advanced
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getReviewerAnalytics } from '@/lib/advanced-analytics';
import { successResponse, errorResponse } from '@/lib/responses';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }

    const payload = verifyToken(token);
    if (!payload) {
      return errorResponse('Invalid token', 401);
    }

    // Only admin and editors can view
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(payload.role)) {
      return errorResponse('Forbidden', 403);
    }

    const analytics = await getReviewerAnalytics();
    return successResponse(analytics);
    
  } catch (error: any) {
    console.error('❌ Error fetching reviewer analytics:', error);
    return errorResponse(error.message || 'Failed to fetch analytics', 500);
  }
}
