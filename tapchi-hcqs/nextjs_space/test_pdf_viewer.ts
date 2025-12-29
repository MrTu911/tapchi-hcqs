
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Kiểm tra submissions và files...\n')
  
  const submissions = await prisma.submission.findMany({
    take: 5,
    include: {
      files: true,
      author: {
        select: {
          fullName: true,
          email: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log(`📊 Tổng số submissions: ${submissions.length}\n`)
  
  submissions.forEach((s, idx) => {
    console.log(`${idx + 1}. ${s.code}: ${s.title}`)
    console.log(`   Author: ${s.author.fullName}`)
    console.log(`   Status: ${s.status}`)
    console.log(`   Files: ${s.files.length}`)
    
    if (s.files.length > 0) {
      s.files.forEach(f => {
        console.log(`     - ${f.originalName} (${f.fileType}, ${f.mimeType})`)
      })
    } else {
      console.log('     (Chưa có file)')
    }
    console.log('')
  })
  
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Lỗi:', e.message)
  prisma.$disconnect()
  process.exit(1)
})
