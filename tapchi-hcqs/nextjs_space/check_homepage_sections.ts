import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🔍 Checking HomepageSection data...\n');
    
    const sections = await prisma.homepageSection.findMany({
      orderBy: { order: 'asc' }
    });
    
    console.log(`Found ${sections.length} homepage sections:\n`);
    
    if (sections.length === 0) {
      console.log('❌ No homepage sections found in database');
    } else {
      sections.forEach((section, index) => {
        console.log(`${index + 1}. ${section.key}`);
        console.log(`   Type: ${section.type}`);
        console.log(`   Title: ${section.title || 'N/A'}`);
        console.log(`   Order: ${section.order}`);
        console.log(`   Active: ${section.isActive ? '✅' : '❌'}`);
        console.log('');
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
