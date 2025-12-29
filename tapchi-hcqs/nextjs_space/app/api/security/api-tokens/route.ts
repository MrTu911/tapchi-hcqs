
/**
 * 🔑 API TOKEN MANAGEMENT API
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createApiToken, 
  getUserApiTokens,
  getApiTokenStats
} from '@/lib/security/api-token-manager'
import { getServerSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    
    if (action === 'stats' && ['SYSADMIN'].includes(session.role)) {
      const stats = await getApiTokenStats()
      return NextResponse.json(stats)
    }
    
    const tokens = await getUserApiTokens(session.uid)
    return NextResponse.json(tokens)
  } catch (error) {
    console.error('Error fetching API tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch API tokens' },
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
    
    const body = await req.json()
    const { name, permissions, expiresInDays } = body
    
    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }
    
    const result = await createApiToken(
      session.uid,
      name,
      permissions,
      expiresInDays
    )
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating API token:', error)
    return NextResponse.json(
      { error: 'Failed to create API token' },
      { status: 500 }
    )
  }
}
