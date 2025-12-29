import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * Module 1: PostgreSQL Full-Text Search API
 * Endpoint: GET /api/search?q=<query>&limit=<number>
 * 
 * Tìm kiếm toàn văn trên bài báo đã xuất bản sử dụng PostgreSQL FTS
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!query || query.trim().length === 0) {
      return errorResponse('Query parameter "q" is required', 400);
    }

    // Tìm kiếm sử dụng PostgreSQL FTS với ranking
    const results = await prisma.$queryRawUnsafe<any[]>(`
      SELECT 
        s.id,
        s.title,
        s."abstractVn",
        s."abstractEn",
        s.keywords,
        s."createdAt",
        s."categoryId",
        c.name as "categoryName",
        u."fullName" as "authorName",
        u.org as "authorOrg",
        a."publishedAt",
        a."doiLocal" as doi,
        a.views,
        a.downloads,
        i."volumeId",
        v."volumeNo",
        i.number as "issueNumber",
        i.year as "issueYear",
        ts_rank(s.search_vector, plainto_tsquery('english', $1)) as rank
      FROM "Submission" s
      LEFT JOIN "Category" c ON s."categoryId" = c.id
      LEFT JOIN "User" u ON s."createdBy" = u.id
      LEFT JOIN "Article" a ON s.id = a."submissionId"
      LEFT JOIN "Issue" i ON a."issueId" = i.id
      LEFT JOIN "Volume" v ON i."volumeId" = v.id
      WHERE 
        s.status = 'PUBLISHED'
        AND s.search_vector @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC, a."publishedAt" DESC NULLS LAST
      LIMIT $2
    `, query, limit);

    // Chuyển đổi kết quả sang format chuẩn
    const formattedResults = results.map(row => ({
      id: row.id,
      title: row.title,
      abstractVn: row.abstractVn,
      abstractEn: row.abstractEn,
      keywords: row.keywords,
      category: row.categoryId ? {
        id: row.categoryId,
        name: row.categoryName
      } : null,
      author: {
        name: row.authorName,
        org: row.authorOrg
      },
      publishedAt: row.publishedAt,
      doi: row.doi,
      views: row.views || 0,
      downloads: row.downloads || 0,
      issue: row.volumeId ? {
        volume: row.volumeNo,
        number: row.issueNumber,
        year: row.issueYear
      } : null,
      relevanceScore: parseFloat(row.rank || 0).toFixed(4)
    }));

    return successResponse({
      query,
      total: formattedResults.length,
      results: formattedResults
    });

  } catch (error: any) {
    console.error('Search API Error:', error);
    return errorResponse(
      'Lỗi khi tìm kiếm: ' + error.message,
      500
    );
  }
}
