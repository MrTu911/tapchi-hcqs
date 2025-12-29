export const dynamic = "force-dynamic"


import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { handleError } from '@/lib/error-handler'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()

    // Mock data for now - in production, fetch from database
    const comments = [
      {
        id: '1',
        pageNumber: 1,
        content: 'Phần mở đầu cần bổ sung thêm tài liệu tham khảo.',
        author: 'PGS.TS Nguyễn Văn A',
        createdAt: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      success: true,
      data: comments
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    logger.error({ message: 'Error fetching comments:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const { pageNumber, content } = body

    if (!content) {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    // Get user details from database
    const userDetails = await prisma.user.findUnique({
      where: { id: user.uid },
      select: { fullName: true, email: true }
    })

    // Mock response - in production, save to database
    const newComment = {
      id: Date.now().toString(),
      pageNumber: pageNumber || 1,
      content,
      author: userDetails?.fullName || user.fullName || user.email || 'Unknown',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newComment
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    logger.error({ message: 'Error creating comment:', error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
