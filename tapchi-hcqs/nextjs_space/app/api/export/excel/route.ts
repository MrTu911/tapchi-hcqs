import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { errorResponse } from '@/lib/responses';
import ExcelJS from 'exceljs';

/**
 * Module 3: Export Excel Report API
 * Endpoint: GET /api/export/excel?filters=...
 * 
 * Xuất danh sách bài báo thành file Excel
 * Requires: Authentication (Editor, Admin roles)
 */
export async function GET(req: NextRequest) {
  try {
    // Kiểm tra authentication
    const session = await getServerSession();
    if (!session || !['EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR', 'SYSADMIN'].includes(session.role)) {
      return errorResponse('Không có quyền xuất báo cáo', 403);
    }

    const { searchParams } = new URL(req.url);
    const filterParam = searchParams.get('filters');
    let filters: any = {};

    if (filterParam) {
      try {
        filters = JSON.parse(decodeURIComponent(filterParam));
      } catch (e) {
        // Nếu không parse được, sử dụng mặc định
      }
    }

    // Xây dựng query
    const where: any = { status: 'PUBLISHED' };

    if (filters.year) {
      where.article = { issue: { year: parseInt(filters.year) } };
    }

    if (filters.categoryId && filters.categoryId !== 'all') {
      where.categoryId = filters.categoryId;
    }

    if (filters.author) {
      where.author = {
        fullName: { contains: filters.author, mode: 'insensitive' }
      };
    }

    // Lấy dữ liệu
    const submissions = await prisma.submission.findMany({
      where,
      include: {
        author: {
          select: { fullName: true, org: true, email: true }
        },
        category: {
          select: { name: true, code: true }
        },
        article: {
          select: {
            publishedAt: true,
            doiLocal: true,
            views: true,
            downloads: true,
            issue: {
              select: {
                number: true,
                year: true,
                volume: {
                  select: { volumeNo: true }
                }
              }
            }
          }
        }
      },
      orderBy: {
        article: { publishedAt: 'desc' }
      },
      take: 1000 // Giới hạn 1000 bản ghi
    });

    // Tạo workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Tap chi Dien tu Khoa hoc Hau can quan su';
    workbook.created = new Date();

    // Tạo sheet chính
    const sheet = workbook.addWorksheet('Danh sach bai bao', {
      properties: { tabColor: { argb: '10B981' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
    });

    // Định nghĩa cột
    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã bài', key: 'code', width: 18 },
      { header: 'Tiêu đề', key: 'title', width: 60 },
      { header: 'Tác giả', key: 'author', width: 25 },
      { header: 'Đơn vị', key: 'org', width: 35 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Danh mục', key: 'category', width: 25 },
      { header: 'Tập', key: 'volume', width: 10 },
      { header: 'Số', key: 'issue', width: 10 },
      { header: 'Năm', key: 'year', width: 10 },
      { header: 'Ngày xuất bản', key: 'publishedAt', width: 18 },
      { header: 'DOI', key: 'doi', width: 25 },
      { header: 'Lượt xem', key: 'views', width: 12 },
      { header: 'Lượt tải', key: 'downloads', width: 12 },
      { header: 'Từ khóa', key: 'keywords', width: 50 },
    ];

    // Định dạng header
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '10B981' } // emerald-500
    };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    sheet.getRow(1).height = 20;

    // Thêm dữ liệu
    submissions.forEach((sub, index) => {
      const row = sheet.addRow({
        stt: index + 1,
        code: sub.code,
        title: sub.title,
        author: sub.author.fullName,
        org: sub.author.org || '-',
        email: sub.author.email,
        category: sub.category?.name || '-',
        volume: sub.article?.issue?.volume?.volumeNo || '-',
        issue: sub.article?.issue?.number || '-',
        year: sub.article?.issue?.year || '-',
        publishedAt: sub.article?.publishedAt 
          ? new Date(sub.article.publishedAt).toLocaleDateString('vi-VN')
          : '-',
        doi: sub.article?.doiLocal || '-',
        views: sub.article?.views || 0,
        downloads: sub.article?.downloads || 0,
        keywords: sub.keywords.join(', ')
      });

      // Định dạng dòng chẵn/lẻ
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F0FDF4' } // emerald-50
        };
      }

      // Wrap text cho cột tiêu đề và từ khóa
      row.getCell('title').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('keywords').alignment = { wrapText: true, vertical: 'top' };
    });

    // Tạo sheet thống kê
    const statsSheet = workbook.addWorksheet('Thong ke', {
      properties: { tabColor: { argb: '3B82F6' } }
    });

    statsSheet.columns = [
      { header: 'Chỉ tiêu', key: 'metric', width: 30 },
      { header: 'Giá trị', key: 'value', width: 20 }
    ];

    // Header
    statsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    statsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '3B82F6' }
    };

    // Thống kê
    const stats = [
      { metric: 'Tổng số bài báo', value: submissions.length },
      { 
        metric: 'Tổng lượt xem', 
        value: submissions.reduce((sum, s) => sum + (s.article?.views || 0), 0) 
      },
      { 
        metric: 'Tổng lượt tải', 
        value: submissions.reduce((sum, s) => sum + (s.article?.downloads || 0), 0) 
      },
      { 
        metric: 'Số danh mục', 
        value: new Set(submissions.map(s => s.category?.name).filter(Boolean)).size 
      },
      { 
        metric: 'Số tác giả', 
        value: new Set(submissions.map(s => s.author.fullName)).size 
      },
      { metric: 'Ngày xuất báo cáo', value: new Date().toLocaleString('vi-VN') }
    ];

    stats.forEach(stat => statsSheet.addRow(stat));

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const fileName = `bao-cao-bai-bao-${new Date().getTime()}.xlsx`;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('Excel Export Error:', error);
    return errorResponse('Lỗi khi xuất Excel: ' + error.message, 500);
  }
}
