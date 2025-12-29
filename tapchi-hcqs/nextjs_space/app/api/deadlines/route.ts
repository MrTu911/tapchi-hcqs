/**
 * @fileoverview API route for managing deadlines
 * @description Get and manage submission deadlines
 */

import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
// authOptions not needed
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * GET /api/deadlines
 * Get user's deadlines or all deadlines (for managers)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // upcoming, overdue, completed
    const type = searchParams.get('type'); // INITIAL_REVIEW, REVISION_SUBMIT, RE_REVIEW, etc.

    const userRole = session.role;
    const isManager = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(userRole);

    const now = new Date();

    // Build where clause
    let whereClause: any = {};

    // Filter by user if not a manager
    if (!isManager) {
      whereClause.assignedTo = session.uid;
    }

    // Filter by type
    if (type) {
      whereClause.type = type;
    }

    // Filter by status
    if (status === 'upcoming') {
      whereClause.completedAt = null;
      whereClause.dueDate = { gte: now };
    } else if (status === 'overdue') {
      whereClause.completedAt = null;
      whereClause.dueDate = { lt: now };
    } else if (status === 'completed') {
      whereClause.completedAt = { not: null };
    } else {
      // Default: show all incomplete
      whereClause.completedAt = null;
    }

    const deadlines = await prisma.deadline.findMany({
      where: whereClause,
      include: {
        submission: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            author: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        },
        assignedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: 100
    });

    // Calculate deadline status
    const enrichedDeadlines = deadlines.map(deadline => {
      const dueDate = new Date(deadline.dueDate);
      const diffMs = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let status: 'overdue' | 'urgent' | 'upcoming' | 'completed';
      if (deadline.completedAt) {
        status = 'completed';
      } else if (diffDays < 0) {
        status = 'overdue';
      } else if (diffDays <= 3) {
        status = 'urgent';
      } else {
        status = 'upcoming';
      }

      return {
        ...deadline,
        daysRemaining: diffDays,
        status
      };
    });

    // Group by status for dashboard
    const summary = {
      total: enrichedDeadlines.length,
      overdue: enrichedDeadlines.filter(d => d.status === 'overdue').length,
      urgent: enrichedDeadlines.filter(d => d.status === 'urgent').length,
      upcoming: enrichedDeadlines.filter(d => d.status === 'upcoming').length,
      completed: enrichedDeadlines.filter(d => d.status === 'completed').length
    };

    return successResponse({
      deadlines: enrichedDeadlines,
      summary
    });

  } catch (error: any) {
    console.error('Error fetching deadlines:', error);
    return errorResponse(error.message || 'Internal server error', 500);
  }
}
