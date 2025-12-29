
/**
 * API: Update reviewer expertise and keywords
 * PUT /api/reviewers/:id/expertise
 */

import { NextRequest, NextResponse } from 'next/server';
// import { getServerSession } from 'next-auth';
import { getServerSession } from '@/lib/auth';
import { updateReviewerExpertise } from '@/lib/reviewer-matcher';
import { errorResponse, successResponse } from '@/lib/responses';
import { z } from 'zod';

const expertiseSchema = z.object({
  expertise: z.array(z.string()),
  keywords: z.array(z.string())
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }
    
    const reviewerId = params.id;
    
    // Chỉ chính reviewer đó hoặc admin mới được cập nhật
    if (session.uid !== reviewerId && session.role !== 'SYSADMIN') {
      return errorResponse('Forbidden', 403);
    }
    
    const body = await request.json();
    const { expertise, keywords } = expertiseSchema.parse(body);
    
    await updateReviewerExpertise(reviewerId, expertise, keywords);
    
    return successResponse({ message: 'Expertise updated successfully' });
    
  } catch (error: any) {
    console.error('❌ Error updating reviewer expertise:', error);
    return errorResponse(error.message || 'Failed to update expertise', 500);
  }
}
