
import { NextRequest, NextResponse } from 'next/server';
import { getDownloadUrl } from '@/lib/s3';

/**
 * Image proxy route to serve S3 images
 * GET /api/images/proxy?key=<s3-key>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const s3Key = searchParams.get('key');

    if (!s3Key) {
      return NextResponse.json(
        { error: 'Missing key parameter' },
        { status: 400 }
      );
    }

    // Generate signed URL (24 hour expiry for caching)
    const signedUrl = await getDownloadUrl(decodeURIComponent(s3Key), 86400);

    // Redirect to signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error: any) {
    console.error('Image proxy error:', error);
    
    // Return placeholder on error
    return NextResponse.redirect(new URL('/images/placeholder.png', request.url));
  }
}

// Cache the response for 1 hour
export const revalidate = 3600;
