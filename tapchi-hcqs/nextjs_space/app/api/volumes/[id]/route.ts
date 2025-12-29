/**
 * API: Volume Detail
 * Quản lý chi tiết một tập
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// Validation schema
const updateVolumeSchema = z.object({
  volumeNo: z.number().int().positive().optional(),
  year: z.number().int().min(2000).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/volumes/[id]
 * Lấy thông tin chi tiết của một tập
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const volume = await prisma.volume.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: {
            number: 'asc',
          },
        },
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    if (!volume) {
      return NextResponse.json(
        { success: false, error: 'Volume not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: volume,
    });
  } catch (error) {
    console.error('Error fetching volume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volume' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/volumes/[id]
 * Cập nhật thông tin tập (chỉ Managing Editor, EIC, SYSADMIN)
 */
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || !session?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kiểm tra quyền
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const validation = updateVolumeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Nếu cập nhật volumeNo, kiểm tra xem đã tồn tại chưa
    if (data.volumeNo) {
      const existingVolume = await prisma.volume.findFirst({
        where: {
          volumeNo: data.volumeNo,
          NOT: { id },
        },
      });

      if (existingVolume) {
        return NextResponse.json(
          { success: false, error: `Tập số ${data.volumeNo} đã tồn tại` },
          { status: 400 }
        );
      }
    }

    // Cập nhật volume
    const volume = await prisma.volume.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: volume,
      message: 'Cập nhật tập thành công',
    });
  } catch (error) {
    console.error('Error updating volume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update volume' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/volumes/[id]
 * Xóa tập (chỉ khi không có issue nào)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid || !session?.role) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Kiểm tra quyền
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Kiểm tra xem có issue nào không
    const volume = await prisma.volume.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    if (!volume) {
      return NextResponse.json(
        { success: false, error: 'Volume not found' },
        { status: 404 }
      );
    }

    if (volume._count.issues > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể xóa tập có ${volume._count.issues} số tạp chí. Vui lòng xóa các số trước.`,
        },
        { status: 400 }
      );
    }

    // Xóa volume
    await prisma.volume.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa tập thành công',
    });
  } catch (error) {
    console.error('Error deleting volume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete volume' },
      { status: 500 }
    );
  }
}
