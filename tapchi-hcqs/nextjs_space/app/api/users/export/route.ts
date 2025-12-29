
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { error: 'Không có quyền xuất danh sách' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    
    // Filters
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const org = searchParams.get('org')

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

    // Get all users matching filters
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        org: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            submissions: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Role mapping for Vietnamese labels
    const getRoleLabel = (role: string) => {
      const roleMap: Record<string, string> = {
        'READER': 'Độc giả',
        'AUTHOR': 'Tác giả',
        'REVIEWER': 'Phản biện',
        'SECTION_EDITOR': 'Biên tập viên',
        'MANAGING_EDITOR': 'Thư ký tòa soạn',
        'EIC': 'Tổng biên tập',
        'LAYOUT_EDITOR': 'Biên tập bố cục',
        'SYSADMIN': 'Quản trị viên',
        'SECURITY_AUDITOR': 'Kiểm định bảo mật'
      }
      return roleMap[role] || role
    }

    // Generate CSV
    const csvHeaders = [
      'STT',
      'Họ và tên',
      'Email',
      'Vai trò',
      'Đơn vị',
      'Số điện thoại',
      'Trạng thái',
      'Số bài nộp',
      'Số phản biện',
      'Ngày tham gia'
    ]

    const csvRows = users.map((user, index) => [
      index + 1,
      user.fullName,
      user.email,
      getRoleLabel(user.role),
      user.org || '',
      user.phone || '',
      user.isActive ? 'Hoạt động' : 'Không hoạt động',
      user._count.submissions,
      user._count.reviews,
      new Date(user.createdAt).toLocaleDateString('vi-VN')
    ])

    // Escape CSV values
    const escapeCSV = (value: any) => {
      const stringValue = String(value ?? '')
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    }

    const csv = [
      csvHeaders.map(escapeCSV).join(','),
      ...csvRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    // Add BOM for UTF-8 to support Vietnamese characters in Excel
    const bom = '\uFEFF'
    const csvWithBOM = bom + csv

    // Return as downloadable file
    return new NextResponse(csvWithBOM, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    console.error('Error exporting users:', error)
    return NextResponse.json(
      { error: 'Có lỗi xảy ra khi xuất danh sách' },
      { status: 500 }
    )
  }
}
