import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testAdminRegistration() {
  console.log('🧪 Testing Admin Registration (No Approval Required)...\n')
  
  // Clean up test admin if exists
  const testEmail = 'admin.test@tapchi.vn'
  const existing = await prisma.user.findUnique({
    where: { email: testEmail }
  })
  
  if (existing) {
    console.log('🗑️  Deleting existing test admin...')
    await prisma.user.delete({ where: { id: existing.id } })
    console.log('✅ Deleted\n')
  }
  
  // Create admin user
  console.log('👤 Creating new ADMIN account...')
  const passwordHash = await bcrypt.hash('Admin@123456', 12)
  
  const admin = await prisma.user.create({
    data: {
      email: testEmail,
      fullName: 'Admin Test Account',
      org: 'Học viện Hậu cần',
      phone: '0901234567',
      role: 'SYSADMIN',
      passwordHash,
      status: 'APPROVED',
      isActive: true,
      emailVerified: true,
      approvedAt: new Date()
    }
  })
  
  console.log('✅ Admin created successfully!\n')
  console.log('📋 Account Details:')
  console.log('   Email:', admin.email)
  console.log('   Password: Admin@123456')
  console.log('   Role:', admin.role)
  console.log('   Status:', admin.status)
  console.log('   IsActive:', admin.isActive)
  console.log('   EmailVerified:', admin.emailVerified)
  console.log('\n✅ Admin can login immediately without approval!\n')
}

testAdminRegistration()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
