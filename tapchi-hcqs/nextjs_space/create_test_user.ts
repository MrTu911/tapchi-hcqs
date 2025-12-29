import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Delete existing test users
  try {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['testuser@test.com', 'john@doe.com']
        }
      }
    });
  } catch (e) {
    console.log('Error deleting users, continuing...');
  }

  // Create strong password hash
  const passwordHash = await bcrypt.hash('TestPass123!', 10);
  
  // Create test user for testing
  const testUser = await prisma.user.create({
    data: {
      email: 'testuser@test.com',
      fullName: 'Test User',
      org: 'Test Organization',
      role: 'AUTHOR',
      passwordHash,
      isActive: true
    }
  });
  
  console.log('Test user created:', testUser.email);
  
  // Also ensure john@doe.com exists with strong password
  const johnHash = await bcrypt.hash('JohnDoe123!', 10);
  const johnUser = await prisma.user.create({
    data: {
      email: 'john@doe.com',
      fullName: 'John Doe',
      org: 'Admin',
      role: 'SYSADMIN',
      passwordHash: johnHash,
      isActive: true
    }
  });
  
  console.log('Admin user created:', johnUser.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
