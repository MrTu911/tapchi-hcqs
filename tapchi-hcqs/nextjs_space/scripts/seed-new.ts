import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// 11 chuyên mục chính thức
const CATEGORIES = [
  { code: "CDHD", name: "Chỉ đạo - Hướng dẫn", description: "Các văn bản chỉ đạo, hướng dẫn về công tác hậu cần quân sự" },
  { code: "NVDC", name: "Những vấn đề chung", description: "Các vấn đề chung về lý luận và thực tiễn hậu cần quân sự" },
  { code: "NCTD", name: "Nghiên cứu - Trao đổi", description: "Các bài nghiên cứu khoa học và trao đổi học thuật" },
  { code: "TTKN", name: "Thực tiễn - Kinh nghiệm", description: "Chia sẻ thực tiễn và kinh nghiệm trong công tác hậu cần" },
  { code: "LSHK", name: "Lịch sử hậu cần, kỹ thuật quân sự", description: "Nghiên cứu lịch sử phát triển hậu cần và kỹ thuật quân sự" },
  { code: "KHKT", name: "Khoa học kỹ thuật hậu cần", description: "Các nghiên cứu khoa học kỹ thuật trong lĩnh vực hậu cần" },
  { code: "QTNQ", name: "Quán triệt các nghị quyết của Đảng", description: "Tuyên truyền và quán triệt các nghị quyết của Đảng" },
  { code: "DBHB", name: "Làm thất bại chiến lược \"Diễn biến hoà bình\"", description: "Đấu tranh chống các thế lực thù địch và chiến lược diễn biến hòa bình" },
  { code: "HTDT", name: "Học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh",  description: "Học tập và làm theo tấm gương đạo đức Hồ Chí Minh" },
  { code: "LSTT", name: "Lịch sử - Truyền thống", description: "Nghiên cứu lịch sử và truyền thống cách mạng" },
  { code: "TINTUC", name: "Tin tức - Thông tin hoạt động hậu cần, kỹ thuật toàn quân", description: "Tin tức và thông tin về các hoạt động hậu cần, kỹ thuật" }
]

// Users với mật khẩu mạnh
const USERS = [
  { email: "admin@tapchi.mil.vn", password: "Admin@2025", fullName: "Quản trị hệ thống", org: "Học viện Hậu cần", role: "SYSADMIN" },
  { email: "editor@tapchi.mil.vn", password: "Editor@2025", fullName: "Biên tập viên chính", org: "Học viện Hậu cần", role: "SECTION_EDITOR" },
  { email: "author@tapchi.mil.vn", password: "Author@2025", fullName: "Tác giả mẫu", org: "Học viện Hậu cần", role: "AUTHOR" },
  { email: "reviewer@tapchi.mil.vn", password: "Reviewer@2025", fullName: "Phản biện viên", org: "Đại học Quốc phòng", role: "REVIEWER" },
  { email: "eic@tapchi.mil.vn", password: "EIC@2025", fullName: "Tổng biên tập", org: "Học viện Hậu cần", role: "EIC" },
  { email: "managing@tapchi.mil.vn", password: "Managing@2025", fullName: "Thư ký tòa soạn", org: "Học viện Hậu cần", role: "MANAGING_EDITOR" }
]

