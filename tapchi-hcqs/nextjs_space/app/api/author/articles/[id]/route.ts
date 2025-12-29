
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const article = await prisma.submission.findFirst({
      where: {
        id: params.id,
        createdBy: session.uid
      },
      include: {
        category: true,
        reviews: {
          select: {
            id: true,
            recommendation: true,
            score: true,
            formJson: true,
            submittedAt: true,
            roundNo: true
            // Không include reviewer để đảm bảo blind review
          }
        },
        decisions: {
          include: {
            editor: {
              select: {
                fullName: true
              }
            }
          }
        },
        author: {
          select: {
            fullName: true,
            email: true,
            org: true
          }
        }
      }
    })

    if (!article) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 })
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if article belongs to user
    const existing = await prisma.submission.findFirst({
      where: {
        id: params.id,
        createdBy: session.uid
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found or unauthorized' },
        { status: 404 }
      )
    }

    // Only allow updates if status is NEW or REVISION
    if (!['NEW', 'REVISION'].includes(existing.status)) {
      return NextResponse.json(
        { error: 'Cannot edit article in current status' },
        { status: 400 }
      )
    }

    const data = await request.json()

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        title: data.title,
        abstractVn: data.abstract,
        keywords: data.keywords,
        categoryId: data.categoryId
      },
      include: {
        category: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if article belongs to user
    const existing = await prisma.submission.findFirst({
      where: {
        id: params.id,
        createdBy: session.uid
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found or unauthorized' },
        { status: 404 }
      )
    }

    // Only allow deletion if status is NEW
    if (existing.status !== 'NEW') {
      return NextResponse.json(
        { error: 'Cannot delete article after submission' },
        { status: 400 }
      )
    }

    await prisma.submission.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
