/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

// In-memory store (consider Redis for production with multiple instances)
const store = new Map<string, RateLimitStore>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (value.resetTime < now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Custom identifier function (defaults to IP address) */
  getIdentifier?: (request: NextRequest) => string;
}

/**
 * Rate limit middleware
 * Returns null if allowed, NextResponse with 429 if rate limited
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const identifier = config.getIdentifier
      ? config.getIdentifier(request)
      : getClientIp(request);
    
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    
    const key = `${identifier}:${request.url}`;
    const record = store.get(key);
    
    if (!record || record.resetTime < now) {
      // New window or expired
      store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return null; // Allow request
    }
    
    if (record.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${retryAfter} seconds.`,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': record.resetTime.toString(),
          },
        }
      );
    }
    
    // Increment counter
    record.count++;
    store.set(key, record);
    
    return null; // Allow request
  };
}

/**
 * Get client IP address from request
 */
function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For header (set by proxies like Nginx)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // Check X-Real-IP header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to 'unknown'
  return 'unknown';
}

/**
 * Common rate limit configurations
 */
export const RateLimitPresets = {
  /** Strict: 10 requests per minute */
  strict: { maxRequests: 10, windowSeconds: 60 },
  
  /** Standard: 60 requests per minute */
  standard: { maxRequests: 60, windowSeconds: 60 },
  
  /** Lenient: 120 requests per minute */
  lenient: { maxRequests: 120, windowSeconds: 60 },
  
  /** Upload: 10 requests per 5 minutes */
  upload: { maxRequests: 10, windowSeconds: 300 },
  
  /** Auth: 5 attempts per 15 minutes */
  auth: { maxRequests: 5, windowSeconds: 900 },
};
