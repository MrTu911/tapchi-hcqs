/**
 * API: Volumes Management
 * Quản lý các Tập tạp chí (Volumes)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const createVolumeSchema = z.object({
  volumeNo: z.number().int().positive('Số tập phải là số nguyên dương'),
  year: z.number().int().min(2000, 'Năm phải từ 2000 trở lên'),
  title: z.string().optional(),
  description: z.string().optional(),
});

/**
 * GET /api/volumes
 * Lấy danh sách tất cả các tập
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeIssues = searchParams.get('includeIssues') === 'true';

    const volumes = await prisma.volume.findMany({
      include: {
        issues: includeIssues,
        _count: {
          select: {
            issues: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { volumeNo: 'desc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: volumes,
    });
  } catch (error) {
    console.error('Error fetching volumes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch volumes' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/volumes
 * Tạo tập mới (chỉ Managing Editor, EIC, SYSADMIN)
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validation = createVolumeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { volumeNo, year, title, description } = validation.data;

    // Kiểm tra xem volume đã tồn tại chưa
    const existingVolume = await prisma.volume.findUnique({
      where: { volumeNo },
    });

    if (existingVolume) {
      return NextResponse.json(
        { success: false, error: `Tập số ${volumeNo} đã tồn tại` },
        { status: 400 }
      );
    }

    // Tạo volume mới
    const volume = await prisma.volume.create({
      data: {
        volumeNo,
        year,
        title: title || `Tập ${volumeNo} - Năm ${year}`,
        description,
      },
      include: {
        _count: {
          select: {
            issues: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: volume,
        message: 'Tạo tập thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating volume:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create volume' },
      { status: 500 }
    );
  }
}
