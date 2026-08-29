import { randomUUID } from 'crypto';
import { activityRepository } from '../repositories/activity.repository.js';
import { leadRepository } from '../repositories/lead.repository.js';
import { campaignRepository } from '../repositories/campaign.repository.js';
import { LeadScoringService } from './lead-scoring.service.js';
import { LeadHealthService } from './lead-health.service.js';
import { NotFoundError } from '../utils/errors.js';
import { Activity, ActivityType, LeadStatus } from '../types/index.js';

export class ActivityService {
  async getLeadActivities(leadId: string): Promise<Activity[]> {
    const lead = await leadRepository.findById(leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }
    return activityRepository.getByLeadId(leadId);
  }

  /**
   * Log an activity and automatically recompute lead's score and health status in MySQL.
   */
  async logActivity(data: {
    leadId: string;
    campaignId?: string | null;
    userId?: string | null;
    type: ActivityType;
    title: string;
    description?: string | null;
    metadata?: Record<string, any> | null;
    autoUpdateLeadStatus?: LeadStatus;
  }): Promise<Activity> {
    const lead = await leadRepository.findById(data.leadId);
    if (!lead) {
      throw new NotFoundError('Lead');
    }

    const activityId = randomUUID();
    await activityRepository.create({
      id: activityId,
      leadId: data.leadId,
      campaignId: data.campaignId || null,
      userId: data.userId || null,
      type: data.type,
      title: data.title,
      description: data.description || null,
      metadata: data.metadata || null
    });

    // Auto-update lead status if relevant
    let newStatus = lead.status;
    if (data.autoUpdateLeadStatus) {
      newStatus = data.autoUpdateLeadStatus;
    } else if (data.type === 'EMAIL_REPLIED' && lead.status !== 'INTERESTED' && lead.status !== 'MEETING' && lead.status !== 'CONVERTED') {
      newStatus = 'REPLIED';
    } else if (data.type === 'MEETING_SCHEDULED') {
      newStatus = 'MEETING';
    } else if (data.type === 'EMAIL_SENT' && lead.status === 'NEW') {
      newStatus = 'CONTACTED';
    }

    // Recalculate score and health with updated activities
    const allActivities = await activityRepository.getByLeadId(data.leadId);
    const updatedLeadData = {
      ...lead,
      status: newStatus
    };

    const newScore = LeadScoringService.calculateScore(updatedLeadData, allActivities).totalScore;
    const newHealth = LeadHealthService.calculateHealth(updatedLeadData, allActivities);

    await leadRepository.update(data.leadId, {
      status: newStatus,
      priorityScore: newScore,
      leadHealth: newHealth
    });

    if (data.campaignId) {
      if (data.type === 'EMAIL_SENT' || data.type === 'FOLLOW_UP_SENT') {
        await campaignRepository.updateEnrollmentStatus(data.campaignId, data.leadId, 'CONTACTED');
      } else if (data.type === 'EMAIL_REPLIED') {
        await campaignRepository.updateEnrollmentStatus(data.campaignId, data.leadId, 'REPLIED');
      }
    }

    const createdActivities = await activityRepository.getByLeadId(data.leadId);
    return createdActivities.find(a => a.id === activityId) || allActivities[0];
  }
}

export const activityService = new ActivityService();
