
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Reorder banners
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { bannerIds } = await request.json();

    if (!Array.isArray(bannerIds)) {
      return NextResponse.json(
        { success: false, error: 'bannerIds must be an array' },
        { status: 400 }
      );
    }

    // Update positions in parallel
    await Promise.all(
      bannerIds.map((id, index) =>
        prisma.banner.update({
          where: { id },
          data: { position: index }
        })
      )
    );

    return NextResponse.json({
      success: true,
      message: 'Banners reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering banners:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder banners' },
      { status: 500 }
    );
  }
}
