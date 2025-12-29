
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if article belongs to user
    const existing = await prisma.submission.findFirst({
      where: {
        id: params.id,
        createdBy: session.uid
      }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Article not found or unauthorized' },
        { status: 404 }
      )
    }

    const data = await request.json()

    // Save draft without changing status
    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        title: data.title,
        abstractVn: data.abstract,
        keywords: data.keywords
      }
    })

    return NextResponse.json({ 
      success: true, 
      savedAt: new Date() 
    })
  } catch (error) {
    console.error('Error autosaving article:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
