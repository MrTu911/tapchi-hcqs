import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  const issues = await prisma.issue.findMany({
    where: {
      number: 5,
      year: 2025
    },
    include: {
      _count: {
        select: { articles: true }
      }
    }
  })

  console.log(`Checking articles for issue 5/2025:`)
  for (const issue of issues) {
    console.log(`\nIssue ID: ${issue.id}`)
    console.log(`  Title: ${issue.title}`)
    console.log(`  Cover: ${issue.coverImage}`)
    console.log(`  Article count: ${issue._count.articles}`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
