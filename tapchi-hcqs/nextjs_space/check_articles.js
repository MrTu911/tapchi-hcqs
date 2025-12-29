const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Check a specific article
    const articleId = 'add087c5-2eb3-473d-811b-9948f51d4e9f';
    
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    });
    
    console.log('Article found:', JSON.stringify(article, null, 2));
    
    // Check total articles
    const total = await prisma.article.count();
    console.log('\nTotal articles:', total);
    
    // Check submissions with published status
    const publishedSubmissions = await prisma.submission.count({
      where: { status: 'PUBLISHED' }
    });
    console.log('Published submissions:', publishedSubmissions);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
