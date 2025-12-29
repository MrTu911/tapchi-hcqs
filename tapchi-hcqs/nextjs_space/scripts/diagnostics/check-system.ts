#!/usr/bin/env tsx
/**
 * System Diagnostic Script
 * Checks database, API endpoints, and system health
 * For use in internal military network
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

interface DiagnosticResult {
  timestamp: string;
  status: 'pass' | 'fail' | 'warning';
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warning';
      message: string;
      details?: any;
    };
  };
}

const result: DiagnosticResult = {
  timestamp: new Date().toISOString(),
  status: 'pass',
  checks: {},
};

function log(level: 'info' | 'success' | 'warning' | 'error', message: string) {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`);
}

/**
 * Check database connectivity
 */
async function checkDatabase() {
  log('info', 'Kiểm tra kết nối cơ sở dữ liệu...');
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const latency = Date.now() - startTime;

    result.checks.database = {
      status: latency < 500 ? 'pass' : 'warning',
      message: `Kết nối thành công (${latency}ms)`,
      details: { latency },
    };

    log('success', `✓ Database: ${latency}ms`);
  } catch (error) {
    result.checks.database = {
      status: 'fail',
      message: 'Không thể kết nối database',
      details: error instanceof Error ? error.message : String(error),
    };
    result.status = 'fail';
    log('error', `✗ Database: Lỗi kết nối`);
  }
}

/**
 * Check database tables and counts
 */
async function checkTables() {
  log('info', 'Kiểm tra bảng dữ liệu...');
  try {
    const [users, submissions, reviews, issues] = await Promise.all([
      prisma.user.count(),
      prisma.submission.count(),
      prisma.review.count(),
      prisma.issue.count(),
    ]);

    result.checks.tables = {
      status: 'pass',
      message: 'Tất cả bảng hoạt động bình thường',
      details: { users, submissions, reviews, issues },
    };

    log('success', `✓ Tables: Users=${users}, Submissions=${submissions}, Reviews=${reviews}, Issues=${issues}`);
  } catch (error) {
    result.checks.tables = {
      status: 'fail',
      message: 'Không thể truy vấn bảng',
      details: error instanceof Error ? error.message : String(error),
    };
    result.status = 'fail';
    log('error', '✗ Tables: Lỗi truy vấn');
  }
}

/**
 * Check environment variables
 */
function checkEnvironment() {
  log('info', 'Kiểm tra biến môi trường...');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missing: string[] = [];
  const present: string[] = [];

  requiredVars.forEach((varName) => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    result.checks.environment = {
      status: 'fail',
      message: `Thiếu biến môi trường: ${missing.join(', ')}`,
      details: { missing, present },
    };
    result.status = 'fail';
    log('error', `✗ Environment: Thiếu ${missing.join(', ')}`);
  } else {
    result.checks.environment = {
      status: 'pass',
      message: 'Tất cả biến môi trường cần thiết đã được cấu hình',
      details: { present },
    };
    log('success', `✓ Environment: ${present.length} biến`);
  }
}

/**
 * Check file system
 */
function checkFileSystem() {
  log('info', 'Kiểm tra hệ thống file...');
  
  const criticalPaths = [
    { path: '.env', type: 'file' },
    { path: 'prisma/schema.prisma', type: 'file' },
    { path: 'public', type: 'dir' },
    { path: 'logs', type: 'dir', optional: true },
  ];

  const issues: string[] = [];

  criticalPaths.forEach((item) => {
    const fullPath = path.join(process.cwd(), item.path);
    const exists = fs.existsSync(fullPath);

    if (!exists && !item.optional) {
      issues.push(item.path);
    }
  });

  if (issues.length > 0) {
    result.checks.filesystem = {
      status: 'warning',
      message: `Một số file/thư mục không tồn tại: ${issues.join(', ')}`,
      details: { missing: issues },
    };
    if (result.status === 'pass') result.status = 'warning';
    log('warning', `⚠ FileSystem: Thiếu ${issues.join(', ')}`);
  } else {
    result.checks.filesystem = {
      status: 'pass',
      message: 'Tất cả file và thư mục quan trọng đều tồn tại',
    };
    log('success', '✓ FileSystem: OK');
  }
}

/**
 * Check for common issues
 */
async function checkCommonIssues() {
  log('info', 'Kiểm tra các vấn đề thường gặp...');
  
  const issues: string[] = [];

  try {
    // Check for very old pending submissions (> 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oldPending = await prisma.submission.count({
      where: {
        status: 'UNDER_REVIEW',
        createdAt: { lt: sixMonthsAgo },
      },
    });

    if (oldPending > 0) {
      issues.push(`${oldPending} bài nộp đang phản biện quá 6 tháng`);
    }

    // Check for submissions without category
    const noCategory = await prisma.submission.count({
      where: { categoryId: null },
    });

    if (noCategory > 0) {
      issues.push(`${noCategory} bài nộp chưa có chuyên mục`);
    }

    if (issues.length > 0) {
      result.checks.commonIssues = {
        status: 'warning',
        message: 'Phát hiện một số vấn đề',
        details: issues,
      };
      if (result.status === 'pass') result.status = 'warning';
      log('warning', `⚠ CommonIssues: ${issues.length} vấn đề`);
    } else {
      result.checks.commonIssues = {
        status: 'pass',
        message: 'Không phát hiện vấn đề thường gặp',
      };
      log('success', '✓ CommonIssues: Không có vấn đề');
    }
  } catch (error) {
    result.checks.commonIssues = {
      status: 'warning',
      message: 'Không thể kiểm tra',
      details: error instanceof Error ? error.message : String(error),
    };
    log('warning', '⚠ CommonIssues: Không thể kiểm tra');
  }
}

/**
 * Save diagnostic report
 */
function saveReport() {
  const reportDir = path.join(process.cwd(), 'logs', 'diagnostics');
  
  try {
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filename = `diagnostic-${Date.now()}.json`;
    const filepath = path.join(reportDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(result, null, 2), 'utf8');
    
    log('info', `Báo cáo đã được lưu tại: ${filepath}`);
  } catch (error) {
    log('warning', 'Không thể lưu báo cáo');
  }
}

/**
 * Main diagnostic routine
 */
async function main() {
  console.log('\n========================================');
  console.log('  HỆ THỐNG CHẨN ĐOÁN TẠP CHÍ HCQS');
  console.log('========================================\n');

  await checkDatabase();
  await checkTables();
  checkEnvironment();
  checkFileSystem();
  await checkCommonIssues();

  console.log('\n========================================');
  console.log(`  KẾT QUẢ: ${result.status.toUpperCase()}`);
  console.log('========================================\n');

  saveReport();

  // Exit with appropriate code
  process.exit(result.status === 'fail' ? 1 : 0);
}

// Run diagnostics
main()
  .catch((error) => {
    console.error('Lỗi khi chạy chẩn đoán:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
