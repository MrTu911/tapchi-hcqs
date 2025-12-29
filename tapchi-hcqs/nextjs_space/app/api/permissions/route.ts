
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !['SYSADMIN', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    
    const where: any = { isActive: true }
    if (category && category !== 'all') {
      where.category = category
    }

    const permissions = await prisma.permission.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      permissions
    })
  } catch (error) {
    console.error('Error fetching permissions:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy danh sách quyền' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Không có quyền tạo permission' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { code, name, description, category } = body

    if (!code || !name || !category) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    const permission = await prisma.permission.create({
      data: {
        code,
        name,
        description,
        category
      }
    })

    return NextResponse.json({
      success: true,
      permission
    })
  } catch (error: any) {
    console.error('Error creating permission:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi tạo permission' },
      { status: 500 }
    )
  }
}
