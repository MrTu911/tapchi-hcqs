

/**
 * ✅ Giai đoạn 2: Rate Limiter với Redis support
 * - Nếu có Redis: dùng Redis (better cho production, multi-instance)
 * - Nếu không: fallback to in-memory Map (đủ cho single instance)
 */

import { Redis } from '@upstash/redis'

// In-memory fallback
const memoryStore = new Map<string, { count: number; timestamp: number }>()

// Redis client (lazy init)
let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN
  
  if (!redisUrl || !redisToken) {
    return null
  }
  
  try {
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken
    })
    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    return null
  }
}

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number
  keyPrefix?: string
}

export interface RateLimitResult {
  limited: boolean
  remaining: number
  resetAt: Date
}

/**
 * Check rate limit cho một key (IP, user ID, etc.)
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, keyPrefix = 'ratelimit' } = options
  const fullKey = `${keyPrefix}:${key}`
  const redis = getRedisClient()
  
  if (redis) {
    // Sử dụng Redis
    return await checkRateLimitRedis(redis, fullKey, maxRequests, windowMs)
  } else {
    // Fallback to in-memory
    return checkRateLimitMemory(fullKey, maxRequests, windowMs)
  }
}

/**
 * Redis implementation (atomic, distributed)
 */
async function checkRateLimitRedis(
  redis: Redis,
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowKey = `${key}:${Math.floor(now / windowMs)}`
  
  try {
    // Sử dụng INCR để atomic increment
    const count = await redis.incr(windowKey)
    
    // Set expiration nếu là lần đầu
    if (count === 1) {
      await redis.expire(windowKey, Math.ceil(windowMs / 1000))
    }
    
    const remaining = Math.max(0, maxRequests - count)
    const resetAt = new Date(Math.ceil(now / windowMs) * windowMs + windowMs)
    
    return {
      limited: count > maxRequests,
      remaining,
      resetAt
    }
  } catch (error) {
    console.error('Redis rate limit error:', error)
    // Fallback to memory on error
    return checkRateLimitMemory(key, maxRequests, windowMs)
  }
}

/**
 * In-memory implementation (simple, single-instance only)
 */
function checkRateLimitMemory(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const record = memoryStore.get(key)
  
  let count = 1
  let timestamp = now
  
  if (record) {
    // Reset nếu hết window
    if (now - record.timestamp > windowMs) {
      timestamp = now
      count = 1
    } else {
      timestamp = record.timestamp
      count = record.count + 1
    }
  }
  
  memoryStore.set(key, { count, timestamp })
  
  const remaining = Math.max(0, maxRequests - count)
  const resetAt = new Date(timestamp + windowMs)
  
  return {
    limited: count > maxRequests,
    remaining,
    resetAt
  }
}

/**
 * Cleanup in-memory store (chỉ cần khi không dùng Redis)
 */
export function cleanupMemoryStore(maxAgeMs: number = 300_000) {
  const redis = getRedisClient()
  if (redis) return // Không cần cleanup khi dùng Redis
  
  const now = Date.now()
  for (const [key, record] of memoryStore.entries()) {
    if (now - record.timestamp > maxAgeMs) {
      memoryStore.delete(key)
    }
  }
}

// Auto cleanup mỗi 5 phút
if (typeof window === 'undefined') {
  // Chỉ chạy trên server
  setInterval(() => cleanupMemoryStore(), 300_000)
}
