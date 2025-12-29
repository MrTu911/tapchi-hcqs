import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    // Hash the password 'admin123'
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const updated = await prisma.user.update({
      where: {
        email: 'admin@tapchi.mil.vn'
      },
      data: {
        passwordHash: passwordHash,
        status: 'APPROVED',
        isActive: true,
        emailVerified: true
      }
    });

    console.log('✅ Admin account password has been reset successfully');
    console.log('Email:', updated.email);
    console.log('Status:', updated.status);
    console.log('Active:', updated.isActive);
    console.log('Email Verified:', updated.emailVerified);
    console.log('\nYou can now login with:');
    console.log('Email: admin@tapchi.mil.vn');
    console.log('Password: admin123');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
