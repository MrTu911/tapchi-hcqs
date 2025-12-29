

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger';
import { uploadFile } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        volume: true,
        articles: {
          include: {
            submission: {
              include: {
                category: true,
                author: {
                  select: {
                    id: true,
                    fullName: true,
                    org: true
                  }
                }
              }
            }
          }
        },
        _count: {
          select: { articles: true }
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: issue,
      issue // Keep for backward compatibility
    });
  } catch (error) {
    console.error('Issue fetch error:', error);
    return NextResponse.json(
      { error: 'Lỗi tải số tạp chí' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Get old data for audit
    const oldIssue = await prisma.issue.findUnique({
      where: { id }
    });

    if (!oldIssue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      );
    }

    const contentType = request.headers.get('content-type') || '';
    
    let volumeNo: number | undefined;
    let number: number | undefined;
    let year: number | undefined;
    let title: string | undefined;
    let description: string | undefined;
    let doi: string | undefined;
    let publishDate: Date | null | undefined;
    let status: string | undefined;
    let coverImagePath: string | undefined;
    let pdfPath: string | undefined;

    // Handle FormData (with file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      const volumeNoStr = formData.get('volumeNo') as string;
      const numberStr = formData.get('number') as string;
      const yearStr = formData.get('year') as string;
      
      volumeNo = volumeNoStr ? parseInt(volumeNoStr) : undefined;
      number = numberStr ? parseInt(numberStr) : undefined;
      year = yearStr ? parseInt(yearStr) : undefined;
      title = formData.get('title') as string || undefined;
      description = formData.get('description') as string || undefined;
      doi = formData.get('doi') as string || undefined;
      status = formData.get('status') as string || undefined;

      const publishDateStr = formData.get('publishDate') as string;
      if (publishDateStr) {
        publishDate = new Date(publishDateStr);
      }

      // Handle cover image upload
      const coverImageFile = formData.get('coverImage') as File | null;
      if (coverImageFile && coverImageFile.size > 0) {
        // Validate file type
        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!validImageTypes.includes(coverImageFile.type)) {
          return NextResponse.json(
            { error: 'Loại file ảnh không hợp lệ. Chỉ chấp nhận JPEG, PNG, JPG và WebP.' },
            { status: 400 }
          );
        }

        // Validate file size (max 5MB)
        if (coverImageFile.size > 5 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Kích thước ảnh vượt quá giới hạn 5MB.' },
            { status: 400 }
          );
        }

        // Upload to S3
        const buffer = Buffer.from(await coverImageFile.arrayBuffer());
        const timestamp = Date.now();
        const issueYear = year || oldIssue.year;
        const issueNumber = number || oldIssue.number;
        const key = `issues/covers/${issueYear}-${issueNumber}-${timestamp}-${coverImageFile.name}`;
        coverImagePath = await uploadFile(buffer, key, coverImageFile.type);
      }

      // Handle PDF upload
      const pdfFile = formData.get('pdfFile') as File | null;
      if (pdfFile && pdfFile.size > 0) {
        // Validate file type
        if (pdfFile.type !== 'application/pdf') {
          return NextResponse.json(
            { error: 'Loại file không hợp lệ. Chỉ chấp nhận PDF.' },
            { status: 400 }
          );
        }

        // Validate file size (max 50MB)
        if (pdfFile.size > 50 * 1024 * 1024) {
          return NextResponse.json(
            { error: 'Kích thước PDF vượt quá giới hạn 50MB.' },
            { status: 400 }
          );
        }

        // Upload to S3
        const buffer = Buffer.from(await pdfFile.arrayBuffer());
        const timestamp = Date.now();
        const issueYear = year || oldIssue.year;
        const issueNumber = number || oldIssue.number;
        const key = `issues/pdfs/${issueYear}-${issueNumber}-${timestamp}-${pdfFile.name}`;
        pdfPath = await uploadFile(buffer, key, pdfFile.type);
      }
    } else {
      // Handle JSON (backward compatibility)
      const body = await request.json();
      volumeNo = body.volumeNo;
      number = body.number;
      year = body.year;
      title = body.title;
      description = body.description;
      coverImagePath = body.coverImage;
      pdfPath = body.pdfUrl;
      doi = body.doi;
      publishDate = body.publishDate ? new Date(body.publishDate) : undefined;
      status = body.status;
    }

    // Find or create volume if volumeNo is provided
    let volumeId = oldIssue.volumeId;
    if (volumeNo) {
      let volume = await prisma.volume.findUnique({
        where: { volumeNo: volumeNo }
      });

      if (!volume) {
        volume = await prisma.volume.create({
          data: {
            volumeNo: volumeNo,
            title: `Tập ${volumeNo}`,
            year: year || oldIssue.year
          }
        });
      }
      volumeId = volume.id;
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: {
        volumeId,
        number: number !== undefined ? number : oldIssue.number,
        year: year !== undefined ? year : oldIssue.year,
        title: title !== undefined ? title : oldIssue.title,
        description: description !== undefined ? description : oldIssue.description,
        coverImage: coverImagePath !== undefined ? coverImagePath : oldIssue.coverImage,
        pdfUrl: pdfPath !== undefined ? pdfPath : oldIssue.pdfUrl,
        doi: doi !== undefined ? doi : oldIssue.doi,
        publishDate: publishDate !== undefined ? publishDate : oldIssue.publishDate,
        status: (status as 'DRAFT' | 'PUBLISHED' | undefined) || oldIssue.status
      },
      include: {
        volume: true
      }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'ISSUE_UPDATE',
      object: `Issue:${issue.id}`,
      before: oldIssue,
      after: issue,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      data: issue,
      issue // Keep for backward compatibility
    });
  } catch (error) {
    console.error('Issue update error:', error);
    return NextResponse.json(
      { error: 'Lỗi cập nhật số tạp chí: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Check if issue has articles
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        _count: {
          select: { articles: true }
        }
      }
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Không tìm thấy số tạp chí' },
        { status: 404 }
      );
    }

    if (issue._count.articles > 0) {
      return NextResponse.json(
        { error: 'Không thể xóa số tạp chí có bài báo. Vui lòng xóa bài báo trước.' },
        { status: 400 }
      );
    }

    await prisma.issue.delete({
      where: { id }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'ISSUE_DELETE',
      object: `Issue:${id}`,
      before: issue,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Xóa số tạp chí thành công'
    });
  } catch (error) {
    console.error('Issue deletion error:', error);
    return NextResponse.json(
      { error: 'Lỗi xóa số tạp chí' },
      { status: 500 }
    );
  }
}
