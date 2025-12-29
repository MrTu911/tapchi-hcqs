/**
 * Status Tracker Utility
 * Tự động ghi lại lịch sử thay đổi trạng thái bài viết
 */

import { prisma } from '@/lib/prisma';
import { SubmissionStatus } from '@prisma/client';

interface TrackStatusChangeParams {
  articleId: string;
  newStatus: SubmissionStatus;
  changedBy?: string;
  notes?: string;
}

/**
 * Ghi lại thay đổi trạng thái bài viết
 */
export async function trackStatusChange(params: TrackStatusChangeParams) {
  const { articleId, newStatus, changedBy, notes } = params;

  try {
    // Ghi lại vào ArticleStatusHistory
    await prisma.articleStatusHistory.create({
      data: {
        articleId,
        status: newStatus,
        changedBy,
        notes,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Track status change error:', error);
    return { success: false, error };
  }
}

/**
 * Lấy lịch sử trạng thái của bài viết
 */
export async function getStatusHistory(articleId: string) {
  try {
    const history = await prisma.articleStatusHistory.findMany({
      where: { articleId },
      include: {
        changer: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        changedAt: 'asc',
      },
    });

    return { success: true, data: history };
  } catch (error) {
    console.error('Get status history error:', error);
    return { success: false, error };
  }
}

/**
 * Status flow mapping - định nghĩa luồng trạng thái hợp lệ
 */
export const statusFlow: Record<SubmissionStatus, SubmissionStatus[]> = {
  NEW: ['DESK_REJECT', 'UNDER_REVIEW'],
  DESK_REJECT: [], // Kết thúc
  UNDER_REVIEW: ['REVISION', 'ACCEPTED', 'REJECTED'],
  REVISION: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED'],
  ACCEPTED: ['IN_PRODUCTION'],
  REJECTED: [], // Kết thúc
  IN_PRODUCTION: ['PUBLISHED'],
  PUBLISHED: [], // Kết thúc
};

/**
 * Kiểm tra xem thay đổi trạng thái có hợp lệ không
 */
export function isValidStatusTransition(
  currentStatus: SubmissionStatus,
  newStatus: SubmissionStatus
): boolean {
  const allowedStatuses = statusFlow[currentStatus];
  return allowedStatuses.includes(newStatus);
}

/**
 * Lấy label hiển thị cho trạng thái
 */
export const statusLabels: Record<SubmissionStatus, string> = {
  NEW: 'Mới gửi',
  DESK_REJECT: 'Từ chối ban đầu',
  UNDER_REVIEW: 'Đang phản biện',
  REVISION: 'Chỉnh sửa',
  ACCEPTED: 'Chấp nhận',
  REJECTED: 'Từ chối',
  IN_PRODUCTION: 'Đang sản xuất',
  PUBLISHED: 'Đã xuất bản',
};

/**
 * Lấy màu hiển thị cho trạng thái
 */
export const statusColors: Record<SubmissionStatus, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  DESK_REJECT: 'bg-red-100 text-red-800',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800',
  REVISION: 'bg-purple-100 text-purple-800',
  ACCEPTED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PRODUCTION: 'bg-indigo-100 text-indigo-800',
  PUBLISHED: 'bg-emerald-100 text-emerald-800',
};
