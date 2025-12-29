
/**
 * ✅ FILE UPLOAD SECURITY
 * Comprehensive security for file uploads
 */

import crypto from 'crypto'
import path from 'path'
import { sanitizeFilename } from './validation'

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
] as const

// File extension mapping
const MIME_TO_EXT: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
}

// Magic bytes for file type verification
const FILE_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/zip': [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
}

/**
 * File validation result
 */
export interface FileValidationResult {
  valid: boolean
  error?: string
  sanitizedFilename?: string
  secureFilename?: string
}

/**
 * Validate file upload
 */
export function validateFile(
  filename: string,
  size: number,
  mimeType: string,
  maxSize: number = 50 * 1024 * 1024 // 50MB default
): FileValidationResult {
  // Check file size
  if (size > maxSize) {
    return {
      valid: false,
      error: `File quá lớn. Kích thước tối đa: ${Math.round(maxSize / 1024 / 1024)}MB`
    }
  }
  
  if (size === 0) {
    return {
      valid: false,
      error: 'File trống không được phép'
    }
  }
  
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType as any)) {
    return {
      valid: false,
      error: 'Loại file không được hỗ trợ'
    }
  }
  
  // Sanitize filename
  const sanitized = sanitizeFilename(filename)
  if (!sanitized) {
    return {
      valid: false,
      error: 'Tên file không hợp lệ'
    }
  }
  
  // Check for double extensions (e.g., file.pdf.exe)
  const parts = sanitized.split('.')
  if (parts.length > 2) {
    return {
      valid: false,
      error: 'Tên file chứa nhiều phần mở rộng không được phép'
    }
  }
  
  // Generate secure filename
  const ext = MIME_TO_EXT[mimeType] || path.extname(sanitized).slice(1)
  const secureFilename = generateSecureFilename(ext)
  
  return {
    valid: true,
    sanitizedFilename: sanitized,
    secureFilename
  }
}

/**
 * Verify file magic bytes
 */
export function verifyFileSignature(
  buffer: Buffer,
  mimeType: string
): boolean {
  const signatures = FILE_SIGNATURES[mimeType]
  if (!signatures) {
    // If no signature defined, allow it (but log warning)
    console.warn(`⚠️ No signature verification for MIME type: ${mimeType}`)
    return true
  }
  
  return signatures.some(signature => {
    if (buffer.length < signature.length) return false
    return signature.every((byte, index) => buffer[index] === byte)
  })
}

/**
 * Generate secure filename
 */
export function generateSecureFilename(extension: string): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  return `${timestamp}-${random}.${extension}`
}

/**
 * Check if file is executable
 */
export function isExecutable(filename: string): boolean {
  const executableExtensions = [
    'exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js',
    'app', 'deb', 'rpm', 'pkg', 'dmg', 'sh', 'run'
  ]
  
  const ext = path.extname(filename).slice(1).toLowerCase()
  return executableExtensions.includes(ext)
}

/**
 * Scan for malicious content in text files
 */
export function scanTextContent(content: string): { safe: boolean; threats: string[] } {
  const threats: string[] = []
  
  // Check for script tags
  if (/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi.test(content)) {
    threats.push('Script tag detected')
  }
  
  // Check for iframe tags
  if (/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi.test(content)) {
    threats.push('Iframe tag detected')
  }
  
  // Check for javascript: protocol
  if (/javascript:/gi.test(content)) {
    threats.push('JavaScript protocol detected')
  }
  
  // Check for data: URLs with HTML
  if (/data:text\/html/gi.test(content)) {
    threats.push('Data URL with HTML detected')
  }
  
  return {
    safe: threats.length === 0,
    threats
  }
}

/**
 * Generate file metadata for database
 */
export interface FileMetadata {
  originalFilename: string
  sanitizedFilename: string
  secureFilename: string
  size: number
  mimeType: string
  hash: string
  uploadedAt: Date
}

/**
 * Create file hash (for deduplication and integrity checking)
 */
export function createFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Complete file validation with all checks
 */
export async function validateUploadedFile(
  file: File
): Promise<FileValidationResult> {
  // Basic validation
  const basicValidation = validateFile(file.name, file.size, file.type)
  if (!basicValidation.valid) {
    return basicValidation
  }
  
  // Check if executable
  if (isExecutable(file.name)) {
    return {
      valid: false,
      error: 'File thực thi không được phép upload'
    }
  }
  
  // Read file buffer for signature verification
  const buffer = Buffer.from(await file.arrayBuffer())
  
  // Verify magic bytes
  if (!verifyFileSignature(buffer, file.type)) {
    return {
      valid: false,
      error: 'File không đúng định dạng đã khai báo'
    }
  }
  
  // For text files, scan content
  if (file.type === 'text/plain') {
    const content = buffer.toString('utf8')
    const scanResult = scanTextContent(content)
    if (!scanResult.safe) {
      return {
        valid: false,
        error: `Phát hiện nội dung nguy hiểm: ${scanResult.threats.join(', ')}`
      }
    }
  }
  
  return basicValidation
}
