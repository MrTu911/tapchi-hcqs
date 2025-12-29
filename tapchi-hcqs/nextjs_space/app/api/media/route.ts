import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3';
import { successResponse, errorResponse } from '@/lib/responses';
import { logAudit, AuditEventType } from '@/lib/audit-logger';
import sharp from 'sharp';

/**
 * GET /api/media
 * List all media files with pagination and search
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const fileType = searchParams.get('fileType') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { altText: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (fileType) {
      where.fileType = { startsWith: fileType }; // e.g., 'image/', 'video/'
    }

    // Fetch media with pagination
    const [media, totalCount] = await Promise.all([
      prisma.media.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileType: true,
          fileSize: true,
          cloudStoragePath: true,
          altText: true,
          title: true,
          description: true,
          category: true,
          width: true,
          height: true,
          isPublic: true,
          uploadedBy: true,
          usageCount: true,
          lastUsedAt: true,
          createdAt: true,
        },
      }),
      prisma.media.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: media,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching media:', error);
    return errorResponse(error.message || 'Failed to fetch media', 500);
  }
}

/**
 * POST /api/media
 * Upload a new media file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    // Check authorization - Only editors and admins can upload
    const allowedRoles = ['SYSADMIN', 'EIC', 'MANAGING_EDITOR', 'SECTION_EDITOR'];
    if (!allowedRoles.includes(session.role)) {
      return errorResponse('Forbidden: Insufficient permissions', 403);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as string) || 'general';
    const altText = (formData.get('altText') as string) || '';
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file) {
      return errorResponse('No file provided', 400);
    }

    // Validate file type (images and videos)
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    const allAllowedTypes = [...allowedImageTypes, ...allowedVideoTypes];
    
    if (!allAllowedTypes.includes(file.type)) {
      return errorResponse(
        `Invalid file type. Allowed images: ${allowedImageTypes.join(', ')}. Allowed videos: ${allowedVideoTypes.join(', ')}`,
        400
      );
    }

    // Validate file size - 10MB for images, 100MB for videos
    const isVideo = allowedVideoTypes.includes(file.type);
    const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for videos, 10MB for images
    if (file.size > maxSize) {
      return errorResponse(`File too large. Maximum size for ${isVideo ? 'videos' : 'images'}: ${maxSize / (1024 * 1024)}MB`, 400);
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get image dimensions using sharp (only for images)
    let width: number | null = null;
    let height: number | null = null;
    if (!isVideo) {
      try {
        const metadata = await sharp(buffer).metadata();
        width = metadata.width || null;
        height = metadata.height || null;
      } catch (err) {
        console.warn('Could not extract image metadata:', err);
      }
    }

    // Generate S3 key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const s3Key = `media/${category}/${timestamp}-${sanitizedFileName}`;

    // Upload to S3
    const cloudStoragePath = await uploadFile(buffer, s3Key, file.type);

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        cloudStoragePath,
        altText: altText || file.name,
        title,
        description,
        category,
        width,
        height,
        isPublic,
        uploadedBy: session.uid,
      },
    });

    // Log audit
    await logAudit({
      actorId: session.uid,
      action: AuditEventType.MEDIA_UPLOADED,
      object: 'media',
      after: {
        id: media.id,
        fileName: file.name,
        fileSize: file.size,
        category,
      },
    });

    return NextResponse.json({ data: media, message: 'Media uploaded successfully' }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading media:', error);
    return errorResponse(error.message || 'Failed to upload media', 500);
  }
}
