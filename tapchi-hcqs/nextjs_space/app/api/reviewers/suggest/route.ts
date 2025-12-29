
/**
 * API: Gợi ý reviewer cho submission
 * GET /api/reviewers/suggest?submissionId=xxx&limit=10
 */

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
import { getServerSession } from '@/lib/auth';
import { suggestReviewers } from '@/lib/reviewer-matcher';
import { errorResponse, successResponse } from '@/lib/responses';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Chỉ editor trở lên mới được dùng chức năng này
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden: Only editors can access this feature', 403);
    }
    
    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minMatchScore = parseFloat(searchParams.get('minMatchScore') || '0.2');
    
    if (!submissionId) {
      return errorResponse('submissionId is required', 400);
    }
    
    const suggestions = await suggestReviewers(submissionId, {
      limit,
      minMatchScore
    });
    
    return successResponse({
      suggestions,
      count: suggestions.length
    });
    
  } catch (error: any) {
    console.error('❌ Error suggesting reviewers:', error);
    return errorResponse(error.message || 'Failed to suggest reviewers', 500);
  }
}
