
/**
 * Phase 3: Workflow Automation
 * Tự động gửi email và notification theo các sự kiện workflow
 */

import { sendEmail } from './email';
import { prisma } from './prisma';

export type WorkflowEvent = 
  | 'REVIEWER_INVITED'
  | 'REVIEWER_DEADLINE_APPROACHING'
  | 'REVIEW_COMPLETED'
  | 'DECISION_MADE'
  | 'REVISION_REQUESTED'
  | 'PAPER_PUBLISHED'
  | 'AUTHOR_REVISION_APPROACHING';

interface WorkflowEmailContext {
  recipientEmail: string;
  recipientName: string;
  submissionCode: string;
  submissionTitle: string;
  additionalData?: Record<string, any>;
}

/**
 * Gửi email và tạo notification cho một workflow event
 */
export async function triggerWorkflowEvent(
  event: WorkflowEvent,
  context: WorkflowEmailContext
): Promise<void> {
  const { recipientEmail, recipientName, submissionCode, submissionTitle, additionalData } = context;
  
  let subject = '';
  let htmlContent = '';
  let notificationMessage = '';
  
  switch (event) {
    case 'REVIEWER_INVITED':
      subject = `[Tạp chí HCQS] Mời phản biện bài viết ${submissionCode}`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Bạn được mời phản biện cho bài viết:</p>
        <p><strong>${submissionTitle}</strong> (Mã: ${submissionCode})</p>
        <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết và phản hồi lời mời.</p>
        <p>Trân trọng,<br/>Ban biên tập Tạp chí HCQS</p>
      `;
      notificationMessage = `Bạn được mời phản biện bài viết ${submissionCode}`;
      break;
      
    case 'REVIEWER_DEADLINE_APPROACHING':
      const daysLeft = additionalData?.daysLeft || 3;
      subject = `[Tạp chí HCQS] Nhắc nhở: Hạn phản biện bài ${submissionCode}`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Đây là email nhắc nhở về hạn phản biện đang đến gần.</p>
        <p><strong>Bài viết:</strong> ${submissionTitle} (${submissionCode})</p>
        <p><strong>Thời gian còn lại:</strong> ${daysLeft} ngày</p>
        <p>Vui lòng hoàn thành phản biện trước hạn để đảm bảo tiến độ xuất bản.</p>
        <p>Trân trọng,<br/>Ban biên tập Tạp chí HCQS</p>
      `;
      notificationMessage = `Hạn phản biện bài ${submissionCode} còn ${daysLeft} ngày`;
      break;
      
    case 'REVIEW_COMPLETED':
      subject = `[Tạp chí HCQS] Phản biện hoàn tất cho bài ${submissionCode}`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Một phản biện viên đã hoàn tất phản biện cho bài viết:</p>
        <p><strong>${submissionTitle}</strong> (${submissionCode})</p>
        <p>Vui lòng đăng nhập để xem kết quả phản biện và đưa ra quyết định.</p>
        <p>Trân trọng,<br/>Hệ thống Tạp chí HCQS</p>
      `;
      notificationMessage = `Phản biện hoàn tất cho bài ${submissionCode}`;
      break;
      
    case 'DECISION_MADE':
      const decision = additionalData?.decision || 'PENDING';
      subject = `[Tạp chí HCQS] Quyết định biên tập cho bài ${submissionCode}`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Ban biên tập đã có quyết định cho bài viết của bạn:</p>
        <p><strong>${submissionTitle}</strong> (${submissionCode})</p>
        <p><strong>Quyết định:</strong> ${decision}</p>
        <p>Vui lòng đăng nhập để xem chi tiết và hướng dẫn tiếp theo.</p>
        <p>Trân trọng,<br/>Ban biên tập Tạp chí HCQS</p>
      `;
      notificationMessage = `Quyết định biên tập cho bài ${submissionCode}: ${decision}`;
      break;
      
    case 'REVISION_REQUESTED':
      subject = `[Tạp chí HCQS] Yêu cầu sửa chữa bài viết ${submissionCode}`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Ban biên tập yêu cầu bạn sửa chữa bài viết:</p>
        <p><strong>${submissionTitle}</strong> (${submissionCode})</p>
        <p>Vui lòng đăng nhập để xem ý kiến phản biện và nộp bản sửa chữa.</p>
        <p>Trân trọng,<br/>Ban biên tập Tạp chí HCQS</p>
      `;
      notificationMessage = `Yêu cầu sửa chữa bài viết ${submissionCode}`;
      break;
      
    case 'PAPER_PUBLISHED':
      subject = `[Tạp chí HCQS] Bài viết ${submissionCode} đã được xuất bản`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Chúc mừng! Bài viết của bạn đã được xuất bản:</p>
        <p><strong>${submissionTitle}</strong> (${submissionCode})</p>
        <p>Bạn có thể xem bài viết trên trang web của tạp chí.</p>
        <p>Trân trọng,<br/>Ban biên tập Tạp chí HCQS</p>
      `;
      notificationMessage = `Bài viết ${submissionCode} đã được xuất bản`;
      break;
      
    case 'AUTHOR_REVISION_APPROACHING':
      const revisionDays = additionalData?.daysLeft || 7;
      subject = `[Tạp chí HCQS] Nhắc nhở: Hạn nộp bản sửa chữa ${submissionCode}`;
      htmlContent = `
        <p>Kính gửi ${recipientName},</p>
        <p>Đây là email nhắc nhở về hạn nộp bản sửa chữa.</p>
        <p><strong>Bài viết:</strong> ${submissionTitle} (${submissionCode})</p>
        <p><strong>Thời gian còn lại:</strong> ${revisionDays} ngày</p>
        <p>Vui lòng nộp bản sửa chữa trước hạn.</p>
        <p>Trân trọng,<br/>Ban biên tập Tạp chí HCQS</p>
      `;
      notificationMessage = `Hạn nộp bản sửa chữa ${submissionCode} còn ${revisionDays} ngày`;
      break;
  }
  
  // Gửi email
  try {
    await sendEmail({
      to: recipientEmail,
      subject,
      html: htmlContent
    });
  } catch (error) {
    console.error(`❌ Failed to send workflow email for ${event}:`, error);
  }
  
  // Tạo notification trong database
  try {
    const user = await prisma.user.findUnique({
      where: { email: recipientEmail },
      select: { id: true }
    });
    
    if (user) {
      // Map workflow event to NotificationType
      const notificationTypeMap: Record<WorkflowEvent, string> = {
        'REVIEWER_INVITED': 'REVIEW_INVITED',
        'REVIEWER_DEADLINE_APPROACHING': 'REVIEW_REMINDER',
        'REVIEW_COMPLETED': 'REVIEW_COMPLETED',
        'DECISION_MADE': 'DECISION_MADE',
        'REVISION_REQUESTED': 'REVISION_REQUESTED',
        'PAPER_PUBLISHED': 'ARTICLE_PUBLISHED',
        'AUTHOR_REVISION_APPROACHING': 'DEADLINE_APPROACHING'
      };
      
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: subject,
          message: notificationMessage,
          type: notificationTypeMap[event] as any,
          isRead: false
        }
      });
    }
  } catch (error) {
    console.error(`❌ Failed to create notification for ${event}:`, error);
  }
}

