/**
 * Zod Validation Schemas
 * Centralized validation for all API inputs
 */

import { z } from 'zod';
import { SubmissionStatus, Recommendation, Decision } from '@prisma/client';

// ============================================================================
// Submission Schemas
// ============================================================================

export const createSubmissionSchema = z.object({
  title: z.string()
    .min(10, 'Tiêu đề phải có ít nhất 10 ký tự')
    .max(500, 'Tiêu đề không được quá 500 ký tự'),
  
  abstract: z.string()
    .min(50, 'Tóm tắt phải có ít nhất 50 ký tự')
    .max(5000, 'Tóm tắt không được quá 5000 ký tự'),
  
  abstractEn: z.string()
    .min(50, 'Tóm tắt tiếng Anh phải có ít nhất 50 ký tự')
    .max(5000, 'Tóm tắt tiếng Anh không được quá 5000 ký tự')
    .optional(),
  
  keywords: z.string()
    .min(3, 'Từ khóa phải có ít nhất 3 ký tự')
    .optional(),
  
  categoryId: z.string({
    required_error: 'Vui lòng chọn chuyên mục',
  }),
  
  manuscriptFileId: z.string().optional(),
  
  securityLevel: z.enum(['PUBLIC', 'CONFIDENTIAL', 'SECRET', 'TOP_SECRET']).default('PUBLIC'),
});

export const updateSubmissionSchema = createSubmissionSchema.partial();

export const updateSubmissionStatusSchema = z.object({
  status: z.nativeEnum(SubmissionStatus),
  notes: z.string().optional(),
});

// ============================================================================
// Review Schemas
// ============================================================================

export const submitReviewSchema = z.object({
  recommendation: z.nativeEnum(Recommendation, {
    required_error: 'Vui lòng chọn khuyến nghị',
  }),
  
  comments: z.string()
    .min(50, 'Nhận xét phải có ít nhất 50 ký tự')
    .max(10000, 'Nhận xét không được quá 10000 ký tự'),
  
  confidentialComments: z.string()
    .max(10000, 'Nhận xét riêng không được quá 10000 ký tự')
    .optional(),
  
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  suggestions: z.string().optional(),
});

export const assignReviewerSchema = z.object({
  reviewerId: z.string({
    required_error: 'Vui lòng chọn phản biện viên',
  }),
  deadline: z.string().datetime().optional(),
});

// ============================================================================
// Decision Schemas
// ============================================================================

export const createDecisionSchema = z.object({
  submissionId: z.string({
    required_error: 'Submission ID là bắt buộc',
  }),
  
  decision: z.nativeEnum(Decision, {
    required_error: 'Vui lòng chọn quyết định',
  }),
  
  comments: z.string()
    .min(20, 'Nhận xét phải có ít nhất 20 ký tự')
    .max(5000, 'Nhận xét không được quá 5000 ký tự'),
  
  editorId: z.string().optional(),
});

// ============================================================================
// Issue Schemas
// ============================================================================

export const createIssueSchema = z.object({
  volumeId: z.string({
    required_error: 'Vui lòng chọn tập',
  }),
  
  number: z.number()
    .int('Số phải là số nguyên')
    .positive('Số phải lớn hơn 0'),
  
  year: z.number()
    .int('Năm phải là số nguyên')
    .min(2000, 'Năm phải từ 2000 trở đi')
    .max(2100, 'Năm không hợp lệ'),
  
  title: z.string()
    .min(5, 'Tiêu đề phải có ít nhất 5 ký tự')
    .max(500, 'Tiêu đề không được quá 500 ký tự'),
  
  description: z.string().max(2000).optional(),
  
  coverImage: z.string().url('URL ảnh bìa không hợp lệ').optional(),
  
  doi: z.string().optional(),
  
  publishDate: z.string().datetime().optional(),
  
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export const updateIssueSchema = createIssueSchema.partial();

// ============================================================================
// Volume Schemas
// ============================================================================

export const createVolumeSchema = z.object({
  volumeNo: z.number()
    .int('Số tập phải là số nguyên')
    .positive('Số tập phải lớn hơn 0'),
  
  year: z.number()
    .int('Năm phải là số nguyên')
    .min(2000, 'Năm phải từ 2000 trở đi')
    .max(2100, 'Năm không hợp lệ'),
  
  title: z.string()
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(200, 'Tiêu đề không được quá 200 ký tự')
    .optional(),
  
  description: z.string().max(1000).optional(),
});

export const updateVolumeSchema = createVolumeSchema.partial();

// ============================================================================
// Chat Schemas
// ============================================================================

export const sendMessageSchema = z.object({
  conversationId: z.string({
    required_error: 'Conversation ID là bắt buộc',
  }),
  
  content: z.string()
    .min(1, 'Nội dung không được để trống')
    .max(10000, 'Nội dung không được quá 10000 ký tự'),
  
  attachments: z.array(z.string()).optional(),
});

export const createConversationSchema = z.object({
  submissionId: z.string({
    required_error: 'Submission ID là bắt buộc',
  }),
  
  participantIds: z.array(z.string())
    .min(1, 'Phải có ít nhất 1 người tham gia')
    .max(10, 'Không được quá 10 người tham gia'),
  
  subject: z.string()
    .min(5, 'Chủ đề phải có ít nhất 5 ký tự')
    .max(200, 'Chủ đề không được quá 200 ký tự')
    .optional(),
});

// ============================================================================
// User Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  fullName: z.string()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được quá 100 ký tự')
    .optional(),
  
  org: z.string().max(200).optional(),
  
  orcid: z.string()
    .regex(/^\d{4}-\d{4}-\d{4}-\d{3}[0-9X]$/, 'ORCID ID không hợp lệ')
    .optional()
    .or(z.literal('')),
  
  bio: z.string().max(1000).optional(),
  
  researchInterests: z.string().max(500).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string({
    required_error: 'Vui lòng nhập mật khẩu hiện tại',
  }),
  
  newPassword: z.string()
    .min(8, 'Mật khẩu mới phải có ít nhất 8 ký tự')
    .max(100, 'Mật khẩu mới không được quá 100 ký tự')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Mật khẩu phải có chữ hoa, chữ thường và số'
    ),
  
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

// ============================================================================
// File Upload Schemas
// ============================================================================

export const fileMetadataSchema = z.object({
  filename: z.string()
    .min(1, 'Tên file không được để trống')
    .max(255, 'Tên file quá dài'),
  
  contentType: z.string()
    .regex(/^[a-z]+\/[a-z0-9\-\.\+]+$/i, 'Content type không hợp lệ'),
  
  size: z.number()
    .positive('Kích thước file phải lớn hơn 0')
    .max(100 * 1024 * 1024, 'File không được quá 100MB'),
  
  category: z.enum(['MANUSCRIPT', 'REVISION', 'SUPPLEMENTARY', 'COVER_IMAGE', 'OTHER'])
    .default('MANUSCRIPT'),
});

// ============================================================================
// Query Schemas
// ============================================================================

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const searchSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  categoryId: z.string().optional(),
  authorId: z.string().optional(),
  yearFrom: z.number().int().optional(),
  yearTo: z.number().int().optional(),
}).merge(paginationSchema);
