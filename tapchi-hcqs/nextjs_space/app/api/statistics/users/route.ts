
/**
 * ✅ Phase 2: User Analytics API
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUserAnalytics } from '@/lib/user-analytics'

export const dynamic = 'force-dynamic'

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

    // Only admin can view analytics
    if (payload.role !== 'SYSADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const analytics = await getUserAnalytics()

    return NextResponse.json(analytics)
  } catch (error: any) {
    console.error('Error getting user analytics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
