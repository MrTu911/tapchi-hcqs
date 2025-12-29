
"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Search, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'

interface NavigationItem {
  id: string
  label: string
  labelEn?: string | null
  url: string
  target: string
  isActive: boolean
}

// Fallback menu if CMS navigation is not available
const fallbackMenuItems: NavigationItem[] = [
  { id: 'home', label: 'TRANG CHỦ', url: '/', target: '_self', isActive: true },
  { id: 'about', label: 'GIỚI THIỆU', url: '/about', target: '_self', isActive: true },
  { id: 'process', label: 'QUY TRÌNH XUẤT BẢN', url: '/publishing-process', target: '_self', isActive: true },
  { id: 'latest', label: 'SỐ MỚI NHẤT', url: '/issues/latest', target: '_self', isActive: true },
  { id: 'archive', label: 'LƯU TRỮ', url: '/archive', target: '_self', isActive: true },
  { id: 'submit', label: 'GỬI BÀI', url: '/dashboard/author', target: '_self', isActive: true },
  { id: 'news', label: 'TIN TỨC', url: '/news', target: '_self', isActive: true },
  { id: 'contact', label: 'LIÊN HỆ', url: '/contact', target: '_self', isActive: true }
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [menuItems, setMenuItems] = useState<NavigationItem[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch navigation items from CMS
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch('/api/navigation?isActive=true')
        const data = await res.json()
        
        if (data.success && data.data && data.data.length > 0) {
          setMenuItems(data.data)
        } else {
          // Use fallback if no CMS navigation
          setMenuItems(fallbackMenuItems)
        }
      } catch (error) {
        console.error('Failed to fetch navigation:', error)
        // Use fallback on error
        setMenuItems(fallbackMenuItems)
      } finally {
        setLoading(false)
      }
    }

    fetchNavigation()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setIsMenuOpen(false)
    }
  }

  return (
    <header className="relative bg-white dark:bg-slate-900 shadow-md transition-colors">
      {/* Banner - Full Width with Responsive Images */}
      <div className="w-full bg-white dark:bg-slate-900 transition-colors">
        <div className="relative w-full max-w-[1280px] mx-auto">
          {/* Mobile Banner: 768x144 */}
          <div className="relative w-full h-[144px] md:hidden">
            <Image
              src="/banner-mobile.png"
              alt="Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự - Journal of Military Logistics Scientific Studies"
              fill
              className="object-cover object-center"
              priority
              sizes="768px"
            />
          </div>
          
          {/* Tablet Banner: 1024x192 */}
          <div className="relative w-full h-[192px] hidden md:block lg:hidden">
            <Image
              src="/banner-tablet.png"
              alt="Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự - Journal of Military Logistics Scientific Studies"
              fill
              className="object-cover object-center"
              priority
              sizes="1024px"
            />
          </div>
          
          {/* PC Banner: 1280x240 */}
          <div className="relative w-full h-[240px] hidden lg:block">
            <Image
              src="/banner-pc.png"
              alt="Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự - Journal of Military Logistics Scientific Studies"
              fill
              className="object-cover object-center"
              priority
              sizes="1280px"
            />
          </div>
        </div>
      </div>

      {/* Navigation - Centered 1280px Width */}
      <nav className="w-full">
        <div className="w-full max-w-[1280px] mx-auto bg-[#295232]">
          <div className="flex items-center justify-between h-14 px-4 sm:px-6">
            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {loading ? (
                <div className="text-white text-sm">Đang tải...</div>
              ) : (
                menuItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.url}
                    target={item.target}
                    rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                    className="text-sm font-semibold text-white hover:bg-white/20 transition-colors px-3 py-2 rounded whitespace-nowrap tracking-wide"
                  >
                    {item.label}
                  </Link>
                ))
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/20"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {/* Search and Theme Toggle */}
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="hidden md:flex items-center">
                <Input
                  type="search"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48 h-9 rounded-l-md rounded-r-none border-0 bg-white text-gray-900 placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="sm"
                  className="h-9 rounded-l-none rounded-r-md bg-white hover:bg-gray-100 text-emerald-800 px-3 border-0"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <div className="text-white">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="lg:hidden pb-4">
              <div className="space-y-1">
                {loading ? (
                  <div className="text-white text-sm px-4 py-2">Đang tải...</div>
                ) : (
                  menuItems.map((item) => (
                    <Link
                      key={item.id}
                      href={item.url}
                      target={item.target}
                      rel={item.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="block text-sm font-semibold text-white hover:bg-white/20 transition-colors px-4 py-2 rounded tracking-wide"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))
                )}
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="mt-4 md:hidden">
                <div className="flex items-center">
                  <Input
                    type="search"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 h-9 rounded-l-md rounded-r-none border-0 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="h-9 rounded-l-none rounded-r-md bg-white hover:bg-gray-100 text-emerald-800 px-3"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
