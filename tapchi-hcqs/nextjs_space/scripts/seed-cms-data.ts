
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CMS data...');

  // Find a SYSADMIN user to be the author
  const admin = await prisma.user.findFirst({
    where: {
      role: 'SYSADMIN',
    },
  });

  if (!admin) {
    console.error('❌ No SYSADMIN user found. Please create one first.');
    return;
  }

  // 1. Seed Banners
  console.log('📸 Creating banners...');
  
  const banners = [
    {
      title: 'Chào mừng đến với Tạp chí điện tử Hậu cần Quân sự',
      titleEn: 'Welcome to Journal of Military Logistics',
      subtitle: 'Nền tảng xuất bản khoa học uy tín trong lĩnh vực hậu cần quân sự',
      subtitleEn: 'Prestigious scientific publishing platform in military logistics',
      imageUrl: '/banner.png',
      buttonText: 'Xem thêm',
      buttonTextEn: 'Learn more',
      linkUrl: '/about',
      position: 0,
      isActive: true,
    },
    {
      title: 'Call for Papers - Số mới nhất',
      titleEn: 'Call for Papers - Latest Issue',
      subtitle: 'Chúng tôi đang nhận bài cho số tạp chí sắp tới. Hạn chót nộp bài: 31/12/2025',
      subtitleEn: 'We are accepting submissions for the upcoming issue. Deadline: 31/12/2025',
      imageUrl: '/banner2.png',
      buttonText: 'Nộp bài ngay',
      buttonTextEn: 'Submit now',
      linkUrl: '/dashboard/author/submit',
      position: 1,
      isActive: true,
    },
    {
      title: 'Tạp chí được Index trên các cơ sở dữ liệu quốc tế',
      titleEn: 'Journal Indexed in International Databases',
      subtitle: 'Tạp chí đã được công nhận bởi Scopus, Web of Science và Google Scholar',
      subtitleEn: 'Recognized by Scopus, Web of Science and Google Scholar',
      imageUrl: '/banner3.png',
      position: 2,
      isActive: true,
    },
  ];

  for (const banner of banners) {
    await prisma.banner.upsert({
      where: { id: `banner-${banner.position}` },
      update: banner,
      create: {
        id: `banner-${banner.position}`,
        ...banner,
      },
    });
  }

  console.log(`✅ Created ${banners.length} banners`);

  // 2. Seed News
  console.log('📰 Creating news articles...');

  const newsArticles = [
    {
      slug: 'thong-bao-nhan-bai-so-moi-2025',
      title: 'Thông báo nhận bài cho số tạp chí tháng 12/2025',
      titleEn: 'Call for Papers - December 2025 Issue',
      summary: 'Tạp chí điện tử Khoa học Hậu cần Quân sự thông báo nhận bài viết cho số xuất bản tháng 12/2025. Chủ đề ưu tiên: Công nghệ số trong hậu cần, Quản trị chuỗi cung ứng quốc phòng.',
      summaryEn: 'Journal of Military Logistics Scientific Studies is accepting submissions for December 2025 issue. Priority topics: Digital technology in logistics, Defense supply chain management.',
      content: `
        <p>Kính gửi quý Tác giả,</p>
        <p>Tạp chí điện tử Khoa học Hậu cần Quân sự (ISSN 1859-1337) trân trọng thông báo nhận bài viết cho số xuất bản tháng 12/2025.</p>
        <h3>Chủ đề ưu tiên</h3>
        <ul>
          <li>Ứng dụng công nghệ số trong hậu cần quân sự</li>
          <li>Quản trị chuỗi cung ứng quốc phòng</li>
          <li>An ninh nguồn cung ứng vật tư quân sự</li>
          <li>Logistics xanh và bền vững trong quốc phòng</li>
        </ul>
        <h3>Thời gian</h3>
        <ul>
          <li>Hạn nộp bài: 31/10/2025</li>
          <li>Thông báo kết quả phản biện: 20/11/2025</li>
          <li>Xuất bản: 15/12/2025</li>
        </ul>
        <p>Mọi chi tiết xin liên hệ: <a href="mailto:tapchi.hvhc@gmail.com">tapchi.hvhc@gmail.com</a></p>
      `,
      coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200',
      category: 'call_for_paper',
      tags: ['call for papers', 'submission', 'deadline'],
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date('2025-01-15'),
      authorId: admin.id,
    },
    {
      slug: 'hoi-thao-khoa-hoc-hau-can-2025',
      title: 'Hội thảo Khoa học "Đổi mới công tác hậu cần trong kỷ nguyên số"',
      titleEn: 'Scientific Conference: Innovation in Logistics in Digital Era',
      summary: 'Học viện Hậu cần tổ chức Hội thảo Khoa học cấp Quốc gia về đổi mới công tác hậu cần trong kỷ nguyên số, dự kiến diễn ra vào tháng 3/2025.',
      summaryEn: 'Military Logistics Academy organizes National Scientific Conference on Innovation in Logistics in Digital Era, scheduled for March 2025.',
      content: `
        <p>Ngày 09/01/2025, Học viện Hậu cần tổ chức Hội thảo Khoa học cấp Quốc gia với chủ đề "Đổi mới công tác hậu cần trong kỷ nguyên số".</p>
        <h3>Thông tin chi tiết</h3>
        <ul>
          <li>Thời gian: 15-16/03/2025</li>
          <li>Địa điểm: Học viện Hậu cần, Hà Nội</li>
          <li>Đối tượng: Cán bộ, giảng viên, nghiên cứu sinh trong và ngoài quân đội</li>
        </ul>
        <h3>Các chuyên đề chính</h3>
        <ol>
          <li>Chuyển đổi số trong quản lý hậu cần</li>
          <li>Ứng dụng AI và Big Data</li>
          <li>Blockchain trong chuỗi cung ứng quốc phòng</li>
          <li>An ninh mạng trong hệ thống hậu cần</li>
        </ol>
        <p>Đăng ký tham gia: <a href="https://hvhc.edu.vn">https://hvhc.edu.vn</a></p>
      `,
      coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200',
      category: 'event',
      tags: ['hội thảo', 'khoa học', 'chuyển đổi số'],
      isPublished: true,
      isFeatured: true,
      publishedAt: new Date('2025-01-09'),
      authorId: admin.id,
    },
    {
      slug: 'chinh-sach-open-access-2025',
      title: 'Chính sách Open Access của Tạp chí năm 2025',
      titleEn: 'Open Access Policy 2025',
      summary: 'Tạp chí áp dụng chính sách Open Access, cho phép truy cập miễn phí tất cả các bài báo đã xuất bản nhằm thúc đẩy chia sẻ tri thức khoa học.',
      summaryEn: 'The journal adopts Open Access policy, providing free access to all published articles to promote scientific knowledge sharing.',
      content: `
        <p>Kể từ số 01/2025, Tạp chí điện tử Khoa học Hậu cần Quân sự chính thức áp dụng chính sách <strong>Open Access</strong>.</p>
        <h3>Lợi ích của Open Access</h3>
        <ul>
          <li>Tăng khả năng tiếp cận và trích dẫn</li>
          <li>Thúc đẩy hợp tác quốc tế</li>
          <li>Minh bạch trong nghiên cứu khoa học</li>
          <li>Phổ biến tri thức rộng rãi</li>
        </ul>
        <h3>Quyền tác giả</h3>
        <p>Tác giả giữ bản quyền đối với bài báo của mình. Tạp chí sử dụng giấy phép <strong>Creative Commons CC BY 4.0</strong>.</p>
        <h3>Phí xuất bản</h3>
        <p>Tạp chí <strong>không thu phí</strong> Article Processing Charge (APC) đối với tác giả.</p>
      `,
      coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1200',
      category: 'policy',
      tags: ['open access', 'chính sách', 'xuất bản'],
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date('2025-01-05'),
      authorId: admin.id,
    },
    {
      slug: 'ket-qua-danh-gia-nam-2024',
      title: 'Kết quả đánh giá Tạp chí năm 2024',
      titleEn: 'Journal Evaluation Results 2024',
      summary: 'Tạp chí đạt nhiều thành tích nổi bật trong năm 2024: Được công nhận thuộc nhóm tạp chí khoa học có uy tín, Impact Factor tăng 25%.',
      summaryEn: 'The journal achieved notable accomplishments in 2024: Recognized as prestigious scientific journal, 25% increase in Impact Factor.',
      content: `
        <h2>Những thành tựu năm 2024</h2>
        <p>Tạp chí điện tử Khoa học Hậu cần Quân sự đã đạt được nhiều thành tích đáng ghi nhận trong năm 2024:</p>
        <h3>Chỉ số công bố</h3>
        <ul>
          <li>Tổng số bài xuất bản: 48 bài</li>
          <li>Số tác giả nước ngoài: 12 tác giả</li>
          <li>Impact Factor: 0.85 (+25% so với 2023)</li>
          <li>Tổng số trích dẫn: 324 lượt</li>
        </ul>
        <h3>Công nhận</h3>
        <ul>
          <li>Được Hội đồng Giáo sư Nhà nước công nhận thuộc danh mục tạp chí khoa học có uy tín</li>
          <li>Indexed trên Google Scholar, ResearchGate</li>
          <li>Đạt chuẩn ISSN quốc tế</li>
        </ul>
        <h3>Định hướng 2025</h3>
        <p>Năm 2025, Tạp chí sẽ tập trung vào việc mở rộng hợp tác quốc tế, nâng cao chất lượng phản biện và đẩy mạnh xuất bản tiếng Anh.</p>
      `,
      coverImage: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=1200',
      category: 'announcement',
      tags: ['báo cáo', 'thành tích', '2024'],
      isPublished: true,
      isFeatured: false,
      publishedAt: new Date('2024-12-30'),
      authorId: admin.id,
    },
  ];

  for (const article of newsArticles) {
    await prisma.news.upsert({
      where: { slug: article.slug },
      update: article,
      create: article,
    });
  }

  console.log(`✅ Created ${newsArticles.length} news articles`);

  // 3. Seed Page Blocks
  console.log('🏠 Creating page blocks...');

  const pageBlocks = [
    {
      key: 'hero_section',
      title: 'Tạp chí điện tử Khoa học Hậu cần Quân sự',
      titleEn: 'Journal of Military Logistics Scientific Studies',
      content: '<p>Nền tảng xuất bản khoa học uy tín trong lĩnh vực hậu cần quân sự. ISSN: 1859-1337</p>',
      contentEn: '<p>Prestigious scientific publishing platform in military logistics. ISSN: 1859-1337</p>',
      blockType: 'hero',
      order: 0,
      isActive: true,
      updatedBy: admin.id,
    },
    {
      key: 'about_section',
      title: 'Giới thiệu',
      titleEn: 'About Us',
      content: `
        <p>Tạp chí điện tử Khoa học Hậu cần Quân sự là ấn phẩm khoa học định kỳ của Học viện Hậu cần, 
        xuất bản các công trình nghiên cứu trong lĩnh vực hậu cần, logistics và quản trị chuỗi cung ứng.</p>
        <p>Tạp chí được công nhận là ấn phẩm khoa học uy tín, áp dụng tiêu chuẩn phản biện ngang hàng quốc tế.</p>
      `,
      contentEn: `
        <p>Journal of Military Logistics Scientific Studies is a periodic scientific publication of 
        Military Logistics Academy, publishing research works in logistics, supply chain management.</p>
        <p>The journal is recognized as a prestigious scientific publication, applying international peer review standards.</p>
      `,
      blockType: 'text',
      order: 1,
      isActive: true,
      updatedBy: admin.id,
    },
    {
      key: 'stats_section',
      title: 'Thống kê',
      titleEn: 'Statistics',
      content: JSON.stringify({
        stats: [
          { label: 'Số bài xuất bản', labelEn: 'Published Articles', value: '500+' },
          { label: 'Tác giả', labelEn: 'Authors', value: '200+' },
          { label: 'Phản biện viên', labelEn: 'Reviewers', value: '150+' },
          { label: 'Impact Factor', labelEn: 'Impact Factor', value: '0.85' },
        ],
      }),
      blockType: 'stats',
      order: 2,
      isActive: true,
      updatedBy: admin.id,
    },
    {
      key: 'contact_section',
      title: 'Liên hệ',
      titleEn: 'Contact',
      content: `
        <p><strong>Tạp chí điện tử Khoa học Hậu cần Quân sự</strong></p>
        <p>Địa chỉ: Đường Ngọc Thụy - Phường Bồ Đề - Thành phố Hà Nội</p>
        <p>Email: tapchi.hvhc@gmail.com</p>
        <p>Điện thoại: 069.577.585</p>
      `,
      contentEn: `
        <p><strong>Journal of Military Logistics Scientific Studies</strong></p>
        <p>Address: Ngoc Thuy Street - Bo De Ward - Hanoi City</p>
        <p>Email: tapchi.hvhc@gmail.com</p>
        <p>Phone: 069.577.585</p>
      `,
      blockType: 'text',
      order: 10,
      isActive: true,
      updatedBy: admin.id,
    },
  ];

  for (const block of pageBlocks) {
    await prisma.pageBlock.upsert({
      where: { key: block.key },
      update: block,
      create: block,
    });
  }

  console.log(`✅ Created ${pageBlocks.length} page blocks`);

  console.log('\n🎉 CMS seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding CMS data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
