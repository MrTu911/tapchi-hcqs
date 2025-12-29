const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const issues = await prisma.issue.findMany({
    orderBy: [
      { year: 'desc' },
      { number: 'desc' }
    ]
  });

  console.log('\n📖 Issues:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  issues.forEach(issue => {
    console.log(`ID: ${issue.id}`);
    console.log(`Volume ${issue.volume}, Number ${issue.number}, Year ${issue.year}`);
    console.log(`Status: ${issue.status}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
