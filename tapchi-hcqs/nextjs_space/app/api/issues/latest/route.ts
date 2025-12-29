
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const latestIssue = await prisma.issue.findFirst({
      where: {
        status: 'PUBLISHED',
        publishDate: {
          lte: new Date()
        }
      },
      include: {
        volume: true,
        _count: {
          select: { articles: true }
        },
        articles: {
          include: {
            submission: {
              include: {
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    org: true
                  }
                },
                category: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    slug: true
                  }
                }
              }
            }
          },
          orderBy: {
            publishedAt: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        publishDate: 'desc'
      }
    })

    if (!latestIssue) {
      return NextResponse.json(
        { success: false, error: 'No published issues found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: latestIssue,
      issue: latestIssue // Keep for backward compatibility
    })
  } catch (error) {
    console.error('Latest issue fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch latest issue' },
      { status: 500 }
    )
  }
}
