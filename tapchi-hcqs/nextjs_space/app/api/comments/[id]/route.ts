/**
 * API: Comment Management
 * Quản lý bình luận (duyệt, xóa)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/comments/[id]
 * Duyệt hoặc từ chối bình luận (chỉ Editor+)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || !session?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ Section Editor, Managing Editor, EIC, SYSADMIN mới có quyền duyệt bình luận
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const { isApproved } = body;

    if (typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isApproved must be a boolean' },
        { status: 400 }
      );
    }

    // Cập nhật trạng thái bình luận
    const comment = await prisma.articleComment.update({
      where: { id },
      data: { isApproved },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            org: true,
          },
        },
        article: {
          select: {
            id: true,
            submission: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: comment,
      message: isApproved ? 'Bình luận đã được duyệt' : 'Bình luận đã bị từ chối',
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update comment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/comments/[id]
 * Xóa bình luận (chỉ Editor+ hoặc chủ bình luận)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const userId = session.uid;

    // Lấy thông tin bình luận
    const comment = await prisma.articleComment.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!comment) {
      return NextResponse.json(
        { success: false, error: 'Comment not found' },
        { status: 404 }
      );
    }

    // Kiểm tra quyền: chỉ chủ bình luận hoặc Editor+ mới xóa được
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    const isOwner = comment.userId === userId;
    const isEditor = session.role && allowedRoles.includes(session.role as Role);

    if (!isOwner && !isEditor) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Xóa bình luận
    await prisma.articleComment.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Đã xóa bình luận',
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
