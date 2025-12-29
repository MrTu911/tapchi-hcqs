
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

/**
 * GET /api/site-settings/[key]
 * Retrieve a specific site setting by key
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const { key } = await params;

    const setting = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!setting) {
      return errorResponse('Setting not found', 404);
    }

    return successResponse({ setting });
  } catch (error: any) {
    console.error('Error fetching site setting:', error);
    return errorResponse('Failed to fetch site setting', 500);
  }
}

/**
 * PATCH /api/site-settings/[key]
 * Update a specific site setting (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session || !['SYSADMIN', 'EIC', 'MANAGING_EDITOR'].includes(session.role)) {
      return errorResponse('Unauthorized', 403);
    }

    const { key } = await params;
    const body = await request.json();
    const { value, label, labelEn, placeholder, helpText, order } = body;

    // Check if setting exists
    const existing = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      return errorResponse('Setting not found', 404);
    }

    // Update setting
    const setting = await prisma.siteSetting.update({
      where: { key },
      data: {
        ...(value !== undefined && { value }),
        ...(label && { label }),
        ...(labelEn !== undefined && { labelEn }),
        ...(placeholder !== undefined && { placeholder }),
        ...(helpText !== undefined && { helpText }),
        ...(order !== undefined && { order }),
      },
    });

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'SiteSetting',
      before: { key, value: existing.value },
      after: { key, value },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse({ setting }, 'Site setting updated successfully');
  } catch (error: any) {
    console.error('Error updating site setting:', error);
    return errorResponse('Failed to update site setting', 500);
  }
}

/**
 * DELETE /api/site-settings/[key]
 * Delete a site setting (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession();

    if (!session || !['SYSADMIN'].includes(session.role)) {
      return errorResponse('Unauthorized - SYSADMIN only', 403);
    }

    const { key } = await params;

    // Check if setting exists
    const existing = await prisma.siteSetting.findUnique({
      where: { key },
    });

    if (!existing) {
      return errorResponse('Setting not found', 404);
    }

    // Delete setting
    await prisma.siteSetting.delete({
      where: { key },
    });

    // Log audit event
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.SETTINGS_CHANGED,
      object: 'SiteSetting',
      before: { key, value: existing.value, settingId: existing.id },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
    });

    return successResponse({ message: 'Setting deleted successfully' }, 'Site setting deleted successfully');
  } catch (error: any) {
    console.error('Error deleting site setting:', error);
    return errorResponse('Failed to delete site setting', 500);
  }
}
