// @ts-nocheck
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Kiểm tra dữ liệu hiện có...\n')

  // Check all volumes
  const volumes = await prisma.volume.findMany({
    orderBy: { year: 'desc' }
  })
  console.log('📚 Các Volume hiện có:')
  for (const vol of volumes) {
    console.log(`   - ID: ${vol.id}, Tập ${vol.volumeNo}, Năm ${vol.year}: ${vol.title}`)
  }

  // Check all issues
  const issues = await prisma.issue.findMany({
    include: { volume: true },
    orderBy: { publishDate: 'desc' }
  })
  console.log('\n📰 Các Issue hiện có:')
  for (const issue of issues) {
    const count = await prisma.submission.count({
      where: { issueId: issue.id }
    })
    console.log(`   - ID: ${issue.id}, ${issue.title} (Volume ${issue.volume.year}), Số bài viết: ${count}`)
  }

  // Check categories
  const categories = await prisma.category.findMany()
  console.log('\n🏷️  Các Category hiện có:')
  for (const cat of categories) {
    console.log(`   - ${cat.code}: ${cat.name}`)
  }
  
  console.log('\n💡 Để import 42 bài viết từ Số 01/2025, cần:')
  console.log('   1. Tạo Volume: Tập 1 - Năm 2025 (hoặc sử dụng Volume khác)')
  console.log('   2. Tạo Issue: Số 1 (231) - 2025 trong Volume đó')
  console.log('   3. Import 42 bài viết vào Issue đó')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
