import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/responses';

/**
 * Module 2: Advanced Filtering API
 * Endpoint: GET /api/search/filter?year=2024&keyword=AI&author=Nguyen&...
 * 
 * Bộ lọc nhiều tiêu chí cho bài báo
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Lấy các tham số lọc
    const year = searchParams.get('year');
    const keyword = searchParams.get('keyword');
    const author = searchParams.get('author');
    const affiliation = searchParams.get('affiliation');
    const categoryId = searchParams.get('categoryId');
    const yearFrom = searchParams.get('yearFrom');
    const yearTo = searchParams.get('yearTo');
    const doi = searchParams.get('doi');
    const issueId = searchParams.get('issueId');
    const sortBy = searchParams.get('sortBy') || 'publishedAt'; // publishedAt, views, downloads, title
    const order = searchParams.get('order') || 'desc'; // asc, desc
    const limit = parseInt(searchParams.get('limit') || '100');

    // Xây dựng điều kiện WHERE
    const where: any = {
      status: 'PUBLISHED'
    };

    // Lọc theo năm (single year)
    if (year) {
      const yearInt = parseInt(year);
      where.article = {
        issue: {
          year: yearInt
        }
      };
    }

    // Lọc theo khoảng năm
    if (yearFrom || yearTo) {
      where.article = where.article || {};
      where.article.issue = where.article.issue || {};
      
      if (yearFrom && yearTo) {
        where.article.issue.year = {
          gte: parseInt(yearFrom),
          lte: parseInt(yearTo)
        };
      } else if (yearFrom) {
        where.article.issue.year = { gte: parseInt(yearFrom) };
      } else if (yearTo) {
        where.article.issue.year = { lte: parseInt(yearTo) };
      }
    }

    // Lọc theo từ khóa trong danh sách keywords
    if (keyword) {
      where.keywords = {
        has: keyword
      };
    }

    // Lọc theo tác giả
    if (author) {
      where.author = {
        fullName: {
          contains: author,
          mode: 'insensitive'
        }
      };
    }

    // Lọc theo đơn vị
    if (affiliation) {
      where.author = where.author || {};
      where.author.org = {
        contains: affiliation,
        mode: 'insensitive'
      };
    }

    // Lọc theo danh mục
    if (categoryId) {
      where.categoryId = categoryId;
    }

    // Lọc theo DOI
    if (doi) {
      where.article = where.article || {};
      where.article.doiLocal = {
        contains: doi,
        mode: 'insensitive'
      };
    }

    // Lọc theo số tạp chí
    if (issueId) {
      where.article = where.article || {};
      where.article.issueId = issueId;
    }

    // Xây dựng orderBy
    let orderBy: any = {};
    switch (sortBy) {
      case 'views':
        orderBy = { article: { views: order } };
        break;
      case 'downloads':
        orderBy = { article: { downloads: order } };
        break;
      case 'title':
        orderBy = { title: order };
        break;
      case 'publishedAt':
      default:
        orderBy = { article: { publishedAt: order } };
        break;
    }

    // Thực hiện truy vấn
    const submissions = await prisma.submission.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            org: true,
            email: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        article: {
          include: {
            issue: {
              include: {
                volume: {
                  select: {
                    volumeNo: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy,
      take: limit
    });

    // Chuyển đổi dữ liệu
    const results = submissions.map(sub => ({
      id: sub.id,
      code: sub.code,
      title: sub.title,
      abstractVn: sub.abstractVn,
      abstractEn: sub.abstractEn,
      keywords: sub.keywords,
      createdAt: sub.createdAt,
      category: sub.category ? {
        id: sub.category.id,
        name: sub.category.name,
        code: sub.category.code
      } : null,
      author: {
        id: sub.author.id,
        name: sub.author.fullName,
        org: sub.author.org,
        email: sub.author.email
      },
      article: sub.article ? {
        publishedAt: sub.article.publishedAt,
        doi: sub.article.doiLocal,
        views: sub.article.views,
        downloads: sub.article.downloads,
        isFeatured: sub.article.isFeatured,
        issue: sub.article.issue ? {
          id: sub.article.issue.id,
          number: sub.article.issue.number,
          year: sub.article.issue.year,
          volume: sub.article.issue.volume?.volumeNo
        } : null
      } : null
    }));

    // Thống kê metadata
    const stats = {
      totalResults: results.length,
      withIssue: results.filter(r => r.article?.issue).length,
      featured: results.filter(r => r.article?.isFeatured).length,
      categories: Array.from(new Set(results.map(r => r.category?.name).filter(Boolean))).length
    };

    return successResponse({
      filters: {
        year,
        keyword,
        author,
        affiliation,
        categoryId,
        yearFrom,
        yearTo,
        doi,
        issueId,
        sortBy,
        order
      },
      stats,
      results
    });

  } catch (error: any) {
    console.error('Filter API Error:', error);
    return errorResponse(
      'Lỗi khi lọc dữ liệu: ' + error.message,
      500
    );
  }
}