/**
 * Kiểm tra và gửi reminder cho các review sắp đến hạn
 */
export async function sendReviewDeadlineReminders(): Promise<void> {
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
  
  const upcomingDeadlines = await prisma.review.findMany({
    where: {
      submittedAt: null,
      declinedAt: null,
      deadline: {
        lte: threeDaysFromNow,
        gte: new Date()
      },
      remindersSent: {
        lt: 2 // Tối đa 2 lần nhắc nhở
      }
    },
    include: {
      reviewer: true,
      submission: true
    }
  });
  
  for (const review of upcomingDeadlines) {
    const daysLeft = Math.ceil(
      (review.deadline!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    await triggerWorkflowEvent('REVIEWER_DEADLINE_APPROACHING', {
      recipientEmail: review.reviewer.email,
      recipientName: review.reviewer.fullName,
      submissionCode: review.submission.code,
      submissionTitle: review.submission.title,
      additionalData: { daysLeft }
    });
    
    // Cập nhật số lần nhắc nhở
    await prisma.review.update({
      where: { id: review.id },
      data: { remindersSent: { increment: 1 } }
    });
  }
}

/**
 * Kiểm tra và gửi reminder cho author revision sắp đến hạn
 */
export async function sendRevisionDeadlineReminders(): Promise<void> {
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const upcomingRevisionDeadlines = await prisma.deadline.findMany({
    where: {
      type: 'REVISION_SUBMIT',
      completedAt: null,
      dueDate: {
        lte: sevenDaysFromNow,
        gte: new Date()
      },
      remindersSent: {
        lt: 2
      }
    },
    include: {
      submission: {
        include: {
          author: true
        }
      }
    }
  });
  
  for (const deadline of upcomingRevisionDeadlines) {
    const daysLeft = Math.ceil(
      (deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    
    await triggerWorkflowEvent('AUTHOR_REVISION_APPROACHING', {
      recipientEmail: deadline.submission.author.email,
      recipientName: deadline.submission.author.fullName,
      submissionCode: deadline.submission.code,
      submissionTitle: deadline.submission.title,
      additionalData: { daysLeft }
    });
    
    await prisma.deadline.update({
      where: { id: deadline.id },
      data: { remindersSent: { increment: 1 } }
    });
  }
}
