import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAudit, AuditEventType } from '@/lib/audit-logger';
import { DeadlineType } from '@prisma/client';

// GET - Lấy danh sách deadline
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const isOverdue = searchParams.get('isOverdue');
    const userId = searchParams.get('userId');

    const whereClause: any = {};

    // Filter by type
    if (type) {
      whereClause.type = type as DeadlineType;
    }

    // Filter by overdue
    if (isOverdue !== null) {
      whereClause.isOverdue = isOverdue === 'true';
    }

    // Filter by assigned user
    if (userId) {
      whereClause.assignedTo = userId;
    }

    // Role-based access: Authors and Reviewers only see their own deadlines
    if (session.role === 'AUTHOR' || session.role === 'REVIEWER') {
      whereClause.assignedTo = session.uid;
    }

    const deadlines = await prisma.deadline.findMany({
      where: whereClause,
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            code: true,
            status: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [
        { isOverdue: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    // Update isOverdue status
    const now = new Date();
    for (const deadline of deadlines) {
      const isNowOverdue = deadline.dueDate < now && !deadline.completedAt;
      if (deadline.isOverdue !== isNowOverdue) {
        await prisma.deadline.update({
          where: { id: deadline.id },
          data: { isOverdue: isNowOverdue },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: deadlines,
    });
  } catch (error: any) {
    console.error('Error fetching deadlines:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Tạo deadline mới
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chỉ Editor trở lên được tạo deadline
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { submissionId, type, dueDate, assignedTo, note } = body;

    if (!submissionId || !type || !dueDate) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    // Kiểm tra submission có tồn tại
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Bài báo không tồn tại' },
        { status: 404 }
      );
    }

    // Tạo deadline
    const deadline = await prisma.deadline.create({
      data: {
        submissionId,
        type: type as DeadlineType,
        dueDate: new Date(dueDate),
        assignedTo: assignedTo || null,
        note: note || null,
        isOverdue: new Date(dueDate) < new Date(),
      },
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
      object: `DEADLINE:${deadline.id}`,
      after: { type, dueDate, assignedTo, submissionId },
    });

    return NextResponse.json({
      success: true,
      data: deadline,
      message: 'Deadline đã được tạo',
    });
  } catch (error: any) {
    console.error('Error creating deadline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Xóa deadline
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Thiếu ID deadline' },
        { status: 400 }
      );
    }

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

    await prisma.deadline.delete({
      where: { id },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SUBMISSION_UPDATED,
      object: `DEADLINE:${id}`,
      before: { type: deadline.type, dueDate: deadline.dueDate },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa deadline',
    });
  } catch (error: any) {
    console.error('Error deleting deadline:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
