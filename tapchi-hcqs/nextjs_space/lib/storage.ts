

import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'
import { uploadFile as uploadS3, getDownloadUrl as getS3Url, deleteFile as deleteS3 } from './s3'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

export interface StorageResult {
  storage: 's3' | 'local'
  key: string
  url?: string
}

/**
 * ✅ Storage Adapter với fallback Local
 * Nếu có AWS config → dùng S3
 * Nếu không → lưu local và trả URL local
 */
export async function saveFile(
  buffer: Buffer, 
  originalName: string, 
  contentType?: string
): Promise<StorageResult> {
  // Kiểm tra xem có cấu hình S3 không
  const hasS3Config = process.env.AWS_BUCKET_NAME && process.env.AWS_BUCKET_NAME.trim() !== ''
  
  if (hasS3Config) {
    try {
      // Tạo S3 key với timestamp và UUID
      const ext = path.extname(originalName) || ''
      const timestamp = Date.now()
      const uuid = crypto.randomUUID()
      const key = `assets/${timestamp}-${uuid}${ext}`
      
      const s3Key = await uploadS3(buffer, key, contentType)
      
      return { 
        storage: 's3', 
        key: s3Key,
        url: `/api/files/download?key=${encodeURIComponent(s3Key)}`
      }
    } catch (error) {
      console.error('S3 upload failed, falling back to local storage:', error)
      // Fallback to local nếu S3 fail
    }
  }
  
  // Fallback: Lưu file local
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  
  const ext = path.extname(originalName) || ''
  const timestamp = Date.now()
  const uuid = crypto.randomUUID()
  const safeName = `${timestamp}-${uuid}${ext}`
  const fullPath = path.join(UPLOAD_DIR, safeName)
  
  await fs.writeFile(fullPath, buffer)
  
  return { 
    storage: 'local', 
    key: `local/${safeName}`,
    url: `/api/files/download?key=${encodeURIComponent(`local/${safeName}`)}`
  }
}

/**
 * Lấy URL để download file
 */
export async function getFileUrl(key: string, expiresIn: number = 3600): Promise<string> {
  if (key.startsWith('local/')) {
    // Local file
    return `/api/files/download?key=${encodeURIComponent(key)}`
  }
  
  // S3 file - tạo signed URL
  const hasS3Config = process.env.AWS_BUCKET_NAME && process.env.AWS_BUCKET_NAME.trim() !== ''
  if (hasS3Config) {
    try {
      return await getS3Url(key, expiresIn)
    } catch (error) {
      console.error('Failed to generate S3 signed URL:', error)
      throw error
    }
  }
  
  throw new Error('Cannot generate URL: No S3 config and not a local file')
}

/**
 * Xóa file
 */
export async function removeFile(key: string): Promise<void> {
  if (key.startsWith('local/')) {
    // Local file
    const fileName = key.replace('local/', '')
    const fullPath = path.join(UPLOAD_DIR, fileName)
    try {
      await fs.unlink(fullPath)
    } catch (error) {
      console.error('Failed to delete local file:', error)
    }
  } else {
    // S3 file
    const hasS3Config = process.env.AWS_BUCKET_NAME && process.env.AWS_BUCKET_NAME.trim() !== ''
    if (hasS3Config) {
      try {
        await deleteS3(key)
      } catch (error) {
        console.error('Failed to delete S3 file:', error)
      }
    }
  }
}

/**
 * Đọc file local
 */
export async function readLocalFile(key: string): Promise<Buffer> {
  if (!key.startsWith('local/')) {
    throw new Error('Not a local file')
  }
  
  const fileName = key.replace('local/', '')
  const fullPath = path.join(UPLOAD_DIR, fileName)
  
  return await fs.readFile(fullPath)
}

/**
 * Tính SHA-256 checksum
 */
export function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}
