
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const pageBlockUpdateSchema = z.object({
  title: z.string().optional(),
  titleEn: z.string().optional(),
  content: z.string().optional(),
  contentEn: z.string().optional(),
  imageUrl: z.string().optional(),
  blockType: z.string().optional(),
  metadata: z.any().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/page-blocks/[key]
export async function GET(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const { key } = params;
    
    const block = await prisma.pageBlock.findUnique({
      where: { key },
      include: {
        updatedByUser: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });
    
    if (!block) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy page block' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: block,
    });
  } catch (error: any) {
    console.error('Error fetching page block:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi tải page block', error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/page-blocks/[key]
export async function PUT(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền truy cập' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.email! },
      select: { id: true, role: true },
    });
    
    if (!user || !['SYSADMIN', 'MANAGING_EDITOR'].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền cập nhật page block' },
        { status: 403 }
      );
    }
    
    const { key } = params;
    const body = await request.json();
    const validated = pageBlockUpdateSchema.parse(body);
    
    const block = await prisma.pageBlock.update({
      where: { key },
      data: {
        ...validated,
        updatedBy: user.id,
      },
      include: {
        updatedByUser: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json({
      success: true,
      message: 'Cập nhật page block thành công',
      data: block,
    });
  } catch (error: any) {
    console.error('Error updating page block:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Dữ liệu không hợp lệ', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Lỗi khi cập nhật page block', error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/page-blocks/[key]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.uid) {
      return NextResponse.json(
        { success: false, message: 'Không có quyền truy cập' },
        { status: 401 }
      );
    }
    
    const user = await prisma.user.findUnique({
      where: { email: session.email! },
      select: { role: true },
    });
    
    if (!user || user.role !== 'SYSADMIN') {
      return NextResponse.json(
        { success: false, message: 'Chỉ SYSADMIN mới có quyền xóa page block' },
        { status: 403 }
      );
    }
    
    const { key } = params;
    
    await prisma.pageBlock.delete({ where: { key } });
    
    return NextResponse.json({
      success: true,
      message: 'Xóa page block thành công',
    });
  } catch (error: any) {
    console.error('Error deleting page block:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi khi xóa page block', error: error.message },
      { status: 500 }
    );
  }
}
