import { randomUUID } from 'crypto';
import { leadRepository } from '../repositories/lead.repository.js';
import { activityRepository } from '../repositories/activity.repository.js';
import { campaignRepository } from '../repositories/campaign.repository.js';
import { sequenceRepository } from '../repositories/sequence.repository.js';
import { LeadScoringService } from './lead-scoring.service.js';
import { LeadHealthService } from './lead-health.service.js';
import { emailVerificationService } from './email-verification.service.js';
import { activityService } from './activity.service.js';
import { emailService } from './email.service.js';
import { CampaignGuardService } from './campaign-guard.service.js';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors.js';
import { Lead, LeadFilterParams, PaginatedResult, ScoreExplanation, EmailStep } from '../types/index.js';

function renderTemplate(template: string, lead: Lead): string {
  if (!template) return '';
  return template
    .replace(/\{\{firstName\}\}/g, lead.firstName || '')
    .replace(/\{\{lastName\}\}/g, lead.lastName || '')
    .replace(/\{\{company\}\}/g, lead.company || '')
    .replace(/\{\{jobTitle\}\}/g, lead.jobTitle || '')
    .replace(/\{\{industry\}\}/g, lead.industry || '');
}

export class LeadService {
  async getLeads(params: LeadFilterParams): Promise<PaginatedResult<Lead>> {
    return leadRepository.list(params);
  }

