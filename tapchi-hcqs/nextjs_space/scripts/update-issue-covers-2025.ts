
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env') });

import { prisma } from '../lib/prisma';

async function updateIssueCovers() {
  console.log('🔄 Cập nhật ảnh bìa các số tạp chí năm 2025...\n');

  const coverImages = [
    { number: 1, coverImage: '/images/issues/2025/issue-01-2025.png' },
    { number: 2, coverImage: '/images/issues/2025/issue-02-2025.png' },
    { number: 3, coverImage: '/images/issues/2025/issue-03-2025.png' },
    { number: 4, coverImage: '/images/issues/2025/issue-04-2025.png' },
    { number: 5, coverImage: '/images/issues/2025/issue-05-2025.png' },
  ];

  for (const { number, coverImage } of coverImages) {
    try {
      const issue = await prisma.issue.findFirst({
        where: {
          year: 2025,
          number: number
        }
      });

      if (issue) {
        await prisma.issue.update({
          where: { id: issue.id },
          data: { coverImage }
        });
        console.log(`✅ Cập nhật ảnh bìa cho số ${number}/2025: ${coverImage}`);
      } else {
        console.log(`⚠️  Không tìm thấy số ${number}/2025 trong database`);
      }
    } catch (error) {
      console.error(`❌ Lỗi khi cập nhật số ${number}/2025:`, error);
    }
  }

  console.log('\n✅ Hoàn tất cập nhật ảnh bìa!');
}

updateIssueCovers()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
