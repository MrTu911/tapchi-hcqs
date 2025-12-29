
/**
 * Signup endpoint - Required by NextAuth integration
 * This is an alias/redirect to /api/auth/register
 */
import { NextRequest } from 'next/server'
import { POST as registerHandler } from '../auth/register/route'

export async function POST(request: NextRequest) {
  return registerHandler(request)
}
