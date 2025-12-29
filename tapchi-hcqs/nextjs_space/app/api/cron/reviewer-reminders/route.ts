import { NextRequest, NextResponse } from 'next/server';
import { sendReviewerReminders } from '@/scripts/cron-jobs';

export const dynamic = 'force-dynamic';

/**
 * @route GET /api/cron/reviewer-reminders
 * @description Cron endpoint to send reviewer reminders
 * @access Internal (should be called by cron service)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify this is an internal call
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await sendReviewerReminders();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
