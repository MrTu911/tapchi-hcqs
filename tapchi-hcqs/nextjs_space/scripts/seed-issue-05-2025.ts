
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Starting to seed Issue 05/2025...')

  // Find or create Volume 2025
  let volume = await prisma.volume.findFirst({
    where: { volumeNo: 54 }
  })

  if (!volume) {
    volume = await prisma.volume.create({
      data: {
        volumeNo: 54,
        year: 2025,
        title: 'Năm thứ 54 - 2025',
        description: 'Tập san năm 2025'
      }
    })
    console.log('✅ Created Volume 54/2025')
  }

  // Create Issue 05/2025
  const existingIssue = await prisma.issue.findFirst({
    where: {
      volumeId: volume.id,
      number: 5
    }
  })

  if (existingIssue) {
    console.log('⚠️ Issue 05/2025 already exists. Deleting and recreating...')
    // Delete articles first
    await prisma.article.deleteMany({
      where: { issueId: existingIssue.id }
    })
    // Delete issue
    await prisma.issue.delete({
      where: { id: existingIssue.id }
    })
    console.log('✅ Deleted old issue')
  }

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

  // Find default category
  let category = await prisma.category.findFirst({
    where: { code: 'LOGISTICS' }
  })

  if (!category) {
    category = await prisma.category.findFirst()
  }

  if (!category) {
    console.error('❌ No category found! Please seed categories first.')
    return
  }

  // Find existing submissions to reuse
  const existingSubmissions = await prisma.submission.findMany({
    where: { status: 'PUBLISHED' },
    take: 20
  })

  if (existingSubmissions.length === 0) {
    console.error('❌ No existing submissions found! Please run main seed first.')
    return
  }

  console.log(`✅ Found ${existingSubmissions.length} existing submissions to reuse`)

  // Articles data
  const articlesData = [
    {
      title: 'Tiếp tục xây dựng Học viện Hậu cần Anh hùng, xứng đáng với niềm tin của Đảng, Nhà nước, Quân đội và Nhân dân',
      authors: 'Đại tướng NGUYỄN TÂN CƯƠNG',
      pages: '3-6',
      abstract: 'Bài viết chào mừng Học viện Hậu cần đón nhận danh hiệu Anh hùng Lực lượng vũ trang nhân dân lần thứ 2, khẳng định truyền thống vẻ vang và phương hướng xây dựng đơn vị trong thời kỳ mới.'
    },
    {
      title: 'Học viện Hậu cần - Trung tâm giáo dục, đào tạo hậu cần, kỹ thuật, tài chính uy tín hàng đầu của quốc gia',
      authors: 'Thượng tướng HOÀNG XUÂN CHIẾN',
      pages: '7-12',
      abstract: 'Đánh giá vai trò, vị trí của Học viện Hậu cần trong hệ thống đào tạo quốc phòng, khẳng định những thành tựu đạt được và định hướng phát triển trong tương lai.'
    },
    {
      title: 'Phát huy truyền thống đơn vị Anh hùng trong thời kỳ đổi mới, đột phá đổi mới sáng tạo, xây dựng Học viện Hậu cần thông minh, hiện đại',
      authors: 'Trung tướng, GS.TS. PHAN TÙNG SƠN',
      pages: '13-18',
      abstract: 'Phân tích yêu cầu xây dựng Học viện Hậu cần thông minh, hiện đại trong bối cảnh cách mạng công nghiệp 4.0 và chuyển đổi số, đề xuất giải pháp phát triển đột phá.'
    },
    {
      title: 'Đột phá phát triển khoa học, công nghệ, đổi mới sáng tạo và chuyển đổi số góp phần thực hiện thắng lợi Nghị quyết Đảng bộ Học viện Hậu cần lần thứ XXIII, nhiệm kỳ 2025 - 2030',
      authors: 'Đại tá, PGS.TS. VŨ HỒNG HÀ',
      pages: '19-23',
      abstract: 'Đề xuất các giải pháp phát triển khoa học công nghệ, đổi mới sáng tạo và chuyển đổi số nhằm hiện đại hóa Học viện, nâng cao chất lượng đào tạo và nghiên cứu khoa học.'
    },
    {
      title: 'Bảo đảm hậu cần, kỹ thuật Chiến dịch tiến công Plei-Me - Kinh nghiệm và hướng kế thừa, phát triển',
      authors: 'Thiếu tướng NGUYỄN HÙNG THẮNG',
      pages: '24-28',
      abstract: 'Tổng kết kinh nghiệm bảo đảm hậu cần, kỹ thuật trong Chiến dịch Plei-Me, rút ra bài học lịch sử có ý nghĩa quan trọng cho công tác bảo đảm chiến dịch hiện đại.'
    },
    {
      title: 'Từ bảo đảm hậu cần Chiến dịch Plei-Me bàn về tạo lập thế trận hậu cần chiến dịch tiến công trong chiến tranh bảo vệ Tổ quốc',
      authors: 'Thượng tá, TS. LÊ ĐÌNH QUÂN',
      pages: '29-32',
      abstract: 'Nghiên cứu kinh nghiệm tạo lập thế trận hậu cần trong Chiến dịch Plei-Me, đề xuất vận dụng vào điều kiện chiến tranh bảo vệ Tổ quốc hiện nay.'
    },
    {
      title: 'Bàn về tổ chức, sử dụng lực lượng quân y trong xử trí thảm họa, thiên tai',
      authors: 'Thiếu tướng, GS.TS. NGUYỄN THẾ HOÀNG; Đại úy, ThS. TỐNG ĐỨC MINH',
      pages: '33-37',
      abstract: 'Phân tích vai trò, nhiệm vụ của lực lượng quân y trong công tác phòng chống thiên tai, đề xuất giải pháp nâng cao hiệu quả tổ chức, sử dụng lực lượng.'
    },
    {
      title: 'Một số giải pháp bảo đảm vật chất hậu cần cho lực lượng vũ trang địa phương tỉnh hoạt động tác chiến trong chiến dịch phòng ngự',
      authors: 'Đại tá, PGS.TS. NGUYỄN NGỌC SƠN',
      pages: '38-42',
      abstract: 'Nghiên cứu đặc điểm, yêu cầu bảo đảm vật chất hậu cần cho lực lượng vũ trang địa phương, đề xuất các giải pháp thiết thực trong chiến dịch phòng ngự.'
    },
    {
      title: 'Một số vấn đề về tạo nguồn vật chất hậu cần lữ đoàn tàu tên lửa tiến công nhóm tàu mặt nước chiến đấu địch phong tỏa đường biển Nam Trung Bộ',
      authors: 'Đại tá, TS. NGUYỄN QUỐC HOÀI',
      pages: '43-47',
      abstract: 'Phân tích yêu cầu tạo nguồn vật chất hậu cần cho lữ đoàn tàu tên lửa trong tác chiến chống phong tỏa đường biển, đề xuất giải pháp cụ thể.'
    },
    {
      title: 'Giải pháp phân cấp vận tải trung đoàn bộ binh vận động tiến công trong chiến tranh bảo vệ Tổ quốc',
      authors: 'Đại tá, TS. NGUYỄN THÀNH TRUNG',
      pages: '48-51',
      abstract: 'Nghiên cứu đặc điểm vận tải của trung đoàn bộ binh trong tác chiến tiến công, đề xuất phương án phân cấp vận tải hợp lý, hiệu quả.'
    },
    {
      title: 'Tổ chức, sử dụng lực lượng hậu cần - kỹ thuật tác chiến phòng thủ quân khu trong chiến tranh bảo vệ Tổ quốc',
      authors: 'Đại tá, PGS.TS. VŨ VĂN BÂN',
      pages: '52-55',
      abstract: 'Đề xuất mô hình tổ chức, cách thức sử dụng lực lượng hậu cần - kỹ thuật trong tác chiến phòng thủ quân khu nhằm đáp ứng yêu cầu tác chiến hiện đại.'
    },
    {
      title: 'Chuẩn bị quân nhu từ thời bình, sẵn sàng bảo đảm cho đánh địch giữ vững khu vực phòng thủ chủ yếu trong tác chiến phòng thủ quân khu',
      authors: 'Thượng tá, ThS. ĐỖ VIỆT HƯNG',
      pages: '56-59',
      abstract: 'Nghiên cứu nội dung, biện pháp chuẩn bị quân nhu từ thời bình, đảm bảo chủ động nguồn lực cho tác chiến phòng thủ quân khu.'
    },
    {
      title: 'Phát triển cơ sở hạ tầng giao thông khu vực phía Đông Bắc tỉnh Bắc Ninh tạo động lực phát triển kinh tế - xã hội và củng cố quốc phòng',
      authors: 'PGS.TS. LÊ HÙNG SƠN; PGS.TS. NGUYỄN HỒNG THÁI',
      pages: '60-63',
      abstract: 'Phân tích vai trò của hệ thống giao thông trong phát triển kinh tế và củng cố quốc phòng, đề xuất định hướng phát triển hạ tầng giao thông khu vực Bắc Ninh.'
    },
    {
      title: 'Nghệ thuật lập thế bảo đảm đánh trận then chốt tiêu diệt địch đổ bộ đường không trong chiến dịch phòng ngự',
      authors: 'Thượng tá, ThS. LÊ VĂN BẰNG',
      pages: '64-67',
      abstract: 'Nghiên cứu nguyên tắc, nội dung nghệ thuật lập thế bảo đảm hậu cần - kỹ thuật cho trận đánh địch đổ bộ đường không trong chiến dịch phòng ngự.'
    },
    {
      title: 'Phối hợp, hiệp đồng chặt chẽ, phát huy sức mạnh tổng hợp của các cấp, các ngành, địa phương, đơn vị trong hoàn thiện quy hoạch hệ thống căn cứ hậu cần - kỹ thuật quân khu',
      authors: 'Thượng tá, ThS. VŨ THANH HẢI',
      pages: '68-71',
      abstract: 'Đề xuất giải pháp tăng cường phối hợp liên ngành trong quy hoạch, xây dựng hệ thống căn cứ hậu cần - kỹ thuật quân khu.'
    },
    {
      title: 'Nâng cao năng lực giải ngân các dự án trong Bộ Quốc phòng',
      authors: 'Trung tá, ThS. NGUYỄN NHẬT HÙNG',
      pages: '72-76',
      abstract: 'Phân tích thực trạng giải ngân dự án đầu tư trong Bộ Quốc phòng, đề xuất giải pháp nâng cao hiệu quả và tiến độ giải ngân.'
    },
    {
      title: 'Biện pháp tạo nguồn vật chất hậu cần, kỹ thuật thường xuyên cho lực lượng hải quân trên các đảo xa bờ',
      authors: 'Thiếu tá, CN. NGUYỄN HUY VĨ',
      pages: '77-80',
      abstract: 'Nghiên cứu đặc thù bảo đảm hậu cần cho lực lượng đóng quân trên các đảo xa, đề xuất các biện pháp tạo nguồn và vận chuyển hiệu quả.'
    },
    {
      title: 'Nâng cao tính chủ động của giảng viên trước yêu cầu đổi mới công tác giảng dạy lý luận chính trị cho cán bộ hậu cần - kỹ thuật quân đội',
      authors: 'Trung tá, ThS. TRƯƠNG TRÍ DŨNG',
      pages: '81-84',
      abstract: 'Phân tích yêu cầu đổi mới phương pháp giảng dạy lý luận chính trị, đề xuất giải pháp nâng cao năng lực sư phạm của giảng viên.'
    },
    {
      title: 'Bảo vệ hậu cần, kỹ thuật trung đoàn bộ binh cơ giới tham gia trận then chốt đánh địch đổ bộ đường không trong chiến dịch tiến công',
      authors: 'Trung tá, TS. NGUYỄN ĐỨC TÚ',
      pages: '85-88',
      abstract: 'Nghiên cứu yêu cầu bảo vệ hậu cần - kỹ thuật trong tác chiến tiến công, đề xuất giải pháp tổ chức lực lượng và phương án bảo vệ.'
    },
    {
      title: 'Một số vấn đề về tổ chức vận tải cơ giới chiến dịch tiến công trong tác chiến phòng thủ quân khu',
      authors: 'Thượng tá, TS. TRỊNH TIẾN THÀNH',
      pages: '89-92',
      abstract: 'Phân tích đặc điểm tổ chức vận tải cơ giới trong chiến dịch, đề xuất mô hình và phương án tổ chức phù hợp với điều kiện thực tế.'
    }
  ]

  // Create articles using existing submissions (without updating them)
  for (const [index, articleData] of articlesData.entries()) {
    if (index >= existingSubmissions.length) {
      console.log(`⚠️ Not enough existing submissions, stopping at ${index} articles`)
      break
    }
    
    const submission = existingSubmissions[index]
    
    // Check if article already exists for this submission
    const existingArticle = await prisma.article.findUnique({
      where: { submissionId: submission.id }
    })
    
    if (existingArticle) {
      // Update existing article
      await prisma.article.update({
        where: { id: existingArticle.id },
        data: {
          issueId: issue.id,
          pages: articleData.pages,
          doiLocal: `10.54939/hcqs.235.${String(index + 1).padStart(2, '0')}`,
          publishedAt: new Date('2025-10-01')
        }
      })
      console.log(`  ✅ Updated article ${index + 1} (${submission.title.substring(0, 50)}...)`)
    } else {
      // Create new article
      await prisma.article.create({
        data: {
          submissionId: submission.id,
          issueId: issue.id,
          pages: articleData.pages,
          doiLocal: `10.54939/hcqs.235.${String(index + 1).padStart(2, '0')}`,
          publishedAt: new Date('2025-10-01')
        }
      })
      console.log(`  ✅ Created article ${index + 1} (${submission.title.substring(0, 50)}...)`)
    }
  }

  console.log(`\n🎉 Successfully seeded Issue 05/2025 with ${articlesData.length} articles!`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
