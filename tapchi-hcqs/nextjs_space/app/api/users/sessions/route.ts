
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền xem phiên đăng nhập' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    // Get recent login audit logs to show active sessions
    const where: any = {
      action: {
        in: ['LOGIN_SUCCESS', 'LOGOUT']
      }
    }

    if (userId) {
      where.actorId = userId
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 200
    })

    // Group by user and find active sessions
    const sessionMap = new Map<string, any>()

    logs.forEach(log => {
      if (!log.actorId) return

      const existing = sessionMap.get(log.actorId)
      
      if (log.action === 'LOGIN_SUCCESS') {
        if (!existing || existing.action === 'LOGOUT') {
          sessionMap.set(log.actorId, {
            userId: log.actorId,
            user: log.actor,
            loginTime: log.createdAt,
            ipAddress: log.ipAddress,
            action: 'LOGIN_SUCCESS',
            id: log.id
          })
        }
      } else if (log.action === 'LOGOUT') {
        if (existing && existing.action === 'LOGIN_SUCCESS') {
          sessionMap.delete(log.actorId)
        }
      }
    })

    const activeSessions = Array.from(sessionMap.values()).map(sess => ({
      id: sess.id,
      userId: sess.userId,
      user: sess.user,
      loginTime: sess.loginTime,
      ipAddress: sess.ip,
      duration: Math.floor((Date.now() - new Date(sess.loginTime).getTime()) / 1000 / 60) // minutes
    }))

    return NextResponse.json({ 
      sessions: activeSessions,
      total: activeSessions.length
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách phiên đăng nhập' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền kết thúc phiên đăng nhập' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'Thiếu userId' },
        { status: 400 }
      )
    }

    // Cannot terminate own session
    if (userId === session.uid) {
      return NextResponse.json(
        { error: 'Không thể kết thúc phiên đăng nhập của chính bạn' },
        { status: 400 }
      )
    }

    // Log a LOGOUT event for that user
    await prisma.auditLog.create({
      data: {
        actorId: userId,
        action: 'LOGOUT',
        object: 'session',
        ipAddress: 'admin-terminated',
        after: {
          terminatedBy: session.email,
          reason: 'Admin forced logout'
        }
      }
    })

    // In a real app, you would also invalidate the session token
    // For now, we just log the logout

    return NextResponse.json({
      success: true,
      message: 'Đã kết thúc phiên đăng nhập'
    })
  } catch (error) {
    console.error('Error terminating session:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi kết thúc phiên đăng nhập' },
      { status: 500 }
    )
  }
}
