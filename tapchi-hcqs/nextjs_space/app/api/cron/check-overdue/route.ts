
/**
 * API: Cron job for checking overdue submissions and deadlines
 * GET /api/cron/check-overdue
 * 
 * Should be called periodically (e.g., daily via cron job)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkOverdueDeadlines } from '@/lib/deadline-manager';
import { errorResponse, successResponse } from '@/lib/responses';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Check and mark overdue deadlines
    await checkOverdueDeadlines();
    
    // Check and update overdue submissions (SLA violations)
    const now = new Date();
    
    // Define SLA periods for each status (in days)
    const SLA_PERIODS: Record<string, number> = {
      'NEW': 7,              // New submissions should be reviewed within 7 days
      'UNDER_REVIEW': 21,    // Review period is 21 days
      'REVISION': 14,        // Authors have 14 days to submit revisions
      'ACCEPTED': 30,        // 30 days to move to production
      'IN_PRODUCTION': 14    // 14 days for production/layout
    };
    
    // Find submissions that exceed SLA
    for (const [status, days] of Object.entries(SLA_PERIODS)) {
      const slaDate = new Date(now);
      slaDate.setDate(slaDate.getDate() - days);
      
      await prisma.submission.updateMany({
        where: {
          status: status as any,
          lastStatusChangeAt: {
            lt: slaDate
          },
          isOverdue: false
        },
        data: {
          isOverdue: true,
          daysInCurrentStatus: days
        }
      });
    }
    
    // Update daysInCurrentStatus for all active submissions
    const activeSubmissions = await prisma.submission.findMany({
      where: {
        status: {
          notIn: ['PUBLISHED', 'REJECTED', 'DESK_REJECT']
        }
      },
      select: {
        id: true,
        status: true,
        lastStatusChangeAt: true
      }
    });
    
    for (const submission of activeSubmissions) {
      const daysInStatus = Math.floor(
        (now.getTime() - new Date(submission.lastStatusChangeAt).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      await prisma.submission.update({
        where: { id: submission.id },
        data: { daysInCurrentStatus: daysInStatus }
      });
    }
    
    return successResponse({
      message: 'Overdue check completed successfully',
      timestamp: new Date().toISOString(),
      processedSubmissions: activeSubmissions.length
    });
    
  } catch (error: any) {
    console.error('❌ Error checking overdue:', error);
    return errorResponse(error.message || 'Failed to check overdue', 500);
  }
}
