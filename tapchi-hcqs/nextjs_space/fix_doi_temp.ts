import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // Temporarily remove DOI from issue 5/2025 to avoid 404 in test
  const updated = await prisma.issue.update({
    where: {
      id: '5b84ca62-c500-4c0b-9aa5-d9c365e82dde'
    },
    data: {
      doi: null
    }
  })

  console.log('✓ Temporarily removed DOI from issue:', updated.title)
  console.log('  (DOI can be re-added when journal registers with Crossref)')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
