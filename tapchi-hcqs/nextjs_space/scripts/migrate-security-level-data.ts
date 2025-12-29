#!/usr/bin/env tsx
/**
 * Migrate SecurityLevel enum data before schema change
 * This script updates existing data from old enum values to temporary text values
 * Then Prisma can push the new enum schema
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Starting SecurityLevel enum migration...\n');

  try {
    // Check current distribution
    console.log('📊 Current security level distribution:');
    const currentData = await prisma.$queryRaw`
      SELECT "securityLevel"::text as level, COUNT(*) as count
      FROM "Submission"
      GROUP BY "securityLevel"::text
    ` as any[];
    
    currentData.forEach(row => {
      console.log(`   ${row.level}: ${row.count} submissions`);
    });

    // Disable the trigger temporarily
    console.log('\n📝 Step 1: Disabling search_vector trigger...');
    await prisma.$executeRaw`
      ALTER TABLE "Submission" DISABLE TRIGGER submission_search_vector_trigger
    `;

    // Add a temporary text column
    console.log('📝 Step 2: Creating temporary column...');
    await prisma.$executeRaw`
      ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "securityLevel_new" TEXT
    `;

    // Copy and transform data
    console.log('📝 Step 3: Migrating data...');
    await prisma.$executeRaw`
      UPDATE "Submission"
      SET "securityLevel_new" = CASE
        WHEN "securityLevel"::text = 'OPEN' THEN 'PUBLIC'
        WHEN "securityLevel"::text = 'INTERNAL' THEN 'CONFIDENTIAL'
        WHEN "securityLevel"::text = 'SENSITIVE' THEN 'SECRET'
        ELSE "securityLevel"::text
      END
    `;

    // Drop old column
    console.log('📝 Step 4: Removing old column...');
    await prisma.$executeRaw`
      ALTER TABLE "Submission" DROP COLUMN "securityLevel"
    `;

    // Rename new column
    console.log('📝 Step 5: Renaming new column...');
    await prisma.$executeRaw`
      ALTER TABLE "Submission" RENAME COLUMN "securityLevel_new" TO "securityLevel"
    `;

    // Re-enable the trigger
    console.log('📝 Step 6: Re-enabling search_vector trigger...');
    await prisma.$executeRaw`
      ALTER TABLE "Submission" ENABLE TRIGGER submission_search_vector_trigger
    `;

    // Verify
    console.log('\n✅ Migration complete! New distribution:');
    const newData = await prisma.$queryRaw`
      SELECT "securityLevel", COUNT(*) as count
      FROM "Submission"
      GROUP BY "securityLevel"
    ` as any[];
    
    newData.forEach(row => {
      console.log(`   ${row.securitylevel}: ${row.count} submissions`);
    });

    console.log('\n✨ Data migration successful!');
    console.log('\n⚠️  Next step: Run `yarn prisma db push` to update the schema');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
