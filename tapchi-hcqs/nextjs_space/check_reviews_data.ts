import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Kiểm tra dữ liệu Review trong hệ thống...\n');
  
  // Check submissions
  const submissionsCount = await prisma.submission.count();
  console.log(`📄 Tổng số bài nộp: ${submissionsCount}`);
  
  // Check reviews
  const reviewsCount = await prisma.review.count();
  console.log(`📝 Tổng số review: ${reviewsCount}\n`);
  
  if (reviewsCount > 0) {
    const reviews = await prisma.review.findMany({
      include: {
        reviewer: {
          select: {
            fullName: true,
            email: true
          }
        },
        submission: {
          select: {
            title: true,
            code: true
          }
        }
      },
      take: 5
    });
    
    console.log('═'.repeat(80));
    console.log('  5 REVIEW ĐẦU TIÊN');
    console.log('═'.repeat(80));
    
    reviews.forEach((review, index) => {
      console.log(`\n${index + 1}. Review ID: ${review.id}`);
      console.log(`   Bài: ${review.submission.title}`);
      console.log(`   Mã: ${review.submission.code}`);
      console.log(`   Reviewer: ${review.reviewer.fullName} (${review.reviewer.email})`);
      console.log(`   Vòng: ${review.roundNo}`);
      console.log(`   Trạng thái: ${review.submittedAt ? '✅ Đã hoàn thành' : '⏳ Chưa hoàn thành'}`);
    });
  } else {
    console.log('⚠️  Không có review nào trong hệ thống!');
    console.log('💡 Để tạo review, cần:');
    console.log('   1. Có bài nộp (Submission)');
    console.log('   2. Editor gán reviewer cho bài nộp đó');
  }
  
  // Check reviewers
  const reviewers = await prisma.user.findMany({
    where: {
      role: 'REVIEWER'
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      _count: {
        select: {
          reviews: true
        }
      }
    }
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log('  DANH SÁCH REVIEWER');
  console.log('═'.repeat(80));
  
  reviewers.forEach((reviewer, index) => {
    console.log(`\n${index + 1}. ${reviewer.fullName} (${reviewer.email})`);
    console.log(`   Số review được gán: ${reviewer._count.reviews}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