// Articles data cho Số 05/2025
const ARTICLES_DATA = [
  {
    title: 'Tiếp tục xây dựng Học viện Hậu cần Anh hùng, xứng đáng với niềm tin của Đảng, Nhà nước, Quân đội và Nhân dân',
    authors: 'Đại tướng NGUYỄN TÂN CƯƠNG',
    pages: '3-6',
    abstract: 'Bài viết chào mừng Học viện Hậu cần đón nhận danh hiệu Anh hùng Lực lượng vũ trang nhân dân lần thứ 2, khẳng định truyền thống vẻ vang và phương hướng xây dựng đơn vị trong thời kỳ mới.',
    keywords: ['Học viện Hậu cần', 'Anh hùng', 'Truyền thống', 'Xây dựng đơn vị']
  },
  {
    title: 'Học viện Hậu cần - Trung tâm giáo dục, đào tạo hậu cần, kỹ thuật, tài chính uy tín hàng đầu của quốc gia',
    authors: 'Thượng tướng HOÀNG XUÂN CHIẾN',
    pages: '7-12',
    abstract: 'Đánh giá vai trò, vị trí của Học viện Hậu cần trong hệ thống đào tạo quốc phòng, khẳng định những thành tựu đạt được và định hướng phát triển trong tương lai.',
    keywords: ['Học viện Hậu cần', 'Đào tạo', 'Giáo dục quốc phòng', 'Hậu cần']
  },
  {
    title: 'Phát huy truyền thống đơn vị Anh hùng trong thời kỳ đổi mới, đột phá đổi mới sáng tạo, xây dựng Học viện Hậu cần thông minh, hiện đại',
    authors: 'Trung tướng, GS.TS. PHAN TÙNG SƠN',
    pages: '13-18',
    abstract: 'Phân tích yêu cầu xây dựng Học viện Hậu cần thông minh, hiện đại trong bối cảnh cách mạng công nghiệp 4.0 và chuyển đổi số, đề xuất giải pháp phát triển đột phá.',
    keywords: ['Chuyển đổi số', 'Học viện thông minh', 'Đổi mới sáng tạo', 'Công nghiệp 4.0']
  },
  {
    title: 'Đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số góp phần thực hiện thắng lợi Nghị quyết Đảng bộ Học viện Hậu cần lần thứ XXIII, nhiệm kỳ 2025 - 2030',
    authors: 'Đại tá, PGS.TS. VŨ HỒNG HÀ',
    pages: '19-23',
    abstract: 'Đề xuất các giải pháp phát triển khoa học công nghệ, đổi mới sáng tạo và chuyển đổi số nhằm hiện đại hóa Học viện, nâng cao chất lượng đào tạo và nghiên cứu khoa học.',
    keywords: ['Khoa học công nghệ', 'Đổi mới sáng tạo', 'Chuyển đổi số', 'Nghị quyết Đảng bộ']
  },
  {
    title: 'Bảo đảm hậu cần, kỹ thuật Chiến dịch tiến công Plei-Me - Kinh nghiệm và hướng kế thừa, phát triển',
    authors: 'Thiếu tướng NGUYỄN HÙNG THẮNG',
    pages: '24-28',
    abstract: 'Tổng kết kinh nghiệm bảo đảm hậu cần, kỹ thuật trong Chiến dịch Plei-Me, rút ra bài học lịch sử có ý nghĩa quan trọng cho công tác bảo đảm chiến dịch hiện đại.',
    keywords: ['Chiến dịch Plei-Me', 'Bảo đảm hậu cần', 'Kinh nghiệm lịch sử', 'Chiến tranh nhân dân']
  },
  {
    title: 'Từ bảo đảm hậu cần Chiến dịch Plei-Me bàn về tạo lập thế trận hậu cần chiến dịch tiến công trong chiến tranh bảo vệ Tổ quốc',
    authors: 'Thượng tá, TS. LÊ ĐÌNH QUÂN',
    pages: '29-32',
    abstract: 'Nghiên cứu kinh nghiệm tạo lập thế trận hậu cần trong Chiến dịch Plei-Me, đề xuất vận dụng vào điều kiện chiến tranh bảo vệ Tổ quốc hiện nay.',
    keywords: ['Thế trận hậu cần', 'Chiến dịch tiến công', 'Bảo vệ Tổ quốc', 'Chiến dịch Plei-Me']
  },
  {
    title: 'Bàn về tổ chức, sử dụng lực lượng quân y trong xử trí thảm họa, thiên tai',
    authors: 'Thiếu tướng, GS.TS. NGUYỄN THẾ HOÀNG; Đại úy, ThS. TỐNG ĐỨC MINH',
    pages: '33-37',
    abstract: 'Phân tích vai trò, nhiệm vụ của lực lượng quân y trong công tác phòng chống thiên tai, đề xuất giải pháp nâng cao hiệu quả tổ chức, sử dụng lực lượng.',
    keywords: ['Quân y', 'Thiên tai', 'Thảm họa', 'Cứu hộ cứu nạn']
  },
  {
    title: 'Một số giải pháp bảo đảm vật chất hậu cần cho lực lượng vũ trang địa phương tỉnh hoạt động tác chiến trong chiến dịch phòng ngự',
    authors: 'Đại tá, PGS.TS. NGUYỄN NGỌC SƠN',
    pages: '38-42',
    abstract: 'Nghiên cứu đặc điểm, yêu cầu bảo đảm vật chất hậu cần cho lực lượng vũ trang địa phương, đề xuất các giải pháp thiết thực trong chiến dịch phòng ngự.',
    keywords: ['Lực lượng địa phương', 'Bảo đảm hậu cần', 'Chiến dịch phòng ngự', 'Vật chất hậu cần']
  },
  {
    title: 'Một số vấn đề về tạo nguồn vật chất hậu cần lữ đoàn tàu tên lửa tiến công nhóm tàu mặt nước chiến đấu địch phong tỏa đường biển Nam Trung Bộ',
    authors: 'Đại tá, TS. NGUYỄN QUỐC HOÀI',
    pages: '43-47',
    abstract: 'Phân tích yêu cầu tạo nguồn vật chất hậu cần cho lữ đoàn tàu tên lửa trong tác chiến chống phong tỏa đường biển, đề xuất giải pháp cụ thể.',
    keywords: ['Hải quân', 'Tàu tên lửa', 'Phòng thủ biển đảo', 'Hậu cần hải quân']
  },
  {
    title: 'Giải pháp phân cấp vận tải trung đoàn bộ binh vận động tiến công trong chiến tranh bảo vệ Tổ quốc',
    authors: 'Đại tá, TS. NGUYỄN THÀNH TRUNG',
    pages: '48-51',
    abstract: 'Nghiên cứu đặc điểm vận tải của trung đoàn bộ binh trong tác chiến tiến công, đề xuất phương án phân cấp vận tải hợp lý, hiệu quả.',
    keywords: ['Vận tải quân sự', 'Bộ binh', 'Tác chiến tiến công', 'Phân cấp vận tải']
  },
  {
    title: 'Tổ chức, sử dụng lực lượng hậu cần - kỹ thuật tác chiến phòng thủ quân khu trong chiến tranh bảo vệ Tổ quốc',
    authors: 'Đại tá, PGS.TS. VŨ VĂN BÂN',
    pages: '52-55',
    abstract: 'Đề xuất mô hình tổ chức, cách thức sử dụng lực lượng hậu cần - kỹ thuật trong tác chiến phòng thủ quân khu nhằm đáp ứng yêu cầu tác chiến hiện đại.',
    keywords: ['Hậu cần kỹ thuật', 'Phòng thủ quân khu', 'Tổ chức lực lượng', 'Tác chiến']
  },
  {
    title: 'Chuẩn bị quân nhu từ thời bình, sẵn sàng bảo đảm cho đánh địch giữ vững khu vực phòng thủ chủ yếu trong tác chiến phòng thủ quân khu',
    authors: 'Thượng tá, ThS. ĐỖ VIỆT HƯNG',
    pages: '56-59',
    abstract: 'Nghiên cứu nội dung, biện pháp chuẩn bị quân nhu từ thời bình, đảm bảo chủ động nguồn lực cho tác chiến phòng thủ quân khu.',
    keywords: ['Quân nhu', 'Chuẩn bị chiến đấu', 'Phòng thủ', 'Thời bình']
  },
  {
    title: 'Phát triển cơ sở hạ tầng giao thông khu vực phía Đông Bắc tỉnh Bắc Ninh tạo động lực phát triển kinh tế - xã hội và củng cố quốc phòng',
    authors: 'PGS.TS. LÊ HÙNG SƠN; PGS.TS. NGUYỄN HỒNG THÁI',
    pages: '60-63',
    abstract: 'Phân tích vai trò của hệ thống giao thông trong phát triển kinh tế và củng cố quốc phòng, đề xuất định hướng phát triển hạ tầng giao thông khu vực Bắc Ninh.',
    keywords: ['Hạ tầng giao thông', 'Phát triển kinh tế', 'Quốc phòng', 'Bắc Ninh']
  },
  {
    title: 'Nghệ thuật lập thế bảo đảm đánh trận then chốt tiêu diệt địch đổ bộ đường không trong chiến dịch phòng ngự',
    authors: 'Thượng tá, ThS. LÊ VĂN BẰNG',
    pages: '64-67',
    abstract: 'Nghiên cứu nguyên tắc, nội dung nghệ thuật lập thế bảo đảm hậu cần - kỹ thuật cho trận đánh địch đổ bộ đường không trong chiến dịch phòng ngự.',
    keywords: ['Nghệ thuật quân sự', 'Phòng không', 'Đổ bộ đường không', 'Chiến dịch phòng ngự']
  },
  {
    title: 'Phối hợp, hiệp đồng chặt chẽ, phát huy sức mạnh tổng hợp của các cấp, các ngành, địa phương, đơn vị trong hoàn thiện quy hoạch hệ thống căn cứ hậu cần - kỹ thuật quân khu',
    authors: 'Thượng tá, ThS. VŨ THANH HẢI',
    pages: '68-71',
    abstract: 'Đề xuất giải pháp tăng cường phối hợp liên ngành trong quy hoạch, xây dựng hệ thống căn cứ hậu cần - kỹ thuật quân khu.',
    keywords: ['Quy hoạch', 'Căn cứ hậu cần', 'Phối hợp liên ngành', 'Quân khu']
  },
  {
    title: 'Nâng cao năng lực giải ngân các dự án trong Bộ Quốc phòng',
    authors: 'Trung tá, ThS. NGUYỄN NHẬT HÙNG',
    pages: '72-76',
    abstract: 'Phân tích thực trạng giải ngân dự án đầu tư trong Bộ Quốc phòng, đề xuất giải pháp nâng cao hiệu quả và tiến độ giải ngân.',
    keywords: ['Giải ngân', 'Dự án đầu tư', 'Quốc phòng', 'Quản lý tài chính']
  },
  {
    title: 'Biện pháp tạo nguồn vật chất hậu cần, kỹ thuật thường xuyên cho lực lượng hải quân trên các đảo xa bờ',
    authors: 'Thiếu tá, CN. NGUYỄN HUY VĨ',
    pages: '77-80',
    abstract: 'Nghiên cứu đặc thù bảo đảm hậu cần cho lực lượng đóng quân trên các đảo xa, đề xuất các biện pháp tạo nguồn và vận chuyển hiệu quả.',
    keywords: ['Hải quân', 'Đảo xa bờ', 'Biển đảo', 'Hậu cần hải quân']
  },
  {
    title: 'Nâng cao tính chủ động của giảng viên trước yêu cầu đổi mới công tác giảng dạy lý luận chính trị cho cán bộ hậu cần - kỹ thuật quân đội',
    authors: 'Trung tá, ThS. TRƯƠNG TRÍ DŨNG',
    pages: '81-84',
    abstract: 'Phân tích yêu cầu đổi mới phương pháp giảng dạy lý luận chính trị, đề xuất giải pháp nâng cao năng lực sư phạm của giảng viên.',
    keywords: ['Giảng dạy', 'Lý luận chính trị', 'Đào tạo', 'Đổi mới phương pháp']
  },
  {
    title: 'Bảo vệ hậu cần, kỹ thuật trung đoàn bộ binh cơ giới tham gia trận then chốt đánh địch đổ bộ đường không trong chiến dịch tiến công',
    authors: 'Trung tá, TS. NGUYỄN ĐỨC TÚ',
    pages: '85-88',
    abstract: 'Nghiên cứu yêu cầu bảo vệ hậu cần - kỹ thuật trong tác chiến tiến công, đề xuất giải pháp tổ chức lực lượng và phương án bảo vệ.',
    keywords: ['Bảo vệ hậu cần', 'Bộ binh cơ giới', 'Tác chiến tiến công', 'An ninh hậu cần']
  },
  {
    title: 'Một số vấn đề về tổ chức vận tải cơ giới chiến dịch tiến công trong tác chiến phòng thủ quân khu',
    authors: 'Thượng tá, TS. TRỊNH TIẾN THÀNH',
    pages: '89-92',
    abstract: 'Phân tích đặc điểm tổ chức vận tải cơ giới trong chiến dịch, đề xuất mô hình và phương án tổ chức phù hợp với điều kiện thực tế.',
    keywords: ['Vận tải cơ giới', 'Chiến dịch tiến công', 'Phòng thủ quân khu', 'Tổ chức vận tải']
  }
]

