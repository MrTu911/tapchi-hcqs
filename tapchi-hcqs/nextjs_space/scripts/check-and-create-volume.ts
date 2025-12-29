// @ts-nocheck
import { PrismaClient, IssueStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Kiểm tra Volume và Issue...\n')

  // Check Volume
  let volume = await prisma.volume.findFirst({
    where: {
      volumeNo: 1,
      year: 2025
    }
  })

  if (!volume) {
    console.log('➕ Tạo Volume mới: Tập 1 - Năm 2025')
    volume = await prisma.volume.create({
      data: {
        volumeNo: 1,
        year: 2025,
        title: 'Tập 1 - Năm 2025',
        description: 'Năm thứ 54 - Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự'
      }
    })
    console.log(`✅ Đã tạo Volume ID: ${volume.id}`)
  } else {
    console.log(`✅ Đã có Volume ID: ${volume.id}`)
  }

  // Check Issue
  let issue = await prisma.issue.findFirst({
    where: {
      volumeId: volume.id,
      number: 1
    }
  })

  if (!issue) {
    console.log('\n➕ Tạo Issue mới: Số 1 (231) - 2025')
    issue = await prisma.issue.create({
      data: {
        volumeId: volume.id,
        number: 1,
        title: 'Số 1 (231) - 2025',
        description: 'Năm thứ 54 - Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự',
        issn: '1859-1337',
        publishedDate: new Date('2025-02-01'),
        status: 'PUBLISHED' as IssueStatus
      }
    })
    console.log(`✅ Đã tạo Issue ID: ${issue.id}`)
  } else {
    console.log(`✅ Đã có Issue ID: ${issue.id}`)
  }

  // Count existing submissions
  const submissionCount = await prisma.submission.count({
    where: { issueId: issue.id }
  })
  console.log(`\n📊 Số bài viết hiện có trong Issue: ${submissionCount}`)

  console.log('\n✨ Sẵn sàng để import 42 bài viết!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
