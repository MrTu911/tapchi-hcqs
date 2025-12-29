
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { auditLogger, AuditEventType, logAudit } from '@/lib/audit-logger';
import { uploadFile } from '@/lib/s3';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const volumeId = searchParams.get('volumeId');
    const status = searchParams.get('status');
    const published = searchParams.get('published') === 'true';
    const limit = searchParams.get('limit');
    const includeArticles = searchParams.get('includeArticles') === 'true';

    // Build query conditions
    const where: any = {};
    if (volumeId) {
      where.volumeId = volumeId;
    }
    if (status) {
      where.status = status;
    }
    if (published) {
      where.status = 'PUBLISHED';
      where.publishDate = {
        lte: new Date()
      };
    }

    // Build include options
    const include: any = {
      volume: true,
      _count: {
        select: { articles: true }
      }
    };

    // Include articles with submission details if requested
    if (includeArticles) {
      include.articles = {
        include: {
          submission: {
            include: {
              author: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  org: true
                }
              },
              category: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        }
      };
    }

    const issues = await prisma.issue.findMany({
      where,
      include,
      orderBy: [
        { year: 'desc' },
        { number: 'desc' }
      ],
      take: limit ? parseInt(limit) : undefined
    });

    return NextResponse.json({
      success: true,
      data: issues,
      issues // Keep for backward compatibility
    });
  } catch (error) {
    console.error('Issues fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['MANAGING_EDITOR', 'EIC', 'SYSADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentType = request.headers.get('content-type') || '';
    
    let volumeNo: number;
    let number: number;
    let year: number;
    let title: string | null;
    let description: string | null;
    let doi: string | null;
    let publishDate: Date | null;
    let status: string;
    let coverImagePath: string | null = null;
    let pdfPath: string | null = null;

    // Handle FormData (with file uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      volumeNo = parseInt(formData.get('volumeNo') as string);
      number = parseInt(formData.get('number') as string);
      year = parseInt(formData.get('year') as string);
      title = formData.get('title') as string || null;
      description = formData.get('description') as string || null;
      doi = formData.get('doi') as string || null;
      publishDate = formData.get('publishDate') ? new Date(formData.get('publishDate') as string) : null;
      status = formData.get('status') as string || 'DRAFT';

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
        const key = `issues/covers/${year}-${number}-${timestamp}-${coverImageFile.name}`;
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
        const key = `issues/pdfs/${year}-${number}-${timestamp}-${pdfFile.name}`;
        pdfPath = await uploadFile(buffer, key, pdfFile.type);
      }
    } else {
      // Handle JSON (backward compatibility)
      const body = await request.json();
      volumeNo = body.volumeNo;
      number = body.number;
      year = body.year;
      title = body.title || null;
      description = body.description || null;
      coverImagePath = body.coverImage || null;
      pdfPath = body.pdfUrl || null;
      doi = body.doi || null;
      publishDate = body.publishDate ? new Date(body.publishDate) : null;
      status = body.status || 'DRAFT';
    }

    if (!volumeNo || !number || !year) {
      return NextResponse.json(
        { error: 'Số tập, số báo và năm là bắt buộc' },
        { status: 400 }
      );
    }

    // Find or create volume based on volumeNo
    let volume = await prisma.volume.findUnique({
      where: { volumeNo: volumeNo }
    });

    if (!volume) {
      // Create volume if it doesn't exist
      volume = await prisma.volume.create({
        data: {
          volumeNo: volumeNo,
          title: `Tập ${volumeNo}`,
          year: year
        }
      });
    }

    // Check if issue already exists for this volume
    const existingIssue = await prisma.issue.findUnique({
      where: {
        volumeId_number: {
          volumeId: volume.id,
          number: number
        }
      }
    });

    if (existingIssue) {
      return NextResponse.json(
        { error: 'Số tạp chí này đã tồn tại trong tập này' },
        { status: 409 }
      );
    }

    const issue = await prisma.issue.create({
      data: {
        volumeId: volume.id,
        number: number,
        year: year,
        title: title,
        description: description,
        coverImage: coverImagePath,
        pdfUrl: pdfPath,
        doi: doi,
        publishDate: publishDate,
        status: status as 'DRAFT' | 'PUBLISHED'
      },
      include: {
        volume: true
      }
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: 'ISSUE_CREATE',
      object: `Issue:${issue.id}`,
      after: issue,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    });

    return NextResponse.json({
      success: true,
      data: issue,
      issue // Keep for backward compatibility
    }, { status: 201 });
  } catch (error) {
    console.error('Issue creation error:', error);
    return NextResponse.json(
      { error: 'Lỗi tạo số tạp chí: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
