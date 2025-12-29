import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBanners() {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { position: 'asc' },
      select: {
        id: true,
        title: true,
        titleEn: true,
        isActive: true,
        deviceType: true,
        position: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        imageUrl: true,
      }
    });

    console.log('\n=== DANH SÁCH BANNER TRONG DATABASE ===\n');
    console.log(`Tổng số banner: ${banners.length}\n`);
    
    banners.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.title || banner.titleEn || 'No title'}`);
      console.log(`   - ID: ${banner.id}`);
      console.log(`   - Trạng thái: ${banner.isActive ? '✅ Hoạt động' : '❌ Tắt'}`);
      console.log(`   - Thiết bị: ${banner.deviceType}`);
      console.log(`   - Vị trí: ${banner.position}`);
      console.log(`   - Hình ảnh: ${banner.imageUrl}`);
      if (banner.startDate) console.log(`   - Bắt đầu: ${banner.startDate.toISOString()}`);
      if (banner.endDate) console.log(`   - Kết thúc: ${banner.endDate.toISOString()}`);
      console.log('');
    });

    // Check active banners
    const now = new Date();
    const activeBanners = banners.filter(b => {
      if (!b.isActive) return false;
      if (b.startDate && b.startDate > now) return false;
      if (b.endDate && b.endDate < now) return false;
      return true;
    });

    console.log(`\n=== BANNER ĐANG HOẠT ĐỘNG: ${activeBanners.length} ===\n`);
    activeBanners.forEach((banner, index) => {
      console.log(`${index + 1}. ${banner.title || banner.titleEn || 'No title'} (${banner.deviceType})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBanners();
