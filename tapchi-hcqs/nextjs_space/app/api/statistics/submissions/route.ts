export const dynamic = 'force-dynamic';

/**
 * GET /api/statistics/submissions
 * Mô tả: Lấy thống kê phân tích submissions
 * Auth: Required (Admin, Editors only)
 */

import { NextRequest } from 'next/server';
import { getSubmissionAnalytics } from '@/lib/advanced-analytics';
import { successResponse } from '@/lib/responses';
import { requireRole } from '@/lib/api-guards';
import { handleError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    // Log request
    logger.info({
      context: 'API_STATISTICS_SUBMISSIONS',
      message: 'Get submission analytics'
    });

    // Require admin or editor role
    const session = await requireRole(['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'], request);

    const analytics = await getSubmissionAnalytics();

    // Log success
    logger.info({
      context: 'API_STATISTICS_SUBMISSIONS',
      message: 'Analytics retrieved',
      userId: session.user.id
    });

    return successResponse(analytics);
    
  } catch (error) {
    logger.error({
      context: 'API_STATISTICS_SUBMISSIONS',
      message: 'Get analytics failed',
      error: error instanceof Error ? error.message : String(error)
    });
    
    return handleError(error, 'API_STATISTICS_SUBMISSIONS');
  }
}
