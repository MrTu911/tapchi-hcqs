import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Kiểm tra trạng thái bài nộp...\n');
  
  const submissions = await prisma.submission.groupBy({
    by: ['status'],
    _count: {
      status: true
    }
  });
  
  console.log('═'.repeat(80));
  console.log('  THỐNG KÊ TRẠNG THÁI BÀI NỘP');
  console.log('═'.repeat(80));
  
  submissions.forEach(stat => {
    console.log(`\n${stat.status}: ${stat._count.status} bài`);
  });
  
  // Get some sample submissions
  const samples = await prisma.submission.findMany({
    take: 5,
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      author: {
        select: {
          fullName: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  console.log('\n' + '═'.repeat(80));
  console.log('  MẪU BÀI NỘP');
  console.log('═'.repeat(80));
  
  samples.forEach((sub, i) => {
    console.log(`\n${i + 1}. ${sub.title}`);
    console.log(`   Mã: ${sub.code}`);
    console.log(`   Tác giả: ${sub.author.fullName}`);
    console.log(`   Trạng thái: ${sub.status}`);
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
