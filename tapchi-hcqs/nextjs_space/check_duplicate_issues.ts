import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const issues = await prisma.issue.findMany({
    where: {
      number: 5,
      year: 2025
    },
    select: {
      id: true,
      number: true,
      year: true,
      coverImage: true,
      title: true,
      status: true
    }
  })

  console.log(`Found ${issues.length} issue(s) with number 5, year 2025:`)
  issues.forEach(issue => {
    console.log(`  ID: ${issue.id}`)
    console.log(`  Title: ${issue.title}`)
    console.log(`  Cover: ${issue.coverImage}`)
    console.log(`  Status: ${issue.status}`)
    console.log('---')
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
