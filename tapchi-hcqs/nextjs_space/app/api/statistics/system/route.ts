
/**
 * 📊 API: System Analytics
 * GET /api/statistics/system
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getSystemAnalytics } from '@/lib/advanced-analytics';
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

    // Only admin can view system analytics
    if (payload.role !== 'SYSADMIN') {
      return errorResponse('Forbidden', 403);
    }

    const analytics = await getSystemAnalytics();
    return successResponse(analytics);
    
  } catch (error: any) {
    console.error('❌ Error fetching system analytics:', error);
    return errorResponse(error.message || 'Failed to fetch analytics', 500);
  }
}
