
/**
 * ✅ CSRF Token API
 * Endpoint to get CSRF token for client-side requests
 */

import { NextRequest } from 'next/server'
import { handleCsrfTokenRequest } from '@/lib/csrf'

export async function GET(request: NextRequest) {
  return handleCsrfTokenRequest()
}
