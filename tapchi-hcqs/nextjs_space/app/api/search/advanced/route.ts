
// @ts-nocheck
export const dynamic = "force-dynamic"

import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const keyword = searchParams.get('keyword')
    const title = searchParams.get('title')
    const author = searchParams.get('author')
    const affiliation = searchParams.get('affiliation')
    const categoryId = searchParams.get('categoryId')
    const yearFrom = searchParams.get('yearFrom')
    const yearTo = searchParams.get('yearTo')
    const keywords = searchParams.get('keywords')

    // Build where clause
    const where: any = {
      submission: {
        status: 'PUBLISHED'
      }
    }

    // General keyword search across multiple fields
    if (keyword) {
      where.OR = [
        {
          submission: {
            title: {
              contains: keyword,
              mode: 'insensitive'
            }
          }
        },
        {
          submission: {
            abstract: {
              contains: keyword,
              mode: 'insensitive'
            }
          }
        },
        {
          submission: {
            author: {
              fullName: {
                contains: keyword,
                mode: 'insensitive'
              }
            }
          }
        }
      ]
    }

    // Title search
    if (title) {
      where.submission = {
        ...where.submission,
        title: {
          contains: title,
          mode: 'insensitive'
        }
      }
    }

    // Author search
    if (author) {
      where.submission = {
        ...where.submission,
        author: {
          fullName: {
            contains: author,
            mode: 'insensitive'
          }
        }
      }
    }

    // Affiliation search
    if (affiliation) {
      where.submission = {
        ...where.submission,
        author: {
          ...where.submission?.author,
          affiliation: {
            contains: affiliation,
            mode: 'insensitive'
          }
        }
      }
    }

    // Category filter
    if (categoryId && categoryId !== 'all') {
      where.submission = {
        ...where.submission,
        categoryId
      }
    }

    // Year range filter
    if (yearFrom || yearTo) {
      where.issue = {
        ...(where.issue || {}),
        ...(yearFrom && { year: { gte: parseInt(yearFrom) } }),
        ...(yearTo && { year: { lte: parseInt(yearTo) } })
      }

      // If both are specified, combine them
      if (yearFrom && yearTo) {
        where.issue = {
          year: {
            gte: parseInt(yearFrom),
            lte: parseInt(yearTo)
          }
        }
      }
    }

    // Keywords search
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean)
      if (keywordArray.length > 0) {
        where.submission = {
          ...where.submission,
          OR: keywordArray.map(kw => ({
            keywords: {
              has: kw
            }
          }))
        }
      }
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        submission: {
          include: {
            author: {
              select: {
                fullName: true,
                affiliation: true
              }
            },
            category: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        issue: {
          include: {
            volume: {
              select: {
                number: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100 // Limit results
    })

    // Transform to simpler structure
    const results = articles.map(article => ({
      id: article.id,
      title: article.submission.title,
      abstract: article.submission.abstract || '',
      author: {
        fullName: article.submission.author.fullName,
        org: article.submission.author.org
      },
      category: article.submission.category,
      keywords: article.submission.keywords || [],
      createdAt: article.submission.createdAt,
      issue: article.issue ? {
        volume: article.issue.volume,
        number: article.issue.number,
        year: article.issue.year
      } : null
    }))

    return successResponse(results, 'Tìm kiếm thành công')
  } catch (error) {
    console.error('Advanced search error:', error)
    return errorResponse('Lỗi tìm kiếm', 500)
  }
}
