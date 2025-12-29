import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Tạo test reviews cho reviewer...\n');
  
  // Get some submissions
  const submissions = await prisma.submission.findMany({
    where: {
      status: {
        in: ['NEW', 'UNDER_REVIEW']
      }
    },
    take: 6,
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  if (submissions.length === 0) {
    console.log('❌ Không có bài nộp nào để gán review!');
    return;
  }
  
  // Get reviewers
  const reviewers = await prisma.user.findMany({
    where: {
      role: 'REVIEWER'
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });
  
  if (reviewers.length === 0) {
    console.log('❌ Không có reviewer nào trong hệ thống!');
    return;
  }
  
  console.log(`✅ Tìm thấy ${submissions.length} bài nộp và ${reviewers.length} reviewer\n`);
  console.log('═'.repeat(80));
  console.log('  TẠO REVIEW ASSIGNMENTS');
  console.log('═'.repeat(80));
  
  // Create reviews for each submission, assigning multiple reviewers
  let reviewCount = 0;
  
  for (let i = 0; i < Math.min(submissions.length, 6); i++) {
    const submission = submissions[i];
    
    // Update submission status to UNDER_REVIEW
    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: 'UNDER_REVIEW' }
    });
    
    // Assign 2 reviewers to each submission
    const reviewer1 = reviewers[i % reviewers.length];
    const reviewer2 = reviewers[(i + 1) % reviewers.length];
    
    // Create review 1
    const review1 = await prisma.review.create({
      data: {
        submissionId: submission.id,
        reviewerId: reviewer1.id,
        roundNo: 1
      }
    });
    
    console.log(`\n✅ Review ${++reviewCount}`);
    console.log(`   Bài: ${submission.title}`);
    console.log(`   Mã: ${submission.code}`);
    console.log(`   Reviewer 1: ${reviewer1.fullName} (${reviewer1.email})`);
    
    // Create review 2 if different reviewer available
    if (reviewer1.id !== reviewer2.id) {
      const review2 = await prisma.review.create({
        data: {
          submissionId: submission.id,
          reviewerId: reviewer2.id,
          roundNo: 1
        }
      });
      
      console.log(`   Reviewer 2: ${reviewer2.fullName} (${reviewer2.email})`);
      reviewCount++;
    }
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`✅ Đã tạo ${reviewCount} review assignments thành công!`);
  console.log('═'.repeat(80));
  console.log('\n💡 Giờ các reviewer có thể đăng nhập và xem các bài được gán phản biện');
  console.log('   Đường dẫn: /dashboard/reviewer/assignments\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
