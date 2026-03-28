// lib/email.ts
// Email sending utility using nodemailer

import nodemailer from 'nodemailer';

// Create transporter based on environment
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If no SMTP config, use console logging for development
  if (!host || !user || !pass) {
    console.log('[Email] SMTP not configured, emails will be logged to console');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
}

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export function getFeedbackReplyTemplate(
  userName: string,
  feedbackTitle: string,
  adminReply: string,
  feedbackId: string
): EmailTemplate {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const feedbackUrl = `${baseUrl}/?feedback=${feedbackId}`;

  return {
    subject: `您的反馈收到了回复 - ${feedbackTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .feedback-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
          .admin-reply { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">📖 AI读</h1>
            <p style="margin: 10px 0 0 0;">您的反馈收到了回复</p>
          </div>
          <div class="content">
            <p>亲爱的 ${userName}，</p>
            <p>感谢您的反馈，我们的团队已经回复了您的问题。</p>

            <div class="feedback-title">📝 ${feedbackTitle}</div>

            <div class="admin-reply">
              <strong>管理员回复：</strong>
              <p style="margin: 10px 0 0 0; white-space: pre-wrap;">${adminReply}</p>
            </div>

            <a href="${feedbackUrl}" class="button">查看完整对话</a>

            <p style="margin-top: 20px; color: #666; font-size: 14px;">
              如果您对回复满意，可以在反馈详情页点击"已解决"。如有其他问题，欢迎继续回复。
            </p>
          </div>
          <div class="footer">
            <p>此邮件由 AI读 自动发送，请勿直接回复。</p>
            <p>© ${new Date().getFullYear()} AI读. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
亲爱的 ${userName}，

感谢您的反馈，我们的团队已经回复了您的问题。

【反馈标题】${feedbackTitle}

【管理员回复】
${adminReply}

查看完整对话：${feedbackUrl}

此邮件由 AI读 自动发送，请勿直接回复。
    `.trim(),
  };
}

export function getNewFeedbackTemplate(
  adminName: string,
  userName: string,
  userEmail: string,
  feedbackTitle: string,
  feedbackContent: string,
  feedbackType: string,
  feedbackId: string
): EmailTemplate {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const adminUrl = `${baseUrl}/admin/feedback`;

  const typeLabels: Record<string, string> = {
    BUG_REPORT: 'Bug报告',
    FEATURE_REQUEST: '功能建议',
    QUESTION: '问题咨询',
    OTHER: '其他',
  };

  return {
    subject: `[新反馈] ${feedbackTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .meta { display: flex; gap: 20px; margin-bottom: 20px; }
          .meta-item { background: white; padding: 10px 15px; border-radius: 6px; }
          .feedback-content { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 24px; background: #f5576c; color: white; text-decoration: none; border-radius: 6px; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🔔 新用户反馈</h1>
            <p style="margin: 10px 0 0 0;">${typeLabels[feedbackType] || feedbackType}</p>
          </div>
          <div class="content">
            <p>亲爱的 ${adminName}，</p>
            <p>有用户提交了新的反馈，请及时处理。</p>

            <div class="meta">
              <div class="meta-item">
                <strong>用户：</strong> ${userName || '匿名'}
              </div>
              <div class="meta-item">
                <strong>邮箱：</strong> ${userEmail || '未提供'}
              </div>
            </div>

            <div class="feedback-content">
              <strong style="font-size: 16px;">${feedbackTitle}</strong>
              <p style="margin: 15px 0 0 0; white-space: pre-wrap;">${feedbackContent}</p>
            </div>

            <a href="${adminUrl}" class="button">前往管理后台处理</a>
          </div>
          <div class="footer">
            <p>此邮件由 AI读 自动发送</p>
            <p>© ${new Date().getFullYear()} AI读. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
亲爱的 ${adminName}，

有用户提交了新的反馈，请及时处理。

【用户】${userName || '匿名'} (${userEmail || '未提供'})
【类型】${typeLabels[feedbackType] || feedbackType}
【标题】${feedbackTitle}

【内容】
${feedbackContent}

前往管理后台处理：${adminUrl}

此邮件由 AI读 自动发送。
    `.trim(),
  };
}

// Send email function
export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<boolean> {
  const transporter = createTransporter();

  if (!transporter) {
    // Development mode - log to console
    console.log('\n========================================');
    console.log('[Email] Development Mode - Email Preview');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Content:\n${template.text}`);
    console.log('========================================\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"AI读" <${process.env.SMTP_USER}>`,
      to,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    console.log(`[Email] Successfully sent to ${to}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

// Check if user wants to receive email notifications
export async function shouldSendEmailNotification(
  userId: string,
  notificationType: 'feedback' | 'system'
): Promise<boolean> {
  const { prisma } = await import('./prisma');

  const settings = await prisma.userSetting.findUnique({
    where: { userId },
    select: { emailNotifyFeedback: true, emailNotifySystem: true },
  });

  if (!settings) return true; // Default to true if no settings

  if (notificationType === 'feedback') {
    return settings.emailNotifyFeedback;
  }
  return settings.emailNotifySystem;
}