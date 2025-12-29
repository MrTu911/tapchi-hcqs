
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PermissionCategory } from '@prisma/client'

const DEFAULT_PERMISSIONS = [
  // CONTENT - Quản lý nội dung
  { code: 'submissions.view', name: 'Xem bài nộp', category: 'CONTENT' as PermissionCategory },
  { code: 'submissions.create', name: 'Nộp bài mới', category: 'CONTENT' as PermissionCategory },
  { code: 'submissions.edit', name: 'Chỉnh sửa bài', category: 'CONTENT' as PermissionCategory },
  { code: 'submissions.delete', name: 'Xóa bài', category: 'CONTENT' as PermissionCategory },
  { code: 'articles.view', name: 'Xem bài báo', category: 'CONTENT' as PermissionCategory },
  { code: 'articles.publish', name: 'Xuất bản bài', category: 'CONTENT' as PermissionCategory },
  { code: 'issues.view', name: 'Xem số tạp chí', category: 'CONTENT' as PermissionCategory },
  { code: 'issues.manage', name: 'Quản lý số tạp chí', category: 'CONTENT' as PermissionCategory },
  
  // WORKFLOW - Quản lý quy trình
  { code: 'reviews.assign', name: 'Gán phản biện', category: 'WORKFLOW' as PermissionCategory },
  { code: 'reviews.submit', name: 'Nộp phản biện', category: 'WORKFLOW' as PermissionCategory },
  { code: 'reviews.view', name: 'Xem phản biện', category: 'WORKFLOW' as PermissionCategory },
  { code: 'decisions.make', name: 'Ra quyết định biên tập', category: 'WORKFLOW' as PermissionCategory },
  { code: 'workflow.manage', name: 'Quản lý workflow', category: 'WORKFLOW' as PermissionCategory },
  
  // USERS - Quản lý người dùng
  { code: 'users.view', name: 'Xem người dùng', category: 'USERS' as PermissionCategory },
  { code: 'users.create', name: 'Tạo người dùng', category: 'USERS' as PermissionCategory },
  { code: 'users.edit', name: 'Sửa người dùng', category: 'USERS' as PermissionCategory },
  { code: 'users.delete', name: 'Xóa người dùng', category: 'USERS' as PermissionCategory },
  { code: 'reviewers.manage', name: 'Quản lý phản biện viên', category: 'USERS' as PermissionCategory },
  
  // CMS - Quản lý CMS
  { code: 'cms.news.manage', name: 'Quản lý tin tức', category: 'CMS' as PermissionCategory },
  { code: 'cms.banners.manage', name: 'Quản lý banner', category: 'CMS' as PermissionCategory },
  { code: 'cms.pages.manage', name: 'Quản lý trang', category: 'CMS' as PermissionCategory },
  { code: 'cms.navigation.manage', name: 'Quản lý menu', category: 'CMS' as PermissionCategory },
  
  // SYSTEM - Quản lý hệ thống
  { code: 'system.settings', name: 'Cài đặt hệ thống', category: 'SYSTEM' as PermissionCategory },
  { code: 'system.integrations', name: 'Tích hợp bên thứ 3', category: 'SYSTEM' as PermissionCategory },
  { code: 'system.categories', name: 'Quản lý chuyên mục', category: 'SYSTEM' as PermissionCategory },
  
  // SECURITY - Bảo mật
  { code: 'security.logs', name: 'Xem log bảo mật', category: 'SECURITY' as PermissionCategory },
  { code: 'security.alerts', name: 'Xem cảnh báo', category: 'SECURITY' as PermissionCategory },
  { code: 'security.sessions', name: 'Quản lý phiên', category: 'SECURITY' as PermissionCategory },
  
  // ANALYTICS - Thống kê
  { code: 'analytics.view', name: 'Xem thống kê', category: 'ANALYTICS' as PermissionCategory },
  { code: 'statistics.view', name: 'Xem báo cáo', category: 'ANALYTICS' as PermissionCategory }
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session || session.role !== 'SYSADMIN') {
      return NextResponse.json(
        { error: 'Chỉ SYSADMIN mới có quyền seed permissions' },
        { status: 403 }
      )
    }

    // Check if permissions already exist
    const existingCount = await prisma.permission.count()
    if (existingCount > 0) {
      return NextResponse.json(
        { message: 'Permissions đã tồn tại', count: existingCount },
        { status: 200 }
      )
    }

    // Create permissions
    const created = await prisma.permission.createMany({
      data: DEFAULT_PERMISSIONS,
      skipDuplicates: true
    })

    return NextResponse.json({
      success: true,
      message: 'Đã tạo permissions thành công',
      count: created.count
    })
  } catch (error: any) {
    console.error('Error seeding permissions:', error)
    return NextResponse.json(
      { error: error.message || 'Có lỗi xảy ra khi seed permissions' },
      { status: 500 }
    )
  }
}
