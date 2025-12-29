import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/responses'

/**
 * GET /api/notifications
 * Retrieves notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Build where clause
    const where: any = {
      userId: session.uid
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Fetch notifications
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit
      }),
      prisma.notification.count({
        where: {
          userId: session.uid,
          isRead: false
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount
      }
    })
  } catch (error) {
    console.error('Notification fetch error:', error)
    return errorResponse('Server error', 500)
  }
}

/**
 * PATCH /api/notifications
 * Mark notification(s) as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return errorResponse('Unauthorized', 401)
    }

    const body = await request.json()
    const { notificationIds, markAllAsRead } = body

    if (markAllAsRead) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: session.uid,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read'
      })
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: session.uid
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Notifications marked as read'
      })
    } else {
      return errorResponse('Invalid request', 400)
    }
  } catch (error) {
    console.error('Notification update error:', error)
    return errorResponse('Server error', 500)
  }
}
