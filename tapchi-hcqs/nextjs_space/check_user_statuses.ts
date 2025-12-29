import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

config();
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      role: true,
      status: true,
      isActive: true,
      emailVerified: true
    }
  });

  console.log('\n📋 TRẠNG THÁI TÀI KHOẢN:\n');
  users.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`  Tên: ${user.fullName}`);
    console.log(`  Vai trò: ${user.role}`);
    console.log(`  Status: ${user.status}`);
    console.log(`  isActive: ${user.isActive}`);
    console.log(`  emailVerified: ${user.emailVerified}`);
    console.log('');
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
