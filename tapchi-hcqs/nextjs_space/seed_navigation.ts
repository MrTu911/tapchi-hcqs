import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding navigation items...')

  // Clear existing navigation items
  await prisma.navigationItem.deleteMany({})
  console.log('✅ Cleared existing navigation items')

  // Create navigation items matching current menu
  const navItems = [
    { label: 'TRANG CHỦ', url: '/', position: 0, isActive: true, target: '_self' },
    { label: 'GIỚI THIỆU', url: '/about', position: 1, isActive: true, target: '_self' },
    { label: 'QUY TRÌNH XUẤT BẢN', url: '/publishing-process', position: 2, isActive: true, target: '_self' },
    { label: 'SỐ MỚI NHẤT', url: '/issues/latest', position: 3, isActive: true, target: '_self' },
    { label: 'LƯU TRỮ', url: '/archive', position: 4, isActive: true, target: '_self' },
    { label: 'GỬI BÀI', url: '/dashboard/author', position: 5, isActive: true, target: '_self' },
    { label: 'TIN TỨC', url: '/news', position: 6, isActive: true, target: '_self' },
    { label: 'LIÊN HỆ', url: '/contact', position: 7, isActive: true, target: '_self' },
  ]

  for (const item of navItems) {
    await prisma.navigationItem.create({ data: item })
    console.log(`✅ Created: ${item.label}`)
  }

  console.log('\n🎉 Navigation seeding completed!')
  console.log(`📊 Total items: ${navItems.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding navigation:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
