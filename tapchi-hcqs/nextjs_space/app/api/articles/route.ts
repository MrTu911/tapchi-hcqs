
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  limit: z.string().transform(val => Math.min(parseInt(val) || 10, 50)).optional(),
  categoryId: z.string().optional(),
  year: z.string().transform(val => parseInt(val) || undefined).optional(),
  search: z.string().optional(),
  sort: z.enum(['latest', 'oldest', 'views', 'title']).default('latest'),
  status: z.string().optional(), // ACCEPTED,IN_PRODUCTION
  withoutIssue: z.string().transform(val => val === 'true').optional()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    
    const validation = querySchema.safeParse(query)
    if (!validation.success) {
      return errorResponse('Tham số không hợp lệ', 400)
    }

    const { page = 1, limit = 10, categoryId, year, search, sort, status, withoutIssue } = validation.data

    // Build where clause
    const where: any = {}
    
    // Handle submission filters
    if (status) {
      // Parse comma-separated statuses
      const statuses = status.split(',').map(s => s.trim())
      where.submission = {
        status: statuses.length > 1 ? { in: statuses } : statuses[0]
      }
    } else {
      // Default to PUBLISHED only
      where.submission = {
        status: 'PUBLISHED'
      }
    }

    if (categoryId) {
      where.submission = { ...where.submission, categoryId }
    }

    // Filter articles without issue
    if (withoutIssue) {
      where.issueId = null
    }

    if (year) {
      where.issue = {
        year
      }
    }

    if (search) {
      where.OR = [
        {
          submission: {
            title: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          submission: {
            abstractVn: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          submission: {
            abstractEn: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          submission: {
            keywords: {
              has: search
            }
          }
        }
      ]
    }

    // Build orderBy
    let orderBy: any = {}
    switch (sort) {
      case 'latest':
        orderBy = { publishedAt: 'desc' }
        break
      case 'oldest':
        orderBy = { publishedAt: 'asc' }
        break
      case 'views':
        orderBy = { views: 'desc' }
        break
      case 'title':
        orderBy = { submission: { title: 'asc' } }
        break
    }

    // Get total count
    const total = await prisma.article.count({ where })

    // Get articles
    const articles = await prisma.article.findMany({
      where,
      orderBy,
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
    console.error('Articles error:', error)
    return errorResponse('Lỗi server')
  }
}
