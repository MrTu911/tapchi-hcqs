
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/responses'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const category = await prisma.category.findUnique({
      where: { slug },
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

    if (!category) {
      return notFoundResponse('Không tìm thấy chuyên mục')
    }

    return successResponse(category)
  } catch (error) {
    console.error('Category detail error:', error)
    return errorResponse('Lỗi server')
  }
}
