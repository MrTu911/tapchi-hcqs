
import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/responses';
import { uploadFile } from '@/lib/s3';
import { getSignedImageUrl } from '@/lib/image-utils';

/**
 * POST /api/news/upload-image - Upload ảnh cho rich text editor
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Chưa đăng nhập', 401);
    }

    // Kiểm tra quyền
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Không có quyền upload ảnh', 403);
    }

    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return errorResponse('Không tìm thấy file ảnh', 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)', 400);
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return errorResponse('Kích thước ảnh không được vượt quá 5MB', 400);
    }

    // Convert to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generate S3 key
    const timestamp = Date.now();
    const ext = file.name.split('.').pop();
    const s3Key = `news/images/${timestamp}-${Math.random().toString(36).substring(7)}.${ext}`;

    // Upload to S3
    const uploadedKey = await uploadFile(buffer, s3Key, file.type);
    
    // Generate signed URL (24 hours expiry)
    const signedUrl = await getSignedImageUrl(uploadedKey, 86400);

    return successResponse({
      url: signedUrl,
      key: uploadedKey
    });
  } catch (error: any) {
    console.error('Upload image error:', error);
    return errorResponse('Lỗi khi upload ảnh', 500, error.message);
  }
}
