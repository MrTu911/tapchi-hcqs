
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

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
    const role = searchParams.get('role') as Role | null
    
    if (!role) {
      return NextResponse.json(
        { error: 'Thiếu thông tin role' },
        { status: 400 }
      )
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get role permissions
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role },
      include: { permission: true }
    })

    // Create a map of permissionId -> isGranted
    const permissionMap = new Map(
      rolePermissions.map(rp => [rp.permissionId, rp.isGranted])
    )

    // Combine data
    const permissions = allPermissions.map(p => ({
      ...p,
      isGranted: permissionMap.get(p.id) ?? false
    }))

    return NextResponse.json({
      success: true,
      role,
      permissions
    })
  } catch (error) {
    console.error('Error fetching role permissions:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi lấy quyền của role' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !['SYSADMIN', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền cập nhật permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role, permissionId, isGranted } = body

    if (!role || !permissionId) {
      return NextResponse.json(
        { error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      )
    }

    // Check if role permission already exists
    const existing = await prisma.rolePermission.findUnique({
      where: {
        role_permissionId: {
          role: role as Role,
          permissionId
        }
      }
    })

    let rolePermission
    if (existing) {
      // Update
      rolePermission = await prisma.rolePermission.update({
        where: { id: existing.id },
        data: { isGranted }
      })
    } else {
      // Create
      rolePermission = await prisma.rolePermission.create({
        data: {
          role: role as Role,
          permissionId,
          isGranted
        }
      })
    }

    return NextResponse.json({
      success: true,
      rolePermission
    })
  } catch (error: any) {
    console.error('Error updating role permission:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi cập nhật quyền' },
      { status: 500 }
    )
  }
}