  async getLeadById(id: string): Promise<any> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError('Lead');
    }
    const enrolledCampaigns = await campaignRepository.getEnrollmentsByLeadId(id);
    return {
      ...lead,
      enrolledCampaigns
    };
  }

  async createLead(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    company: string;
    jobTitle: string;
    industry: string;
    companySize?: any;
    source?: any;
    status?: any;
    createdBy: string;
  }): Promise<Lead> {
    const existing = await leadRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`Lead with email '${data.email}' already exists`);
    }

    // 1. Email Verification
    const verification = await emailVerificationService.verifyEmail(data.email);

    const leadId = randomUUID();
    const candidateLead: Partial<Lead> = {
      id: leadId,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
      company: data.company.trim(),
      jobTitle: data.jobTitle.trim(),
      industry: data.industry.trim(),
      companySize: data.companySize || '11-50',
      source: data.source || 'MANUAL',
      status: data.status || 'NEW',
      emailVerificationStatus: verification.status,
      createdBy: data.createdBy
    };

    // 2. Score & Health Calculation
    candidateLead.priorityScore = LeadScoringService.calculateScore(candidateLead, []).totalScore;
    candidateLead.leadHealth = LeadHealthService.calculateHealth(candidateLead, []);

    await leadRepository.create(candidateLead);

    // 3. Log initial activity
    await activityRepository.create({
      id: randomUUID(),
      leadId,
      userId: data.createdBy,
      type: 'STATUS_CHANGED',
      title: 'Lead Created',
      description: `Lead created from source: ${candidateLead.source}`
    });

    return this.getLeadById(leadId);
  }

  async updateLead(id: string, updates: Partial<Lead>, modifiedByUserId?: string): Promise<Lead> {
    const existing = await leadRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Lead');
    }

    if (updates.email && updates.email.toLowerCase().trim() !== existing.email.toLowerCase().trim()) {
      const emailConflict = await leadRepository.findByEmail(updates.email);
      if (emailConflict && emailConflict.id !== id) {
        throw new ConflictError(`Email '${updates.email}' is already in use by another lead`);
      }
      const verification = await emailVerificationService.verifyEmail(updates.email);
      updates.emailVerificationStatus = verification.status;
    }

    const mergedLead: Lead = {
      ...existing,
      ...updates
    };

    // Re-evaluate activities to recalculate score & health
    const activities = await activityRepository.getByLeadId(id);
    mergedLead.priorityScore = LeadScoringService.calculateScore(mergedLead, activities).totalScore;
    mergedLead.leadHealth = LeadHealthService.calculateHealth(mergedLead, activities);

    await leadRepository.update(id, mergedLead);

    if (updates.status && updates.status !== existing.status) {
      await activityRepository.create({
        id: randomUUID(),
        leadId: id,
        userId: modifiedByUserId || null,
        type: 'STATUS_CHANGED',
        title: 'Status Updated',
        description: `Status changed from ${existing.status} to ${updates.status}`
      });
    }

    return this.getLeadById(id);
  }

  async deleteLead(id: string): Promise<void> {
    await this.getLeadById(id);
    await leadRepository.delete(id);
  }

  async getLeadScoreExplanation(id: string): Promise<ScoreExplanation> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError('Lead');
    }
    const activities = await activityRepository.getByLeadId(id);
    return LeadScoringService.calculateScore(lead, activities);
  }

  async verifyLeadEmail(id: string): Promise<Lead> {
    const lead = await leadRepository.findById(id);
    if (!lead) {
      throw new NotFoundError('Lead');
    }
    const verification = await emailVerificationService.verifyEmail(lead.email);
    const activities = await activityRepository.getByLeadId(id);

    const updatedLead: Lead = {
      ...lead,
      emailVerificationStatus: verification.status
    };

    updatedLead.priorityScore = LeadScoringService.calculateScore(updatedLead, activities).totalScore;
    updatedLead.leadHealth = LeadHealthService.calculateHealth(updatedLead, activities);

    await leadRepository.update(id, updatedLead);
    return this.getLeadById(id);
  }

  /**
   * End-to-end execution of a cadence outreach email for an enrolled lead.
   * Validates Campaign Guard, checks idempotency, renders personalized tokens,
   * sends real email via EmailService (Resend API), logs EMAIL_SENT activity upon provider confirmation,
   * updates campaign_leads status, and recomputes lead priority score and health.
   */
  async sendCadenceEmail(leadId: string, campaignId?: string, userId?: string) {
    // 1. Authoritative Recipient & Lead retrieval from MySQL
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const enrolledCampaigns = await campaignRepository.getEnrollmentsByLeadId(leadId);
    if (enrolledCampaigns.length === 0) {
      throw new BadRequestError('Lead is not enrolled in any campaign. Please enroll the lead into a campaign first.');
    }

    let targetEnrollment = campaignId 
      ? enrolledCampaigns.find(e => e.campaignId === campaignId)
      : enrolledCampaigns.find(e => e.campaignStatus === 'ACTIVE') || enrolledCampaigns[0];

    if (!targetEnrollment) {
      throw new BadRequestError('Lead is not enrolled in the specified campaign.');
    }

    const targetCampaignId = targetEnrollment.campaignId;
    const targetCampaign = await campaignRepository.findById(targetCampaignId);
    if (!targetCampaign) {
      throw new NotFoundError('Campaign');
    }

    // 2. Comprehensive Campaign Guard Safety Validation
    const guardResult = CampaignGuardService.validateLeadForCampaign(lead, targetCampaign, null);
    if (!guardResult.eligible) {
      throw new BadRequestError(`Blocked by Campaign Guard: ${guardResult.reasons.join(' ')}`);
    }

    if (targetCampaign.status !== 'ACTIVE') {
      throw new BadRequestError(
        `Campaign '${targetCampaign.name}' is currently ${targetCampaign.status}. Please activate the campaign before sending emails.`
      );
    }

    if (lead.emailVerificationStatus === 'INVALID') {
      throw new BadRequestError(
        'Lead has an INVALID or undeliverable email address. Blocked by Campaign Guard.'
      );
    }

    if (lead.leadHealth === 'DO_NOT_CONTACT' || lead.status === 'NOT_INTERESTED') {
      throw new BadRequestError(
        'Lead is on suppression list (DO_NOT_CONTACT). Blocked by Campaign Guard.'
      );
    }

    // 3. Fetch Cadence Steps
    const steps = await sequenceRepository.getStepsByCampaignId(targetCampaignId);
    if (steps.length === 0) {
      throw new BadRequestError(`No email cadence steps configured for campaign '${targetCampaign.name}'.`);
    }

    // Default to initial Day 0 step (step #1)
    const step = steps.find((s: EmailStep) => s.delayDays === 0) || steps[0];

    // 4. Idempotency Check: Prevent duplicate sends for same lead + campaign + step
    const existingActivities = await activityRepository.getByLeadId(leadId);
    const alreadySent = existingActivities.some(
      a => a.type === 'EMAIL_SENT' && 
           a.campaignId === targetCampaignId &&
           (a.metadata?.stepNumber === step.stepNumber || targetEnrollment.status === 'CONTACTED')
    );

    if (alreadySent) {
      throw new BadRequestError(
        `Day ${step.delayDays} initial email has already been sent to ${lead.firstName} ${lead.lastName} for campaign '${targetCampaign.name}'.`
      );
    }

    // 5. Render Personalization Variables
    const renderedSubject = renderTemplate(step.subject, lead);
    const renderedBody = renderTemplate(step.body, lead);

    // 6. Real Transactional Email Dispatch through Resend
    // Recipient MUST strictly be the lead's email from MySQL
    const sendResult = await emailService.sendCadenceEmail({
      to: lead.email,
      toName: `${lead.firstName} ${lead.lastName}`.trim(),
      subject: renderedSubject,
      body: renderedBody,
      campaignName: targetCampaign.name,
      leadId: lead.id,
      campaignId: targetCampaignId,
      stepNumber: step.stepNumber
    });

    // 7. Log EMAIL_SENT Activity ONLY upon successful provider acceptance
    const activity = await activityService.logActivity({
      leadId,
      campaignId: targetCampaignId,
      userId: userId || null,
      type: 'EMAIL_SENT',
      title: 'Outreach Email Sent',
      description: 'Personalized cadence email submitted to inbox via Resend',
      metadata: {
        stepId: step.id,
        stepNumber: step.stepNumber,
        delayDays: step.delayDays,
        subject: renderedSubject,
        body: renderedBody,
        recipientEmail: lead.email,
        campaignName: targetCampaign.name,
        providerMessageId: sendResult.messageId,
        provider: sendResult.provider,
        deliveryStatus: sendResult.status // 'EMAIL_SUBMITTED'
      },
      autoUpdateLeadStatus: lead.status === 'NEW' ? 'CONTACTED' : lead.status
    });

    // 8. Update enrollment status in campaign_leads to CONTACTED
    await campaignRepository.updateEnrollmentStatus(targetCampaignId, leadId, 'CONTACTED');

    const updatedLead = await this.getLeadById(leadId);

    return {
      message: 'Email submitted successfully.',
      activity,
      lead: updatedLead,
      emailDetails: {
        campaignId: targetCampaignId,
        campaignName: targetCampaign.name,
        stepNumber: step.stepNumber,
        delayDays: step.delayDays,
        recipientEmail: lead.email,
        subject: renderedSubject,
        body: renderedBody,
        providerMessageId: sendResult.messageId,
        deliveryStatus: sendResult.status
      }
    };
  }
}

export const leadService = new LeadService();
