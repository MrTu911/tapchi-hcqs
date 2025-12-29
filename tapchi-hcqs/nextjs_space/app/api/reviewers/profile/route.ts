
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// GET - Lấy thông tin profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.uid },
      include: {
        reviewerProfile: true
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      data: user.reviewerProfile
    })
  } catch (error: any) {
    console.error('Error fetching reviewer profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Tạo hoặc cập nhật profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.uid }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    const body = await request.json()
    const { expertise, keywords, maxConcurrentReviews, isAvailable, unavailableUntil } = body
    
    // Upsert profile
    const profile = await prisma.reviewerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        expertise: expertise || [],
        keywords: keywords || [],
        maxConcurrentReviews: maxConcurrentReviews || 5,
        isAvailable: isAvailable !== false,
        unavailableUntil: unavailableUntil ? new Date(unavailableUntil) : null
      },
      update: {
        expertise: expertise || undefined,
        keywords: keywords || undefined,
        maxConcurrentReviews: maxConcurrentReviews || undefined,
        isAvailable: isAvailable !== undefined ? isAvailable : undefined,
        unavailableUntil: unavailableUntil ? new Date(unavailableUntil) : undefined
      }
    })
    
    return NextResponse.json({
      success: true,
      data: profile
    })
  } catch (error: any) {
    console.error('Error updating reviewer profile:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
