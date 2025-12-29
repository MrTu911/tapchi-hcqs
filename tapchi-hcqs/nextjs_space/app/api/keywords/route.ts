/**
 * API: Keywords Management
 * Quản lý từ khóa bài báo
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { z } from 'zod';

// Validation schema
const createKeywordSchema = z.object({
  term: z.string().min(2, 'Từ khóa phải có ít nhất 2 ký tự'),
  category: z.string().optional(),
  synonyms: z.array(z.string()).optional(),
  relatedTerms: z.array(z.string()).optional(),
});

/**
 * GET /api/keywords
 * Lấy danh sách từ khóa
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '100');

    const keywords = await prisma.keyword.findMany({
      where: {
        ...(search && {
          OR: [
            { term: { contains: search, mode: 'insensitive' } },
            { synonyms: { has: search } },
          ],
        }),
        ...(category && { category }),
      },
      orderBy: [
        { usage: 'desc' },  // Phổ biến nhất trước
        { term: 'asc' },
      ],
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: keywords,
    });
  } catch (error) {
    console.error('Error fetching keywords:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch keywords' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keywords
 * Tạo từ khóa mới (chỉ Editor+)
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

    // Kiểm tra quyền (Editor trở lên)
    const allowedRoles = ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'] as Role[];
    if (!allowedRoles.includes(session.role as Role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validation = createKeywordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { term, category, synonyms, relatedTerms } = validation.data;

    // Kiểm tra xem keyword đã tồn tại chưa
    const existingKeyword = await prisma.keyword.findUnique({
      where: { term: term.toLowerCase() },
    });

    if (existingKeyword) {
      return NextResponse.json(
        { success: false, error: `Từ khóa "${term}" đã tồn tại` },
        { status: 400 }
      );
    }

    // Tạo keyword mới
    const keyword = await prisma.keyword.create({
      data: {
        term: term.toLowerCase(),
        category,
        synonyms: synonyms || [],
        relatedTerms: relatedTerms || [],
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: keyword,
        message: 'Tạo từ khóa thành công',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating keyword:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create keyword' },
      { status: 500 }
    );
  }
}
