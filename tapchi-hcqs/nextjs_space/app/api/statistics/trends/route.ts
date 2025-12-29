
/**
 * 💡 API: Trend Analysis with AI Predictions
 * GET /api/statistics/trends
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { getTrendAnalysis } from '@/lib/advanced-analytics';
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

    // Only admin and EIC can view trends
    const allowedRoles = ['SYSADMIN', 'EIC'];
    if (!allowedRoles.includes(payload.role)) {
      return errorResponse('Forbidden', 403);
    }

    const analysis = await getTrendAnalysis();
    return successResponse(analysis);
    
  } catch (error: any) {
    console.error('❌ Error fetching trend analysis:', error);
    return errorResponse(error.message || 'Failed to fetch trends', 500);
  }
}
