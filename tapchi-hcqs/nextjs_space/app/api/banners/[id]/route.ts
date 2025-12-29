
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile } from '@/lib/s3';
import { getSignedImageUrl } from '@/lib/image-utils';
import { z } from 'zod';

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

// GET - Get single banner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
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
      }
    });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Add signed URL
    const bannerWithSignedUrl = {
      ...banner,
      imageUrlSigned: await getSignedImageUrl(banner.imageUrl, 86400)
    };

    return NextResponse.json({
      success: true,
      data: bannerWithSignedUrl
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch banner' },
      { status: 500 }
    );
  }
}

// PUT - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const existingBanner = await prisma.banner.findUnique({
      where: { id: params.id }
    });

    if (!existingBanner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
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

    // Parse fields
    if (bannerData.position) bannerData.position = parseInt(bannerData.position);
    if (bannerData.isActive !== undefined) bannerData.isActive = bannerData.isActive === 'true';
    if (bannerData.startDate && bannerData.startDate !== '') {
      bannerData.startDate = new Date(bannerData.startDate);
    } else if (bannerData.startDate === '') {
      bannerData.startDate = null;
    }
    if (bannerData.endDate && bannerData.endDate !== '') {
      bannerData.endDate = new Date(bannerData.endDate);
    } else if (bannerData.endDate === '') {
      bannerData.endDate = null;
    }

    // Upload new image if provided
    let imageUrl = existingBanner.imageUrl;
    if (file) {
      // Delete old image
      try {
        await deleteFile(existingBanner.imageUrl);
      } catch (error) {
        console.error('Error deleting old image:', error);
      }

      // Upload new image
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `banners/${Date.now()}-${file.name}`;
      imageUrl = await uploadFile(buffer, fileName, file.type);
    }

    // Validate data
    const validated = BannerSchema.partial().parse(bannerData);

    // Update banner
    const banner = await prisma.banner.update({
      where: { id: params.id },
      data: {
        ...validated,
        ...(imageUrl !== existingBanner.imageUrl && { imageUrl }),
        updatedBy: session.uid,
      },
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
      }
    });

    // Add signed URL
    const bannerWithSignedUrl = {
      ...banner,
      imageUrlSigned: await getSignedImageUrl(banner.imageUrl, 86400)
    };

    return NextResponse.json({
      success: true,
      data: bannerWithSignedUrl,
      message: 'Banner updated successfully'
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update banner' },
      { status: 500 }
    );
  }
}

// DELETE - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    if (!['SYSADMIN', 'EIC'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const banner = await prisma.banner.findUnique({
      where: { id: params.id }
    });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      );
    }

    // Delete image from S3
    try {
      await deleteFile(banner.imageUrl);
    } catch (error) {
      console.error('Error deleting image from S3:', error);
    }

    // Delete banner
    await prisma.banner.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete banner' },
      { status: 500 }
    );
  }
}
