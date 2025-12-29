
/**
 * API: Cron job for sending deadline reminders
 * GET /api/cron/reminders
 * 
 * Should be called periodically (e.g., daily via cron job or external scheduler)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  sendReviewDeadlineReminders, 
  sendRevisionDeadlineReminders 
} from '@/lib/workflow-automator';
import { errorResponse, successResponse } from '@/lib/responses';

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'default-secret';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', 401);
    }
    
    // Send review deadline reminders
    await sendReviewDeadlineReminders();
    
    // Send revision deadline reminders
    await sendRevisionDeadlineReminders();
    
    return successResponse({
      message: 'Reminders sent successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Error sending reminders:', error);
    return errorResponse(error.message || 'Failed to send reminders', 500);
  }
}
