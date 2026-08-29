import { Resend } from 'resend';
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
  provider: string;
  status: 'EMAIL_SUBMITTED';
  to: string;
  subject: string;
}

export class EmailService {
  private resendClient: Resend | null = null;

  constructor() {
    if (config.email.resendApiKey) {
      this.resendClient = new Resend(config.email.resendApiKey);
    }
  }

  /**
   * Re-evaluates client instance if config is updated dynamically
   */
  private getClient(): Resend {
    const apiKey = config.email.resendApiKey || process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new BadRequestError(
        'Email delivery provider is not configured. Please configure RESEND_API_KEY in the backend environment to enable real email delivery.'
      );
    }
    if (!this.resendClient || (this.resendClient as any).key !== apiKey) {
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
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
      Sent via OutreachFlow Intelligent Campaign Engine
    </p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Sends transactional cadence email to the authoritative recipient via Resend API
   */
  async sendCadenceEmail(payload: SendEmailPayload): Promise<EmailSendResult> {
    const { to, toName, subject, body } = payload;

    if (!to || !to.includes('@')) {
      throw new BadRequestError(`Invalid recipient email address: '${to}'`);
    }

    const client = this.getClient();

    const fromAddress = config.email.fromName
      ? `${config.email.fromName} <${config.email.from}>`
      : config.email.from;

    const htmlContent = this.formatHtmlBody(body);

    try {
      const response = await client.emails.send({
        from: fromAddress,
        to: toName ? `${toName} <${to}>` : to,
        subject: subject,
        text: body,
        html: htmlContent
      });

      if (response.error) {
        console.error('❌ Resend API delivery error:', response.error);
        throw new BadRequestError(`Email provider delivery failed: ${response.error.message}`);
      }

      const messageId = response.data?.id || `resend_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return {
        messageId,
        provider: 'resend',
        status: 'EMAIL_SUBMITTED',
        to,
        subject
      };
    } catch (error: any) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      console.error('❌ Unexpected error during email transmission:', error.message);
      throw new BadRequestError(
        error.message ? `Email delivery failed: ${error.message}` : 'Failed to deliver email through transactional provider'
      );
    }
  }
}

export const emailService = new EmailService();
