import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { deleteFile } from '@/lib/s3';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

/**
 * GET /api/media/[id]
 * Get a specific media file by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { id } = params;

    const media = await prisma.media.findUnique({
      where: { id },
    });

    if (!media) {
      return errorResponse('Media not found', 404);
    }

    return NextResponse.json({ data: media });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return errorResponse(error.message || 'Failed to fetch media', 500);
  }
}

/**
 * PATCH /api/media/[id]
 * Update media metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const { id } = params;
    const body = await request.json();

    const { altText, title, description, category } = body;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return errorResponse('Media not found', 404);
    }

    const updatedMedia = await prisma.media.update({
      where: { id },
      data: {
        ...(altText !== undefined && { altText }),
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_UPDATED,
      object: 'media',
      before: media,
      after: updatedMedia,
    });

    return successResponse(updatedMedia, 'Media updated successfully');
  } catch (error: any) {
    console.error('Error updating media:', error);
    return errorResponse(error.message || 'Failed to update media', 500);
  }
}

/**
 * DELETE /api/media/[id]
 * Delete a media file
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Only SYSADMIN and EIC can delete media
    if (!['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const { id } = params;

    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) {
      return errorResponse('Media not found', 404);
    }

    // Check if media is being used (usageCount > 0)
    if (media.usageCount > 0) {
      return errorResponse(
        `Cannot delete media: currently used in ${media.usageCount} location(s)`,
        400
      );
    }

    // Delete from S3
    try {
      await deleteFile(media.cloudStoragePath);
    } catch (s3Error) {
      console.warn('S3 deletion warning:', s3Error);
      // Continue with database deletion even if S3 delete fails
    }

    // Delete from database
    await prisma.media.delete({ where: { id } });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_DELETED,
      object: 'media',
      before: media,
    });

    return successResponse(null, 'Media deleted successfully');
  } catch (error: any) {
    console.error('Error deleting media:', error);
    return errorResponse(error.message || 'Failed to delete media', 500);
  }
}
