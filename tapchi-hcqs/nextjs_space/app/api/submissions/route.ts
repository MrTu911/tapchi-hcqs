/**
 * Submissions API Route
 * Enhanced with error handling, validation, and logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { handleError, ValidationError, assertExists } from '@/lib/error-handler';
import { requireAuth, requireAuthor } from '@/lib/api-guards';
import { createSubmissionSchema } from '@/lib/validators';

/**
 * POST /api/submissions
 * Create a new submission
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and authorize
    const session = await requireAuthor(request);
    
    logger.api('POST', '/api/submissions', { userId: session.user.id });

    // 2. Validate content-type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      throw new ValidationError('Yêu cầu multipart/form-data để tải lên file');
    }

    // 3. Parse form data
    const formData = await request.formData();
    const title = formData.get('title') as string;
    const abstractVn = formData.get('abstractVn') as string;
    const abstractEn = formData.get('abstractEn') as string;
    const keywords = formData.get('keywords') as string;
    const categoryId = formData.get('categoryId') as string;
    const securityLevel = (formData.get('securityLevel') as string) || 'PUBLIC';
    const file = formData.get('file') as File;

    // 4. Validate with Zod schema
    const validatedData = createSubmissionSchema.parse({
      title,
      abstract: abstractVn,
      abstractEn,
      keywords,
      categoryId,
      securityLevel,
    });

    logger.debug({
      context: 'SUBMISSION_CREATE',
      userId: session.user.id,
      title: title?.substring(0, 50),
    });

    // 5. Validate file
    if (!file) {
      throw new ValidationError('Vui lòng tải lên file bản thảo');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new ValidationError('Kích thước file vượt quá 10MB');
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Chỉ chấp nhận file PDF, DOC, DOCX');
    }

    // 6. Generate submission code
    const year = new Date().getFullYear();
    const count = await prisma.submission.count();
    const code = `MS-${year}-${String(count + 1).padStart(4, '0')}`;

    // 7. Parse keywords
    const keywordArray = keywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    // 8. Handle file upload
    let uploadedFileId: string | null = null;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { saveFile } = await import('@/lib/storage');
      const savedFile = await saveFile(buffer, file.name, file.type);

      const uploadedFile = await prisma.uploadedFile.create({
        data: {
          originalName: file.name,
          cloudStoragePath: savedFile.key,
          fileType: 'MANUSCRIPT',
          mimeType: file.type,
          fileSize: file.size,
          uploadedBy: session.user.id,
          description: 'Bản thảo bài viết',
        },
      });

      uploadedFileId = uploadedFile.id;
      
      logger.info({
        context: 'FILE_UPLOAD',
        fileId: uploadedFileId,
        fileName: file.name,
        fileSize: file.size,
        userId: session.user.id,
      });
    } catch (fileError) {
      logger.error({
        context: 'FILE_UPLOAD_ERROR',
        error: fileError instanceof Error ? fileError.message : String(fileError),
        userId: session.user.id,
      });
      throw new ValidationError('Không thể tải lên file. Vui lòng thử lại.');
    }

    // 9. Create submission
    const submission = await prisma.submission.create({
      data: {
        code,
        title: validatedData.title,
        abstractVn: validatedData.abstract,
        abstractEn: validatedData.abstractEn || null,
        keywords: keywordArray,
        status: 'NEW',
        securityLevel: validatedData.securityLevel as any,
        categoryId: validatedData.categoryId,
        createdBy: session.user.id,
        files: uploadedFileId
          ? {
              connect: { id: uploadedFileId },
            }
          : undefined,
      },
      include: {
        category: true,
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        files: true,
      },
    });

    // 10. Create audit log
    try {
      await prisma.auditLog.create({
        data: {
          actorId: session.user.id,
          action: 'CREATE_SUBMISSION',
          object: `submission:${submission.id}`,
          after: submission as any,
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
        },
      });
    } catch (auditError) {
      logger.error({
        context: 'AUDIT_LOG_ERROR',
        error: auditError instanceof Error ? auditError.message : String(auditError),
      });
      // Non-critical, continue
    }

    logger.info({
      context: 'SUBMISSION_CREATED',
      submissionId: submission.id,
      code: submission.code,
      userId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error) {
    return handleError(error, 'API_SUBMISSIONS_POST');
  }
}

/**
 * GET /api/submissions
 * List submissions with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const session = await requireAuth(request);

    logger.api('GET', '/api/submissions', { userId: session.user.id });

    // 2. Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    // 3. Build where clause
    const where: any = {};

    // Filter by role - Authors only see their own submissions
    if (session.user.role === 'AUTHOR') {
      where.createdBy = session.user.id;
    }

    if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    // 4. Fetch submissions with pagination
    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        include: {
          category: true,
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          reviews: true,
          decisions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    logger.debug({
      context: 'SUBMISSIONS_FETCHED',
      userId: session.user.id,
      count: submissions.length,
      total,
    });

    return NextResponse.json({
      success: true,
      submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error, 'API_SUBMISSIONS_GET');
  }
}
