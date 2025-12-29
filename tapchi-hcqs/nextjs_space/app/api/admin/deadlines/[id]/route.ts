import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

// GET - Lấy chi tiết deadline
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const deadline = await prisma.deadline.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            author: true,
            category: true,
          },
        },
        assignedUser: true,
      },
    });

    if (!deadline) {
      return NextResponse.json(
        { error: 'Không tìm thấy deadline' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deadline,
    });
  } catch (error: any) {
    console.error('Error fetching deadline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Cập nhật deadline
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { dueDate, assignedTo, note, completedAt } = body;

    const updateData: any = {};
    if (dueDate !== undefined) {
      updateData.dueDate = new Date(dueDate);
      updateData.isOverdue = new Date(dueDate) < new Date();
    }
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (note !== undefined) updateData.note = note;
    if (completedAt !== undefined) {
      updateData.completedAt = completedAt ? new Date(completedAt) : null;
      updateData.isOverdue = false; // Mark as not overdue if completed
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: updateData,
      include: {
        submission: {
          select: {
            title: true,
            code: true,
          },
        },
        assignedUser: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SUBMISSION_UPDATED,
      object: `DEADLINE:${id}`,
      after: { dueDate, assignedTo, note, completedAt },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Đã cập nhật deadline',
    });
  } catch (error: any) {
    console.error('Error updating deadline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Đánh dấu deadline hoàn thành
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const deadline = await prisma.deadline.findUnique({
      where: { id },
      include: {
        submission: true,
      },
    });

    if (!deadline) {
      return NextResponse.json(
        { error: 'Không tìm thấy deadline' },
        { status: 404 }
      );
    }

    // Chỉ người được giao mới được đánh dấu hoàn thành
    if (
      deadline.assignedTo &&
      deadline.assignedTo !== session.uid &&
      !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)
    ) {
      return NextResponse.json(
        { error: 'Bạn không có quyền đánh dấu deadline này hoàn thành' },
        { status: 403 }
      );
    }

    const updated = await prisma.deadline.update({
      where: { id },
      data: {
        completedAt: new Date(),
        isOverdue: false,
      },
      include: {
        submission: true,
        assignedUser: true,
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SUBMISSION_UPDATED,
      object: `DEADLINE:${id}`,
      after: { completedAt: new Date(), isOverdue: false },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Đã đánh dấu hoàn thành',
    });
  } catch (error: any) {
    console.error('Error completing deadline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
