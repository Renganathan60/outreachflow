import nodemailer, { Transporter, TestAccount } from 'nodemailer';
import { config } from '../config/env.js';
import { BadRequestError } from '../utils/errors.js';

export interface SendEmailPayload {
  to: string;
  toName?: string;
  subject: string;
  body: string;
  campaignName?: string;
  leadId?: string;
  campaignId?: string;
  stepNumber?: number;
}

export interface EmailSendResult {
  messageId: string;
  previewUrl: string;
  provider: string;
  status: 'EMAIL_SENT';
  to: string;
  subject: string;
}

export class EmailService {
  private transporter: Transporter | null = null;
  private cachedTestAccount: TestAccount | null = null;

  /**
   * Initializes or retrieves a Nodemailer SMTP Transporter configured for Ethereal Email
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    let user = config.email.etherealUser;
    let pass = config.email.etherealPass;

    // If no credentials in .env, automatically create a real Ethereal Test Account on-the-fly
    if (!user || !pass) {
      if (!this.cachedTestAccount) {
        console.log('🔄 Creating new Ethereal Email test account for SMTP delivery...');
        this.cachedTestAccount = await nodemailer.createTestAccount();
        console.log(`✅ Generated Ethereal Test Account: ${this.cachedTestAccount.user}`);
      }
      user = this.cachedTestAccount.user;
      pass = this.cachedTestAccount.pass;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.etherealHost || 'smtp.ethereal.email',
      port: config.email.etherealPort || 587,
      secure: false, // true for 465, false for other ports (587)
      auth: {
        user,
        pass
      }
    });

    return this.transporter;
  }

  /**
   * Formats plain text email body into clean, responsive HTML
   */
  private formatHtmlBody(body: string): string {
    const paragraphs = body
      .split(/\n\n+/)
      .map(p => `<p style="margin: 0 0 14px 0; font-size: 15px; line-height: 1.6; color: #1e293b;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('');

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; padding: 32px; border-radius: 12px; border: 1px solid #e2e8f0;">
    ${paragraphs}
    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0 16px 0;" />
    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
      Sent via OutreachFlow Intelligent Campaign Engine & Ethereal SMTP
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Sends transactional cadence email via Nodemailer + Ethereal SMTP
   * Generates and returns real Ethereal Web Preview URL (nodemailer.getTestMessageUrl)
   */
  async sendCadenceEmail(payload: SendEmailPayload): Promise<EmailSendResult> {
    const { to, toName, subject, body } = payload;

    if (!to || !to.includes('@')) {
      throw new BadRequestError(`Invalid recipient email address: '${to}'`);
    }

    try {
      const transporter = await this.getTransporter();

      const fromAddress = config.email.fromName
        ? `"${config.email.fromName}" <${config.email.from}>`
        : config.email.from;

      const htmlContent = this.formatHtmlBody(body);

      // Perform real SMTP transmission through Ethereal
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toName ? `"${toName}" <${to}>` : to,
        subject,
        text: body,
        html: htmlContent
      });

      // Capture official Ethereal web preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info) || '';

      console.log('----------------------------------------------------');
      console.log(`✉️ [Ethereal SMTP] Email sent to: ${to}`);
      console.log(`📋 [Message ID]: ${info.messageId}`);
      if (previewUrl) {
        console.log(`🔗 [Ethereal Preview URL]: ${previewUrl}`);
      }
      console.log('----------------------------------------------------');

      return {
        messageId: info.messageId,
        previewUrl: typeof previewUrl === 'string' ? previewUrl : '',
        provider: 'ethereal',
        status: 'EMAIL_SENT',
        to,
        subject
      };
    } catch (error: any) {
      console.error('❌ Ethereal SMTP delivery error:', error.message);
      throw new BadRequestError(
        error.message ? `SMTP delivery failed: ${error.message}` : 'Failed to deliver email through Ethereal SMTP provider'
      );
    }
  }
}

export const emailService = new EmailService();
