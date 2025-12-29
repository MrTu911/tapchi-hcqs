
/**
 * ✅ Phase 2: Session Management API
 * GET: List all sessions (admin) or user's sessions
 * DELETE: Force logout specific session or all user sessions
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import {
  getAllActiveSessions,
  getUserSessions,
  deleteSession,
  deleteAllUserSessions
} from '@/lib/session-manager'
import { auditLogger, AuditEventType } from '@/lib/audit-logger'

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const token = request.cookies.get('accessToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If admin and requesting all sessions
    if (payload.role === 'SYSADMIN' && !userId) {
      const sessions = await getAllActiveSessions()
      return NextResponse.json({ sessions })
    }

    // Get specific user's sessions (admin can view any, users can only view their own)
    const targetUserId = userId || payload.uid
    if (targetUserId !== payload.uid && payload.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const sessions = await getUserSessions(targetUserId)
    return NextResponse.json({ sessions })
  } catch (error: any) {
    console.error('Error getting sessions:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get current user from token
    const token = request.cookies.get('accessToken')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const userId = searchParams.get('userId')
    const all = searchParams.get('all') === 'true'

    const requestInfo = auditLogger.extractRequestInfo(request)

    // Delete all sessions for a user
    if (all && userId) {
      // Only admin can force logout others
      if (userId !== payload.uid && payload.role !== 'SYSADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      await deleteAllUserSessions(userId)

      await auditLogger.logSuccess(AuditEventType.LOGOUT, {
        userId: payload.uid,
        userEmail: payload.email,
        userRole: payload.role,
        details: { action: 'Force logout all sessions', targetUserId: userId },
        ...requestInfo
      })

      return NextResponse.json({ message: 'Đã đăng xuất tất cả phiên' })
    }

    // Delete specific session
    if (sessionId) {
      await deleteSession(sessionId)

      await auditLogger.logSuccess(AuditEventType.LOGOUT, {
        userId: payload.uid,
        userEmail: payload.email,
        userRole: payload.role,
        details: { action: 'Force logout session', sessionId },
        ...requestInfo
      })

      return NextResponse.json({ message: 'Đã đăng xuất phiên' })
    }

    return NextResponse.json({ error: 'Missing sessionId or userId' }, { status: 400 })
  } catch (error: any) {
    console.error('Error deleting session:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
