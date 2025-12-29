
/**
 * ✅ COMPREHENSIVE INPUT VALIDATION & SANITIZATION SYSTEM
 * Bảo vệ chống XSS, SQL Injection, Command Injection
 * Tuân thủ OWASP Top 10 Security Practices
 */

import { z } from 'zod'
import { NextRequest } from 'next/server'

// ==================== XSS PROTECTION ====================

/**
 * Sanitize HTML input to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Sanitize user input (không HTML)
 */
export function sanitizeInput(input: string): string {
  if (!input) return ''
  
  // Loại bỏ ký tự nguy hiểm
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove inline event handlers
    .replace(/javascript:/gi, '')
    .replace(/data:text\/html/gi, '')
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[^\w\-@.+]/g, '') // Only allow valid email characters
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''
  
  return filename
    .replace(/[^\w\s.-]/g, '') // Remove special characters
    .replace(/\.{2,}/g, '.') // Remove consecutive dots
    .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
    .trim()
}

// ==================== VALIDATION SCHEMAS ====================

/**
 * User Registration Schema
 */
export const registerSchema = z.object({
  email: z.string()
    .email('Email không hợp lệ')
    .min(5, 'Email phải có ít nhất 5 ký tự')
    .max(100, 'Email không được vượt quá 100 ký tự')
    .transform(sanitizeEmail),
  
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải có ít nhất 1 chữ hoa')
    .regex(/[a-z]/, 'Mật khẩu phải có ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Mật khẩu phải có ít nhất 1 số')
    .regex(/[^A-Za-z0-9]/, 'Mật khẩu phải có ít nhất 1 ký tự đặc biệt'),
  
  fullName: z.string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được vượt quá 100 ký tự')
    .transform(sanitizeInput),
  
  org: z.string()
    .min(2, 'Tên tổ chức phải có ít nhất 2 ký tự')
    .max(200, 'Tên tổ chức không được vượt quá 200 ký tự')
    .transform(sanitizeInput)
    .optional(),
  
  phone: z.string()
    .min(10, 'Số điện thoại phải có ít nhất 10 ký tự')
    .max(15, 'Số điện thoại không được vượt quá 15 ký tự')
    .regex(/^[0-9+\-\s()]+$/, 'Số điện thoại không hợp lệ')
    .optional(),
  
  academicTitle: z.string()
    .max(100, 'Học hàm không được vượt quá 100 ký tự')
    .transform(sanitizeInput)
    .optional(),
  
  academicDegree: z.string()
    .max(100, 'Học vị không được vượt quá 100 ký tự')
    .transform(sanitizeInput)
    .optional(),
  
  position: z.string()
    .max(100, 'Chức vụ không được vượt quá 100 ký tự')
    .transform(sanitizeInput)
    .optional(),
  
  rank: z.string()
    .max(100, 'Cấp bậc không được vượt quá 100 ký tự')
    .transform(sanitizeInput)
    .optional(),
  
  cvUrl: z.string()
    .url('URL không hợp lệ')
    .optional(),
  
  role: z.enum([
    'READER', 
    'AUTHOR', 
    'REVIEWER', 
    'SECTION_EDITOR',
    'MANAGING_EDITOR', 
    'EIC', 
    'LAYOUT_EDITOR', 
    'SYSADMIN', 
    'SECURITY_AUDITOR'
  ]).optional()
})

/**
 * Login Schema
 */
export const loginSchema = z.object({
  email: z.string()
    .email('Email không hợp lệ')
    .transform(sanitizeEmail),
  
  password: z.string()
    .min(1, 'Mật khẩu không được để trống')
})

/**
 * Submission Schema
 */
