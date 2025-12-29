import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  try {
    // Check if guidelines page exists
    const existing = await prisma.publicPage.findUnique({
      where: { slug: 'guidelines' }
    });

    if (existing) {
      console.log('✓ Guidelines page already exists');
      return;
    }

    // Create guidelines page
    await prisma.publicPage.create({
      data: {
        slug: 'guidelines',
        title: 'Hướng dẫn dành cho tác giả',
        titleEn: 'Author Guidelines',
        content: `
          <h2>Hướng dẫn dành cho tác giả</h2>
          <p>Đây là trang hướng dẫn dành cho tác giả.</p>
          <p>Nội dung sẽ được cập nhật qua CMS.</p>
        `,
        contentEn: `
          <h2>Author Guidelines</h2>
          <p>This is the author guidelines page.</p>
          <p>Content will be updated via CMS.</p>
        `,
        metaTitle: 'Hướng dẫn dành cho tác giả',
        metaDesc: 'Hướng dẫn nộp bài và quy trình biên tập',
        isPublished: true,
        publishedAt: new Date(),
        template: 'default',
        order: 5
      }
    });

    console.log('✓ Guidelines page created successfully');
  } catch (error) {
    console.error('✗ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
