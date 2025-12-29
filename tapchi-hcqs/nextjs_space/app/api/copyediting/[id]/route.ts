import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod validation schema
const updateCopyeditSchema = z.object({
  notes: z.string().optional(),
  fileUrl: z.string().url().optional(),
  status: z.enum(['editing', 'completed', 'revision_needed']).optional(),
  tags: z.array(z.string()).optional(),
  deadline: z.string().optional(), // ISO date string
});

/**
 * GET /api/copyediting/[id]
 * Lấy chi tiết copyedit
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const copyedit = await prisma.copyedit.findUnique({
      where: { id: params.id },
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    org: true,
                  },
                },
              },
            },
          },
        },
        editor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!copyedit) {
      return NextResponse.json(
        { success: false, message: 'Copyedit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: copyedit,
    });
  } catch (error: any) {
    console.error('GET /api/copyediting/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/copyediting/[id]
 * Cập nhật copyedit (notes, file, status)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validated = updateCopyeditSchema.parse(body);

    // Kiểm tra quyền - chỉ editor phụ trách hoặc admin mới được cập nhật
    const copyedit = await prisma.copyedit.findUnique({
      where: { id: params.id },
      include: {
        article: {
          include: {
            submission: true,
          },
        },
      },
    });

    if (!copyedit) {
      return NextResponse.json(
        { success: false, message: 'Copyedit not found' },
        { status: 404 }
      );
    }

    const isEditor = copyedit.editorId === session.uid;
    const isAdmin = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role);

    if (!isEditor && !isAdmin) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - you are not assigned to this copyedit' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      notes: validated.notes,
      fileUrl: validated.fileUrl,
      status: validated.status,
      tags: validated.tags,
    };

    // Handle deadline
    if (validated.deadline !== undefined) {
      updateData.deadline = validated.deadline ? new Date(validated.deadline) : null;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) delete updateData[key];
    });

    // Cập nhật copyedit
    const updated = await prisma.copyedit.update({
      where: { id: params.id },
      data: updateData,
      include: {
        article: {
          include: {
            submission: true,
          },
        },
        editor: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    // Nếu status thay đổi, gửi notification
    if (validated.status && validated.status !== copyedit.status) {
      let notificationMessage = '';
      if (validated.status === 'completed') {
        notificationMessage = `Biên tập bài viết "${updated.article.submission.title}" đã hoàn thành.`;
      } else if (validated.status === 'revision_needed') {
        notificationMessage = `Bài viết "${updated.article.submission.title}" cần chỉnh sửa thêm.`;
      }

      if (notificationMessage) {
        await prisma.notification.create({
          data: {
            userId: updated.article.submission.createdBy,
            type: 'ARTICLE_PUBLISHED',
            title: 'Cập nhật biên tập',
            message: notificationMessage,
            link: `/dashboard/author/submissions/${updated.article.submissionId}`,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Copyedit updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('PATCH /api/copyediting/[id] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/copyediting/[id]
 * Xóa copyedit (chỉ admin)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ admin mới có thể xóa
    if (!['EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - admin only' },
        { status: 403 }
      );
    }

    await prisma.copyedit.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Copyedit deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/copyediting/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
