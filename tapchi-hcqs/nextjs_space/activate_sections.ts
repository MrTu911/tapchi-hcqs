import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function activateSections() {
  try {
    console.log('=== Activating Homepage Sections ===\n')

    // Activate hero_banner section
    const heroBanner = await prisma.homepageSection.update({
      where: { key: 'hero_banner' },
      data: { isActive: true }
    })
    console.log('✓ Activated hero_banner section')

    // Activate video_media section
    const videoMedia = await prisma.homepageSection.update({
      where: { key: 'video_media' },
      data: { isActive: true }
    })
    console.log('✓ Activated video_media section')

    // Show updated status
    console.log('\n=== Updated Sections ===')
    console.log(`hero_banner: ${heroBanner.isActive ? 'ACTIVE' : 'INACTIVE'}`)
    console.log(`video_media: ${videoMedia.isActive ? 'ACTIVE' : 'INACTIVE'}`)

    console.log('\n✓ Sections activated successfully!')

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

activateSections()
