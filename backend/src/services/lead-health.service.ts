import { Lead, LeadHealth, Activity } from '../types/index.js';

export class LeadHealthService {
  /**
   * Calculates the updated LeadHealth state based on status and historical activities.
   */
  public static calculateHealth(lead: Partial<Lead>, activities: Activity[] = []): LeadHealth {
    // 1. Explicit suppression rules
    if (lead.leadHealth === 'DO_NOT_CONTACT' || lead.status === 'NOT_INTERESTED') {
      return 'DO_NOT_CONTACT';
    }

    if (lead.emailVerificationStatus === 'INVALID') {
      return 'DO_NOT_CONTACT';
    }

    // 2. High Intent triggers
    if (lead.status === 'INTERESTED' || lead.status === 'MEETING' || lead.status === 'CONVERTED') {
      return 'HIGH_INTENT';
    }

    const hasReplied = activities.some(a => a.type === 'EMAIL_REPLIED') || lead.status === 'REPLIED';
    const hasMeeting = activities.some(a => a.type === 'MEETING_SCHEDULED');

    if (hasReplied || hasMeeting) {
      return 'HIGH_INTENT';
    }

    // 3. Unresponsive check: 3 or more emails sent with 0 opens and 0 replies
    const sentCount = activities.filter(a => a.type === 'EMAIL_SENT' || a.type === 'FOLLOW_UP_SENT').length;
    const openCount = activities.filter(a => a.type === 'EMAIL_OPENED').length;

    if (sentCount >= 3 && openCount === 0 && !hasReplied) {
      return 'UNRESPONSIVE';
    }

    // 4. Needs follow up: Contacted or opened but no reply yet
    if (lead.status === 'CONTACTED' || openCount > 0) {
      return 'NEEDS_FOLLOW_UP';
    }

    return 'ACTIVE';
  }
}
