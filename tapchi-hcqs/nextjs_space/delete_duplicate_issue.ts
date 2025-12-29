import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // Delete the duplicate issue with simple title
  const deleted = await prisma.issue.delete({
    where: {
      id: '8d0acafe-36fd-4081-9aa6-a23a745fdf60'
    }
  })

  console.log('✓ Deleted duplicate issue:', deleted.title)
  
  // Verify
  const remaining = await prisma.issue.count({
    where: {
      number: 5,
      year: 2025
    }
  })
  
  console.log(`\nRemaining issues for 5/2025: ${remaining}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
