
/**
 * Auth utilities for Edge Runtime (Middleware)
 * Uses jose library which is compatible with Edge Runtime
 */
import { jwtVerify } from 'jose'

export interface JWTPayload {
  uid: string
  role: string
  email: string
  fullName: string
  iat?: number
  exp?: number
}

function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('❌ CRITICAL: JWT_SECRET must be set in environment variables')
  }
  return new TextEncoder().encode(secret)
}

export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getJWTSecret()
    const { payload } = await jwtVerify(token, secret)
    
    return {
      uid: payload.uid as string,
      role: payload.role as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      iat: payload.iat,
      exp: payload.exp
    }
  } catch (error: any) {
    // Token invalid or expired
    console.error('Token verification failed:', error.message)
    return null
  }
}
