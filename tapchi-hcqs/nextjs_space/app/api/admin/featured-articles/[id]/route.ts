import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

// PATCH - Cập nhật featured article (position, isActive, reason)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = params;
    const body = await req.json();
    const { position, isActive, reason } = body;

    const updateData: any = {};
    if (position !== undefined) updateData.position = position;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (reason !== undefined) updateData.reason = reason;

    const updated = await prisma.featuredArticle.update({
      where: { id },
      data: updateData,
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: true,
                category: true,
              },
            },
          },
        },
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.ARTICLE_UPDATED,
      object: `FEATURED_ARTICLE:${id}`,
      after: { position, isActive, reason },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Đã cập nhật bài viết nổi bật',
    });
  } catch (error: any) {
    console.error('Error updating featured article:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
