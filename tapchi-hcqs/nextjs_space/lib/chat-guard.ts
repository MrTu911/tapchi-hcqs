/**
 * Chat Permission Guard
 * Kiểm tra quyền chat giữa các vai trò trong hệ thống
 */

import { Role } from '@prisma/client';

/**
 * Ma trận phân quyền chat (Role Matrix)
 * Định nghĩa vai trò nào có thể chat với vai trò nào
 */
export const CHAT_ROLE_MATRIX: Record<Role, Role[]> = {
  // Reader không có chat nội bộ
  READER: [],
  
  // Author có thể chat với: Section Editor, Managing Editor, Chief Editor (EIC), Author khác
  // ❌ KHÔNG được chat với Reviewer (blind review)
  AUTHOR: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'AUTHOR', 'LAYOUT_EDITOR'],
  
  // Section Editor có thể chat với: Author, Reviewer, Managing Editor, Chief Editor
  SECTION_EDITOR: ['AUTHOR', 'REVIEWER', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'SECTION_EDITOR', 'LAYOUT_EDITOR'],
  
  // Managing Editor có thể chat với tất cả (trừ Reader)
  MANAGING_EDITOR: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'EIC', 'SYSADMIN', 'MANAGING_EDITOR', 'LAYOUT_EDITOR'],
  
  // Reviewer có thể chat với: Section Editor, Managing Editor, Chief Editor
  // ❌ KHÔNG được chat với Author (blind review)
  REVIEWER: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN'],
  
  // Chief Editor (EIC) có thể chat với tất cả
  EIC: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'SYSADMIN', 'EIC', 'LAYOUT_EDITOR'],
  
  // Layout Editor có thể chat với editors
  LAYOUT_EDITOR: ['SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'LAYOUT_EDITOR'],
  
  // System Admin có thể chat với tất cả
  SYSADMIN: ['AUTHOR', 'REVIEWER', 'SECTION_EDITOR', 'MANAGING_EDITOR', 'EIC', 'SYSADMIN', 'LAYOUT_EDITOR', 'SECURITY_AUDITOR'],
  
  // Security Auditor có thể chat với admin
  SECURITY_AUDITOR: ['SYSADMIN', 'SECURITY_AUDITOR'],
};

/**
 * Kiểm tra xem một vai trò có thể chat với vai trò khác không
 * @param senderRole - Vai trò người gửi
 * @param receiverRole - Vai trò người nhận
 * @returns true nếu được phép chat, false nếu không
 */
export function canChat(senderRole: Role, receiverRole: Role): boolean {
  // Kiểm tra null/undefined
  if (!senderRole || !receiverRole) {
    console.warn('[chat-guard] canChat called with undefined role:', { senderRole, receiverRole });
    return false;
  }
  
  const allowedRoles = CHAT_ROLE_MATRIX[senderRole] || [];
  return allowedRoles.includes(receiverRole);
}

/**
 * Kiểm tra xem người dùng có thể tham gia hội thoại không
 * @param userRole - Vai trò người dùng
 * @param participantRoles - Danh sách vai trò của các thành viên trong hội thoại
 * @returns true nếu được phép tham gia, false nếu không
 */
export function canJoinConversation(userRole: Role, participantRoles: Role[]): boolean {
  const allowedRoles = CHAT_ROLE_MATRIX[userRole] || [];
  
  // Kiểm tra xem tất cả các thành viên trong hội thoại có nằm trong danh sách được phép không
  return participantRoles.every(role => allowedRoles.includes(role));
}

/**
 * Lấy danh sách vai trò mà người dùng có thể chat
 * @param userRole - Vai trò người dùng
 * @returns Danh sách vai trò được phép chat
 */
export function getAllowedRoles(userRole: Role): Role[] {
  if (!userRole) {
    console.warn('[chat-guard] getAllowedRoles called with undefined role');
    return [];
  }
  return CHAT_ROLE_MATRIX[userRole] || [];
}

/**
 * Validate conversation participants theo quy tắc blind review
 * @param participants - Danh sách vai trò của các thành viên
 * @returns { valid: boolean, reason?: string }
 */
export function validateConversationParticipants(
  participants: Role[]
): { valid: boolean; reason?: string } {
  // Kiểm tra nếu có cả Author và Reviewer trong cùng một hội thoại
  const hasAuthor = participants.includes('AUTHOR');
  const hasReviewer = participants.includes('REVIEWER');
  
  if (hasAuthor && hasReviewer) {
    return {
      valid: false,
      reason: 'Tác giả và phản biện không được phép trò chuyện trực tiếp (blind review policy)'
    };
  }
  
  // Kiểm tra từng cặp thành viên
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      if (!canChat(participants[i], participants[j])) {
        return {
          valid: false,
          reason: `${participants[i]} không có quyền chat với ${participants[j]}`
        };
      }
    }
  }
  
  return { valid: true };
}
