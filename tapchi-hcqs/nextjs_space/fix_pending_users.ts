import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPendingUsers() {
  console.log('🔧 Đưa tất cả tài khoản PENDING về trạng thái chờ duyệt hoàn chỉnh...\n')
  
  // Update all PENDING users except admin.test
  const updated = await prisma.user.updateMany({
    where: {
      email: {
        not: 'admin.test@tapchi.vn'
      },
      status: 'PENDING'
    },
    data: {
      isActive: false,
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null
    }
  })
  
  console.log(`✅ Đã cập nhật ${updated.count} tài khoản\n`)
  
  // Show final list
  const pendingUsers = await prisma.user.findMany({
    where: {
      status: 'PENDING'
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
  
  console.log(`📋 Tổng số tài khoản chờ duyệt: ${pendingUsers.length}\n`)
  console.log('─'.repeat(100))
  pendingUsers.forEach((user, index) => {
    console.log(`${(index + 1).toString().padStart(2, ' ')}. ${user.fullName.padEnd(30, ' ')} | ${user.email.padEnd(30, ' ')} | ${user.role.padEnd(15, ' ')} | Active: ${user.isActive}`)
  })
  console.log('─'.repeat(100))
  
  console.log('\n✅ Hoàn thành! Tất cả tài khoản đã sẵn sàng để phê duyệt từ admin.test@tapchi.vn')
}

fixPendingUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
