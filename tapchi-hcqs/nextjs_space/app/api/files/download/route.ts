

import { NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth'
import { errorResponse } from '@/lib/responses'
import { getDownloadUrl } from '@/lib/s3'
import { redirect } from 'next/navigation'

/**
 * GET /api/files/download?key=...
 * Download file from S3 using signed URL
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.uid) {
      return errorResponse('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return errorResponse('Missing file key', 400)
    }

    // Generate signed URL
    const signedUrl = await getDownloadUrl(key, 3600) // 1 hour expiry

    // Redirect to signed URL
    return redirect(signedUrl)
  } catch (error: any) {
    console.error('File download error:', error)
    return errorResponse(error.message || 'Lỗi khi tải file')
  }
}
