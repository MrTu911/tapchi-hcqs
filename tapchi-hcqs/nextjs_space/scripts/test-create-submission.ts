
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧪 Testing Submission creation...')
  
  // Find author and category
  const author = await prisma.user.findFirst({
    where: { role: 'AUTHOR' }
  })
  
  const category = await prisma.category.findFirst()
  
  if (!author || !category) {
    console.error('❌ Missing author or category')
    return
  }
  
  console.log(`Author: ${author.fullName}`)
  console.log(`Category: ${category.name}`)
  
  try {
    const submission = await prisma.submission.create({
      data: {
        code: `TEST-${Date.now()}`,
        title: 'Test Submission',
        abstractVn: 'Test abstract in Vietnamese',
        abstractEn: 'Test abstract in English',
        keywords: ['test', 'submission'],
        status: 'PUBLISHED',
        createdBy: author.id,
        categoryId: category.id
      }
    })
    
    console.log('✅ Created submission:', submission.id)
    
    // Clean up
    await prisma.submission.delete({
      where: { id: submission.id }
    })
    console.log('✅ Cleaned up test submission')
    
  } catch (error) {
    console.error('❌ Error creating submission:', error)
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
