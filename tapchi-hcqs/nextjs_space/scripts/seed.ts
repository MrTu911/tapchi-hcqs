
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 11 chuyên mục chính thức
const CATEGORIES = [
  {
    code: "CDHD",
    name: "Chỉ đạo - Hướng dẫn",
    description: "Các văn bản chỉ đạo, hướng dẫn về công tác hậu cần quân sự"
  },
  {
    code: "NVDC", 
    name: "Những vấn đề chung",
    description: "Các vấn đề chung về lý luận và thực tiễn hậu cần quân sự"
  },
  {
    code: "NCTD",
    name: "Nghiên cứu - Trao đổi", 
    description: "Các bài nghiên cứu khoa học và trao đổi học thuật"
  },
  {
    code: "TTKN",
    name: "Thực tiễn - Kinh nghiệm",
    description: "Chia sẻ thực tiễn và kinh nghiệm trong công tác hậu cần"
  },
  {
    code: "LSHK",
    name: "Lịch sử hậu cần, kỹ thuật quân sự",
    description: "Nghiên cứu lịch sử phát triển hậu cần và kỹ thuật quân sự"
  },
  {
    code: "KHKT", 
    name: "Khoa học kỹ thuật hậu cần",
    description: "Các nghiên cứu khoa học kỹ thuật trong lĩnh vực hậu cần"
  },
  {
    code: "QTNQ",
    name: "Quán triệt các nghị quyết của Đảng",
    description: "Tuyên truyền và quán triệt các nghị quyết của Đảng"
  },
  {
    code: "DBHB",
    name: "Làm thất bại chiến lược \"Diễn biến hoà bình\"",
    description: "Đấu tranh chống các thế lực thù địch và chiến lược diễn biến hòa bình"
  },
  {
    code: "HTDT",
    name: "Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh", 
    description: "Học tập và làm theo tấm gương đạo đức Hồ Chí Minh"
  },
  {
    code: "LSTT",
    name: "Lịch sử - Truyền thống",
    description: "Nghiên cứu lịch sử và truyền thống cách mạng"
  },
  {
    code: "TINTUC",
    name: "Tin tức - Thông tin hoạt động hậu cần, kỹ thuật toàn quân",
    description: "Tin tức và thông tin về các hoạt động hậu cần, kỹ thuật"
  }
]

// Official user accounts - Tài khoản chính thức
const USERS = [
  // Main official accounts - Tài khoản chính
  {
    email: "admin@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Quản trị viên hệ thống",
    org: "Học viện Khoa học Hậu cần Quân sự",
    role: "SYSADMIN"
  },
  {
    email: "tongbientap@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Tổng Biên Tập",
    org: "Học viện Khoa học Hậu cần Quân sự",
    role: "EIC"
  },
  {
    email: "bientapchinh@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Biên Tập Chính",
    org: "Học viện Khoa học Hậu cần Quân sự",
    role: "MANAGING_EDITOR"
  },
  {
    email: "bientap@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Biên Tập Chuyên Mục",
    org: "Học viện Khoa học Hậu cần Quân sự",
    role: "SECTION_EDITOR"
  },
  {
    email: "tacgia@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Tác giả",
    org: "Học viện Khoa học Hậu cần Quân sự",
    role: "AUTHOR"
  },
  {
    email: "phanbien@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Phản biện viên",
    org: "Đại học Quốc phòng",
    role: "REVIEWER"
  },
  // Additional test accounts for full workflow - Tài khoản phụ để test đầy đủ
  {
    email: "tacgia2@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Tác giả 2",
    org: "Quân khu 1",
    role: "AUTHOR"
  },
  {
    email: "phanbien2@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Phản biện viên 2",
    org: "Học viện Lục quân",
    role: "REVIEWER"
  },
  {
    email: "dangtrang@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Biên tập dàn trang",
    org: "Học viện Khoa học Hậu cần Quân sự",
    role: "LAYOUT_EDITOR"
  },
  {
    email: "docgia@tapchinckhhcqs.vn",
    password: "TapChi@2025",
    fullName: "Độc giả",
    org: "Quân khu 2",
    role: "READER"
  }
]

