import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config()
const prisma = new PrismaClient()

// 11 chuyên mục chính thức
const CATEGORIES = [
  {
    code: "CDHD",
    name: "Chỉ đạo - Hướng dẫn",
    slug: "chi-dao-huong-dan",
    description: "Các văn bản chỉ đạo, hướng dẫn về công tác hậu cần quân sự"
  },
  {
    code: "NVDC", 
    name: "Những vấn đề chung",
    slug: "nhung-van-de-chung",
    description: "Các vấn đề chung về lý luận và thực tiễn hậu cần quân sự"
  },
  {
    code: "NCTD",
    name: "Nghiên cứu - Trao đổi",
    slug: "nghien-cuu-trao-doi",
    description: "Các bài nghiên cứu khoa học và trao đổi học thuật"
  },
  {
    code: "TTKN",
    name: "Thực tiễn - Kinh nghiệm",
    slug: "thuc-tien-kinh-nghiem",
    description: "Chia sẻ thực tiễn và kinh nghiệm trong công tác hậu cần"
  },
  {
    code: "LSHK",
    name: "Lịch sử hậu cần, kỹ thuật quân sự",
    slug: "lich-su-hau-can-ky-thuat",
    description: "Nghiên cứu lịch sử phát triển hậu cần và kỹ thuật quân sự"
  },
  {
    code: "KHKT", 
    name: "Khoa học kỹ thuật hậu cần",
    slug: "khoa-hoc-ky-thuat",
    description: "Các nghiên cứu khoa học kỹ thuật trong lĩnh vực hậu cần"
  },
  {
    code: "QTNQ",
    name: "Quán triệt các nghị quyết của Đảng",
    slug: "quan-triet-nghi-quyet",
    description: "Tuyên truyền và quán triệt các nghị quyết của Đảng"
  },
  {
    code: "DBHB",
    name: "Làm thất bại chiến lược \"Diễn biến hoà bình\"",
    slug: "dien-bien-hoa-binh",
    description: "Đấu tranh chống các thế lực thù địch và chiến lược diễn biến hòa bình"
  },
  {
    code: "HTDT",
    name: "Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh",
    slug: "hoc-tap-ho-chi-minh",
    description: "Học tập và làm theo tấm gương đạo đức Hồ Chí Minh"
  },
  {
    code: "LSTT",
    name: "Lịch sử - Truyền thống",
    slug: "lich-su-truyen-thong",
    description: "Nghiên cứu lịch sử và truyền thống cách mạng"
  },
  {
    code: "TINTUC",
    name: "Tin tức - Thông tin hoạt động hậu cần, kỹ thuật toàn quân",
    slug: "tin-tuc-thong-tin",
    description: "Tin tức và thông tin về các hoạt động hậu cần, kỹ thuật"
  }
]

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu mẫu...\n')

  // Lấy users đã tạo
  console.log('👥 Lấy thông tin users...')
  const admin = await prisma.user.findFirst({ where: { role: 'SYSADMIN' } })
  const eic = await prisma.user.findFirst({ where: { role: 'EIC' } })
  const editor = await prisma.user.findFirst({ where: { role: 'SECTION_EDITOR' } })
  const author = await prisma.user.findFirst({ where: { role: 'AUTHOR' } })
  const reviewer = await prisma.user.findFirst({ where: { role: 'REVIEWER' } })

  if (!admin || !eic || !editor || !author || !reviewer) {
    console.error('❌ Không tìm thấy đủ users. Vui lòng chạy reset_and_create_test_users.ts trước.')
    return
  }

  console.log(`✅ Admin: ${admin.email}`)
  console.log(`✅ EIC: ${eic.email}`)
  console.log(`✅ Editor: ${editor.email}`)
  console.log(`✅ Author: ${author.email}`)
  console.log(`✅ Reviewer: ${reviewer.email}\n`)

  // 1. Tạo chuyên mục
  console.log('📚 Tạo 11 chuyên mục...')
  const categories = []
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { code: cat.code },
      update: cat,
      create: cat
    })
    categories.push(category)
  }
  console.log(`✅ Đã tạo ${categories.length} chuyên mục\n`)

  // 2. Tạo Volume 2025
  console.log('📖 Tạo Volume 2025...')
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
  console.log(`✅ Volume 2025: ${volume2025.id}\n`)

  // 3. Tạo 5 Issues cho 2025
  console.log('📰 Tạo 5 số báo 2025...')
  const issuesData = [
    { number: 1, title: 'Số 01/2025', month: 1, coverImage: '/images/issues/bia-01-2025.png' },
    { number: 2, title: 'Số 02/2025', month: 3, coverImage: '/images/issues/bia-02-2025.png' },
    { number: 3, title: 'Số 03/2025', month: 5, coverImage: '/images/issues/bia-03-2025.png' },
    { number: 4, title: 'Số 04/2025', month: 7, coverImage: '/images/issues/bia-04-2025.png' },
    { number: 5, title: 'Số 05/2025', month: 9, coverImage: '/images/issues/bia-05-2025.png' }
  ]

  const issues = []
  for (const issueData of issuesData) {
    const issue = await prisma.issue.upsert({
      where: { 
        volumeId_number: {
          volumeId: volume2025.id,
          number: issueData.number
        }
      },
      update: {
        title: issueData.title,
        publishDate: new Date(2025, issueData.month - 1, 15),
        coverImage: issueData.coverImage,
        description: `Số báo khoa học tháng ${issueData.month} năm 2025`,
        status: 'PUBLISHED'
      },
      create: {
        volumeId: volume2025.id,
        number: issueData.number,
        year: 2025,
        title: issueData.title,
        publishDate: new Date(2025, issueData.month - 1, 15),
        coverImage: issueData.coverImage,
        description: `Số báo khoa học tháng ${issueData.month} năm 2025`,
        status: 'PUBLISHED'
      }
    })
    issues.push(issue)
  }
  console.log(`✅ Đã tạo ${issues.length} số báo\n`)

  // 4. Tạo submissions và articles mẫu
  console.log('📝 Tạo submissions và articles mẫu...')
  let articleCount = 0
  const timestamp = Date.now()
  
  for (let i = 0; i < 3; i++) {
    const category = categories[i % categories.length]
    const issue = issues[i % issues.length]
    
    // Tạo submission
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-2025-${timestamp}-${String(i + 1).padStart(3, '0')}`,
        title: `Nghiên cứu ứng dụng công nghệ ${i + 1} trong hậu cần quân sự`,
        abstractVn: `Tóm tắt bài viết nghiên cứu về ứng dụng công nghệ hiện đại trong lĩnh vực hậu cần quân sự. Bài viết phân tích các giải pháp công nghệ tiên tiến và đánh giá hiệu quả ứng dụng trong thực tiễn.`,
        abstractEn: `Abstract of research article on the application of modern technology in military logistics. The article analyzes advanced technological solutions and evaluates their practical effectiveness.`,
        keywords: ['công nghệ', 'hậu cần', 'quân sự', 'ứng dụng'],
        status: 'PUBLISHED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })

    // Tạo article tương ứng
    const article = await prisma.article.create({
      data: {
        issueId: issue.id,
        submissionId: submission.id,
        pages: `${10 + i * 5}-${15 + i * 5}`,
        doiLocal: `10.12345/hcqs.2025.${i + 1}`,
        pdfFile: `/articles/article-${i + 1}.pdf`,
        publishedAt: issue.publishDate,
        approvalStatus: 'APPROVED',
        approvedBy: eic.id,
        approvedAt: new Date(),
        views: Math.floor(Math.random() * 500),
        downloads: Math.floor(Math.random() * 200)
      }
    })
    articleCount++
  }
  console.log(`✅ Đã tạo ${articleCount} articles\n`)

  // 5. Tạo một số submissions đang xử lý
  console.log('📋 Tạo submissions đang xử lý...')
  const submissionStatuses = ['NEW', 'UNDER_REVIEW', 'REVISION', 'ACCEPTED']
  let submissionCount = 0
  const timestamp2 = Date.now()

  for (let i = 0; i < 8; i++) {
    const category = categories[i % categories.length]
    const status = submissionStatuses[i % submissionStatuses.length]
    
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-WIP-${timestamp2}-${String(i + 1).padStart(3, '0')}`,
        title: `Bài đang xử lý ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết đang trong quá trình xử lý về ${category.name}.`,
        abstractEn: `Abstract for article in progress on ${category.name}.`,
        keywords: [category.name.toLowerCase(), 'đang xử lý'],
        status: status as any,
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })
    submissionCount++

    // Nếu đang UNDER_REVIEW, tạo review
    if (status === 'UNDER_REVIEW') {
      await prisma.review.create({
        data: {
          submissionId: submission.id,
          reviewerId: reviewer.id,
          roundNo: 1,
          invitedAt: new Date(),
          acceptedAt: new Date(),
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
        }
      })
    }
  }
  console.log(`✅ Đã tạo ${submissionCount} submissions đang xử lý\n`)

  // 6. Tạo News
  console.log('📰 Tạo tin tức...')
  const newsData = [
    {
      title: 'Tạp chí nhận giải thưởng xuất sắc năm 2024',
      slug: 'giai-thuong-xuat-sac-2024',
      summary: 'Tạp chí Khoa học Hậu cần Quân sự vinh dự nhận giải thưởng xuất sắc...'
    },
    {
      title: 'Hội nghị khoa học toàn quốc về Hậu cần 2025',
      slug: 'hoi-nghi-khoa-hoc-2025',
      summary: 'Hội nghị khoa học toàn quốc về Hậu cần quân sự sẽ được tổ chức...'
    },
    {
      title: 'Call for Papers - Số đặc biệt về AI trong Hậu cần',
      slug: 'cfp-ai-trong-hau-can',
      summary: 'Tạp chí kêu gọi bài viết cho số đặc biệt về ứng dụng AI...'
    }
  ]

  for (const news of newsData) {
    await prisma.news.upsert({
      where: { slug: news.slug },
      update: {
        title: news.title,
        summary: news.summary,
        content: `<p>${news.summary} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`,
        isPublished: true,
        publishedAt: new Date(),
        authorId: admin.id
      },
      create: {
        title: news.title,
        slug: news.slug,
        summary: news.summary,
        content: `<p>${news.summary} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>`,
        isPublished: true,
        publishedAt: new Date(),
        authorId: admin.id
      }
    })
  }
  console.log(`✅ Đã tạo ${newsData.length} tin tức\n`)

  // 7. Tạo Banners
  console.log('🎨 Tạo banners...')
  const bannersData = [
    {
      title: 'Chào mừng đến với Tạp chí Khoa học Hậu cần Quân sự',
      imageUrl: '/banner.png',
      linkUrl: '/about',
      position: 0
    },
    {
      title: 'Call for Papers - Số mới nhất',
      imageUrl: '/banner2.png',
      linkUrl: '/dashboard/author/submit',
      position: 1
    }
  ]

  for (const banner of bannersData) {
    await prisma.banner.create({
      data: {
        ...banner,
        isActive: true
      }
    })
  }
  console.log(`✅ Đã tạo ${bannersData.length} banners\n`)

  // 8. Tạo Navigation
  console.log('🧭 Tạo navigation menu...')
  const navItems = [
    { label: 'Trang chủ', labelEn: 'Home', url: '/', position: 0 },
    { label: 'Giới thiệu', labelEn: 'About', url: '/about', position: 1 },
    { label: 'Tạp chí', labelEn: 'Journal', url: '/journal', position: 2 },
    { label: 'Kho lưu trữ', labelEn: 'Archive', url: '/archive', position: 3 },
    { label: 'Liên hệ', labelEn: 'Contact', url: '/contact', position: 4 }
  ]

  for (const item of navItems) {
    await prisma.navigationItem.create({
      data: {
        ...item,
        isActive: true
      }
    })
  }
  console.log(`✅ Đã tạo ${navItems.length} navigation items\n`)

  console.log('═══════════════════════════════════════════')
  console.log('✅ HOÀN TẤT SEED DỮ LIỆU MẪU!')
  console.log('═══════════════════════════════════════════')
  console.log(`📚 ${categories.length} chuyên mục`)
  console.log(`📖 1 Volume (2025)`)
  console.log(`📰 ${issues.length} Issues`)
  console.log(`📝 ${articleCount} Articles đã xuất bản`)
  console.log(`📋 ${submissionCount} Submissions đang xử lý`)
  console.log(`📰 ${newsData.length} Tin tức`)
  console.log(`🎨 ${bannersData.length} Banners`)
  console.log(`🧭 ${navItems.length} Navigation items`)
  console.log('═══════════════════════════════════════════\n')
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