export const submissionSchema = z.object({
  title: z.string()
    .min(10, 'Tiêu đề phải có ít nhất 10 ký tự')
    .max(500, 'Tiêu đề không được vượt quá 500 ký tự')
    .transform(sanitizeInput),
  
  abstract: z.string()
    .min(100, 'Tóm tắt phải có ít nhất 100 ký tự')
    .max(5000, 'Tóm tắt không được vượt quá 5000 ký tự'),
  
  keywords: z.array(z.string().transform(sanitizeInput))
    .min(3, 'Phải có ít nhất 3 từ khóa')
    .max(10, 'Không được vượt quá 10 từ khóa'),
  
  categoryId: z.string().uuid('Category ID không hợp lệ'),
  
  authors: z.array(z.object({
    name: z.string().min(2).max(100).transform(sanitizeInput),
    email: z.string().email().transform(sanitizeEmail),
    org: z.string().min(2).max(200).transform(sanitizeInput),
    isCorresponding: z.boolean()
  })).min(1, 'Phải có ít nhất 1 tác giả')
})

/**
 * Review Schema
 */
export const reviewSchema = z.object({
  submissionId: z.string().uuid('Submission ID không hợp lệ'),
  
  recommendation: z.enum([
    'ACCEPT',
    'MINOR_REVISION',
    'MAJOR_REVISION',
    'REJECT'
  ]),
  
  comments: z.string()
    .min(100, 'Nhận xét phải có ít nhất 100 ký tự')
    .max(10000, 'Nhận xét không được vượt quá 10000 ký tự'),
  
  confidentialComments: z.string()
    .max(5000, 'Nhận xét riêng không được vượt quá 5000 ký tự')
    .optional()
})

/**
 * File Upload Schema
 */
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Tên file không được để trống')
    .max(255, 'Tên file quá dài')
    .transform(sanitizeFilename),
  
  size: z.number()
    .max(50 * 1024 * 1024, 'File không được vượt quá 50MB'), // 50MB limit
  
  mimeType: z.string()
    .refine(
      (type) => ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(type),
      'Chỉ chấp nhận file PDF hoặc Word'
    )
})

/**
 * Search Query Schema
 */
export const searchSchema = z.object({
  query: z.string()
    .min(1, 'Từ khóa tìm kiếm không được để trống')
    .max(500, 'Từ khóa tìm kiếm quá dài')
    .transform(sanitizeInput),
  
  page: z.number()
    .int()
    .min(1, 'Số trang phải lớn hơn 0')
    .max(10000, 'Số trang quá lớn')
    .optional()
    .default(1),
  
  limit: z.number()
    .int()
    .min(1, 'Số kết quả phải lớn hơn 0')
    .max(100, 'Số kết quả không được vượt quá 100')
    .optional()
    .default(20)
})

// ==================== VALIDATION HELPERS ====================

/**
 * Validate request body against a schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }
    }
    return {
      success: false,
      error: 'Invalid request body'
    }
  }
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  params: Record<string, any>,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      }
    }
    return {
      success: false,
      error: 'Invalid query parameters'
    }
  }
}

/**
 * Validate UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Prevent path traversal attacks
 */
export function preventPathTraversal(path: string): boolean {
  const dangerousPatterns = [
    '../',
    '..\\',
    './',
    '.\\',
    '%2e%2e',
    '%252e%252e',
    '..%2f',
    '..%5c'
  ]
  
  const lowerPath = path.toLowerCase()
  return !dangerousPatterns.some(pattern => lowerPath.includes(pattern))
}

/**
 * Check for SQL injection patterns
 */
export function containsSqlInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;|\||&|`)/,
    /(--|\#|\/\*|\*\/)/
  ]
  
  return sqlPatterns.some(pattern => pattern.test(input))
}

/**
 * Check for command injection patterns
 */
export function containsCommandInjection(input: string): boolean {
  const commandPatterns = [
    /[;&|`$\(\)]/,
    /(\bsh\b|\bbash\b|\bcmd\b|\bpowershell\b)/i
  ]
  
  return commandPatterns.some(pattern => pattern.test(input))
}
