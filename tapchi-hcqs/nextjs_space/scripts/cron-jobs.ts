/**
 * Automated Cron Jobs for Journal Management System
 * 
 * These jobs handle:
 * 1. Deadline monitoring and notifications
 * 2. SLA tracking and alerts
 * 3. Automated reviewer reminders
 * 4. Overdue task escalation
 */

import { prisma } from '../lib/prisma';
import { createAuditLog } from '../lib/audit-logger';

/**
 * Check for overdue deadlines and send notifications
 * Run: Every hour
 */
export async function checkOverdueDeadlines() {
  console.log('[CRON] Checking overdue deadlines...');
  
  try {
    const now = new Date();
    
    // Find all deadlines that are overdue and not completed
    const overdueDeadlines = await prisma.deadline.findMany({
      where: {
        dueDate: { lt: now },
        completedAt: null
      },
      include: {
        assignedUser: true,
        submission: {
          select: {
            code: true,
            title: true
          }
        }
      }
    });

    console.log(`[CRON] Found ${overdueDeadlines.length} overdue deadlines`);

    for (const deadline of overdueDeadlines) {
      // Log audit event
      await createAuditLog({
        userId: deadline.assignedTo || undefined,
        action: 'DEADLINE_OVERDUE',
        entity: 'Deadline',
        entityId: deadline.id,
        metadata: {
          deadlineType: deadline.type,
          dueDate: deadline.dueDate,
          submissionCode: deadline.submission?.code,
          daysOverdue: Math.floor((now.getTime() - deadline.dueDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      // TODO: Send email notification to assigned user
      const userName = deadline.assignedUser?.fullName || 'Unknown User';
      console.log(`[CRON] Overdue deadline alert: ${deadline.type} for ${userName}`);
    }

    return { success: true, overdueCount: overdueDeadlines.length };
  } catch (error) {
    console.error('[CRON] Error checking overdue deadlines:', error);
    return { success: false, error };
  }
}

/**
 * Send reminders for upcoming deadlines (24-48 hours before)
 * Run: Daily at 9:00 AM
 */
export async function sendDeadlineReminders() {
  console.log('[CRON] Sending deadline reminders...');
  
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    // Find deadlines due in 24-48 hours
    const upcomingDeadlines = await prisma.deadline.findMany({
      where: {
        dueDate: {
          gte: in24Hours,
          lte: in48Hours
        },
        completedAt: null
      },
      include: {
        assignedUser: true,
        submission: {
          select: {
            code: true,
            title: true
          }
        }
      }
    });

    console.log(`[CRON] Found ${upcomingDeadlines.length} upcoming deadlines`);

    for (const deadline of upcomingDeadlines) {
      // Log reminder sent
      await createAuditLog({
        userId: deadline.assignedTo || undefined,
        action: 'DEADLINE_REMINDER',
        entity: 'Deadline',
        entityId: deadline.id,
        metadata: {
          deadlineType: deadline.type,
          dueDate: deadline.dueDate,
          submissionCode: deadline.submission?.code,
          hoursUntilDue: Math.floor((deadline.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))
        }
      });

      // TODO: Send email reminder to assigned user
      const userName = deadline.assignedUser?.fullName || 'Unknown User';
      console.log(`[CRON] Deadline reminder sent: ${deadline.type} for ${userName}`);
    }

    return { success: true, reminderCount: upcomingDeadlines.length };
  } catch (error) {
    console.error('[CRON] Error sending deadline reminders:', error);
    return { success: false, error };
  }
}

/**
 * Track SLA compliance and generate alerts
 * Run: Daily at midnight
 */
export async function trackSLACompliance() {
  console.log('[CRON] Tracking SLA compliance...');
  
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Check submissions in review for more than 30 days (example SLA)
    const longReviewSubmissions = await prisma.submission.findMany({
      where: {
        status: 'UNDER_REVIEW',
        createdAt: { lt: thirtyDaysAgo }
      },
      include: {
        reviews: {
          where: {
            submittedAt: null,
            declinedAt: null
          }
        }
      }
    });

    console.log(`[CRON] Found ${longReviewSubmissions.length} submissions exceeding review SLA`);

    for (const submission of longReviewSubmissions) {
      // Log SLA violation
      await createAuditLog({
        action: 'SLA_VIOLATION',
        entity: 'Submission',
        entityId: submission.id,
        metadata: {
          submissionCode: submission.code,
          status: submission.status,
          daysInReview: Math.floor((now.getTime() - submission.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
          pendingReviewers: submission.reviews.length
        }
      });

      console.log(`[CRON] SLA violation: ${submission.code} has been in review for over 30 days`);
    }

    return { success: true, violationCount: longReviewSubmissions.length };
  } catch (error) {
    console.error('[CRON] Error tracking SLA compliance:', error);
    return { success: false, error };
  }
}

/**
 * Send reminder emails to reviewers with pending reviews
 * Run: Every Monday at 10:00 AM
 */
export async function sendReviewerReminders() {
  console.log('[CRON] Sending reviewer reminders...');
  
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Find reviews invited more than 7 days ago but not yet submitted or declined
    const pendingReviews = await prisma.review.findMany({
      where: {
        invitedAt: { lt: sevenDaysAgo },
        submittedAt: null,
        declinedAt: null,
        acceptedAt: { not: null } // Only remind those who accepted
      },
      include: {
        reviewer: true,
        submission: {
          select: {
            code: true,
            title: true
          }
        }
      }
    });

    console.log(`[CRON] Found ${pendingReviews.length} pending reviews to remind`);

    for (const review of pendingReviews) {
      // Log reminder sent
      await createAuditLog({
        userId: review.reviewerId,
        action: 'REVIEWER_REMINDER',
        entity: 'Review',
        entityId: review.id,
        metadata: {
          submissionCode: review.submission.code,
          invitedAt: review.invitedAt,
          daysWaiting: Math.floor((now.getTime() - review.invitedAt.getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      // TODO: Send email reminder to reviewer
      console.log(`[CRON] Reviewer reminder sent: ${review.reviewer.fullName} for ${review.submission.code}`);
    }

    return { success: true, reminderCount: pendingReviews.length };
  } catch (error) {
    console.error('[CRON] Error sending reviewer reminders:', error);
    return { success: false, error };
  }
}

/**
 * Clean up old audit logs (older than 1 year)
 * Run: Monthly on the 1st at 2:00 AM
 */
export async function cleanupOldAuditLogs() {
  console.log('[CRON] Cleaning up old audit logs...');
  
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: oneYearAgo }
      }
    });

    console.log(`[CRON] Deleted ${result.count} old audit log entries`);

    // Log the cleanup action
    await createAuditLog({
      action: 'AUDIT_LOG_CLEANUP',
      entity: 'AuditLog',
      metadata: {
        deletedCount: result.count,
        olderThan: oneYearAgo
      }
    });

    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error('[CRON] Error cleaning up audit logs:', error);
    return { success: false, error };
  }
}

// Export all cron jobs
export const cronJobs = {
  checkOverdueDeadlines,
  sendDeadlineReminders,
  trackSLACompliance,
  sendReviewerReminders,
  cleanupOldAuditLogs
};
