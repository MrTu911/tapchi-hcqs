

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Try to find article by ID first
    let article = await prisma.article.findUnique({
      where: { id },
      include: {
        submission: {
          include: {
            category: true,
            author: {
              select: {
                id: true,
                fullName: true,
                org: true,
                email: true
              }
            }
          }
        },
        issue: {
          include: {
            volume: true
          }
        }
      }
    });

    // If not found, try to find by submission ID
    if (!article) {
      article = await prisma.article.findFirst({
        where: { submissionId: id },
        include: {
          submission: {
            include: {
              category: true,
              author: {
                select: {
                  id: true,
                  fullName: true,
                  org: true,
                  email: true
                }
              }
            }
          },
          issue: {
            include: {
              volume: true
            }
          }
        }
      });
    }

    if (!article) {
      return NextResponse.json(
        { error: 'Không tìm thấy bài báo' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.article.update({
      where: { id: article.id },
      data: { views: { increment: 1 } }
    });

    // Fetch related articles from the same category
    let relatedArticles: any[] = [];
    if (article.submission?.categoryId) {
      relatedArticles = await prisma.article.findMany({
        where: {
          id: { not: article.id },
          submission: {
            categoryId: article.submission.categoryId,
            status: 'PUBLISHED'
          }
        },
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
        },
        orderBy: { publishedAt: 'desc' },
        take: 6
      });
    }

    return NextResponse.json({
      success: true,
      article,
      relatedArticles
    });
  } catch (error) {
    console.error('Article fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      issueId,
      pages,
      doiLocal,
      isFeatured
    } = body;

    const oldArticle = await prisma.article.findUnique({
      where: { id }
    });

    if (!oldArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        issueId: issueId || null,
        pages,
        doiLocal,
        isFeatured: isFeatured !== undefined ? isFeatured : oldArticle.isFeatured
      },
      include: {
        submission: {
          include: {
            category: true,
            author: true
          }
        },
        issue: {
          include: {
            volume: true
          }
        }
      }
    });

    await logAudit({
      actorId: session.uid,
      action: 'ARTICLE_UPDATE',
      object: `Article:${article.id}`,
      before: oldArticle,
      after: article,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      article
    });
  } catch (error) {
    console.error('Article update error:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}
