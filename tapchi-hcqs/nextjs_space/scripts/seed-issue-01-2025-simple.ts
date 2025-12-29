import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const ISSUE_DATA = {
  volumeNo: 1,
  year: 2025,
  issueNumber: 1
}

// Mẫu dữ liệu 5 bài viết đại diện
const SAMPLE_ARTICLES = [
  {
    title: 'Đổi mới, sáng tạo, tăng tốc, bứt phá, quyết liệt thực hiện thắng lợi nhiệm vụ giáo dục - đào tạo, nghiên cứu khoa học năm 2025',
    authorName: 'Trung tướng, GS.TS. PHAN TÙNG SƠN',
    pages: '3-7',
    category: 'HUONG_DAN_CHI_DAO'
  },
  {
    title: 'Tăng cường sự lãnh đạo của Đảng đối với công tác hậu cần, kỹ thuật quân đội thời kỳ mới',
    authorName: 'Trung tướng ĐỖ VĂN THIỆN',
    pages: '17-21',
    category: 'KY_NIEM'
  },
  {
    title: 'Tổ chức dự trữ vật chất quân nhu lực lượng vũ trang địa phương',
    authorName: 'Thượng tá, TS. ĐỖ DUY THÁNG',
    pages: '32-35',
    category: 'NCTD'
  },
  {
    title: 'Tổ chức, sử dụng lực lượng hậu cần dự bị lữ đoàn tàu tên lửa',
    authorName: 'Thượng tá, TS. NGUYỄN QUỐC HOÀI',
    pages: '106-109',
    category: 'NCTD'
  },
  {
    title: 'Nghiên cứu một số mô hình ứng xử phi tuyến của bê tông cốt thép',
    authorName: 'Trung tá, ThS. NGUYỄN VĂN TRỌNG',
    pages: '110-114',
    category: 'NCTD'
  },
  {
    title: 'Nâng cao chất lượng tự học từ vựng Tiếng Anh cho đối tượng đào tạo sĩ quan hậu cần',
    authorName: 'Thiếu tá, ThS. HOÀNG THỊ THU HÀ',
    pages: '115-117',
    category: 'NCTD'
  },
  {
    title: 'Biện pháp bảo đảm vật chất hậu cần phân đội bộ binh cơ động chiến đấu',
    authorName: 'Đại tá, TS. PHẠM TRỌNG DIỄN',
    pages: '118-121',
    category: 'NCTD'
  },
  {
    title: 'Khai thác, tạo nguồn vật chất hậu cần của các đoàn hậu cần trên Chiến trường B2',
    authorName: 'Đại tá, TS. VŨ QUANG HÒA',
    pages: '151-155',
    category: 'LICH_SU'
  }
]

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu demo đơn giản...')

  // Get volume
  const volume = await prisma.volume.findFirst({ where: { volumeNo: ISSUE_DATA.volumeNo } })
  if (!volume) {
    console.log('❌ Không tìm thấy volume')
    return
  }

  // Get issue
  const issue = await prisma.issue.findFirst({
    where: {
      volumeId: volume.id,
      number: ISSUE_DATA.issueNumber
    }
  })
  if (!issue) {
    console.log('❌ Không tìm thấy issue')
    return
  }

  console.log(`✅ Đang sử dụng Issue: ${issue.title}`)

  // Process each article
  for (const art of SAMPLE_ARTICLES) {
    // Get or create category
    const category = await prisma.category.findFirst({ where: { code: art.category } })
    if (!category) {
      console.log(`⚠️  Không tìm thấy category: ${art.category}`)
      continue
    }

    // Get or create author
    const authorEmail = art.authorName.toLowerCase().replace(/[^a-z]/g, '') + '@hvhc.mil.vn'
    let author = await prisma.user.findFirst({ where: { email: authorEmail } })
    
    if (!author) {
      author = await prisma.user.create({
        data: {
          email: authorEmail,
          fullName: art.authorName,
          role: 'AUTHOR',
          passwordHash: await bcrypt.hash('password123', 10),
          org: 'Học viện Hậu cần'
        }
      })
      console.log(`✅ Đã tạo Author: ${art.authorName}`)
    }

    // Use raw SQL to insert submission to avoid Prisma issues
    const submissionCode = `HCQS-2025-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`
    
    const result: any = await prisma.$queryRaw`
      INSERT INTO "Submission" (
        id, code, title, "createdBy", "categoryId", status, "securityLevel",
        "createdAt", "daysInCurrentStatus", "isOverdue", "lastStatusChangeAt"
      ) VALUES (
        gen_random_uuid(),
        ${submissionCode},
        ${art.title},
        ${author.id},
        ${category.id},
        'PUBLISHED'::"SubmissionStatus",
        'OPEN'::"SecurityLevel",
        NOW() - INTERVAL '90 days',
        0,
        false,
        NOW()
      )
      RETURNING id
    `
    
    const submissionId = result[0].id
    console.log(`✅ Đã tạo Submission: ${art.title.substring(0, 50)}...`)

    // Create article
    await prisma.$queryRaw`
      INSERT INTO "Article" (
        id, "issueId", "submissionId", pages, "publishedAt", views, downloads, "isFeatured"
      ) VALUES (
        gen_random_uuid(),
        ${issue.id},
        ${submissionId},
        ${art.pages},
        ${issue.publishDate},
        ${Math.floor(Math.random() * 500) + 50},
        ${Math.floor(Math.random() * 200) + 20},
        ${Math.random() > 0.8}
      )
    `
    
    console.log(`✅ Đã tạo Article liên kết`)
  }

  console.log('✨ Hoàn thành seed dữ liệu demo!')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
