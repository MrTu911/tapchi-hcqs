
/**
 * 🔑 API TOKEN MANAGEMENT - DELETE/REVOKE
 */

import { NextRequest, NextResponse } from 'next/server'
import { revokeApiToken, deleteApiToken } from '@/lib/security/api-token-manager'
import { getServerSession } from '@/lib/auth'

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const params = await context.params
    const tokenId = params.id
    
    await deleteApiToken(tokenId, session.uid)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting API token:', error)
    return NextResponse.json(
      { error: 'Failed to delete API token' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const params = await context.params
    const tokenId = params.id
    const body = await req.json()
    
    if (body.action === 'revoke') {
      await revokeApiToken(tokenId, session.uid)
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error revoking API token:', error)
    return NextResponse.json(
      { error: 'Failed to revoke API token' },
      { status: 500 }
    )
  }
}
