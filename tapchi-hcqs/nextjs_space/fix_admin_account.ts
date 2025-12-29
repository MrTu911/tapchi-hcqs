import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminAccount() {
  try {
    const updated = await prisma.user.update({
      where: {
        email: 'admin@tapchi.mil.vn'
      },
      data: {
        status: 'APPROVED',
        isActive: true,
        emailVerified: true
      }
    });

    console.log('✅ Admin account has been updated successfully:');
    console.log(JSON.stringify(updated, null, 2));
  } catch (error) {
    console.error('❌ Error updating admin account:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminAccount();
