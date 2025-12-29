
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateDOISuffix, validateDOI, submitDOIToCrossRef, getCrossRefConfig } from '@/lib/integrations/crossref'

/**
 * GET /api/metadata - Get article metadata
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = req.nextUrl.searchParams
    const articleId = searchParams.get('articleId')

    if (articleId) {
      // Get single article metadata
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          submission: {
            include: {
              author: true,
              category: true
            }
          },
          issue: {
            include: {
              volume: true
            }
          }
        }
      })

      if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: article
      })
    }

    // Get all articles with metadata
    const articles = await prisma.article.findMany({
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
            category: true
          }
        },
        issue: {
          include: {
            volume: true
          }
        }
      },
      orderBy: {
        publishedAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: articles
    })
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/metadata - Update article metadata
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { articleId, pages, doiLocal, issueId, publishedAt } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'Missing articleId' },
        { status: 400 }
      )
    }

    // Validate DOI if provided
    if (doiLocal && !validateDOI(doiLocal)) {
      return NextResponse.json(
        { error: 'Invalid DOI format' },
        { status: 400 }
      )
    }

    const article = await prisma.article.update({
      where: { id: articleId },
      data: {
        pages,
        doiLocal,
        issueId,
        publishedAt: publishedAt ? new Date(publishedAt) : undefined
      },
      include: {
        submission: {
          include: {
            author: true
          }
        },
        issue: {
          include: {
            volume: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: article
    })
  } catch (error) {
    console.error('Error updating metadata:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/metadata/generate-doi - Generate DOI for article
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN']
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { articleId, prefix = '10.xxxxx' } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'Missing articleId' },
        { status: 400 }
      )
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        issue: {
          include: {
            volume: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    if (!article.issue) {
      return NextResponse.json(
        { error: 'Article must be assigned to an issue first' },
        { status: 400 }
      )
    }

    // Count articles in the same issue to generate article number
    const articleCount = await prisma.article.count({
      where: { issueId: article.issueId }
    })

    const doiSuffix = generateDOISuffix(
      article.issue.volume.volumeNo,
      article.issue.number,
      articleCount
    )

    const doi = `${prefix}/${doiSuffix}`

    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: { doiLocal: doi }
    })

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      doi
    })
  } catch (error) {
    console.error('Error generating DOI:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
