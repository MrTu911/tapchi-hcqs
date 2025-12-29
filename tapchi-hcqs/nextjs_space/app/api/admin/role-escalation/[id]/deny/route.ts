import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-logger';

/**
 * @route POST /api/admin/role-escalation/[id]/deny
 * @description Deny a role escalation request
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
    const body = await req.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Denial reason is required' },
        { status: 400 }
      );
    }

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

    // Update the escalation request (using REJECTED status per schema)
    const result = await prisma.roleEscalationRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectedAt: new Date(),
        rejectionReason: reason
      }
    });

    // Log the denial
    await createAuditLog({
      userId: session.uid,
      action: 'REJECT',
      entity: 'RoleEscalationRequest',
      entityId: requestId,
      metadata: {
        userId: escalationRequest.userId,
        requestedRole: escalationRequest.requestedRole,
        reason
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Role escalation request rejected',
      data: result
    });

  } catch (error) {
    console.error('Error rejecting role escalation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
