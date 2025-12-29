import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdminStatus() {
  try {
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@tapchi.mil.vn'
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        isActive: true,
        emailVerified: true
      }
    });

    console.log('Admin account status:');
    console.log(JSON.stringify(admin, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminStatus();
