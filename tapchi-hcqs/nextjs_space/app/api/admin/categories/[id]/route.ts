
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { getServerSession } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!category) {
      return errorResponse('Không tìm thấy chuyên mục', 404)
    }

    return successResponse(category)
  } catch (error) {
    console.error('Get category error:', error)
    return errorResponse('Lỗi server')
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    // Check permissions
    const allowedRoles = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC']
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền thực hiện thao tác này', 403)
    }

    const body = await request.json()
    const { code, name, slug, description } = body

    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: params.id }
    })

    if (!existingCategory) {
      return errorResponse('Không tìm thấy chuyên mục', 404)
    }

    // Check if code or slug already exists (excluding current category)
    if (code || slug) {
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            {
              OR: [
                code ? { code } : {},
                slug ? { slug } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            }
          ]
        }
      })

      if (duplicateCategory) {
        if (duplicateCategory.code === code) {
          return errorResponse('Mã chuyên mục đã tồn tại', 400)
        }
        if (duplicateCategory.slug === slug) {
          return errorResponse('Slug đã tồn tại', 400)
        }
      }
    }

    const category = await prisma.category.update({
      where: { id: params.id },
      data: {
        ...(code && { code }),
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description: description || null }),
      }
    })

    return successResponse(category, 'Cập nhật chuyên mục thành công')
  } catch (error) {
    console.error('Update category error:', error)
    return errorResponse('Lỗi server khi cập nhật chuyên mục')
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    // Check permissions
    const allowedRoles = ['SYSADMIN', 'MANAGING_EDITOR', 'EIC']
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền thực hiện thao tác này', 403)
    }

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    })

    if (!category) {
      return errorResponse('Không tìm thấy chuyên mục', 404)
    }

    // Check if category has submissions
    if (category._count.submissions > 0) {
      return errorResponse(
        `Không thể xóa chuyên mục có ${category._count.submissions} bài viết. Vui lòng chuyển các bài viết sang chuyên mục khác trước.`,
        400
      )
    }

    await prisma.category.delete({
      where: { id: params.id }
    })

    return successResponse(null, 'Xóa chuyên mục thành công')
  } catch (error) {
    console.error('Delete category error:', error)
    return errorResponse('Lỗi server khi xóa chuyên mục')
  }
}