import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-logger';

/**
 * @route POST /api/admin/role-escalation/[id]/approve
 * @description Approve a role escalation request
 * @access Private (SYSADMIN only)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. SYSADMIN role required.' },
        { status: 403 }
      );
    }

    const requestId = params.id;

    // Get the escalation request
    const escalationRequest = await prisma.roleEscalationRequest.findUnique({
      where: { id: requestId },
      include: { user: true }
    });

    if (!escalationRequest) {
      return NextResponse.json(
        { error: 'Escalation request not found' },
        { status: 404 }
      );
    }

    if (escalationRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    // Start a transaction to update both the request and the user role
    const result = await prisma.$transaction(async (tx) => {
      // Update the escalation request
      const updatedRequest = await tx.roleEscalationRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedBy: session.uid,
          approvedAt: new Date()
        }
      });

      // Update the user's role
      await tx.user.update({
        where: { id: escalationRequest.userId },
        data: { role: escalationRequest.requestedRole }
      });

      return updatedRequest;
    });

    // Log the approval
    await createAuditLog({
      userId: session.uid,
      action: 'APPROVE',
      entity: 'RoleEscalationRequest',
      entityId: requestId,
      metadata: {
        userId: escalationRequest.userId,
        fromRole: escalationRequest.user.role,
        toRole: escalationRequest.requestedRole
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role escalation request approved successfully',
      data: result
    });

  } catch (error) {
    console.error('Error approving role escalation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
