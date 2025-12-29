
/**
 * Tự động sinh mã bài báo theo format: HCQS-YYYYMMDD-XXX
 * Ví dụ: HCQS-20251031-001
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function generateSubmissionCode(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  
  const prefix = `HCQS-${year}${month}${day}`
  
  // Tìm số thứ tự cuối cùng trong ngày hôm nay
  const lastSubmission = await prisma.submission.findFirst({
    where: {
      code: {
        startsWith: prefix
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  let sequence = 1
  if (lastSubmission) {
    // Extract sequence number from code (HCQS-20251031-001 -> 001)
    const parts = lastSubmission.code.split('-')
    if (parts.length === 3) {
      sequence = parseInt(parts[2]) + 1
    }
  }
  
  const sequenceStr = String(sequence).padStart(3, '0')
  return `${prefix}-${sequenceStr}`
}

/**
 * Kiểm tra mã bài có hợp lệ không
 */
export function isValidSubmissionCode(code: string): boolean {
  // Format: HCQS-YYYYMMDD-XXX
  const regex = /^HCQS-\d{8}-\d{3}$/
  return regex.test(code)
}
