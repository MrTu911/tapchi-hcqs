'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  Home,
  FileText,
  Upload,
  CheckSquare,
  Users,
  Settings,
  BarChart3,
  FileCheck,
  Shield,
  BookOpen,
  Layout as LayoutIcon,
  FolderTree,
  Workflow,
  Plug,
  FileEdit,
  UserCheck,
  AlertTriangle,
  FileLock,
  Newspaper,
  Image as ImageIcon,
  Globe,
  Activity,
  TrendingUp,
  Clock,
  Menu,
  ChevronDown,
  ChevronRight,
  X,
  Bell,
  User,
  Palette,
  FileBarChart,
  Video,
  MessageSquare,
  Tags,
  Layers,
  Send,
  Inbox,
  Eye,
  MessagesSquare,
  BookText,
  Award,
  ClipboardList
} from 'lucide-react'
import { can } from '@/lib/rbac'

interface SidebarProps {
  role: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

interface MenuItem {
  label: string
  icon: any
  href: string
  roles: string[]
  section?: string
  badge?: string
}

interface MenuSection {
  id: string
  label: string
  icon: any
  items: MenuItem[]
  defaultOpen?: boolean
}

export default function DashboardSidebar({ role, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const [openSections, setOpenSections] = useState<string[]>(['overview', 'content', 'editorial', 'cms', 'system'])

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const getRolePath = (role: string) => {
    const pathMap: Record<string, string> = {
      'AUTHOR': 'author',
      'REVIEWER': 'reviewer',
      'SECTION_EDITOR': 'editor',
      'MANAGING_EDITOR': 'managing',
      'EIC': 'eic',
      'LAYOUT_EDITOR': 'layout',
      'SYSADMIN': 'admin',
      'SECURITY_AUDITOR': 'security'
    }
    return pathMap[role] || 'author'
  }

  const getMenuSections = (): MenuSection[] => {
    const sections: MenuSection[] = []

    // ========== OVERVIEW SECTION (Always visible) ==========
    sections.push({
      id: 'overview',
      label: 'Tổng quan',
      icon: Home,
      defaultOpen: true,
      items: [
        {
          label: 'Bảng điều khiển',
          icon: Home,
          href: `/dashboard/${getRolePath(role)}`,
          roles: ['ALL'],
        },
        {
          label: 'Thông báo',
          icon: Bell,
          href: '/dashboard/notifications',
          roles: ['ALL'],
        },
        {
          label: 'Tin nhắn',
          icon: MessageSquare,
          href: '/dashboard/messages',
          roles: ['ALL'],
        },
        {
          label: 'Hồ sơ cá nhân',
          icon: User,
          href: '/dashboard/profile',
          roles: ['ALL'],
        }
      ]
    })

    // ========== AUTHOR SECTION ==========
    if (can.submit(role as any)) {
      sections.push({
        id: 'author',
        label: 'Quản lý Bài viết',
        icon: FileEdit,
        defaultOpen: true,
        items: [
          {
            label: 'Nộp bài mới',
            icon: Send,
            href: '/dashboard/author/submit',
            roles: ['AUTHOR'],
          },
          {
            label: 'Bài của tôi',
            icon: Inbox,
            href: '/dashboard/author/submissions',
            roles: ['AUTHOR'],
          }
        ]
      })
    }

    // ========== REVIEWER SECTION ==========
    if (can.review(role as any)) {
      sections.push({
        id: 'reviewer',
        label: 'Phản biện',
        icon: CheckSquare,
        defaultOpen: true,
        items: [
          {
            label: 'Bài cần phản biện',
            icon: ClipboardList,
            href: '/dashboard/reviewer/assignments',
            roles: ['REVIEWER'],
          },
          {
            label: 'Lịch sử phản biện',
            icon: FileCheck,
            href: '/dashboard/reviewer/history',
            roles: ['REVIEWER'],
          }
        ]
      })
    }

    // ========== EDITORIAL SECTION ==========
    if (can.decide(role as any)) {
      sections.push({
        id: 'editorial',
        label: 'Biên tập',
        icon: FileEdit,
        defaultOpen: true,
        items: [
          {
            label: 'Bài cần xử lý',
            icon: Inbox,
            href: '/dashboard/editor/submissions',
            roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
          },
          {
            label: 'Gán phản biện',
            icon: UserCheck,
            href: '/dashboard/editor/assign-reviewers',
            roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
          },
          {
            label: 'Quy trình & Thời hạn',
            icon: Clock,
            href: '/dashboard/editor/workflow',
            roles: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
          }
        ]
      })
    }

    // ========== PRODUCTION SECTION ==========
    if (can.layout(role as any)) {
      sections.push({
        id: 'production',
        label: 'Sản xuất',
        icon: LayoutIcon,
        items: [
          {
            label: 'Hàng đợi Sản xuất',
            icon: LayoutIcon,
            href: '/dashboard/layout/production',
            roles: ['LAYOUT_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
          }
        ]
      })
    }

    // ========== CONTENT MANAGEMENT SECTION ==========
    if (can.admin(role as any)) {
      sections.push({
        id: 'content',
        label: 'Quản lý Nội dung',
        icon: BookOpen,
        items: [
          {
            label: 'Bài báo',
            icon: FileText,
            href: '/dashboard/admin/articles',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Số Tạp chí',
            icon: BookOpen,
            href: '/dashboard/admin/issues',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Tập (Volumes)',
            icon: Layers,
            href: '/dashboard/admin/volumes',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Chuyên mục',
            icon: FolderTree,
            href: '/dashboard/admin/categories',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Từ khóa',
            icon: Tags,
            href: '/dashboard/admin/keywords',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Metadata & Xuất bản',
            icon: FileCheck,
            href: '/dashboard/admin/metadata',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          }
        ]
      })

      // ========== USER MANAGEMENT SECTION ==========
      sections.push({
        id: 'users',
        label: 'Quản lý Người dùng',
        icon: Users,
        items: [
          {
            label: 'Tất cả Người dùng',
            icon: Users,
            href: '/dashboard/admin/users',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Phản biện viên',
            icon: Award,
            href: '/dashboard/admin/reviewers',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Quyền (RBAC)',
            icon: Shield,
            href: '/dashboard/admin/permissions',
            roles: ['SYSADMIN', 'EIC'],
          },
          {
            label: 'Phiên đăng nhập',
            icon: Activity,
            href: '/dashboard/admin/sessions',
            roles: ['SYSADMIN', 'EIC', 'MANAGING_EDITOR'],
          }
        ]
      })

      // ========== CMS SECTION ==========
      sections.push({
        id: 'cms',
        label: 'CMS & Website',
        icon: Globe,
        items: [
          {
            label: 'Trang chủ',
            icon: Home,
            href: '/dashboard/admin/cms/homepage',
            roles: ['SYSADMIN', 'MANAGING_EDITOR'],
          },
          {
            label: 'Trang công khai',
            icon: Globe,
            href: '/dashboard/admin/cms/pages',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Tin tức',
            icon: Newspaper,
            href: '/dashboard/admin/news',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'],
          },
          {
            label: 'Banner',
            icon: ImageIcon,
            href: '/dashboard/admin/banners',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Thư viện Media',
            icon: ImageIcon,
            href: '/dashboard/admin/cms/media',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'],
          },
          {
            label: 'Video',
            icon: Video,
            href: '/dashboard/admin/cms/videos',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC', 'SECTION_EDITOR'],
          },
          {
            label: 'Menu điều hướng',
            icon: Menu,
            href: '/dashboard/admin/cms/navigation',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          },
          {
            label: 'Cài đặt Website',
            icon: Settings,
            href: '/dashboard/admin/cms/settings',
            roles: ['SYSADMIN', 'MANAGING_EDITOR', 'EIC'],
          }
        ]
      })

      // ========== SYSTEM & ANALYTICS SECTION ==========
      sections.push({
        id: 'system',
        label: 'Hệ thống & Phân tích',
        icon: Activity,
        items: [
          {
            label: 'Thống kê Hệ thống',
            icon: BarChart3,
            href: '/dashboard/admin/statistics',
            roles: ['SYSADMIN', 'EIC'],
          },
          {
            label: 'Phân tích Chi tiết',
            icon: TrendingUp,
            href: '/dashboard/admin/analytics',
            roles: ['SYSADMIN', 'EIC'],
          },
          {
            label: 'Báo cáo & Xuất dữ liệu',
            icon: FileBarChart,
            href: '/dashboard/admin/reports',
            roles: ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'],
          },
          {
            label: 'Quy trình Hệ thống',
            icon: Workflow,
            href: '/dashboard/admin/workflow',
            roles: ['SYSADMIN'],
          },
          {
            label: 'Tích hợp',
            icon: Plug,
            href: '/dashboard/admin/integrations',
            roles: ['SYSADMIN'],
          },
          {
            label: 'Cấu hình Giao diện',
            icon: Palette,
            href: '/dashboard/admin/ui-config',
            roles: ['SYSADMIN'],
          },
          {
            label: 'Cài đặt Phản biện',
            icon: CheckSquare,
            href: '/dashboard/admin/review-settings',
            roles: ['SYSADMIN', 'EIC'],
          }
        ]
      })

      // ========== SECURITY SECTION ==========
      sections.push({
        id: 'security',
        label: 'Bảo mật',
        icon: Shield,
        items: [
          {
            label: 'Cảnh báo Bảo mật',
            icon: AlertTriangle,
            href: '/dashboard/admin/security-alerts',
            roles: ['SYSADMIN', 'SECURITY_AUDITOR'],
          },
          {
            label: 'Nhật ký Bảo mật',
            icon: FileLock,
            href: '/dashboard/admin/security-logs',
            roles: ['SYSADMIN', 'EIC', 'SECURITY_AUDITOR'],
          },
          {
            label: 'Nhật ký Kiểm toán',
            icon: FileBarChart,
            href: '/dashboard/admin/audit-logs',
            roles: ['SYSADMIN', 'EIC', 'SECURITY_AUDITOR'],
          }
        ]
      })
    }

    // Security Auditor (non-admin)
    if (can.securityAudit(role as any) && !can.admin(role as any)) {
      sections.push({
        id: 'security',
        label: 'Bảo mật',
        icon: Shield,
        items: [
          {
            label: 'Kiểm tra Bảo mật',
            icon: Shield,
            href: '/dashboard/security/audit',
            roles: ['SECURITY_AUDITOR'],
          }
        ]
      })
    }

    // Filter items by role
    return sections.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.roles.includes('ALL') || item.roles.includes(role)
      )
    })).filter(section => section.items.length > 0)
  }

  const menuSections = getMenuSections()

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-military-700/30 bg-gradient-to-br from-military-900 via-military-800 to-military-900">
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-military-700/50 transition-colors lg:hidden"
          >
            <X className="h-5 w-5 text-military-100" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
            <BookText className="h-6 w-6 text-military-900" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide">HCQS Journal</h2>
            <p className="text-[10px] text-military-300 font-medium">Dashboard v2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-military-700 scrollbar-track-military-900">
        <div className="space-y-3">
          {menuSections.map((section) => {
            const SectionIcon = section.icon
            const isOpen = openSections.includes(section.id)
            const hasMultipleItems = section.items.length > 1
            
            return (
              <div key={section.id} className="space-y-1">
                {hasMultipleItems ? (
                  <>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-military-700/40 transition-all duration-200 group"
                    >
                      <SectionIcon className="h-4 w-4 text-amber-400 flex-shrink-0" />
                      <span className="flex-1 text-left text-xs font-bold text-military-200 uppercase tracking-wider group-hover:text-white">
                        {section.label}
                      </span>
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-military-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-military-400" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="ml-3 space-y-0.5 border-l-2 border-military-700/50 pl-2">
                        {section.items.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => isMobileOpen && onMobileClose?.()}
                              className={cn(
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
                                isActive
                                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-military-900 shadow-lg shadow-amber-500/30 font-semibold'
                                  : 'text-military-300 hover:bg-military-700/40 hover:text-white'
                              )}
                            >
                              <Icon className="h-4 w-4 flex-shrink-0" />
                              <span className="flex-1">{item.label}</span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  // Single item sections
                  section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => isMobileOpen && onMobileClose?.()}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-military-900 shadow-lg shadow-amber-500/30 font-semibold'
                            : 'text-military-300 hover:bg-military-700/40 hover:text-white'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">{section.label}</span>
                      </Link>
                    )
                  })
                )}
              </div>
            )
          })}
        </div>
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-military-700/30 bg-gradient-to-br from-military-900 via-military-800 to-military-900">
        <div className="flex items-center gap-3 text-xs">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-military-900 font-bold text-sm">
              {role === 'SYSADMIN' ? 'AD' : role === 'EIC' ? 'TB' : role.charAt(0)}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">
              {role === 'SYSADMIN' ? 'Admin' : role === 'EIC' ? 'Tổng biên tập' : role === 'MANAGING_EDITOR' ? 'Thư ký tòa soạn' : 'Dashboard'}
            </p>
            <p className="text-[10px] text-military-400">Phiên bản 2.0.0</p>
          </div>
        </div>
      </div>
    </>
  )

  // Desktop sidebar
  if (!isMobileOpen) {
    return (
      <aside className="hidden lg:flex w-64 flex-col border-r border-military-700/50 bg-gradient-to-b from-military-900 via-military-800 to-military-900 shadow-2xl">
        <SidebarContent />
      </aside>
    )
  }

  // Mobile sidebar
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        onClick={onMobileClose}
      />
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 flex flex-col border-r border-military-700/50 bg-gradient-to-b from-military-900 via-military-800 to-military-900 shadow-2xl z-50 lg:hidden">
        <SidebarContent />
      </aside>
    </>
  )
}
