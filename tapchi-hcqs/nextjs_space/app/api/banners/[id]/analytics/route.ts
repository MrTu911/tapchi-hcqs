
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST - Track banner click or view
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action } = await request.json();

    if (!['click', 'view'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    const updateData = action === 'click'
      ? { clickCount: { increment: 1 } }
      : { viewCount: { increment: 1 } };

    await prisma.banner.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `${action} tracked successfully`
    });
  } catch (error) {
    console.error('Error tracking banner analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}
