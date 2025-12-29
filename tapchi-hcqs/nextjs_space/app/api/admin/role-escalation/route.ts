import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * @route GET /api/admin/role-escalation
 * @description Get all role escalation requests
 * @access Private (SYSADMIN only)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. SYSADMIN role required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: any = {};
    // Use correct enum values: PENDING, APPROVED, REJECTED
    if (status && ['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      where.status = status;
    }

    const requests = await prisma.roleEscalationRequest.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true
          }
        },
        requester: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        },
        approver: {
          select: {
            id: true,
            email: true,
            fullName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: requests,
      count: requests.length
    });

  } catch (error) {
    console.error('Error fetching role escalation requests:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
