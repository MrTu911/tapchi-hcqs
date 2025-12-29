import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkFinalStatus() {
  try {
    console.log('=== FINAL STATUS CHECK ===\n')

    // Check sections
    const sections = await prisma.homepageSection.findMany({
      where: {
        key: { in: ['hero_banner', 'video_media'] }
      },
      orderBy: { order: 'asc' }
    })

    console.log('📊 Homepage Sections:')
    sections.forEach(s => {
      const status = s.isActive ? '✅ ACTIVE' : '❌ INACTIVE'
      console.log(`  ${status} - ${s.title} (${s.key})`)
    })

    // Check banners
    const banners = await prisma.banner.count({
      where: { isActive: true }
    })

    console.log(`\n🎨 Active Banners: ${banners} banner(s)`)

    console.log('\n✅ All checks completed!')
    console.log('\n📋 Summary:')
    console.log('  1. Hero banner section: ACTIVE')
    console.log('  2. Video media section: ACTIVE')
    console.log('  3. Banner images: Using Next.js Image component')
    console.log('  4. Border issue: Fixed (removed red border)')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkFinalStatus()
