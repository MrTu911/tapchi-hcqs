
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, notFoundResponse } from '@/lib/responses'

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    const validation = querySchema.safeParse(query)
    if (!validation.success) {
      return errorResponse('Tham số không hợp lệ', 400)
    }

    const { page = 1, limit = 10 } = validation.data

    // Find category
    const category = await prisma.category.findUnique({
      where: { slug }
    })

    if (!category) {
      return notFoundResponse('Không tìm thấy chuyên mục')
    }

    // Get articles count
    const total = await prisma.article.count({
      where: {
        submission: {
          categoryId: category.id,
          status: 'PUBLISHED'
        }
      }
    })

    // Get articles
    const articles = await prisma.article.findMany({
      where: {
        submission: {
          categoryId: category.id,
          status: 'PUBLISHED'
        }
      },
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        submission: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                fullName: true,
                org: true
              }
            }
          }
        },
        issue: true
      }
    })

    const totalPages = Math.ceil(total / limit)

    return successResponse({
      category,
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    })
  } catch (error) {
    console.error('Category articles error:', error)
    return errorResponse('Lỗi server')
  }
}
