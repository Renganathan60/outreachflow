import { Lead, Campaign, CampaignGuardResult, CampaignLead } from '../types/index.js';

export class CampaignGuardService {
  /**
   * Evaluates business rules to decide whether a lead is safe and eligible
   * to be enrolled or contacted in a specific campaign.
   */
  public static validateLeadForCampaign(
    lead: Lead,
    campaign: Campaign,
    existingCampaignEnrollment?: CampaignLead | null
  ): CampaignGuardResult {
    const reasons: string[] = [];
    const leadName = `${lead.firstName} ${lead.lastName}`.trim();

    // Guard Check 1: Campaign Status Check
    if (campaign.status === 'COMPLETED') {
      reasons.push(`Campaign '${campaign.name}' is already COMPLETED and cannot accept new outreach.`);
    } else if (campaign.status === 'PAUSED') {
      reasons.push(`Campaign '${campaign.name}' is currently PAUSED.`);
    }

    // Guard Check 2: Email Verification & Format
    if (!lead.email || lead.emailVerificationStatus === 'INVALID') {
      reasons.push('Lead has an INVALID or undeliverable email address.');
    }

    // Guard Check 3: Do Not Contact & Suppression Policy
    if (lead.leadHealth === 'DO_NOT_CONTACT') {
      reasons.push('Lead is marked as DO_NOT_CONTACT (opted out or unsubscribed).');
    }
    if (lead.status === 'NOT_INTERESTED') {
      reasons.push('Lead explicitly indicated NOT_INTERESTED in previous interactions.');
    }

    // Guard Check 4: Unresponsive Suppression
    if (lead.leadHealth === 'UNRESPONSIVE') {
      reasons.push('Lead has shown zero engagement across multiple previous outreach sequences.');
    }

    // Guard Check 5: Duplicate Enrollment Check
    if (existingCampaignEnrollment) {
      if (existingCampaignEnrollment.status === 'CONTACTED' || existingCampaignEnrollment.lastContactedAt) {
        reasons.push('Lead has already been contacted by this specific campaign.');
      } else {
        reasons.push('Lead is already enrolled in this campaign.');
      }
    }

    // Guard Check 6: Conversion status check (Already a customer/meeting booked)
    if (lead.status === 'CONVERTED') {
      reasons.push('Lead is already CONVERTED into a customer; cold outreach is prohibited.');
    }

    const eligible = reasons.length === 0;

    return {
      eligible,
      leadId: lead.id,
      leadEmail: lead.email,
      leadName,
      reasons
    };
  }

  /**
   * Batch evaluates multiple leads against a campaign.
   */
  public static validateBatch(
    leads: Lead[],
    campaign: Campaign,
    existingEnrollmentMap: Map<string, CampaignLead> = new Map()
  ): {
    eligibleLeads: Lead[];
    blockedLeads: { lead: Lead; reasons: string[] }[];
    totalEvaluated: number;
    passRate: number;
  } {
    const eligibleLeads: Lead[] = [];
    const blockedLeads: { lead: Lead; reasons: string[] }[] = [];

    for (const lead of leads) {
      const existing = existingEnrollmentMap.get(lead.id) || null;
      const result = this.validateLeadForCampaign(lead, campaign, existing);

      if (result.eligible) {
        eligibleLeads.push(lead);
      } else {
        blockedLeads.push({
          lead,
          reasons: result.reasons
        });
      }
    }

    const total = leads.length;
    const passRate = total > 0 ? Math.round((eligibleLeads.length / total) * 100) : 0;

    return {
      eligibleLeads,
      blockedLeads,
      totalEvaluated: total,
      passRate
    };
  }
}
