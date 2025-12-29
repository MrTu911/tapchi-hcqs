
import { NextRequest, NextResponse } from 'next/server'

// Minimal NextAuth compatibility layer for testing purposes
export async function GET(
  request: NextRequest,
  { params }: { params: { nextauth: string[] } }
) {
  const path = params.nextauth?.[0]
  
  // Return providers information
  if (path === 'providers') {
    return NextResponse.json({
      credentials: {
        id: 'credentials',
        name: 'Credentials',
        type: 'credentials'
      }
    })
  }

  // Return session information
  if (path === 'session') {
    return NextResponse.json({
      user: null
    })
  }

  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

export async function POST(request: NextRequest) {
  // Forward to our custom auth endpoints
  const body = await request.json()
  
  if (body.action === 'signin') {
    // Redirect to our custom login endpoint
    return NextResponse.redirect(new URL('/api/auth/login', request.url))
  }
  
  if (body.action === 'signout') {
    // Redirect to our custom logout endpoint
    return NextResponse.redirect(new URL('/api/auth/logout', request.url))
  }

  return NextResponse.json({ error: 'Not implemented' }, { status: 501 })
}
