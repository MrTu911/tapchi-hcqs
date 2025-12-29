import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@tapchi.mil.vn', 'editor@tapchi.mil.vn', 'author@tapchi.mil.vn']
      }
    },
    select: {
      email: true,
      fullName: true,
      role: true,
      status: true,
      isActive: true
    }
  });

  console.log('Users found:');
  users.forEach(user => {
    console.log(`- ${user.email} | ${user.fullName} | ${user.role} | Status: ${user.status} | Active: ${user.isActive}`);
  });

  if (users.length === 0) {
    console.log('No users found with these emails');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
