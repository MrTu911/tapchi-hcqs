
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3';
import { getSignedImageUrl } from '@/lib/image-utils';
import { z } from 'zod';

// Validation schema
const BannerSchema = z.object({
  title: z.string().optional(),
  titleEn: z.string().optional(),
  subtitle: z.string().optional(),
  subtitleEn: z.string().optional(),
  linkUrl: z.string().optional(),
  linkTarget: z.enum(['_self', '_blank']).default('_self'),
  altText: z.string().optional(),
  buttonText: z.string().optional(),
  buttonTextEn: z.string().optional(),
  deviceType: z.enum(['mobile', 'tablet', 'desktop', 'all']).default('all'),
  position: z.number().default(0),
  isActive: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  targetRole: z.string().optional(),
});

// GET - List all banners with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isActive = searchParams.get('isActive');
    const deviceType = searchParams.get('deviceType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build filter
    const where: any = {};
    
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }
    
    if (deviceType) {
      where.OR = [
        { deviceType: deviceType },
        { deviceType: 'all' }
      ];
    }

    // Check schedule (active banners only in date range)
    const now = new Date();
    if (isActive === 'true') {
      where.AND = [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ]
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } }
          ]
        }
      ];
    }

    const [banners, total] = await Promise.all([
      prisma.banner.findMany({
        where,
        include: {
          creator: {
            select: {
              id: true,
              fullName: true,
              email: true,
            }
          },
          updater: {
            select: {
              id: true,
              fullName: true,
              email: true,
            }
          }
        },
        orderBy: { position: 'asc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.banner.count({ where })
    ]);

    // Add signed URLs to banners
    const bannersWithSignedUrls = await Promise.all(
      banners.map(async (banner) => ({
        ...banner,
        imageUrlSigned: await getSignedImageUrl(banner.imageUrl, 86400) // 24 hours
      }))
    );

    return NextResponse.json({
      success: true,
      data: bannersWithSignedUrls,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banners' },
      { status: 500 }
    );
  }
}

// POST - Create new banner (with image upload)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    
    // Extract banner data
    const bannerData: any = {};
    formData.forEach((value, key) => {
      if (key !== 'image') {
        bannerData[key] = value;
      }
    });

    // Parse JSON fields
    if (bannerData.position) bannerData.position = parseInt(bannerData.position);
    if (bannerData.isActive) bannerData.isActive = bannerData.isActive === 'true';
    if (bannerData.startDate && bannerData.startDate !== '') {
      bannerData.startDate = new Date(bannerData.startDate);
    } else {
      delete bannerData.startDate;
    }
    if (bannerData.endDate && bannerData.endDate !== '') {
      bannerData.endDate = new Date(bannerData.endDate);
    } else {
      delete bannerData.endDate;
    }

    // Upload image to S3
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `banners/${Date.now()}-${file.name}`;
    const cloudStoragePath = await uploadFile(buffer, fileName, file.type);

    // Validate data
    const validated = BannerSchema.parse(bannerData);

    // Create banner
    const banner = await prisma.banner.create({
      data: {
        ...validated,
        imageUrl: cloudStoragePath,
        createdBy: session.uid,
        updatedBy: session.uid,
      },
      include: {
        creator: {
          select: {
            id: true,
            fullName: true,
            email: true,
          }
        }
      }
    });

    // Add signed URL to response
    const bannerWithSignedUrl = {
      ...banner,
      imageUrlSigned: await getSignedImageUrl(banner.imageUrl, 86400)
    };

    return NextResponse.json({
      success: true,
      data: bannerWithSignedUrl,
      message: 'Banner created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create banner' },
      { status: 500 }
    );
  }
}
