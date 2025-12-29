
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting seed for 2025 issues...')

  try {
    // 1. Create or get Volume 2 for 2025
    console.log('📖 Creating Volume 2 for 2025...')
    const volume2025 = await prisma.volume.upsert({
      where: { volumeNo: 2 },
      update: {
        year: 2025,
        title: 'Tập 2 - Năm 2025',
        description: 'Tập san khoa học Hậu cần quân sự năm 2025'
      },
      create: {
        volumeNo: 2,
        year: 2025,
        title: 'Tập 2 - Năm 2025',
        description: 'Tập san khoa học Hậu cần quân sự năm 2025'
      }
    })
    console.log(`✅ Volume 2025 created/updated: ${volume2025.id}`)

    // 2. Create 5 issues for 2025
    console.log('📰 Creating 5 issues for 2025...')
    
    const issues2025Data = [
      {
        number: 1,
        title: 'Số 01 - Tháng 1/2025',
        publishDate: new Date('2025-01-15'),
        coverImage: '/images/issues/bia-01-2025.png',
        description: 'Số báo khoa học tháng 1 năm 2025'
      },
      {
        number: 2,
        title: 'Số 02 - Tháng 3/2025',
        publishDate: new Date('2025-03-15'),
        coverImage: '/images/issues/bia-02-2025.png',
        description: 'Số báo khoa học tháng 3 năm 2025'
      },
      {
        number: 3,
        title: 'Số 03 - Tháng 5/2025',
        publishDate: new Date('2025-05-15'),
        coverImage: '/images/issues/bia-03-2025.png',
        description: 'Số báo khoa học tháng 5 năm 2025'
      },
      {
        number: 4,
        title: 'Số 04 - Tháng 7/2025',
        publishDate: new Date('2025-07-15'),
        coverImage: '/images/issues/bia-04-2025.png',
        description: 'Số báo khoa học tháng 7 năm 2025'
      },
      {
        number: 5,
        title: 'Số 05 - Tháng 9/2025',
        publishDate: new Date('2025-09-15'),
        coverImage: '/images/issues/bia-05-2025.png',
        description: 'Số báo khoa học tháng 9 năm 2025'
      }
    ]

    const createdIssues = []
    for (const issueData of issues2025Data) {
      const issue = await prisma.issue.upsert({
        where: {
          volumeId_number: {
            volumeId: volume2025.id,
            number: issueData.number
          }
        },
        update: {
          title: issueData.title,
          publishDate: issueData.publishDate,
          coverImage: issueData.coverImage,
          description: issueData.description,
          status: 'PUBLISHED'
        },
        create: {
          volumeId: volume2025.id,
          number: issueData.number,
          year: 2025,
          title: issueData.title,
          publishDate: issueData.publishDate,
          coverImage: issueData.coverImage,
          description: issueData.description,
          status: 'PUBLISHED'
        }
      })
      createdIssues.push(issue)
      console.log(`✅ Issue ${issueData.number}/2025 created: ${issue.title}`)
    }

    // 3. Get categories for sample articles
    const categories = await prisma.category.findMany()
    const authors = await prisma.user.findMany({
      where: { role: 'AUTHOR' }
    })
    
    if (authors.length === 0) {
      console.log('⚠️ No authors found, skipping sample articles')
      return
    }

    // 4. Create sample articles for each issue (2-3 articles per issue)
    console.log('📝 Creating sample articles...')
    
    const sampleArticles = [
      // Issue 1
      {
        title: "Đổi mới công tác hậu cần quân sự trong bối cảnh cách mạng công nghiệp 4.0",
        abstractVn: "Bài viết phân tích tác động của cách mạng công nghiệp 4.0 đến công tác hậu cần quân sự, đề xuất các giải pháp đổi mới phù hợp.",
        abstractEn: "This article analyzes the impact of Industry 4.0 on military logistics, proposing appropriate innovative solutions.",
        keywords: ["hậu cần 4.0", "chuyển đổi số", "công nghệ", "đổi mới"],
        categoryCode: "NCTD",
        issueNumber: 1
      },
      {
        title: "Ứng dụng trí tuệ nhân tạo trong dự báo nhu cầu vật tư quân sự",
        abstractVn: "Nghiên cứu ứng dụng các thuật toán AI và machine learning để dự báo chính xác nhu cầu vật tư, tối ưu hóa kho vận.",
        abstractEn: "Research on applying AI and machine learning algorithms for accurate supply demand forecasting and inventory optimization.",
        keywords: ["AI", "dự báo", "vật tư", "tối ưu hóa"],
        categoryCode: "KHKT",
        issueNumber: 1
      },
      
      // Issue 2
      {
        title: "Xây dựng hệ thống hậu cần thông minh phục vụ quốc phòng",
        abstractVn: "Đề xuất mô hình hệ thống hậu cần thông minh tích hợp IoT, Big Data và AI để nâng cao hiệu quả bảo đảm hậu cần quốc phòng.",
        abstractEn: "Proposing a smart logistics system model integrating IoT, Big Data and AI to improve defense logistics efficiency.",
        keywords: ["hậu cần thông minh", "IoT", "Big Data", "tích hợp"],
        categoryCode: "KHKT",
        issueNumber: 2
      },
      {
        title: "Kinh nghiệm quản lý chuỗi cung ứng trong các tình huống khẩn cấp",
        abstractVn: "Tổng kết kinh nghiệm thực tiễn trong quản lý và điều phối chuỗi cung ứng hậu cần khi xảy ra các tình huống khẩn cấp.",
        abstractEn: "Summarizing practical experience in managing and coordinating logistics supply chains during emergency situations.",
        keywords: ["chuỗi cung ứng", "khẩn cấp", "quản lý", "điều phối"],
        categoryCode: "TTKN",
        issueNumber: 2
      },
      
      // Issue 3
      {
        title: "Nghiên cứu công nghệ Blockchain trong bảo mật chuỗi cung ứng quân sự",
        abstractVn: "Phân tích tiềm năng ứng dụng công nghệ blockchain để tăng cường bảo mật, minh bạch và truy xuất nguồn gốc trong chuỗi cung ứng vật tư quân sự.",
        abstractEn: "Analyzing the potential of blockchain technology to enhance security, transparency and traceability in military supply chains.",
        keywords: ["blockchain", "bảo mật", "chuỗi cung ứng", "truy xuất"],
        categoryCode: "KHKT",
        issueNumber: 3
      },
      {
        title: "Quán triệt và triển khai Nghị quyết Đại hội XIII về quốc phòng",
        abstractVn: "Phân tích nội dung và ý nghĩa của các nghị quyết liên quan đến quốc phòng, đề xuất phương hướng triển khai trong lĩnh vực hậu cần.",
        abstractEn: "Analyzing content and significance of defense-related resolutions, proposing implementation directions in logistics.",
        keywords: ["nghị quyết", "đại hội XIII", "quốc phòng", "triển khai"],
        categoryCode: "QTNQ",
        issueNumber: 3
      },
      
      // Issue 4
      {
        title: "Lịch sử phát triển công nghệ vũ khí và kỹ thuật hậu cần Việt Nam",
        abstractVn: "Nghiên cứu lịch sử hình thành và phát triển của công nghệ vũ khí, kỹ thuật hậu cần Quân đội nhân dân Việt Nam qua các thời kỳ.",
        abstractEn: "Researching the formation and development history of weapons technology and logistics engineering of Vietnam People's Army.",
        keywords: ["lịch sử", "vũ khí", "kỹ thuật", "phát triển"],
        categoryCode: "LSHK",
        issueNumber: 4
      },
      {
        title: "Học tập và làm theo tư tưởng Hồ Chí Minh về xây dựng Quân đội",
        abstractVn: "Nghiên cứu tư tưởng của Chủ tịch Hồ Chí Minh về xây dựng Quân đội nhân dân, rút ra bài học cho công tác hậu cần hiện nay.",
        abstractEn: "Studying President Ho Chi Minh's thoughts on building the People's Army, drawing lessons for current logistics work.",
        keywords: ["Hồ Chí Minh", "tư tưởng", "xây dựng quân đội", "bài học"],
        categoryCode: "HTDT",
        issueNumber: 4
      },
      
      // Issue 5
      {
        title: "Những vấn đề lý luận và thực tiễn về hậu cần trong chiến tranh hiện đại",
        abstractVn: "Phân tích các vấn đề lý luận cơ bản và thực tiễn về tổ chức, hoạt động hậu cần trong điều kiện chiến tranh hiện đại.",
        abstractEn: "Analyzing basic theoretical and practical issues of logistics organization and operations in modern warfare conditions.",
        keywords: ["lý luận", "thực tiễn", "chiến tranh hiện đại", "tổ chức"],
        categoryCode: "NVDC",
        issueNumber: 5
      },
      {
        title: "Đấu tranh chống âm mưu diễn biến hòa bình trong lĩnh vực quốc phòng",
        abstractVn: "Phân tích các thủ đoạn diễn biến hòa bình của các thế lực thù địch nhằm vào lĩnh vực quốc phòng, đề xuất biện pháp đấu tranh.",
        abstractEn: "Analyzing peaceful evolution tactics of hostile forces targeting defense sector, proposing countermeasures.",
        keywords: ["diễn biến hòa bình", "thế lực thù địch", "đấu tranh", "quốc phòng"],
        categoryCode: "DBHB",
        issueNumber: 5
      }
    ]

    let articleCount = 0
    for (const articleData of sampleArticles) {
      const category = categories.find(c => c.code === articleData.categoryCode)
      if (!category) {
        console.log(`⚠️ Category ${articleData.categoryCode} not found, skipping article`)
        continue
      }

      const issue = createdIssues.find(i => i.number === articleData.issueNumber)
      if (!issue) {
        console.log(`⚠️ Issue ${articleData.issueNumber} not found, skipping article`)
        continue
      }

      const author = authors[articleCount % authors.length]

      // Create submission first
      const now = new Date()
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
      const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
      const submission = await prisma.submission.create({
        data: {
          code: `HCQS-${dateStr}-${timeStr}${String(articleCount + 1).padStart(2, '0')}`,
          title: articleData.title,
          abstractVn: articleData.abstractVn,
          abstractEn: articleData.abstractEn,
          keywords: articleData.keywords,
          categoryId: category.id,
          createdBy: author.id,
          status: 'PUBLISHED'
        }
      })

      // Create article
      const article = await prisma.article.create({
        data: {
          issueId: issue.id,
          submissionId: submission.id,
          pages: `${10 + articleCount * 5}-${20 + articleCount * 5}`,
          doiLocal: `10.12345/tapchi.2025.${issue.number}.${articleCount + 1}`,
          publishedAt: issue.publishDate,
          views: Math.floor(Math.random() * 500) + 100,
          downloads: Math.floor(Math.random() * 200) + 50,
          isFeatured: articleCount % 3 === 0, // Feature every 3rd article
          approvalStatus: 'APPROVED',
          approvedBy: author.id,
          approvedAt: issue.publishDate
        }
      })

      articleCount++
      console.log(`✅ Article created: ${submission.title}`)
    }

    console.log(`\n✅ Seed completed successfully!`)
    console.log(`📊 Summary:`)
    console.log(`   - Volume: 1 (Year 2025)`)
    console.log(`   - Issues: ${createdIssues.length}`)
    console.log(`   - Articles: ${articleCount}`)

  } catch (error) {
    console.error('❌ Error seeding data:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
