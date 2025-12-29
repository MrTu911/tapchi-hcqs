/**
 * API: Keyword Detail
 * Quản lý chi tiết từ khóa
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Validation schema
const updateKeywordSchema = z.object({
  term: z.string().min(2).optional(),
  category: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  relatedTerms: z.array(z.string()).optional(),
});

/**
 * GET /api/keywords/[id]
 * Lấy thông tin chi tiết từ khóa
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const keyword = await prisma.keyword.findUnique({
      where: { id },
    });

    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: keyword,
    });
  } catch (error) {
    console.error('Error fetching keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch keyword' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/keywords/[id]
 * Cập nhật từ khóa (chỉ Editor+)
 */
export async function PUT(
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

    // Kiểm tra quyền
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = updateKeywordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Nếu cập nhật term, kiểm tra xem đã tồn tại chưa
    if (data.term) {
      const existingKeyword = await prisma.keyword.findFirst({
        where: {
          term: data.term.toLowerCase(),
          NOT: { id },
        },
      });

      if (existingKeyword) {
        return NextResponse.json(
          { success: false, error: `Từ khóa "${data.term}" đã tồn tại` },
          { status: 400 }
        );
      }
      
      // Chuẩn hóa term
      data.term = data.term.toLowerCase();
    }

    // Cập nhật keyword
    const keyword = await prisma.keyword.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      success: true,
      data: keyword,
      message: 'Cập nhật từ khóa thành công',
    });
  } catch (error) {
    console.error('Error updating keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update keyword' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keywords/[id]
 * Xóa từ khóa (chỉ Managing Editor, EIC, SYSADMIN)
 */
export async function DELETE(
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

    // Kiểm tra quyền (chỉ Managing Editor trở lên)
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Xóa keyword
    await prisma.keyword.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa từ khóa thành công',
    });
  } catch (error) {
    console.error('Error deleting keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete keyword' },
      { status: 500 }
    );
  }
}
