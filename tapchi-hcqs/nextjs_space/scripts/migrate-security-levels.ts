/**
 * Script to migrate SecurityLevel enum values
 * OPEN -> PUBLIC
 * INTERNAL -> CONFIDENTIAL  
 * SENSITIVE -> SECRET
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Migrating SecurityLevel enum values...\n');

  // First, check current values
  const submissions = await prisma.$queryRaw`
    SELECT "securityLevel", COUNT(*) as count
    FROM "Submission"
    GROUP BY "securityLevel"
  ` as any[];

  console.log('Current distribution:');
  submissions.forEach(row => {
    console.log(`  ${row.securityLevel}: ${row.count} submissions`);
  });

  // Perform migration using raw SQL (since enum change blocks Prisma client)
  console.log('\n🔧 Updating values...');
  
  await prisma.$executeRaw`
    UPDATE "Submission" 
    SET "securityLevel" = 'PUBLIC' 
    WHERE "securityLevel" = 'OPEN'
  `;
  
  await prisma.$executeRaw`
    UPDATE "Submission"
    SET "securityLevel" = 'CONFIDENTIAL'
    WHERE "securityLevel" = 'INTERNAL'
  `;
  
  await prisma.$executeRaw`
    UPDATE "Submission"
    SET "securityLevel" = 'SECRET'
    WHERE "securityLevel" = 'SENSITIVE'
  `;

  console.log('✅ Migration completed!');
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
