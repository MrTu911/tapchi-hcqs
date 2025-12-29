/**
 * API: Admin Comments Management
 * Lấy tất cả bình luận (chỉ Editor+)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';

/**
 * GET /api/admin/comments
 * Lấy tất cả bình luận (chỉ Editor, Managing Editor, EIC, SYSADMIN)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || !session?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ Section Editor, Managing Editor, EIC, SYSADMIN mới có quyền xem tất cả bình luận
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Lấy tất cả bình luận
    const comments = await prisma.articleComment.findMany({
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
      orderBy: [
        { isApproved: 'asc' },  // Chưa duyệt lên trước
        { createdAt: 'desc' },  // Mới nhất trước
      ],
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching all comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
