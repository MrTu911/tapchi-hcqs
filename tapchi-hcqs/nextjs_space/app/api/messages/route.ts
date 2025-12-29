
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notification-manager'

// GET - Lấy danh sách tin nhắn theo submissionId
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this submission
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: true
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Check if user is author, editor, or admin
    const userRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR']
    const isEditor = userRoles.includes(session.role)
    const isAuthor = submission.createdBy === session.uid

    if (!isEditor && !isAuthor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { submissionId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Mark messages as read by current user
    await prisma.message.updateMany({
      where: {
        submissionId,
        receiverId: session.uid,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      success: true,
      data: messages
    })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Gửi tin nhắn mới
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { submissionId, receiverId, message } = body

    if (!submissionId || !receiverId || !message?.trim()) {
      return NextResponse.json(
        { error: 'submissionId, receiverId, and message are required' },
        { status: 400 }
      )
    }

    // Verify submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver) {
      return NextResponse.json({ error: 'Receiver not found' }, { status: 404 })
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        submissionId,
        senderId: session.uid,
        receiverId,
        message: message.trim(),
        isRead: false
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            role: true
          }
        }
      }
    })

    // Send notification to receiver
    await createNotification({
      userId: receiverId,
      type: 'SUBMISSION_RECEIVED', // Use existing type or create new one
      title: 'Tin nhắn mới',
      message: `Bạn có tin nhắn mới về bài "${submission.title}"`,
      link: `/dashboard/author/submissions/${submissionId}#messages`
    })

    return NextResponse.json({
      success: true,
      data: newMessage
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET unread count
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: session.uid,
        isRead: false
      }
    })

    return NextResponse.json({
      success: true,
      unreadCount
    })
  } catch (error: any) {
    console.error('Error getting unread count:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
