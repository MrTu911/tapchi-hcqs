import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating Media table...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Media" (
        "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "fileName" TEXT NOT NULL,
        "fileType" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "cloudStoragePath" TEXT NOT NULL UNIQUE,
        "altText" TEXT,
        "title" TEXT,
        "description" TEXT,
        "category" TEXT,
        "width" INTEGER,
        "height" INTEGER,
        "isPublic" BOOLEAN NOT NULL DEFAULT false,
        "uploadedBy" TEXT,
        "usageCount" INTEGER NOT NULL DEFAULT 0,
        "lastUsedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    console.log('Creating indexes...');
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Media_category_idx" ON "Media"("category")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Media_fileType_idx" ON "Media"("fileType")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Media_uploadedBy_idx" ON "Media"("uploadedBy")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Media_isPublic_idx" ON "Media"("isPublic")`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Media_createdAt_idx" ON "Media"("createdAt")`;
    
    console.log('✅ Media table created successfully!');
  } catch (error) {
    console.error('Error creating Media table:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
