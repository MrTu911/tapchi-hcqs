
/**
 * Public Article Detail API
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        category: true,
        author: {
          select: { id: true, fullName: true, org: true, bio: true }
        },
        article: {
          include: {
            issue: {
              include: { volume: true }
            }
          }
        }
      }
    })

    if (!submission || submission.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Get metrics
    const metrics = await prisma.articleMetrics.findUnique({
      where: { articleId: submission.article?.id }
    })

    return NextResponse.json({
      article: submission,
      metrics
    })
  } catch (error) {
    console.error('Public article detail API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}
