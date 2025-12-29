const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany({
    select: {
      code: true,
      name: true,
      slug: true
    },
    orderBy: { code: 'asc' }
  });

  console.log('\n📚 Category Slugs:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  categories.forEach(cat => {
    console.log(`${cat.code.padEnd(8)} | ${cat.name.padEnd(50)} | ${cat.slug}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
