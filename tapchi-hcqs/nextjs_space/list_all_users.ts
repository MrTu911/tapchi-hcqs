import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      role: true,
      status: true,
      isActive: true
    },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  console.log('All users in database:');
  users.forEach(user => {
    console.log(`- ${user.email} | ${user.fullName} | ${user.role} | Status: ${user.status} | Active: ${user.isActive}`);
  });

  console.log(`\nTotal users found: ${users.length}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
