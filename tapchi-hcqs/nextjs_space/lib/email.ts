
import nodemailer from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: string;
}

/**
 * Get email configuration from environment variables
 */
function getEmailConfig(): EmailConfig {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    },
    from: process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@tapchi.vn'
  };
}

/**
 * Create nodemailer transporter
 */
function createTransporter() {
  const config = getEmailConfig();
  
  // If SMTP credentials are not configured, return null
  if (!config.auth.user || !config.auth.pass) {
    console.warn('⚠️ SMTP credentials not configured. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth
  });
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Send an email
 * @param options Email options
 * @returns boolean indicating success
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.log(`📧 [MOCK] Email would be sent to: ${options.to}`);
    console.log(`   Subject: ${options.subject}`);
    return false;
  }

  try {
    const config = getEmailConfig();
    await transporter.sendMail({
      from: config.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    });
    
    console.log(`✅ Email sent successfully to: ${options.to}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Email templates
 */

export function getSubmissionStatusEmailTemplate(
  recipientName: string,
  submissionTitle: string,
  newStatus: string,
  language: 'en' | 'vi' = 'vi'
) {
  const templates = {
    vi: {
      subject: `Cập nhật trạng thái bài gửi: ${submissionTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Tạp chí Khoa học Hậu cần Quân sự</h2>
          <p>Kính gửi <strong>${recipientName}</strong>,</p>
          <p>Bài gửi của bạn "<strong>${submissionTitle}</strong>" đã có cập nhật trạng thái mới:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #4299e1; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>Trạng thái hiện tại:</strong> ${getStatusText(newStatus, 'vi')}
            </p>
          </div>
          <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Xem bài gửi
          </a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Email tự động từ Tạp chí Khoa học Hậu cần Quân sự. Vui lòng không trả lời email này.
          </p>
        </div>
      `,
      text: `Kính gửi ${recipientName},\n\nBài gửi của bạn "${submissionTitle}" đã có cập nhật trạng thái mới: ${getStatusText(newStatus, 'vi')}\n\nVui lòng đăng nhập vào hệ thống để xem chi tiết.`
    },
    en: {
      subject: `Submission Status Update: ${submissionTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Journal of Military Logistics Scientific Studies</h2>
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>Your submission "<strong>${submissionTitle}</strong>" has a new status update:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #4299e1; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>Current Status:</strong> ${getStatusText(newStatus, 'en')}
            </p>
          </div>
          <p>Please log in to the system to view details.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/dashboard" 
             style="display: inline-block; padding: 10px 20px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Submission
          </a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Automated email from Journal of Military Logistics Scientific Studies. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Dear ${recipientName},\n\nYour submission "${submissionTitle}" has a new status update: ${getStatusText(newStatus, 'en')}\n\nPlease log in to the system to view details.`
    }
  };

  return templates[language];
}

export function getReviewRequestEmailTemplate(
  reviewerName: string,
  submissionTitle: string,
  dueDate: string,
  language: 'en' | 'vi' = 'vi'
) {
  const templates = {
    vi: {
      subject: `Yêu cầu phản biện bài viết: ${submissionTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Tạp chí Khoa học Hậu cần Quân sự</h2>
          <p>Kính gửi <strong>${reviewerName}</strong>,</p>
          <p>Chúng tôi xin mời bạn phản biện bài viết sau:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>Tiêu đề:</strong> ${submissionTitle}
            </p>
            <p style="margin: 10px 0 0 0; color: #718096;">
              <strong>Hạn chót:</strong> ${dueDate}
            </p>
          </div>
          <p>Vui lòng đăng nhập vào hệ thống để xem chi tiết bài viết và gửi phản biện.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/dashboard/reviewer" 
             style="display: inline-block; padding: 10px 20px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            Xem bài viết
          </a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Email tự động từ Tạp chí Khoa học Hậu cần Quân sự. Vui lòng không trả lời email này.
          </p>
        </div>
      `,
      text: `Kính gửi ${reviewerName},\n\nChúng tôi xin mời bạn phản biện bài viết: "${submissionTitle}"\n\nHạn chót: ${dueDate}\n\nVui lòng đăng nhập vào hệ thống để xem chi tiết.`
    },
    en: {
      subject: `Review Request: ${submissionTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Journal of Military Logistics Scientific Studies</h2>
          <p>Dear <strong>${reviewerName}</strong>,</p>
          <p>We invite you to review the following submission:</p>
          <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>Title:</strong> ${submissionTitle}
            </p>
            <p style="margin: 10px 0 0 0; color: #718096;">
              <strong>Due Date:</strong> ${dueDate}
            </p>
          </div>
          <p>Please log in to the system to view the submission details and submit your review.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/dashboard/reviewer" 
             style="display: inline-block; padding: 10px 20px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Submission
          </a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Automated email from Journal of Military Logistics Scientific Studies. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Dear ${reviewerName},\n\nWe invite you to review the following submission: "${submissionTitle}"\n\nDue Date: ${dueDate}\n\nPlease log in to the system to view details.`
    }
  };

  return templates[language];
}

function getStatusText(status: string, language: 'en' | 'vi'): string {
  const statusMap: Record<string, { vi: string; en: string }> = {
    NEW: { vi: 'Mới gửi', en: 'New' },
    DESK_REJECT: { vi: 'Từ chối ban đầu', en: 'Desk Reject' },
    UNDER_REVIEW: { vi: 'Đang phản biện', en: 'Under Review' },
    REVISION: { vi: 'Yêu cầu sửa', en: 'Revision Required' },
    ACCEPTED: { vi: 'Chấp nhận', en: 'Accepted' },
    REJECTED: { vi: 'Từ chối', en: 'Rejected' },
    IN_PRODUCTION: { vi: 'Đang xuất bản', en: 'In Production' },
    PUBLISHED: { vi: 'Đã xuất bản', en: 'Published' }
  };

  return statusMap[status]?.[language] || status;
}

/**
 * Email template for user registration verification
 */
export function getRegistrationVerificationEmailTemplate(
  fullName: string,
  verificationUrl: string,
  language: 'en' | 'vi' = 'vi'
) {
  const templates = {
    vi: {
      subject: 'Xác thực email đăng ký tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Tạp chí Khoa học Hậu cần Quân sự</h2>
          <p>Kính gửi <strong>${fullName}</strong>,</p>
          <p>Cảm ơn bạn đã đăng ký tài khoản tại Tạp chí Khoa học Hậu cần Quân sự.</p>
          <p>Để hoàn tất đăng ký, vui lòng xác thực địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Xác thực email
          </a>
          <p>Hoặc sao chép link sau vào trình duyệt:</p>
          <p style="background-color: #f7fafc; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #4a5568;">
            ${verificationUrl}
          </p>
          <p style="color: #e53e3e; margin-top: 20px;">
            <strong>Lưu ý:</strong> Link xác thực sẽ hết hạn sau 24 giờ.
          </p>
          <p>Sau khi xác thực email, tài khoản của bạn sẽ được Ban biên tập xem xét và phê duyệt trước khi có thể sử dụng đầy đủ chức năng.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Email tự động từ Tạp chí Khoa học Hậu cần Quân sự. Vui lòng không trả lời email này.
          </p>
        </div>
      `,
      text: `Kính gửi ${fullName},\n\nCảm ơn bạn đã đăng ký tài khoản tại Tạp chí Khoa học Hậu cần Quân sự.\n\nVui lòng xác thực email bằng cách truy cập link sau:\n${verificationUrl}\n\nLink xác thực sẽ hết hạn sau 24 giờ.`
    },
    en: {
      subject: 'Email Verification for Account Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Journal of Military Logistics Scientific Studies</h2>
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>Thank you for registering an account at the Journal of Military Logistics Scientific Studies.</p>
          <p>To complete your registration, please verify your email address by clicking the button below:</p>
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 12px 24px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Verify Email
          </a>
          <p>Or copy and paste this link into your browser:</p>
          <p style="background-color: #f7fafc; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #4a5568;">
            ${verificationUrl}
          </p>
          <p style="color: #e53e3e; margin-top: 20px;">
            <strong>Note:</strong> This verification link will expire in 24 hours.
          </p>
          <p>After email verification, your account will be reviewed and approved by the editorial board before full access is granted.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Automated email from Journal of Military Logistics Scientific Studies. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Dear ${fullName},\n\nThank you for registering an account at the Journal of Military Logistics Scientific Studies.\n\nPlease verify your email by visiting:\n${verificationUrl}\n\nThis link will expire in 24 hours.`
    }
  };

  return templates[language];
}

/**
 * Email template for account approval notification
 */
export function getAccountApprovalEmailTemplate(
  fullName: string,
  approvedRole: string,
  language: 'en' | 'vi' = 'vi'
) {
  const roleNames: Record<string, { vi: string; en: string }> = {
    AUTHOR: { vi: 'Tác giả', en: 'Author' },
    REVIEWER: { vi: 'Phản biện', en: 'Reviewer' },
    SECTION_EDITOR: { vi: 'Biên tập viên', en: 'Section Editor' },
    MANAGING_EDITOR: { vi: 'Tổng biên tập', en: 'Managing Editor' },
    EIC: { vi: 'Tổng biên tập trưởng', en: 'Editor-in-Chief' }
  };

  const roleName = roleNames[approvedRole]?.[language] || approvedRole;

  const templates = {
    vi: {
      subject: 'Tài khoản của bạn đã được phê duyệt',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Tạp chí Khoa học Hậu cần Quân sự</h2>
          <p>Kính gửi <strong>${fullName}</strong>,</p>
          <div style="background-color: #f0fff4; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>🎉 Chúc mừng!</strong> Tài khoản của bạn đã được phê duyệt.
            </p>
          </div>
          <p>Bạn đã được cấp quyền: <strong>${roleName}</strong></p>
          <p>Giờ đây bạn có thể đăng nhập và sử dụng đầy đủ các tính năng của hệ thống.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/auth/login" 
             style="display: inline-block; padding: 12px 24px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Đăng nhập ngay
          </a>
          <p>Chúng tôi rất vui mừng được chào đón bạn tham gia Tạp chí Khoa học Hậu cần Quân sự!</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Email tự động từ Tạp chí Khoa học Hậu cần Quân sự. Vui lòng không trả lời email này.
          </p>
        </div>
      `,
      text: `Kính gửi ${fullName},\n\nChúc mừng! Tài khoản của bạn đã được phê duyệt với vai trò: ${roleName}\n\nBạn có thể đăng nhập tại: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/auth/login`
    },
    en: {
      subject: 'Your Account has been Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Journal of Military Logistics Scientific Studies</h2>
          <p>Dear <strong>${fullName}</strong>,</p>
          <div style="background-color: #f0fff4; padding: 15px; border-left: 4px solid #48bb78; margin: 20px 0;">
            <p style="margin: 0; font-size: 16px; color: #2d3748;">
              <strong>🎉 Congratulations!</strong> Your account has been approved.
            </p>
          </div>
          <p>You have been granted the role: <strong>${roleName}</strong></p>
          <p>You can now log in and use all system features.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/auth/login" 
             style="display: inline-block; padding: 12px 24px; background-color: #48bb78; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Log In Now
          </a>
          <p>We are excited to welcome you to the Journal of Military Logistics Scientific Studies!</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Automated email from Journal of Military Logistics Scientific Studies. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Dear ${fullName},\n\nCongratulations! Your account has been approved with the role: ${roleName}\n\nYou can log in at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/auth/login`
    }
  };

  return templates[language];
}

/**
 * Email template for account rejection notification
 */
export function getAccountRejectionEmailTemplate(
  fullName: string,
  rejectionReason: string,
  language: 'en' | 'vi' = 'vi'
) {
  const templates = {
    vi: {
      subject: 'Thông báo về tài khoản đăng ký',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Tạp chí Khoa học Hậu cần Quân sự</h2>
          <p>Kính gửi <strong>${fullName}</strong>,</p>
          <p>Chúng tôi xin thông báo rằng yêu cầu đăng ký tài khoản của bạn chưa được chấp thuận.</p>
          <div style="background-color: #fff5f5; padding: 15px; border-left: 4px solid #f56565; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #2d3748;">
              <strong>Lý do:</strong> ${rejectionReason || 'Không đáp ứng yêu cầu'}
            </p>
          </div>
          <p>Nếu bạn có thắc mắc hoặc muốn đăng ký lại với thông tin đầy đủ hơn, vui lòng liên hệ với Ban biên tập qua email hoặc số điện thoại được công bố trên trang web.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Email tự động từ Tạp chí Khoa học Hậu cần Quân sự. Vui lòng không trả lời email này.
          </p>
        </div>
      `,
      text: `Kính gửi ${fullName},\n\nYêu cầu đăng ký tài khoản của bạn chưa được chấp thuận.\n\nLý do: ${rejectionReason || 'Không đáp ứng yêu cầu'}\n\nVui lòng liên hệ Ban biên tập nếu có thắc mắc.`
    },
    en: {
      subject: 'Account Registration Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Journal of Military Logistics Scientific Studies</h2>
          <p>Dear <strong>${fullName}</strong>,</p>
          <p>We regret to inform you that your account registration request has not been approved.</p>
          <div style="background-color: #fff5f5; padding: 15px; border-left: 4px solid #f56565; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #2d3748;">
              <strong>Reason:</strong> ${rejectionReason || 'Does not meet requirements'}
            </p>
          </div>
          <p>If you have questions or would like to reapply with more complete information, please contact the editorial board via the email or phone number published on the website.</p>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Automated email from Journal of Military Logistics Scientific Studies. Please do not reply to this email.
          </p>
        </div>
      `,
      text: `Dear ${fullName},\n\nYour account registration request has not been approved.\n\nReason: ${rejectionReason || 'Does not meet requirements'}\n\nPlease contact the editorial board if you have questions.`
    }
  };

  return templates[language];
}

/**
 * Email template for notifying admins about new user registration
 */
export function getNewRegistrationNotificationEmailTemplate(
  fullName: string,
  email: string,
  requestedRole: string,
  org: string | null,
  language: 'en' | 'vi' = 'vi'
) {
  const roleNames: Record<string, { vi: string; en: string }> = {
    AUTHOR: { vi: 'Tác giả', en: 'Author' },
    REVIEWER: { vi: 'Phản biện', en: 'Reviewer' },
    SECTION_EDITOR: { vi: 'Biên tập viên', en: 'Section Editor' }
  };

  const roleName = roleNames[requestedRole]?.[language] || requestedRole;

  const templates = {
    vi: {
      subject: `Yêu cầu đăng ký tài khoản mới: ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Tạp chí Khoa học Hậu cần Quân sự</h2>
          <h3 style="color: #2d3748;">Yêu cầu đăng ký tài khoản mới</h3>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Họ tên:</strong> ${fullName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Vai trò mong muốn:</strong> ${roleName}</p>
            ${org ? `<p style="margin: 5px 0;"><strong>Đơn vị công tác:</strong> ${org}</p>` : ''}
          </div>
          <p>Vui lòng đăng nhập vào hệ thống quản trị để xem chi tiết và phê duyệt tài khoản.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/dashboard/admin/users" 
             style="display: inline-block; padding: 12px 24px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            Xem yêu cầu đăng ký
          </a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Email tự động từ Tạp chí Khoa học Hậu cần Quân sự.
          </p>
        </div>
      `,
      text: `Yêu cầu đăng ký tài khoản mới\n\nHọ tên: ${fullName}\nEmail: ${email}\nVai trò: ${roleName}\n${org ? `Đơn vị: ${org}\n` : ''}\nVui lòng đăng nhập hệ thống để xem chi tiết.`
    },
    en: {
      subject: `New Account Registration Request: ${fullName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c5282;">Journal of Military Logistics Scientific Studies</h2>
          <h3 style="color: #2d3748;">New Account Registration Request</h3>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Full Name:</strong> ${fullName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Requested Role:</strong> ${roleName}</p>
            ${org ? `<p style="margin: 5px 0;"><strong>Organization:</strong> ${org}</p>` : ''}
          </div>
          <p>Please log in to the admin system to view details and approve the account.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://tapchinckhhcqs.abacusai.app'}/dashboard/admin/users" 
             style="display: inline-block; padding: 12px 24px; background-color: #4299e1; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold;">
            View Registration Request
          </a>
          <hr style="margin-top: 30px; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 12px;">
            Automated email from Journal of Military Logistics Scientific Studies.
          </p>
        </div>
      `,
      text: `New Account Registration Request\n\nFull Name: ${fullName}\nEmail: ${email}\nRole: ${roleName}\n${org ? `Organization: ${org}\n` : ''}\nPlease log in to view details.`
    }
  };

  return templates[language];
}
