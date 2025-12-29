import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth';
import { errorResponse } from '@/lib/responses';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Module 3: Export PDF Report API
 * Endpoint: GET /api/export/pdf?filters=...
 * 
 * Xuất danh sách bài báo thành file PDF
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
          select: { fullName: true, org: true }
        },
        category: {
          select: { name: true }
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
      take: 500 // Giới hạn 500 bản ghi
    });

    // Tạo PDF
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Font support for Vietnamese (fallback to basic Latin)
    // Trong production, nên tích hợp font tiếng Việt
    
    // Tiêu đề
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('BAO CAO DANH SACH BAI BAO KHOA HOC', 148, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Tap chi Dien tu Khoa hoc Hau can quan su`, 148, 22, { align: 'center' });
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, 148, 28, { align: 'center' });

    // Thông tin bộ lọc
    if (Object.keys(filters).length > 0) {
      doc.setFontSize(9);
      doc.text(`Bo loc: ${JSON.stringify(filters, null, 2)}`, 14, 35);
    }

    // Chuẩn bị dữ liệu cho bảng
    const tableData = submissions.map((sub, index) => [
      (index + 1).toString(),
      sub.title.substring(0, 80) + (sub.title.length > 80 ? '...' : ''),
      sub.author.fullName,
      sub.author.org || '-',
      sub.category?.name || '-',
      sub.article?.issue 
        ? `${sub.article.issue.number}/${sub.article.issue.year}`
        : '-',
      sub.article?.publishedAt 
        ? new Date(sub.article.publishedAt).toLocaleDateString('vi-VN')
        : '-',
      sub.article?.doiLocal || '-'
    ]);

    // Tạo bảng
    autoTable(doc, {
      startY: 45,
      head: [[
        'STT',
        'Tieu de',
        'Tac gia',
        'Don vi',
        'Danh muc',
        'So/Nam',
        'Ngay XB',
        'DOI'
      ]],
      body: tableData,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [16, 185, 129], // emerald-500
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 253, 250] // emerald-50
      },
      columnStyles: {
        0: { cellWidth: 10 },  // STT
        1: { cellWidth: 70 },  // Tiêu đề
        2: { cellWidth: 40 },  // Tác giả
        3: { cellWidth: 40 },  // Đơn vị
        4: { cellWidth: 30 },  // Danh mục
        5: { cellWidth: 20 },  // Số/Năm
        6: { cellWidth: 25 },  // Ngày XB
        7: { cellWidth: 35 },  // DOI
      },
      margin: { left: 14, right: 14 },
    });

    // Thêm footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Trang ${i} / ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Xuất file
    const pdfBytes = doc.output('arraybuffer');
    const fileName = `bao-cao-bai-bao-${new Date().getTime()}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error: any) {
    console.error('PDF Export Error:', error);
    return errorResponse('Lỗi khi xuất PDF: ' + error.message, 500);
  }
}
