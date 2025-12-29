import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Tạo bài nộp mới để test review...\n');
  
  // Get authors
  const authors = await prisma.user.findMany({
    where: {
      role: 'AUTHOR'
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });
  
  if (authors.length === 0) {
    console.log('❌ Không có tác giả nào trong hệ thống!');
    return;
  }
  
  // Get a category
  const category = await prisma.category.findFirst();
  
  if (!category) {
    console.log('❌ Không có danh mục nào!');
    return;
  }
  
  const testSubmissions = [
    {
      title: 'Nghiên cứu ứng dụng trí tuệ nhân tạo trong quản lý hậu cần quân sự',
      abstractVn: 'Bài báo nghiên cứu về ứng dụng công nghệ AI và machine learning trong tối ưu hóa hệ thống quản lý hậu cần quân sự, giúp nâng cao hiệu quả và độ chính xác.',
      abstractEn: 'This paper studies the application of AI and machine learning in optimizing military logistics management systems.',
      keywords: 'trí tuệ nhân tạo, hậu cần quân sự, machine learning, tối ưu hóa',
      status: 'NEW'
    },
    {
      title: 'Phân tích chiến lược chuỗi cung ứng trong hoạt động quân sự hiện đại',
      abstractVn: 'Nghiên cứu về các mô hình chuỗi cung ứng tiên tiến và ứng dụng trong điều kiện hoạt động quân sự đặc thù của Việt Nam.',
      abstractEn: 'Research on advanced supply chain models and their application in Vietnam military operations.',
      keywords: 'chuỗi cung ứng, chiến lược, quân sự, logistics',
      status: 'UNDER_REVIEW'
    },
    {
      title: 'Đánh giá hiệu quả hệ thống thông tin quản lý tại các đơn vị hậu cần',
      abstractVn: 'Bài báo đánh giá thực trạng và đề xuất giải pháp nâng cao hiệu quả hệ thống thông tin quản lý tại các đơn vị hậu cần quân đội.',
      abstractEn: 'Evaluation and solutions for improving information management systems in military logistics units.',
      keywords: 'hệ thống thông tin, quản lý, hậu cần, hiệu quả',
      status: 'NEW'
    },
    {
      title: 'Nghiên cứu mô hình dự báo nhu cầu vật tư kỹ thuật quân sự',
      abstractVn: 'Xây dựng mô hình toán học để dự báo nhu cầu vật tư kỹ thuật, góp phần tối ưu hóa việc dự trữ và phân phối.',
      abstractEn: 'Mathematical model for forecasting military equipment needs to optimize storage and distribution.',
      keywords: 'dự báo, vật tư kỹ thuật, mô hình toán học, tối ưu hóa',
      status: 'UNDER_REVIEW'
    },
    {
      title: 'Ứng dụng công nghệ blockchain trong quản lý chuỗi cung ứng quân sự',
      abstractVn: 'Nghiên cứu khả năng ứng dụng công nghệ blockchain để tăng cường tính minh bạch và bảo mật trong chuỗi cung ứng quân sự.',
      abstractEn: 'Study on blockchain technology application for transparency and security in military supply chain.',
      keywords: 'blockchain, chuỗi cung ứng, bảo mật, minh bạch',
      status: 'NEW'
    }
  ];
  
  console.log('═'.repeat(80));
  console.log('  TẠO BÀI NỘP MỚI');
  console.log('═'.repeat(80));
  
  for (let i = 0; i < testSubmissions.length; i++) {
    const submissionData = testSubmissions[i];
    const author = authors[i % authors.length];
    
    // Generate unique code
    const date = new Date();
    const code = `HCQS-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-TEST${String(i + 1).padStart(3, '0')}`;
    
    const submission = await prisma.submission.create({
      data: {
        code,
        title: submissionData.title,
        abstractVn: submissionData.abstractVn,
        abstractEn: submissionData.abstractEn,
        keywords: submissionData.keywords.split(', '),
        createdBy: author.id,
        categoryId: category.id,
        status: submissionData.status as any
      }
    });
    
    console.log(`\n✅ Bài nộp ${i + 1}: ${submission.title}`);
    console.log(`   Mã: ${submission.code}`);
    console.log(`   Tác giả: ${author.fullName}`);
    console.log(`   Trạng thái: ${submission.status}`);
  }
  
  console.log('\n' + '═'.repeat(80));
  console.log(`✅ Đã tạo ${testSubmissions.length} bài nộp mới thành công!`);
  console.log('═'.repeat(80));
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
