
import Image from 'next/image'

export function Footer() {
  return (
    <footer className="w-full mt-auto">
      {/* Footer Image Section - Full Width with Responsive Images */}
      <div className="relative w-full bg-white">
        <div className="relative w-full max-w-[1280px] mx-auto">
          {/* Mobile Footer: 768x... */}
          <div className="relative w-full h-[120px] md:hidden">
            <Image
              src="/footer-mobile.png"
              alt="Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự - Thông tin liên hệ"
              fill
              className="object-cover object-center"
              sizes="768px"
              priority={false}
            />
          </div>
          
          {/* Tablet Footer: 1024x192 */}
          <div className="relative w-full h-[192px] hidden md:block lg:hidden">
            <Image
              src="/footer-tablet.png"
              alt="Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự - Thông tin liên hệ"
              fill
              className="object-cover object-center"
              sizes="1024px"
              priority={false}
            />
          </div>
          
          {/* PC Footer */}
          <div className="relative w-full h-[192px] hidden lg:block">
            <Image
              src="/footer-pc.png"
              alt="Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự - Thông tin liên hệ"
              fill
              className="object-cover object-center"
              sizes="1280px"
              priority={false}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
