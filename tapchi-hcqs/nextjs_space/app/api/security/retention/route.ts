
/**
 * 🧩 DATA RETENTION POLICY API
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getRetentionPolicies, 
  updateRetentionPolicy,
  getRetentionStats,
  runAllRetentionPolicies
} from '@/lib/security/data-retention'
import { getServerSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!['SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    if (action === 'stats') {
      const stats = await getRetentionStats()
      return NextResponse.json(stats)
    }
    
    const policies = await getRetentionPolicies()
    return NextResponse.json(policies)
  } catch (error) {
    console.error('Error fetching retention policies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retention policies' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!['SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await req.json()
    const { action } = body
    
    if (action === 'run') {
      const result = await runAllRetentionPolicies()
      return NextResponse.json(result)
    }
    
    // Update policy
    const { entity, ...policy } = body
    await updateRetentionPolicy(entity, policy, session.uid)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating retention policy:', error)
    return NextResponse.json(
      { error: 'Failed to update retention policy' },
      { status: 500 }
    )
  }
}
