import { randomUUID } from 'crypto';
import { campaignRepository } from '../repositories/campaign.repository.js';
import { leadRepository } from '../repositories/lead.repository.js';
import { activityRepository } from '../repositories/activity.repository.js';
import { sequenceRepository } from '../repositories/sequence.repository.js';
import { CampaignGuardService } from './campaign-guard.service.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { Campaign, CampaignStatus, Lead, CampaignLead } from '../types/index.js';

export class CampaignService {
  async getCampaigns(createdBy?: string): Promise<Campaign[]> {
    return campaignRepository.findAll(createdBy);
  }

  async getCampaignById(id: string): Promise<Campaign> {
    const campaign = await campaignRepository.findById(id);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }
    const stats = await campaignRepository.getCampaignStats(id);
    campaign.stats = stats;
    return campaign;
  }

  async createCampaign(data: {
    name: string;
    description?: string | null;
    createdBy: string;
  }): Promise<Campaign> {
    const campaignId = randomUUID();
    await campaignRepository.create({
      id: campaignId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      status: 'DRAFT',
      createdBy: data.createdBy
    });

    // Automatically initialize a default sequence for the new campaign
    const sequenceId = randomUUID();
    await sequenceRepository.createSequence({
      id: sequenceId,
      campaignId,
      name: `${data.name} Default Sequence`
    });

    // Add initial step #1
    await sequenceRepository.addStep({
      id: randomUUID(),
      sequenceId,
      campaignId,
      stepNumber: 1,
      subject: 'Connecting with {{company}} / {{firstName}}',
      body: 'Hi {{firstName}},\n\nI came across {{company}} and noticed your work as {{jobTitle}}.\n\nWould you be open to a quick intro call?\n\nBest regards,',
      delayDays: 0
    });

    return this.getCampaignById(campaignId);
  }

  async updateCampaign(id: string, updates: { name?: string; description?: string | null; status?: CampaignStatus }): Promise<Campaign> {
    await this.getCampaignById(id);
    await campaignRepository.update(id, updates);
    return this.getCampaignById(id);
  }

  async deleteCampaign(id: string): Promise<void> {
    await this.getCampaignById(id);
    await campaignRepository.delete(id);
  }

  async getCampaignLeads(campaignId: string) {
    await this.getCampaignById(campaignId);
    return campaignRepository.getCampaignLeads(campaignId);
  }

  /**
   * Evaluates leads through Campaign Guard and enrolls eligible ones.
   */
  async enrollLeadsWithGuard(campaignId: string, leadIds: string[], userId?: string) {
    const campaign = await this.getCampaignById(campaignId);
    if (leadIds.length === 0) {
      throw new BadRequestError('No lead IDs provided for enrollment');
    }

    const leads = await leadRepository.findByIds(leadIds);
    if (leads.length === 0) {
      throw new BadRequestError('None of the specified leads exist');
    }

    // Get existing enrollments for this campaign
    const existingEnrollments = await campaignRepository.getCampaignLeads(campaignId);
    const existingMap = new Map<string, CampaignLead>();
    for (const e of existingEnrollments) {
      existingMap.set(e.leadId, e);
    }

    // Run Campaign Guard Engine
    const guardValidation = CampaignGuardService.validateBatch(leads, campaign, existingMap);

    // Enroll only eligible leads
    let enrolledCount = 0;
    if (guardValidation.eligibleLeads.length > 0) {
      const eligibleIds = guardValidation.eligibleLeads.map(l => l.id);
      enrolledCount = await campaignRepository.addLeadsBatch(campaignId, eligibleIds);

      // Log activities for enrolled leads
      for (const lead of guardValidation.eligibleLeads) {
        await activityRepository.create({
          id: randomUUID(),
          leadId: lead.id,
          campaignId,
          userId: userId || null,
          type: 'CAMPAIGN_ADDED',
          title: 'Enrolled in Campaign',
          description: `Passed Campaign Guard and enrolled into '${campaign.name}'`
        });
      }
    }

    return {
      campaignId,
      campaignName: campaign.name,
      totalRequested: leadIds.length,
      enrolledCount,
      eligibleCount: guardValidation.eligibleLeads.length,
      blockedCount: guardValidation.blockedLeads.length,
      passRate: guardValidation.passRate,
      eligibleLeads: guardValidation.eligibleLeads,
      blockedLeads: guardValidation.blockedLeads
    };
  }

  /**
   * Dry-run Campaign Guard validation without modifying database
   */
  async previewCampaignGuard(campaignId: string, leadIds: string[]) {
    const campaign = await this.getCampaignById(campaignId);
    const leads = await leadRepository.findByIds(leadIds);
    const existingEnrollments = await campaignRepository.getCampaignLeads(campaignId);
    const existingMap = new Map<string, CampaignLead>();
    for (const e of existingEnrollments) {
      existingMap.set(e.leadId, e);
    }
    return CampaignGuardService.validateBatch(leads, campaign, existingMap);
  }

  async removeLeadFromCampaign(campaignId: string, leadId: string, userId?: string): Promise<void> {
    await this.getCampaignById(campaignId);
    await campaignRepository.removeLead(campaignId, leadId);

    await activityRepository.create({
      id: randomUUID(),
      leadId,
      campaignId,
      userId: userId || null,
      type: 'CAMPAIGN_REMOVED',
      title: 'Removed from Campaign',
      description: 'Lead removed from campaign sequence'
    });
  }

  async getCampaignAnalytics(campaignId: string) {
    await this.getCampaignById(campaignId);
    return campaignRepository.getCampaignStats(campaignId);
  }
}

export const campaignService = new CampaignService();
