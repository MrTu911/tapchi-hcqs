'use client'

import Link from 'next/link'
import { Facebook, Youtube, Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ModernFooter() {
  return (
    <footer className="bg-gradient-to-br from-[#2C5530] via-[#295232] to-[#2E4A36] text-white mt-12">
      <div className="max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-6 py-10">
          {/* Column 1: About */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-yellow-400 mb-2">
                Tạp chí Nghiên cứu KH Hậu cần Quân sự
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Cơ quan của Học viện Hậu cần - Bộ Quốc phòng Việt Nam
              </p>
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-400 italic">
                "Nghiên cứu khoa học vững chắc - Phục vụ sự nghiệp quốc phòng"
              </p>
            </div>
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/10 hover:bg-yellow-400 hover:text-gray-900 transition-all duration-300"
                asChild
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Facebook className="h-5 w-5" />
                </a>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full bg-white/10 hover:bg-yellow-400 hover:text-gray-900 transition-all duration-300"
                asChild
              >
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <Youtube className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </div>

          {/* Column 2: Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-yellow-400 mb-3">Liên hệ</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 group">
                <MapPin className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Tòa soạn:</p>
                  <p className="text-gray-300 group-hover:text-white transition-colors">
                    Số 45, Phường Ngọc Thụy, Long Biên, Hà Nội
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <Mail className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <a
                  href="mailto:tapchihcqs@hvc.edu.vn"
                  className="text-gray-300 hover:text-yellow-300 transition-colors"
                >
                  tapchihcqs@hvc.edu.vn
                </a>
              </div>
              <div className="flex items-center gap-3 group">
                <Phone className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                <a
                  href="tel:+842412345678"
                  className="text-gray-300 hover:text-yellow-300 transition-colors"
                >
                  +84 24 1234 5678
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-yellow-400 mb-3">Liên kết nhanh</h4>
            <nav className="space-y-2 text-sm">
              <Link
                href="/about"
                className="flex items-center gap-2 text-gray-300 hover:text-yellow-300 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                Giới thiệu
              </Link>
              <Link
                href="/editorial-board"
                className="flex items-center gap-2 text-gray-300 hover:text-yellow-300 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                Ban biên tập
              </Link>
              <Link
                href="/submission-guide"
                className="flex items-center gap-2 text-gray-300 hover:text-yellow-300 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                Hướng dẫn gửi bài
              </Link>
              <Link
                href="/issues"
                className="flex items-center gap-2 text-gray-300 hover:text-yellow-300 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                Các số đã xuất bản
              </Link>
              <Link
                href="/contact"
                className="flex items-center gap-2 text-gray-300 hover:text-yellow-300 transition-colors group"
              >
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                Liên hệ
              </Link>
            </nav>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
              <p className="text-gray-400 text-center sm:text-left">
                © {new Date().getFullYear()} Học viện Hậu cần - Bộ Quốc phòng. All rights reserved.
              </p>
              <div className="flex gap-4 text-xs">
                <Link href="/privacy" className="text-gray-400 hover:text-yellow-300 transition-colors">
                  Chính sách bảo mật
                </Link>
                <span className="text-gray-600">•</span>
                <Link href="/terms" className="text-gray-400 hover:text-yellow-300 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
