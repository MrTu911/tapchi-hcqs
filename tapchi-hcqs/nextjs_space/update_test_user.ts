import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create strong password hash
  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  
  // Upsert test user for testing
  const testUser = await prisma.user.upsert({
    where: { email: 'testuser@test.com' },
    update: {
      passwordHash,
      fullName: 'Test User',
      org: 'Test Organization',
      role: 'AUTHOR',
      isActive: true
    },
    create: {
      email: 'testuser@test.com',
      fullName: 'Test User',
      org: 'Test Organization',
      role: 'AUTHOR',
      passwordHash,
      isActive: true
    }
  });
  
  console.log('Test user created/updated:', testUser.email);
  
  // Also ensure john@doe.com exists with strong password
  const johnHash = await bcrypt.hash('JohnDoe123!', 10);
  const johnUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {
      passwordHash: johnHash,
      fullName: 'John Doe',
      org: 'Admin',
      role: 'SYSADMIN',
      isActive: true
    },
    create: {
      email: 'john@doe.com',
      fullName: 'John Doe',
      org: 'Admin',
      role: 'SYSADMIN',
      passwordHash: johnHash,
      isActive: true
    }
  });
  
  console.log('Admin user created/updated:', johnUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
