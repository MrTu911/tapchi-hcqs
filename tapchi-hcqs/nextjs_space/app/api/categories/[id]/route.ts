import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories/[id]
 * Get a specific category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: {
              where: {
                status: 'PUBLISHED'
              }
            }
          }
        }
      }
    });

    if (!category) {
      return errorResponse('Không tìm thấy chuyên mục', 404);
    }

    return NextResponse.json({ data: category });
  } catch (error: any) {
    console.error('Error fetching category:', error);
    return errorResponse(error.message || 'Lỗi khi lấy thông tin chuyên mục', 500);
  }
}

/**
 * PUT /api/categories/[id]
 * Update a category
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const allowedRoles = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền thực hiện thao tác này', 403);
    }

    const { id } = params;
    const body = await request.json();
    const { code, name, slug, description } = body;

    // Validate required fields
    if (!code || !name || !slug) {
      return errorResponse('Thiếu thông tin bắt buộc', 400);
    }

    const existingCategory = await prisma.category.findUnique({ where: { id } });
    if (!existingCategory) {
      return errorResponse('Không tìm thấy chuyên mục', 404);
    }

    // Check if code or slug already exists (excluding current category)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              { code },
              { slug }
            ]
          }
        ]
      }
    });

    if (duplicateCategory) {
      if (duplicateCategory.code === code) {
        return errorResponse('Mã chuyên mục đã tồn tại', 400);
      }
      if (duplicateCategory.slug === slug) {
        return errorResponse('Slug đã tồn tại', 400);
      }
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        code,
        name,
        slug,
        description: description || null,
      }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SUBMISSION_UPDATED,
      object: 'category',
      before: existingCategory,
      after: updatedCategory,
    });

    return successResponse(updatedCategory, 'Cập nhật chuyên mục thành công');
  } catch (error: any) {
    console.error('Error updating category:', error);
    return errorResponse(error.message || 'Lỗi khi cập nhật chuyên mục', 500);
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Only SYSADMIN and EIC can delete categories
    if (!['SYSADMIN', 'EIC'].includes(session.role)) {
      return errorResponse('Không có quyền thực hiện thao tác này', 403);
    }

    const { id } = params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!category) {
      return errorResponse('Không tìm thấy chuyên mục', 404);
    }

    // Check if category has submissions
    if (category._count.submissions > 0) {
      return errorResponse(
        `Không thể xóa chuyên mục này vì có ${category._count.submissions} bài viết đang sử dụng`,
        400
      );
    }

    // Delete category
    await prisma.category.delete({ where: { id } });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SUBMISSION_DELETED,
      object: 'category',
      before: category,
    });

    return successResponse(null, 'Xóa chuyên mục thành công');
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return errorResponse(error.message || 'Lỗi khi xóa chuyên mục', 500);
  }
}
