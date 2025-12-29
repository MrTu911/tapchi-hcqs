
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  User, 
  LogOut, 
  Settings,
  Menu,
  Search,
  Moon,
  Sun,
  Bell
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { NotificationBell } from './notification-bell'
import { cn } from '@/lib/utils'

interface DashboardHeaderProps {
  session: {
    fullName: string
    email: string
    role: string
  }
  onMobileMenuToggle?: () => void
}

export default function DashboardHeader({ session, onMobileMenuToggle }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/auth/login'
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-military-700/50 bg-gradient-to-r from-military-900 via-military-800 to-military-900 backdrop-blur-md shadow-2xl">
      <div className="max-w-full mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onMobileMenuToggle}
            className="lg:hidden text-military-100 hover:text-white hover:bg-military-700/50 transition-colors"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="text-military-900 font-bold text-lg">HC</span>
            </div>
            <div className="hidden lg:block">
              <span className="text-sm font-bold bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent tracking-wide">
                Tạp chí KHOA HỌC HẬU CẦN QUÂN SỰ
              </span>
              <p className="text-[10px] text-military-300 font-medium">Học viện Hậu cần - Bộ Quốc phòng</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Global Search */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-military-400" />
              <Input
                type="search"
                placeholder="Tìm kiếm bài báo, người dùng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 h-9 pl-10 pr-4 bg-military-800/50 border-military-700 text-white placeholder:text-military-400 focus:border-amber-500 focus:ring-amber-500/20 transition-colors"
              />
            </div>
          </form>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="text-military-300 hover:text-amber-400 hover:bg-military-700/50 transition-all"
            disabled={!mounted}
          >
            {!mounted ? (
              <Sun className="h-5 w-5" />
            ) : theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
            <span className="sr-only">Chuyển đổi chế độ sáng/tối</span>
          </Button>

          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 hover:bg-military-700/50 transition-colors">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="text-military-900 font-bold text-sm">
                    {session.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-sm font-medium text-white">{session.fullName}</div>
                  <div className="text-xs text-amber-400 font-medium">
                    {getRoleLabel(session.role)}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-military-900 border-military-700">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium text-white">{session.fullName}</p>
                  <p className="text-xs text-military-400">{session.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-military-700" />
              <DropdownMenuItem asChild className="text-military-200 focus:bg-military-800 focus:text-white cursor-pointer">
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Hồ sơ cá nhân
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-military-200 focus:bg-military-800 focus:text-white cursor-pointer">
                <Link href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Cài đặt
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-military-700" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="cursor-pointer text-red-400 focus:bg-red-900/20 focus:text-red-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
