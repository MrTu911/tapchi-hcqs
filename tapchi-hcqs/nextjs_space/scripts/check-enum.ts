import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
config({ path: '.env' });

const prisma = new PrismaClient();

async function main() {
  try {
    // Kiểm tra enum SubmissionStatus
    const enumValues = await prisma.$queryRaw<Array<{enumlabel: string}>>` 
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'SubmissionStatus'
      ORDER BY enumsortorder;
    `;
    console.log('\n=== SubmissionStatus Enum Values ===');
    console.log(enumValues.map(v => v.enumlabel));
    
    // Kiểm tra cột status
    const columns = await prisma.$queryRaw<Array<{column_name: string, data_type: string, udt_name: string}>>` 
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'Submission' 
      AND column_name = 'status';
    `;
    console.log('\n=== Submission.status Column ===');
    console.log(JSON.stringify(columns, null, 2));
    
    // Thử tạo submission đơn giản
    console.log('\n=== Testing Submission Create ===');
    const testSubmission = {
      code: 'TEST-2025-9999',
      title: 'Test submission',
      abstractVn: 'Test abstract',
      keywords: ['test'],
      status: 'NEW' as any,
      securityLevel: 'PUBLIC' as any,
      categoryId: (await prisma.category.findFirst())?.id || '',
      createdBy: (await prisma.user.findFirst({ where: { role: 'AUTHOR' }}))?.id || ''
    };
    
    console.log('Data to insert:', testSubmission);
    
  } catch (error: any) {
    console.error('\n=== ERROR ===');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.meta) {
      console.error('Meta:', error.meta);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