async function main() {
  console.log('🚀 Starting comprehensive database seeding...')

  // 1. Seed Categories
  console.log('\n📁 Seeding Categories...')
  for (const cat of CATEGORIES) {
    const slug = cat.code.toLowerCase()
    await prisma.category.upsert({
      where: { code: cat.code },
      update: { name: cat.name, description: cat.description, slug },
      create: { ...cat, slug }
    })
  }
  console.log(`✅ Created ${CATEGORIES.length} categories`)

  // 2. Seed Users
  console.log('\n👥 Seeding Users...')
  const createdUsers = []
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: { fullName: user.fullName, org: user.org, role: user.role as any, passwordHash },
      create: {
        email: user.email,
        fullName: user.fullName,
        org: user.org,
        role: user.role as any,
        passwordHash,
        isActive: true
      }
    })
    createdUsers.push(createdUser)
    console.log(`  ✅ ${user.email} (${user.role})`)
  }

  // 3. Create Volume and Issue
  console.log('\n📚 Creating Volume and Issue 05/2025...')
  const volume = await prisma.volume.upsert({
    where: { volumeNo: 54 },
    update: { year: 2025, title: 'Năm thứ 54 - 2025' },
    create: {
      volumeNo: 54,
      year: 2025,
      title: 'Năm thứ 54 - 2025',
      description: 'Tập san năm 2025'
    }
  })

  const issue = await prisma.issue.create({
    data: {
      volumeId: volume.id,
      number: 5,
      year: 2025,
      title: 'Số 5 (235) - Tháng 10/2025',
      publishDate: new Date('2025-10-01'),
      coverImage: '/images/issues/2025/issue-05-2025-cover.png',
      doi: '10.54939/hcqs.235',
      description: 'Chào mừng Học viện Hậu cần đón nhận danh hiệu Anh hùng Lực lượng vũ trang nhân dân (lần 2) và tổ chức thành công Đại hội đại biểu Đảng bộ Học viện Hậu cần lần thứ XXIII, nhiệm kỳ 2025 - 2030. Kỷ niệm 60 năm Chiến thắng Plei-Me (26/11/1965 - 26/11/2025)',
      status: 'PUBLISHED'
    }
  })
  console.log(`✅ Created Issue: ${issue.title}`)

  // 4. Create Submissions and Articles
  console.log('\n📝 Creating Submissions and Articles...')
  const defaultCategory = await prisma.category.findFirst({ where: { code: 'NCTD' } })
  const authorUser = createdUsers.find(u => u.role === 'AUTHOR') || createdUsers[0]

  for (const [index, articleData] of ARTICLES_DATA.entries()) {
    // Create submission
    const submission = await prisma.submission.create({
      data: {
        code: `HCQS-20250901-${String(index + 1).padStart(3, '0')}`,
        title: articleData.title,
        abstractVn: articleData.abstract,
        abstractEn: articleData.abstract,
        keywords: articleData.keywords,
        categoryId: defaultCategory!.id,
        createdBy: authorUser.id,
        status: 'PUBLISHED',
        createdAt: new Date('2025-09-01')
      }
    })

    // Create article
    await prisma.article.create({
      data: {
        submissionId: submission.id,
        issueId: issue.id,
        pages: articleData.pages,
        doiLocal: `10.54939/hcqs.235.${String(index + 1).padStart(2, '0')}`,
        publishedAt: new Date('2025-10-01')
      }
    })

    console.log(`  ✅ Article ${index + 1}: ${submission.title.substring(0, 60)}...`)
  }

  // 5. Create CMS Data
  console.log('\n🎨 Creating CMS Data...')
  
  // Banners
  await prisma.banner.createMany({
    data: [
      {
        title: 'Banner chính trang chủ',
        imageUrl: '/banner2.png',
        linkUrl: '/',
        position: 1,
        isActive: true
      },
      {
        title: 'Banner thứ hai',
        imageUrl: '/banner3.png',
        linkUrl: '/issues',
        position: 2,
        isActive: true
      }
    ]
  })

  // News
  const adminUser = createdUsers.find(u => u.role === 'SYSADMIN')!
  await prisma.news.createMany({
    data: [
      {
        title: 'Học viện Hậu cần đón nhận danh hiệu Anh hùng Lực lượng vũ trang nhân dân lần thứ 2',
        slug: 'hoc-vien-hau-can-anh-hung-lan-2',
        summary: 'Ngày 15 tháng 9 năm 2025, Học viện Hậu cần vinh dự đón nhận Huân chương Sao Vàng và danh hiệu Anh hùng Lực lượng vũ trang nhân dân lần thứ 2.',
        content: '<p>Sáng ngày 15/9/2025, tại Hội trường lớn Học viện Hậu cần, đã diễn ra Lễ công bố Quyết định của Chủ tịch nước trao tặng Huân chương Sao Vàng và danh hiệu Anh hùng Lực lượng vũ trang nhân dân lần thứ 2...</p>',
        authorId: adminUser.id,
        isPublished: true,
        publishedAt: new Date('2025-09-15')
      },
      {
        title: 'Kỷ niệm 60 năm Chiến thắng Plei-Me (1965-2025)',
        slug: 'ky-niem-60-nam-chien-thang-plei-me',
        summary: 'Chiến thắng Plei-Me là một trong những chiến thắng quan trọng, mở đầu cho chiến dịch Tây Nguyên mùa khô 1965-1966.',
        content: '<p>Nhân dịp kỷ niệm 60 năm Chiến thắng Plei-Me, Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự xuất bản chuyên đề đặc biệt với các bài viết về kinh nghiệm bảo đảm hậu cần trong chiến dịch...</p>',
        authorId: adminUser.id,
        isPublished: true,
        publishedAt: new Date('2025-11-01')
      }
    ]
  })

  // Page Blocks
  await prisma.pageBlock.createMany({
    data: [
      {
        key: 'hero-section',
        title: 'Phần giới thiệu chính',
        content: '<h1>Tạp chí Nghiên cứu Khoa học Hậu cần Quân sự</h1><p>Tạp chí chuyên ngành về lĩnh vực hậu cần quân sự</p>',
        blockType: 'hero',
        order: 1,
        isActive: true
      }
    ]
  })

  console.log('✅ CMS data created')

  console.log('\n🎉 Database seeding completed successfully!')
  console.log(`\n📊 Summary:`)
  console.log(`   - Categories: ${CATEGORIES.length}`)
  console.log(`   - Users: ${USERS.length}`)
  console.log(`   - Articles: ${ARTICLES_DATA.length}`)
  console.log(`   - Issue: Số 5 (235) - Tháng 10/2025`)
  console.log(`\n🔐 Test Accounts (mật khẩu: [role]@2025):`)
  USERS.forEach(u => console.log(`   - ${u.email} (${u.role})`))
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
