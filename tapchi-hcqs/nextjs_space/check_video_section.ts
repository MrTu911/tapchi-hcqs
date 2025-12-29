import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

async function checkVideoSection() {
  try {
    const videoSection = await prisma.homepageSection.findFirst({
      where: {
        key: 'video_media'
      }
    })

    console.log('=== Video Section Status ===')
    if (videoSection) {
      console.log('Video section found:')
      console.log('Key:', videoSection.key)
      console.log('Title:', videoSection.title)
      console.log('Is Active:', videoSection.isActive)
      console.log('Order:', videoSection.order)
      console.log('Settings:', videoSection.settings)
    } else {
      console.log('Video section NOT FOUND in database')
    }

    // Check all homepage sections
    console.log('\n=== All Homepage Sections ===')
    const allSections = await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' }
    })

    allSections.forEach(section => {
      console.log(`${section.order}. ${section.key} - ${section.title} (${section.isActive ? 'ACTIVE' : 'INACTIVE'})`)
    })

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVideoSection()
