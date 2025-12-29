
import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/s3';
import { prisma } from '@/lib/prisma';

// GET - Get signed URL for banner image
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const banner = await prisma.banner.findUnique({
      where: { id: params.id },
      select: { imageUrl: true }
    });

    if (!banner) {
      return NextResponse.json(
        { success: false, error: 'Banner not found' },
        { status: 404 }
      );
    }

    const signedUrl = await getDownloadUrl(banner.imageUrl, 3600);

    return NextResponse.json({
      success: true,
      url: signedUrl
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate signed URL' },
      { status: 500 }
    );
  }
}
