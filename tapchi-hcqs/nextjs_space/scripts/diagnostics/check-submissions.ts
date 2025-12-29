#!/usr/bin/env tsx
/**
 * Submission Diagnostic Script
 * Checks submission workflow and identifies potential issues
 */

import { PrismaClient, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

function log(level: 'info' | 'success' | 'warning' | 'error', message: string) {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`);
}

async function checkSubmissions() {
  console.log('\n========================================');
  console.log('  KIỂM TRA HỆ THỐNG NỘP BÀI');
  console.log('========================================\n');

  try {
    // Count by status
    const statusCounts = await prisma.submission.groupBy({
      by: ['status'],
      _count: true,
    });

    log('info', 'Thống kê theo trạng thái:');
    statusCounts.forEach((item) => {
      console.log(`  - ${item.status}: ${item._count} bài`);
    });

    // Check submissions without files
    const noFiles = await prisma.submission.findMany({
      where: {
        files: { none: {} },
        status: { notIn: ['NEW'] },
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
      },
    });

    if (noFiles.length > 0) {
      log('warning', `\nPhát hiện ${noFiles.length} bài nộp không có file:`);
      noFiles.forEach((sub) => {
        console.log(`  - ${sub.id}: ${sub.title.substring(0, 50)}... (${sub.status})`);
      });
    } else {
      log('success', '\n✓ Tất cả bài nộp đều có file');
    }

    // Check submissions stuck in review
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stuckInReview = await prisma.submission.findMany({
      where: {
        status: 'UNDER_REVIEW',
        createdAt: { lt: thirtyDaysAgo },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        reviews: {
          select: {
            id: true,
            submittedAt: true,
          },
        },
      },
    });

    if (stuckInReview.length > 0) {
      log('warning', `\nPhát hiện ${stuckInReview.length} bài bị kẹt trong phản biện (>30 ngày):`);
      stuckInReview.forEach((sub) => {
        const pendingReviews = sub.reviews.filter((r) => !r.submittedAt).length;
        console.log(
          `  - ${sub.id}: ${sub.title.substring(0, 50)}... (${pendingReviews} đánh giá chờ xử lý)`
        );
      });
    } else {
      log('success', '\n✓ Không có bài bị kẹt trong phản biện');
    }

    // Check submissions without category
    const noCategory = await prisma.submission.count({
      where: { categoryId: null },
    });

    if (noCategory > 0) {
      log('warning', `\n⚠ ${noCategory} bài nộp chưa có chuyên mục`);
    } else {
      log('success', '\n✓ Tất cả bài nộp đều có chuyên mục');
    }

    // Check for duplicate titles
    const duplicates = await prisma.$queryRaw<Array<{ title: string; count: bigint }>>` 
      SELECT title, COUNT(*) as count
      FROM "Submission"
      GROUP BY title
      HAVING COUNT(*) > 1
    `;

    if (duplicates.length > 0) {
      log('warning', `\n⚠ Phát hiện ${duplicates.length} tiêu đề trùng lặp`);
    } else {
      log('success', '\n✓ Không có tiêu đề trùng lặp');
    }

    console.log('\n========================================');
    log('success', 'Kiểm tra hoàn tất');
    console.log('========================================\n');
  } catch (error) {
    log('error', '✗ Lỗi khi kiểm tra:');
    console.error(error);
    process.exit(1);
  }
}

checkSubmissions()
  .catch((error) => {
    console.error('Lỗi:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
