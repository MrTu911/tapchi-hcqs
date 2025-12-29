
/**
 * 🧠 SECURITY ALERTS API
 * GET: Lấy danh sách security alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSecurityAlerts, getSecurityStats } from '@/lib/security/anomaly-detector'
import { getServerSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Chỉ SYSADMIN và SECURITY_AUDITOR mới xem được
    if (!['SYSADMIN', 'SECURITY_AUDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    if (action === 'stats') {
      const days = parseInt(url.searchParams.get('days') || '7')
      const stats = await getSecurityStats(days)
      return NextResponse.json(stats)
    }
    
    // Get alerts with filters
    const filters = {
      type: url.searchParams.get('type') || undefined,
      severity: url.searchParams.get('severity') || undefined,
      status: url.searchParams.get('status') || undefined
    }
    
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    const result = await getSecurityAlerts(filters as any, page, limit)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching security alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch security alerts' },
      { status: 500 }
    )
  }
}
