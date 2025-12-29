import { NextRequest, NextResponse } from 'next/server';
// No need to import
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Zod validation schema
const updateProductionSchema = z.object({
  layoutUrl: z.string().url().optional(),
  doi: z.string().optional(),
  notes: z.string().optional(),
  issueId: z.string().uuid().optional(),
});

/**
 * GET /api/production/[id]
 * Lấy chi tiết production
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const production = await prisma.production.findUnique({
      where: { id: params.id },
      include: {
        article: {
          include: {
            submission: {
              include: {
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    org: true,
                  },
                },
                category: true,
              },
            },
          },
        },
        issue: {
          include: {
            volume: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!production) {
      return NextResponse.json(
        { success: false, message: 'Production not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: production,
    });
  } catch (error: any) {
    console.error('GET /api/production/[id] error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/production/[id]
 * Cập nhật production (layout, DOI, issue)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Chỉ managing editor, EIC, sysadmin cập nhật
    const allowedRoles = ['MANAGING_EDITOR', 'EIC', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = updateProductionSchema.parse(body);

    const production = await prisma.production.findUnique({
      where: { id: params.id },
      include: {
        article: {
          include: {
            submission: true,
          },
        },
      },
    });

    if (!production) {
      return NextResponse.json(
        { success: false, message: 'Production not found' },
        { status: 404 }
      );
    }

    // Cập nhật production
    const updated = await prisma.production.update({
      where: { id: params.id },
      data: validated,
      include: {
        article: {
          include: {
            submission: true,
          },
        },
        issue: {
          include: {
            volume: true,
          },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Production updated successfully',
      data: updated,
    });
  } catch (error: any) {
    console.error('PATCH /api/production/[id] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
