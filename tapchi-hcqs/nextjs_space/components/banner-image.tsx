
import Image from 'next/image'

export function BannerImage() {
  return (
    <div className="w-full bg-white border-b-4 border-emerald-800">
      <div className="relative w-full h-24 sm:h-32 md:h-40 lg:h-48 xl:h-56">
        <Image
          src="/banner-new.png"
          alt="Nghiên cứu Khoa học Hậu cần Quân sự - Journal of Military Logistics Scientific Studies"
          fill
          className="object-contain"
          priority
          sizes="100vw"
        />
      </div>
    </div>
  )
}
