/**
 * API: Article Comments
 * Bình luận công khai trên bài viết
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const createCommentSchema = z.object({
  articleId: z.string(),
  content: z.string().min(1, 'Nội dung bình luận không được để trống').max(2000, 'Bình luận quá dài (tối đa 2000 ký tự)'),
});

/**
 * GET /api/comments?articleId=xxx
 * Lấy danh sách bình luận của bài viết
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { success: false, error: 'articleId is required' },
        { status: 400 }
      );
    }

    // Kiểm tra bài viết có tồn tại và đã được xuất bản không
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, publishedAt: true },
    });

    if (!article || !article.publishedAt) {
      return NextResponse.json(
        { success: false, error: 'Article not found or not published' },
        { status: 404 }
      );
    }

    // Lấy các bình luận đã được duyệt
    const comments = await prisma.articleComment.findMany({
      where: {
        articleId,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            org: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/comments
 * Tạo bình luận mới
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    // Bình luận không bắt buộc phải đăng nhập (cho phép anonymous)
    const userId = session?.uid || null;

    const body = await request.json();
    const validation = createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { articleId, content } = validation.data;

    // Kiểm tra bài viết có tồn tại và đã xuất bản không
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, publishedAt: true },
    });

    if (!article || !article.publishedAt) {
      return NextResponse.json(
        { success: false, error: 'Article not found or not published' },
        { status: 404 }
      );
    }

    // Tạo bình luận (mặc định isApproved = false, cần kiểm duyệt)
    const comment = await prisma.articleComment.create({
      data: {
        articleId,
        userId,
        content,
        isApproved: false, // Cần kiểm duyệt bởi admin/editor
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            org: true,
          },
        },
      },
    });

    // TODO: Gửi thông báo cho editor/admin về bình luận mới cần kiểm duyệt

    return NextResponse.json(
      {
        success: true,
        data: comment,
        message: 'Bình luận của bạn đang chờ kiểm duyệt',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
