import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Adding pdfUrl column to Issue table...')
    
    await prisma.$executeRaw`ALTER TABLE "Issue" ADD COLUMN IF NOT EXISTS "pdfUrl" TEXT`
    
    console.log('✅ Successfully added pdfUrl column to Issue table')
  } catch (error) {
    console.error('❌ Error:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
