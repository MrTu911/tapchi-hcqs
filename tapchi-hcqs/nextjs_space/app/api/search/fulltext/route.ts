import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @route GET /api/search/fulltext
 * @description Full-text search across articles using PostgreSQL FTS
 * @access Public
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const category = searchParams.get('category');
    const year = searchParams.get('year');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Sanitize query for tsquery
    const sanitizedQuery = query
      .replace(/[^\w\s\p{L}]/gu, ' ') // Remove special chars but keep unicode letters
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0)
      .join(' | '); // OR operator between words

    if (!sanitizedQuery) {
      return NextResponse.json(
        { error: 'Invalid search query' },
        { status: 400 }
      );
    }

    // Build WHERE conditions
    const conditions: string[] = [];
    const params: any[] = [sanitizedQuery];
    let paramIndex = 2;

    if (category) {
      conditions.push(`c."id" = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (year) {
      conditions.push(`EXTRACT(YEAR FROM s."createdAt") = $${paramIndex}`);
      params.push(parseInt(year));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : '';

    // Full-text search query using PostgreSQL's ts_rank for relevance scoring
    const searchQuery = `
      WITH search_results AS (
        SELECT 
          s."id",
          s."code",
          s."title",
          s."titleEn",
          s."abstractVi",
          s."abstractEn",
          s."keywords",
          s."createdAt",
          s."categoryId",
          c."name" as "categoryName",
          u."fullName" as "authorName",
          u."org" as "authorOrg",
          a."id" as "articleId",
          i."volumeNo",
          i."number" as "issueNumber",
          i."year" as "issueYear",
          -- Calculate relevance score (title has highest weight)
          ts_rank(
            setweight(to_tsvector('simple', COALESCE(s."title", '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(s."titleEn", '')), 'A') ||
            setweight(to_tsvector('simple', COALESCE(s."abstractVi", '')), 'B') ||
            setweight(to_tsvector('simple', COALESCE(s."abstractEn", '')), 'B') ||
            setweight(to_tsvector('simple', array_to_string(s."keywords", ' ')), 'C'),
            plainto_tsquery('simple', $1)
          ) as "relevance",
          -- Highlight matches in title
          ts_headline(
            'simple',
            COALESCE(s."title", ''),
            plainto_tsquery('simple', $1),
            'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=25'
          ) as "titleHighlight"
        FROM "Submission" s
        LEFT JOIN "Category" c ON s."categoryId" = c."id"
        LEFT JOIN "User" u ON s."createdBy" = u."id"
        LEFT JOIN "Article" a ON s."id" = a."submissionId"
        LEFT JOIN "Issue" i ON a."issueId" = i."id"
        WHERE 
          s."status" = 'PUBLISHED'
          AND (
            to_tsvector('simple', COALESCE(s."title", '')) @@ plainto_tsquery('simple', $1)
            OR to_tsvector('simple', COALESCE(s."titleEn", '')) @@ plainto_tsquery('simple', $1)
            OR to_tsvector('simple', COALESCE(s."abstractVi", '')) @@ plainto_tsquery('simple', $1)
            OR to_tsvector('simple', COALESCE(s."abstractEn", '')) @@ plainto_tsquery('simple', $1)
            OR to_tsvector('simple', array_to_string(s."keywords", ' ')) @@ plainto_tsquery('simple', $1)
          )
          ${whereClause}
      )
      SELECT 
        *,
        COUNT(*) OVER() as "totalCount"
      FROM search_results
      ORDER BY "relevance" DESC, "createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const results = await prisma.$queryRawUnsafe<any[]>(searchQuery, ...params);

    // Transform results
    const totalCount = results.length > 0 ? Number(results[0].totalCount) : 0;
    const articles = results.map((row: any) => ({
      id: row.id,
      articleId: row.articleId,
      code: row.code,
      title: row.title,
      titleEn: row.titleEn,
      titleHighlight: row.titleHighlight,
      abstractVi: row.abstractVi?.substring(0, 300) + (row.abstractVi?.length > 300 ? '...' : ''),
      abstractEn: row.abstractEn?.substring(0, 300) + (row.abstractEn?.length > 300 ? '...' : ''),
      keywords: row.keywords,
      category: row.categoryName,
      author: row.authorName,
      authorOrg: row.authorOrg,
      publishedDate: row.createdAt,
      issue: row.volumeNo && row.issueNumber ? {
        volume: row.volumeNo,
        number: row.issueNumber,
        year: row.issueYear
      } : null,
      relevance: Number(row.relevance)
    }));

    return NextResponse.json({
      success: true,
      query,
      total: totalCount,
      limit,
      offset,
      results: articles
    });

  } catch (error) {
    console.error('Full-text search error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
