
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'
import { getServerSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
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
    })

    return successResponse(categories)
  } catch (error) {
    console.error('Categories error:', error)
    return errorResponse('Lỗi server')
  }
}

export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!code || !name || !slug) {
      return errorResponse('Thiếu thông tin bắt buộc', 400)
    }

    // Check if code or slug already exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { code },
          { slug }
        ]
      }
    })

    if (existingCategory) {
      if (existingCategory.code === code) {
        return errorResponse('Mã chuyên mục đã tồn tại', 400)
      }
      if (existingCategory.slug === slug) {
        return errorResponse('Slug đã tồn tại', 400)
      }
    }

    const category = await prisma.category.create({
      data: {
        code,
        name,
        slug,
        description: description || null,
      }
    })

    return successResponse(category, 'Tạo chuyên mục thành công')
  } catch (error) {
    console.error('Create category error:', error)
    return errorResponse('Lỗi server khi tạo chuyên mục')
  }
}
