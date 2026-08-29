import { Router, Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activity.service.js';
import { leadRepository } from '../repositories/lead.repository.js';
import { ResponseFormatter } from '../utils/api-response.js';
import { config } from '../config/env.js';

const router = Router();

/**
 * Resend Webhook Handler (Ready for Production Webhook Ingestion)
 * Handles: email.delivered, email.bounced, email.opened, email.clicked
 */
router.post('/resend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const event = req.body;
    const eventType = event?.type;
    const data = event?.data;

    console.log(`📡 [Webhook] Received Resend Event: ${eventType}`, {
      emailId: data?.email_id,
      to: data?.to,
      subject: data?.subject
    });

    if (!eventType || !data) {
      return ResponseFormatter.success(res, { processed: false }, 'Invalid webhook payload structure', 200);
    }

    const recipientEmail = Array.isArray(data.to) ? data.to[0] : data.to;
    let lead = null;
    if (recipientEmail) {
      lead = await leadRepository.findByEmail(recipientEmail);
    }

    if (lead) {
      switch (eventType) {
        case 'email.delivered':
          await activityService.logActivity({
            leadId: lead.id,
            type: 'EMAIL_SENT',
            title: 'Email Confirmed Delivered',
            description: `Transactional provider confirmed delivery to ${recipientEmail}`,
            metadata: {
              providerMessageId: data.email_id,
              event: eventType,
              deliveryStatus: 'EMAIL_DELIVERED'
            }
          });
          break;

        case 'email.bounced':
          // Update lead email verification and health to protect domain reputation
          await leadRepository.update(lead.id, {
            emailVerificationStatus: 'INVALID',
            leadHealth: 'DO_NOT_CONTACT'
          });

          await activityService.logActivity({
            leadId: lead.id,
            type: 'STATUS_CHANGED',
            title: 'Email Hard Bounced',
            description: `Provider reported bounce (${data.bounce_type || 'Permanent'}). Lead moved to DO_NOT_CONTACT.`,
            metadata: {
              providerMessageId: data.email_id,
              event: eventType,
              deliveryStatus: 'EMAIL_BOUNCED'
            }
          });
          break;

        case 'email.opened':
          await activityService.logActivity({
            leadId: lead.id,
            type: 'EMAIL_OPENED',
            title: 'Email Opened by Prospect',
            description: `Recipient opened email (${data.subject || 'Outreach'})`,
            metadata: {
              providerMessageId: data.email_id,
              event: eventType
            }
          });
          break;

        case 'email.clicked':
          await activityService.logActivity({
            leadId: lead.id,
            type: 'EMAIL_OPENED',
            title: 'Link Clicked in Email',
            description: `Recipient clicked link: ${data.click?.url || 'Campaign Link'}`,
            metadata: {
              providerMessageId: data.email_id,
              event: eventType,
              url: data.click?.url
            }
          });
          break;

        default:
          console.log(`ℹ️ Unhandled Resend event type: ${eventType}`);
      }
    }

    return ResponseFormatter.success(res, { processed: true, eventType }, 'Webhook event processed successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
