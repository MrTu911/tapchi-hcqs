import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { uploadFile } from '@/lib/s3';
import { successResponse, errorResponse } from '@/lib/responses';
import { prisma } from '@/lib/prisma';
import { logAudit, AuditEventType } from '@/lib/audit-logger';

/**
 * API để upload cover image hoặc PDF cho Issue
 * POST /api/issues/upload
 * Body: FormData with file and issueId
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Chỉ EIC, MANAGING_EDITOR, SYSADMIN mới được phép
    const allowedRoles = ['EIC', 'MANAGING_EDITOR', 'SYSADMIN'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền thực hiện', 403);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const issueId = formData.get('issueId') as string;
    const fileType = formData.get('fileType') as string; // 'cover' | 'pdf'

    if (!file || !issueId || !fileType) {
      return errorResponse('file, issueId và fileType là bắt buộc', 400);
    }

    // Validation file type
    if (fileType === 'cover') {
      const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        return errorResponse('File ảnh phải là JPEG, PNG hoặc WebP', 400);
      }
    } else if (fileType === 'pdf') {
      if (file.type !== 'application/pdf') {
        return errorResponse('File phải là PDF', 400);
      }
    } else {
      return errorResponse('fileType phải là "cover" hoặc "pdf"', 400);
    }

    // Kiểm tra kích thước
    const maxSize = fileType === 'cover' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB cho ảnh, 50MB cho PDF
    if (file.size > maxSize) {
      return errorResponse(
        `File quá lớn. Tối đa ${fileType === 'cover' ? '5MB' : '50MB'}`,
        400
      );
    }

    // Kiểm tra Issue tồn tại
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: { volume: true },
    });

    if (!issue) {
      return errorResponse('Không tìm thấy số tạp chí', 404);
    }

    // Convert file to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Tạo S3 key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key =
      fileType === 'cover'
        ? `issues/covers/${issue.volume.volumeNo}-${issue.number}-${timestamp}-${sanitizedFileName}`
        : `issues/pdfs/${issue.volume.volumeNo}-${issue.number}-${timestamp}-${sanitizedFileName}`;

    // Upload to S3
    const s3Path = await uploadFile(buffer, s3Key, file.type);

    // Cập nhật Issue
    const updateData: any = {};
    if (fileType === 'cover') {
      updateData.coverImage = s3Path;
    }
    // Note: PDF của Issue thường là tổng hợp của tất cả bài trong số, cần xử lý riêng
    // Ở đây ta chỉ lưu path, không có trường PDF trong Issue model hiện tại

    if (Object.keys(updateData).length > 0) {
      await prisma.issue.update({
        where: { id: issueId },
        data: updateData,
      });
    }

    // Log audit (simplified)
    await logAudit({
      actorId: session.uid,
      action: 'FILE_UPLOAD',
      object: 'Issue',
      after: {
        issueId,
        fileType,
        fileName: file.name,
        s3Path,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Upload ${fileType === 'cover' ? 'ảnh bìa' : 'PDF'} thành công`,
        data: {
          fileUrl: s3Path,
          fileName: file.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading file:', error);
    return errorResponse('Lỗi khi upload file', 500);
  }
}
