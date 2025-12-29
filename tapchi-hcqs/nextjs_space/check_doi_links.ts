import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  // Check issues with DOI
  const issues = await prisma.issue.findMany({
    where: {
      doi: {
        not: null
      }
    },
    select: {
      id: true,
      number: true,
      year: true,
      doi: true
    }
  })

  console.log('Issues with DOI:')
  issues.forEach(issue => {
    console.log(`  Issue ${issue.number}/${issue.year}: https://doi.org/${issue.doi}`)
  })

  // Check if any DOI is invalid
  const invalidDoi = issues.find(issue => 
    issue.doi && !issue.doi.startsWith('10.')
  )

  if (invalidDoi) {
    console.log('\n⚠️ Found invalid DOI format:', invalidDoi.doi)
    console.log('DOI should start with "10."')
  } else {
    console.log('\n✓ All DOIs have valid format')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
