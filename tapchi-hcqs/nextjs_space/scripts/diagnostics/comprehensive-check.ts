/**
 * Kiểm tra toàn diện hệ thống
 * Chẩn đoán tất cả các vấn đề có thể xảy ra
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

config({ path: '.env' });

const prisma = new PrismaClient();

interface DiagnosticResult {
  section: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
  details?: any;
}

const results: DiagnosticResult[] = [];

function log(section: string, status: 'PASS' | 'FAIL' | 'WARNING', message: string, details?: any) {
  results.push({ section, status, message, details });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${section}] ${message}`);
  if (details) {
    console.log('   Details:', JSON.stringify(details, null, 2));
  }
}

async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    log('DATABASE', 'PASS', 'Kết nối database thành công');
    return true;
  } catch (error: any) {
    log('DATABASE', 'FAIL', 'Không thể kết nối database', { error: error.message });
    return false;
  }
}

async function checkEnums() {
  try {
    // Kiểm tra SubmissionStatus enum
    const submissionStatusEnum = await prisma.$queryRaw<Array<{enumlabel: string}>>` 
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'SubmissionStatus'
      ORDER BY enumsortorder;
    `;
    
    const expectedStatuses = ['NEW', 'DESK_REJECT', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED', 'REJECTED', 'IN_PRODUCTION', 'PUBLISHED'];
    const actualStatuses = submissionStatusEnum.map(e => e.enumlabel);
    
    if (JSON.stringify(actualStatuses) === JSON.stringify(expectedStatuses)) {
      log('ENUM', 'PASS', 'SubmissionStatus enum đúng', { values: actualStatuses });
    } else {
      log('ENUM', 'FAIL', 'SubmissionStatus enum không khớp', {
        expected: expectedStatuses,
        actual: actualStatuses
      });
    }

    // Kiểm tra SecurityLevel enum
    const securityLevelEnum = await prisma.$queryRaw<Array<{enumlabel: string}>>` 
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'SecurityLevel'
      ORDER BY enumsortorder;
    `;
    
    const expectedSecurityLevels = ['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET'];
    const actualSecurityLevels = securityLevelEnum.map(e => e.enumlabel);
    
    if (JSON.stringify(actualSecurityLevels) === JSON.stringify(expectedSecurityLevels)) {
      log('ENUM', 'PASS', 'SecurityLevel enum đúng', { values: actualSecurityLevels });
    } else {
      log('ENUM', 'FAIL', 'SecurityLevel enum không khớp', {
        expected: expectedSecurityLevels,
        actual: actualSecurityLevels
      });
    }

  } catch (error: any) {
    log('ENUM', 'FAIL', 'Không thể kiểm tra enums', { error: error.message });
  }
}

async function checkTableColumns() {
  try {
    const submissionColumns = await prisma.$queryRaw<Array<{
      column_name: string;
      data_type: string;
      udt_name: string;
    }>>` 
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name = 'Submission' 
      AND column_name IN ('status', 'securityLevel')
      ORDER BY column_name;
    `;
    
    const statusCol = submissionColumns.find(c => c.column_name === 'status');
    const securityCol = submissionColumns.find(c => c.column_name === 'securityLevel');
    
    if (statusCol && statusCol.udt_name === 'SubmissionStatus') {
      log('SCHEMA', 'PASS', 'Cột Submission.status đúng type', { column: statusCol });
    } else {
      log('SCHEMA', 'FAIL', 'Cột Submission.status sai type', { column: statusCol });
    }
    
    if (securityCol && securityCol.udt_name === 'SecurityLevel') {
      log('SCHEMA', 'PASS', 'Cột Submission.securityLevel đúng type', { column: securityCol });
    } else {
      log('SCHEMA', 'FAIL', 'Cột Submission.securityLevel sai type', { column: securityCol });
    }
    
  } catch (error: any) {
    log('SCHEMA', 'FAIL', 'Không thể kiểm tra table columns', { error: error.message });
  }
}

async function checkPrismaClient() {
  try {
    // Kiểm tra xem Prisma Client có biết enum không
    const testData = {
      code: 'TEST-DIAGNOSTIC-001',
      title: 'Test diagnostic submission',
      abstractVn: 'Test abstract for diagnostic purposes',
      keywords: ['test'],
      status: 'NEW' as any,
      securityLevel: 'PUBLIC' as any,
      categoryId: '',
      createdBy: ''
    };
    
    // Lấy category và user đầu tiên
    const category = await prisma.category.findFirst();
    const user = await prisma.user.findFirst({ where: { role: 'AUTHOR' }});
    
    if (!category || !user) {
      log('PRISMA', 'WARNING', 'Không có category hoặc user để test');
      return;
    }
    
    testData.categoryId = category.id;
    testData.createdBy = user.id;
    
    log('PRISMA', 'PASS', 'Prisma Client khởi tạo thành công');
    log('PRISMA', 'WARNING', 'Chưa test create thực tế (sẽ gây dirty data)');
    
  } catch (error: any) {
    log('PRISMA', 'FAIL', 'Prisma Client có vấn đề', { error: error.message });
  }
}

async function checkExistingData() {
  try {
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      submissions: await prisma.submission.count(),
      articles: await prisma.article.count(),
      reviews: await prisma.review.count()
    };
    
    log('DATA', 'PASS', 'Kiểm tra dữ liệu hiện tại', counts);
    
    // Kiểm tra submissions có giá trị status hợp lệ không
    const submissions = await prisma.submission.findMany({
      select: {
        id: true,
        code: true,
        status: true,
        securityLevel: true
      },
      take: 5
    });
    
    log('DATA', 'PASS', 'Mẫu submissions', { 
      count: submissions.length,
      samples: submissions.map(s => ({
        code: s.code,
        status: s.status,
        securityLevel: s.securityLevel
      }))
    });
    
  } catch (error: any) {
    log('DATA', 'FAIL', 'Không thể kiểm tra dữ liệu', { error: error.message });
  }
}

async function checkPrismaClientVersion() {
  try {
    const { version } = require('@prisma/client/package.json');
    log('VERSION', 'PASS', `Prisma Client version: ${version}`);
  } catch (error: any) {
    log('VERSION', 'WARNING', 'Không thể xác định Prisma version', { error: error.message });
  }
}

async function main() {
  console.log('\n========================================');
  console.log('  KIỂM TRA TOÀN DIỆN HỆ THỐNG');
  console.log('========================================\n');

  await checkDatabaseConnection();
  await checkPrismaClientVersion();
  await checkEnums();
  await checkTableColumns();
  await checkPrismaClient();
  await checkExistingData();
  
  console.log('\n========================================');
  console.log('  TÓM TẮT KẾT QUẢ');
  console.log('========================================\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const warnings = results.filter(r => r.status === 'WARNING').length;
  
  console.log(`✅ PASS: ${passed}`);
  console.log(`❌ FAIL: ${failed}`);
  console.log(`⚠️  WARNING: ${warnings}`);
  console.log(`\nTổng số kiểm tra: ${results.length}`);
  
  if (failed > 0) {
    console.log('\n🚨 CÓ LỐI PHÁT HIỆN!');
    console.log('\nCác lỗi:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  - [${r.section}] ${r.message}`);
    });
  } else {
    console.log('\n✅ TẤT CẢ KIỂM TRA ĐỀU PASS!');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);
