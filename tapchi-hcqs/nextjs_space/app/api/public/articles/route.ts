
/**
 * Public Articles API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const featured = searchParams.get('featured') === 'true'

    const skip = (page - 1) * limit

    const where: any = {
      status: 'PUBLISHED',
      article: { isNot: null }
    }

    if (category) {
      where.category = { code: category }
    }

    if (featured) {
      where.article = { isFeatured: true }
    }

    const [articles, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
          author: {
            select: { id: true, fullName: true, org: true }
          },
          article: {
            include: {
              issue: {
                include: { volume: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.submission.count({ where })
    ])

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Public articles API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}
