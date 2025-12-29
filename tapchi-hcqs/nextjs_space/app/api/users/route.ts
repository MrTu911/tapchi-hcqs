
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { can } from '@/lib/rbac'
import { hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Filters
    const role = searchParams.get('role')
    const status = searchParams.get('status') // 'active', 'inactive', 'all'
    const search = searchParams.get('search')
    const org = searchParams.get('org')
    const sortBy = searchParams.get('sortBy') || 'createdAt' // 'createdAt', 'fullName', 'email'
    const sortOrder = searchParams.get('sortOrder') || 'desc' // 'asc', 'desc'

    // Build where clause
    const where: any = {}
    
    if (role && role !== 'all') {
      where.role = role
    }

    if (status === 'active') {
      where.isActive = true
    } else if (status === 'inactive') {
      where.isActive = false
    }

    if (org && org !== 'all') {
      where.org = org
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { org: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get total count
    const total = await prisma.user.count({ where })

    // Get users
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        org: true,
        isActive: true,
        createdAt: true,
        rank: true,
        position: true,
        academicTitle: true,
        academicDegree: true,
        reviewerProfile: {
          select: {
            expertise: true,
            totalReviews: true,
            completedReviews: true
          }
        },
        _count: {
          select: {
            submissions: true,
            reviews: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take: limit
    })

    // Get unique organizations for filter
    const organizations = await prisma.user.findMany({
      where: {
        org: { not: null }
      },
      select: {
        org: true
      },
      distinct: ['org']
    })

    return NextResponse.json({ 
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      filters: {
        organizations: organizations.map(o => o.org).filter(Boolean)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách người dùng' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !can.admin(session.role as any)) {
      return NextResponse.json(
        { error: 'Không có quyền tạo người dùng' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      fullName, 
      email, 
      password, 
      role, 
      org,
      rank,
      position,
      academicTitle,
      academicDegree,
      expertise
    } = body

    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Email đã tồn tại' },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    // Create user with additional fields
    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        passwordHash,
        role,
        org: org || null,
        rank: rank || null,
        position: position || null,
        academicTitle: academicTitle || null,
        academicDegree: academicDegree || null,
        isActive: true
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        org: true,
        rank: true,
        position: true,
        academicTitle: true,
        academicDegree: true,
        isActive: true,
        createdAt: true
      }
    })

    // If role is REVIEWER and expertise is provided, create ReviewerProfile
    if (role === 'REVIEWER' && expertise && Array.isArray(expertise) && expertise.length > 0) {
      await prisma.reviewerProfile.create({
        data: {
          userId: user.id,
          expertise: expertise,
          keywords: []
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.uid,
        action: 'CREATE_USER',
        object: `user:${user.id}`,
        after: user as any,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi tạo người dùng' },
      { status: 500 }
    )
  }
}
