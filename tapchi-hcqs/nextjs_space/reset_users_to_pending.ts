import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetUsersToPending() {
  console.log('🔄 Đưa tất cả tài khoản (trừ admin.test) về trạng thái PENDING...\n')
  
  // Get all users except admin.test
  const allUsers = await prisma.user.findMany({
    where: {
      email: {
        not: 'admin.test@tapchi.vn'
      }
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true
    }
  })
  
  console.log(`📊 Tìm thấy ${allUsers.length} tài khoản\n`)
  
  // Update to PENDING
  const updated = await prisma.user.updateMany({
    where: {
      email: {
        not: 'admin.test@tapchi.vn'
      },
      status: {
        not: 'PENDING'
      }
    },
    data: {
      status: 'PENDING',
      isActive: false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null
    }
  })
  
  console.log(`✅ Đã cập nhật ${updated.count} tài khoản về trạng thái PENDING\n`)
  
  // Show updated list
  const updatedUsers = await prisma.user.findMany({
    where: {
      email: {
        not: 'admin.test@tapchi.vn'
      }
    },
    select: {
      email: true,
      fullName: true,
      role: true,
      status: true,
      isActive: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log('📋 Danh sách tài khoản cần duyệt:')
  console.log('─'.repeat(80))
  updatedUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.fullName}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Status: ${user.status}`)
    console.log(`   IsActive: ${user.isActive}`)
    console.log('─'.repeat(80))
  })
  
  console.log('\n✅ Hoàn thành! Bạn có thể đăng nhập admin.test để phê duyệt các tài khoản này.')
}

resetUsersToPending()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
