
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing SubmissionStatus enum...')
  
  try {
    // Check current enum values
    const currentValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'SubmissionStatus'
      ORDER BY enumsortorder
    `
    
    console.log('Current enum values:', currentValues)
    
    // Try to add NEW value if not exists
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
              WHERE pg_type.typname = 'SubmissionStatus' AND enumlabel = 'NEW'
          ) THEN
              ALTER TYPE "SubmissionStatus" ADD VALUE 'NEW';
          END IF;
      END $$;
    `
    
    console.log('✅ Added NEW value to SubmissionStatus enum')
    
    // Verify
    const newValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'SubmissionStatus'
      ORDER BY enumsortorder
    `
    
    console.log('Updated enum values:', newValues)
    
  } catch (error) {
    console.error('❌ Error:', error)
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