async function createSlug(name: string): Promise<string> {
  // Comprehensive Vietnamese to ASCII conversion
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a', 'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o', 'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u', 'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A', 'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A', 'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E', 'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O', 'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O', 'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U', 'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D'
  }

  let result = name.toLowerCase()
  
  // Replace Vietnamese characters
  for (const [viet, ascii] of Object.entries(vietnameseMap)) {
    result = result.replace(new RegExp(viet.toLowerCase(), 'g'), ascii.toLowerCase())
  }

  // Clean up
  result = result
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric except spaces and hyphens
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, '')      // Trim hyphens from start and end

  return result
}

async function main() {
  console.log('🌱 Bắt đầu seed database...')

  // 1. Seed 11 chuyên mục
  console.log('📚 Seed 11 chuyên mục...')
  for (const cat of CATEGORIES) {
    const slug = await createSlug(cat.name)
    await prisma.category.upsert({
      where: { code: cat.code },
      update: {
        name: cat.name,
        slug,
        description: cat.description
      },
      create: {
        code: cat.code,
        name: cat.name,
        slug,
        description: cat.description
      }
    })
  }

  // 2. Seed users
  console.log('👥 Seed users...')
  const createdUsers: any[] = []
  for (const user of USERS) {
    const hashedPassword = await bcrypt.hash(user.password, 12)
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        fullName: user.fullName,
        org: user.org,
        role: user.role as any,
        passwordHash: hashedPassword
      },
      create: {
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role as any,
        passwordHash: hashedPassword
      }
    })
    createdUsers.push(createdUser)
  }

  // 2.5. Create Reviewer Profiles with expertise and keywords
  console.log('👨‍🔬 Creating Reviewer Profiles...')
  const reviewers = createdUsers.filter(u => u.role === 'REVIEWER')
  
  const reviewerExpertise = [
    {
      expertise: ['Hậu cần quân sự', 'Quản lý vật tư', 'Kỹ thuật'],
      keywords: ['hậu cần', 'vật tư', 'quản lý', 'kỹ thuật quân sự', 'logistics']
    },
    {
      expertise: ['Lý luận hậu cần', 'Chiến lược quốc phòng'],
      keywords: ['lý luận', 'chiến lược', 'quốc phòng', 'hậu cần hiện đại', 'chiến tranh']
    },
    {
      expertise: ['Công nghệ thông tin', 'AI', 'Tự động hóa'],
      keywords: ['AI', 'machine learning', 'automation', 'công nghệ', 'thông tin']
    }
  ]
  
  for (let i = 0; i < reviewers.length && i < reviewerExpertise.length; i++) {
    const reviewer = reviewers[i]
    const expertise = reviewerExpertise[i]
    
    await prisma.reviewerProfile.upsert({
      where: { userId: reviewer.id },
      update: {
        expertise: expertise.expertise,
        keywords: expertise.keywords,
        maxConcurrentReviews: 5,
        isAvailable: true
      },
      create: {
        userId: reviewer.id,
        expertise: expertise.expertise,
        keywords: expertise.keywords,
        totalReviews: Math.floor(Math.random() * 10) + 5,
        completedReviews: Math.floor(Math.random() * 8) + 3,
        declinedReviews: Math.floor(Math.random() * 2),
        avgCompletionDays: Math.random() * 10 + 5,
        averageRating: Math.random() * 1.5 + 3.5,
        maxConcurrentReviews: 5,
        isAvailable: true,
        lastReviewAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      }
    })
  }
  
  console.log(`✅ Created ${Math.min(reviewers.length, reviewerExpertise.length)} reviewer profiles`)

  // 3. Seed Volumes and Issues
  console.log('📖 Seed Volumes and Issues...')
  
  // Create Volume 1
  const volume1 = await prisma.volume.upsert({
    where: { volumeNo: 1 },
    update: {},
    create: {
      volumeNo: 1,
      year: 2024,
      title: 'Tập 1 - Năm 2024',
      description: 'Tập đầu tiên của Tạp chí Khoa học Hậu cần Quân sự năm 2024'
    }
  })

  // Create Issues for Volume 1
  const issue1 = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume1.id, number: 1 } },
    update: {
      publishDate: new Date('2024-06-01'),
      status: 'PUBLISHED'
    },
    create: {
      volumeId: volume1.id,
      number: 1, 
      year: 2024,
      title: 'Số 1 - Tháng 6/2024',
      publishDate: new Date('2024-06-01'),
      status: 'PUBLISHED'
    }
  })

  const issue2 = await prisma.issue.upsert({
    where: { volumeId_number: { volumeId: volume1.id, number: 2 } },
    update: {
      publishDate: new Date('2024-12-01'),
      status: 'PUBLISHED'
    },
    create: {
      volumeId: volume1.id,
      number: 2,
      year: 2024,
      title: 'Số 2 - Tháng 12/2024',
      publishDate: new Date('2024-12-01'),
      status: 'PUBLISHED'
    }
  })

  // 4. Lấy categories và authors để seed submissions & articles
  const categories = await prisma.category.findMany()
  const author = createdUsers.find(u => u.email === 'tacgia@tapchinckhhcqs.vn')!
  const author2 = createdUsers.find(u => u.email === 'tacgia2@tapchinckhhcqs.vn')!
  
  // Validation: Đảm bảo authors tồn tại
  if (!author || !author2) {
    throw new Error('❌ Không tìm thấy authors cần thiết cho seed process')
  }

  // 5. Seed sample articles (15 bài phân bố đều 11 chuyên mục)
  console.log('📰 Seed sample articles...')
  const sampleArticles = [
    {
      title: "Đổi mới công tác hậu cần quân sự trong thời kỳ mới",
      abstractVn: "Bài viết phân tích những thành tựu và hạn chế trong công tác hậu cần quân sự, đề xuất các giải pháp đổi mới phù hợp với yêu cầu nhiệm vụ trong giai đoạn hiện tại.",
      abstractEn: "This article analyzes achievements and limitations in military logistics work, proposing innovative solutions suitable for current mission requirements.",
      keywords: ["hậu cần quân sự", "đổi mới", "hiệu quả"],
      categoryCode: "CDHD",
      issueId: issue1.id
    },
    {
      title: "Những vấn đề lý luận về hậu cần trong chiến tranh hiện đại",
      abstractVn: "Nghiên cứu các vấn đề lý luận cơ bản về hậu cần trong bối cảnh chiến tranh hiện đại, đặc biệt là vai trò của công nghệ thông tin.",
      abstractEn: "Research on basic theoretical issues of logistics in modern warfare, especially the role of information technology.",
      keywords: ["lý luận hậu cần", "chiến tranh hiện đại", "công nghệ"],
      categoryCode: "NVDC",
      issueId: issue1.id
    },
    {
      title: "Nghiên cứu ứng dụng AI trong quản lý vật tư quân sự",
      abstractVn: "Bài báo trình bày kết quả nghiên cứu ứng dụng trí tuệ nhân tạo (AI) trong công tác quản lý và phân phối vật tư quân sự, nâng cao hiệu quả hoạt động hậu cần.",
      abstractEn: "The paper presents research results on applying artificial intelligence (AI) in military supply management and distribution, improving logistics efficiency.",
      keywords: ["AI", "vật tư quân sự", "quản lý", "hiệu quả"],
      categoryCode: "NCTD",
      issueId: issue1.id
    },
    {
      title: "Kinh nghiệm tổ chức hậu cần trong các cuộc diễn tập lớn",
      abstractVn: "Chia sẻ kinh nghiệm thực tiễn trong tổ chức công tác hậu cần cho các cuộc diễn tập quy mô lớn, rút ra những bài học quý báu.",
      abstractEn: "Sharing practical experience in organizing logistics for large-scale exercises, drawing valuable lessons.",
      keywords: ["diễn tập", "tổ chức hậu cần", "kinh nghiệm"],
      categoryCode: "TTKN", 
      issueId: issue1.id
    },
    {
      title: "Lịch sử phát triển hậu cần Quân đội nhân dân Việt Nam",
      abstractVn: "Tổng quan lịch sử phát triển của hậu cần Quân đội nhân dân Việt Nam từ những ngày đầu thành lập đến nay, phân tích các giai đoạn phát triển quan trọng.",
      abstractEn: "Overview of the development history of Vietnam People's Army logistics from its early days to present, analyzing important development stages.",
      keywords: ["lịch sử", "hậu cần QĐNDVN", "phát triển"],
      categoryCode: "LSHK",
      issueId: issue1.id
    },
    {
      title: "Nghiên cứu công nghệ blockchain trong quản trị chuỗi cung ứng quân sự",
      abstractVn: "Nghiên cứu khả năng ứng dụng công nghệ blockchain để tăng cường tính minh bạch và bảo mật trong quản trị chuỗi cung ứng vật tư quân sự.",
      abstractEn: "Research on the potential application of blockchain technology to enhance transparency and security in military supply chain management.",
      keywords: ["blockchain", "chuỗi cung ứng", "bảo mật"],
      categoryCode: "KHKT",
      issueId: issue2.id
    },
    {
      title: "Quán triệt Nghị quyết số 28 về đổi mới công tác hậu cần",
      abstractVn: "Phân tích nội dung và ý nghĩa của Nghị quyết số 28 của Đảng về đổi mới công tác hậu cần, đề xuất các biện pháp triển khai thực hiện.",
      abstractEn: "Analysis of the content and significance of Party Resolution No. 28 on logistics reform, proposing implementation measures.",
      keywords: ["nghị quyết", "đổi mới", "triển khai"],
      categoryCode: "QTNQ",
      issueId: issue2.id
    },
    {
      title: "Âm mưu của các thế lực thù địch trong lĩnh vực hậu cần quân sự",
      abstractVn: "Phân tích các thủ đoạn, âm mưu của các thế lực thù địch nhằm phá hoại công tác hậu cần quân sự, đề xuất các biện pháp đấu tranh.",
      abstractEn: "Analysis of tactics and conspiracies of hostile forces aimed at sabotaging military logistics work, proposing countermeasures.",
      keywords: ["thế lực thù địch", "âm mưu", "đấu tranh"],
      categoryCode: "DBHB",
      issueId: issue2.id
    },
    {
      title: "Học tập và làm theo tư tưởng Hồ Chí Minh về hậu cần",
      abstractVn: "Nghiên cứu tư tưởng của Chủ tịch Hồ Chí Minh về công tác hậu cần, rút ra những bài học quý báu cho thời kỳ hiện tại.",
      abstractEn: "Study of President Ho Chi Minh's thoughts on logistics work, drawing valuable lessons for the current period.",
      keywords: ["Hồ Chí Minh", "tư tưởng", "hậu cần"],
      categoryCode: "HTDT",
      issueId: issue2.id
    },
    {
      title: "Truyền thống anh hùng của lực lượng hậu cần trong kháng chiến",
      abstractVn: "Ghi nhận và tôn vinh truyền thống anh hùng của lực lượng hậu cần Quân đội nhân dân Việt Nam trong các cuộc kháng chiến chống ngoại xâm.",
      abstractEn: "Recognition and honoring the heroic traditions of Vietnam People's Army logistics forces in resistance wars against foreign invaders.",
      keywords: ["truyền thống", "anh hùng", "kháng chiến"],
      categoryCode: "LSTT",
      issueId: issue2.id
    },
    {
      title: "Thông tin hoạt động hậu cần, kỹ thuật quý IV/2024",
      abstractVn: "Tổng hợp các hoạt động nổi bật của lực lượng hậu cần, kỹ thuật trong quý IV năm 2024, đánh giá kết quả và định hướng nhiệm vụ.",
      abstractEn: "Summary of outstanding activities of logistics and technical forces in Q4 2024, evaluating results and task orientation.",
      keywords: ["hoạt động", "quý IV", "tổng kết"],
      categoryCode: "TINTUC",
      issueId: issue2.id
    }
  ]

  for (let i = 0; i < sampleArticles.length; i++) {
    const article = sampleArticles[i]
    const category = categories.find(c => c.code === article.categoryCode)!
    const useAuthor = i % 2 === 0 ? author : author2

    // Tạo submission
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-${Date.now()}-${i}`,
        title: article.title,
        abstractVn: article.abstractVn,
        abstractEn: article.abstractEn,
        keywords: article.keywords,
        status: 'PUBLISHED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: useAuthor.id
      }
    })

    // Tạo submission version
    await prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNo: 1,
        filesetId: `fileset-${submission.id}-v1`,
        changelog: 'Phiên bản đầu tiên'
      }
    })

    // Tạo article
    await prisma.article.create({
      data: {
        submissionId: submission.id,
        issueId: article.issueId,
        pages: `${10 + i * 5}-${15 + i * 5}`,
        doiLocal: `10.59386/tapchi-hcqs.2024.${i + 1}`,
        htmlBody: `<div class="article-content">
          <h2>${article.title}</h2>
          <div class="abstract">
            <h3>Tóm tắt</h3>
            <p>${article.abstractVn}</p>
          </div>
          <div class="abstract">
            <h3>Abstract</h3>
            <p>${article.abstractEn}</p>
          </div>
          <div class="keywords">
            <strong>Từ khóa:</strong> ${article.keywords.join(', ')}
          </div>
          <div class="content">
            <p>Đây là nội dung mẫu cho bài báo. Trong thực tế, nội dung sẽ được soạn thảo chi tiết hơn...</p>
          </div>
        </div>`,
        publishedAt: new Date(),
        views: Math.floor(Math.random() * 500),
        downloads: Math.floor(Math.random() * 100)
      }
    })
  }

  // 6. Seed submissions đang trong quy trình (để dashboard có dữ liệu)
  console.log('📝 Seed submissions đang xử lý...')
  const reviewer = createdUsers.find(u => u.role === 'REVIEWER')!
  const editor = createdUsers.find(u => u.role === 'SECTION_EDITOR')!
  
  // Tạo 5 bài NEW (mới nộp, chưa xử lý)
  for (let i = 0; i < 5; i++) {
    const category = categories[i % categories.length]
    await prisma.submission.create({
      data: {
        code: `SUB-NEW-${Date.now()}-${i}`,
        title: `Bài nộp mới ${i + 1}: Nghiên cứu về ${category.name}`,
        abstractVn: `Đây là tóm tắt tiếng Việt cho bài nghiên cứu mới về ${category.name}. Bài viết phân tích các vấn đề quan trọng và đề xuất giải pháp khả thi.`,
        abstractEn: `This is the English abstract for the new research on ${category.name}. The article analyzes important issues and proposes feasible solutions.`,
        keywords: ['nghiên cứu', category.name.toLowerCase(), 'giải pháp'],
        status: 'NEW',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })
  }

  // Tạo 5 bài UNDER_REVIEW (đang phản biện)
  for (let i = 0; i < 5; i++) {
    const category = categories[(i + 5) % categories.length]
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-REVIEW-${Date.now()}-${i}`,
        title: `Bài đang phản biện ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt tiếng Việt cho bài viết về ${category.name}. Bài viết này đang được gửi đi phản biện.`,
        abstractEn: `English abstract for the article on ${category.name}. This article is under review.`,
        keywords: ['phản biện', category.name.toLowerCase(), 'đánh giá'],
        status: 'UNDER_REVIEW',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author2.id
      }
    })

    // Tạo submission version
    await prisma.submissionVersion.create({
      data: {
        submissionId: submission.id,
        versionNo: 1,
        filesetId: `fileset-${submission.id}-v1`,
        changelog: 'Phiên bản gửi phản biện'
      }
    })

    // Tạo 2 reviews cho mỗi submission (1 hoàn thành, 1 chưa)
    // Review 1 - Đã hoàn thành
    await prisma.review.create({
      data: {
        submissionId: submission.id,
        reviewerId: reviewer.id,
        roundNo: 1,
        recommendation: i % 2 === 0 ? 'MINOR' : 'ACCEPT',
        score: 8 + (i % 3),
        formJson: {
          comments: `Đây là nhận xét chi tiết của phản biện viên. Bài viết có chất lượng tốt, cần chỉnh sửa một số điểm nhỏ.`,
          strengths: 'Bài viết có cấu trúc rõ ràng, lập luận chặt chẽ.',
          weaknesses: 'Cần bổ sung thêm tài liệu tham khảo.',
          suggestions: 'Nên mở rộng phần thảo luận.'
        },
        submittedAt: new Date(Date.now() - (7 - i) * 24 * 60 * 60 * 1000) // 1-7 ngày trước
      }
    })

    // Review 2 - Chưa hoàn thành
    if (i < 3) {
      await prisma.review.create({
        data: {
          submissionId: submission.id,
          reviewerId: reviewer.id,
          roundNo: 1
          // Không có submittedAt, recommendation, score, comments - tức là chưa làm
        }
      })
    }
  }

  // Tạo 3 bài REVISION (cần sửa)
  for (let i = 0; i < 3; i++) {
    const category = categories[i]
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-REVISION-${Date.now()}-${i}`,
        title: `Bài cần chỉnh sửa ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết cần chỉnh sửa về ${category.name}.`,
        abstractEn: `Abstract for revision article on ${category.name}.`,
        keywords: ['chỉnh sửa', category.name.toLowerCase()],
        status: 'REVISION',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })

    // Tạo decision yêu cầu sửa
    await prisma.editorDecision.create({
      data: {
        submissionId: submission.id,
        decidedBy: editor.id,
        roundNo: 1,
        decision: 'MAJOR',
        note: 'Vui lòng chỉnh sửa theo các góp ý của phản biện viên.',
        decidedAt: new Date()
      }
    })
  }

  // Tạo 2 bài ACCEPTED (chấp nhận, chờ xuất bản)
  for (let i = 0; i < 2; i++) {
    const category = categories[i]
    await prisma.submission.create({
      data: {
        code: `SUB-ACCEPTED-${Date.now()}-${i}`,
        title: `Bài đã chấp nhận ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết đã được chấp nhận về ${category.name}.`,
        abstractEn: `Abstract for accepted article on ${category.name}.`,
        keywords: ['chấp nhận', category.name.toLowerCase()],
        status: 'ACCEPTED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author2.id
      }
    })
  }

  // Tạo 2 bài REJECTED (từ chối)
  for (let i = 0; i < 2; i++) {
    const category = categories[i]
    const submission = await prisma.submission.create({
      data: {
        code: `SUB-REJECTED-${Date.now()}-${i}`,
        title: `Bài bị từ chối ${i + 1}: ${category.name}`,
        abstractVn: `Tóm tắt cho bài viết bị từ chối về ${category.name}.`,
        abstractEn: `Abstract for rejected article on ${category.name}.`,
        keywords: ['từ chối', category.name.toLowerCase()],
        status: 'REJECTED',
        securityLevel: 'PUBLIC',
        categoryId: category.id,
        createdBy: author.id
      }
    })

    await prisma.editorDecision.create({
      data: {
        submissionId: submission.id,
        decidedBy: editor.id,
        roundNo: 1,
        decision: 'REJECT',
        note: 'Bài viết không đáp ứng yêu cầu của tạp chí.',
        decidedAt: new Date()
      }
    })
  }

  // 7. Tạo audit logs
  console.log('📋 Seed audit logs...')
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: author.id,
        action: 'Nộp bài mới',
        object: 'Submission SUB-NEW-1',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        actorId: editor.id,
        action: 'Gán phản biện',
        object: 'Submission SUB-REVIEW-1',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        actorId: reviewer.id,
        action: 'Hoàn thành phản biện',
        object: 'Review #1',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        actorId: editor.id,
        action: 'Quyết định chấp nhận',
        object: 'Submission SUB-ACCEPTED-1',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
      }
    ]
  })

  console.log('✅ Seed thành công!')
  console.log(`📚 Đã tạo ${categories.length} chuyên mục`)
  console.log(`👥 Đã tạo ${createdUsers.length} người dùng`)
  console.log(`📖 Đã tạo 2 số tạp chí`)
  console.log(`📰 Đã tạo ${sampleArticles.length} bài báo đã xuất bản`)
  console.log(`📝 Đã tạo 19 submissions đang xử lý (5 NEW, 5 UNDER_REVIEW, 3 REVISION, 2 ACCEPTED, 2 REJECTED, 2 IN_PRODUCTION)`)
  console.log(`⭐ Đã tạo 8 reviews`)
  console.log(`📋 Đã tạo audit logs`)
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
