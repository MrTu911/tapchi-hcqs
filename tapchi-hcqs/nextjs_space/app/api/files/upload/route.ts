
import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/s3';
import { getServerSession } from '@/lib/auth';
// import { extractPdfMetadata, PdfMetadata } from '@/lib/pdf-metadata';

/**
 * API Upload file to S3
 * POST /api/files/upload
 * Accepts multipart/form-data with 'file' field
 * Returns: { success: true, url: string, cloud_storage_path: string, metadata?: PdfMetadata }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication using JWT
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, GIF, PDF'
        },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract PDF metadata if it's a PDF file
    // let pdfMetadata: PdfMetadata | undefined;
    // if (file.type === 'application/pdf') {
    //   try {
    //     pdfMetadata = await extractPdfMetadata(buffer);
    //     console.log('Extracted PDF metadata:', pdfMetadata);
    //   } catch (error) {
    //     console.error('Error extracting PDF metadata:', error);
    //     // Continue with upload even if metadata extraction fails
    //   }
    // }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedName}`;
    const s3Key = `${folder}/${fileName}`;

    // Upload to S3
    const cloud_storage_path = await uploadFile(buffer, s3Key, file.type);

    // Generate public URL (we'll use signed URL for downloads)
    // For now, just return the cloud_storage_path
    const publicUrl = `/api/files/download?path=${encodeURIComponent(cloud_storage_path)}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      cloud_storage_path,
      fileName,
      fileSize: file.size,
      fileType: file.type,
      // metadata: pdfMetadata // Include PDF metadata if available
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

