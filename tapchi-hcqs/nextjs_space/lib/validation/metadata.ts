
import { z } from 'zod'

/**
 * Schema validation for article metadata
 */
export const metadataSchema = z.object({
  title: z.string().min(5, 'Tiêu đề phải có ít nhất 5 ký tự'),
  abstract: z.string().min(30, 'Tóm tắt phải có ít nhất 30 ký tự').optional(),
  keywords: z.string().optional(),
  authors: z.string().optional(),
  affiliation: z.string().optional(),
  doi: z.string().regex(/^10\.\d{4,}\/[^\s]+$/, 'DOI không hợp lệ (ví dụ: 10.5567/hcqs.2025.123)').optional().or(z.literal('')),
  pages: z.string().regex(/^\d+-\d+$/, 'Trang phải có định dạng: số-số (ví dụ: 1-10)').optional().or(z.literal('')),
  issueId: z.string().optional(),
  publishedAt: z.string().optional()
})

export type MetadataFormData = z.infer<typeof metadataSchema>

/**
 * Generate DOI for article
 * Format: 10.5567/hcqs.{year}.{articleId}
 */
export function generateDOI(articleId: number | string, year?: number): string {
  const currentYear = year || new Date().getFullYear()
  return `10.5567/hcqs.${currentYear}.${articleId}`
}

