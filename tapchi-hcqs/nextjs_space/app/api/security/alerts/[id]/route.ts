
/**
 * 🧠 SECURITY ALERT UPDATE API
 * PATCH: Cập nhật trạng thái alert
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateAlertStatus } from '@/lib/security/anomaly-detector'
import { getServerSession } from '@/lib/auth'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!['SYSADMIN', 'SECURITY_AUDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const params = await context.params
    const alertId = params.id
    const body = await req.json()
    
    const { status, notes } = body
    
    if (!status || !['REVIEWED', 'RESOLVED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }
    
    await updateAlertStatus(alertId, status, session.uid, notes)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating alert status:', error)
    return NextResponse.json(
      { error: 'Failed to update alert status' },
      { status: 500 }
    )
  }
}
