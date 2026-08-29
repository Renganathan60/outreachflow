import { randomUUID } from 'crypto';
import { sequenceRepository } from '../repositories/sequence.repository.js';
import { campaignRepository } from '../repositories/campaign.repository.js';
import { NotFoundError, BadRequestError } from '../utils/errors.js';
import { EmailSequence, EmailStep } from '../types/index.js';

export class SequenceService {
  async getSequenceByCampaignId(campaignId: string): Promise<EmailSequence> {
    const campaign = await campaignRepository.findById(campaignId);
    if (!campaign) {
      throw new NotFoundError('Campaign');
    }

    let sequence = await sequenceRepository.getByCampaignId(campaignId);
    if (!sequence) {
      // Auto-create if not existing
      const sequenceId = randomUUID();
      await sequenceRepository.createSequence({
        id: sequenceId,
        campaignId,
        name: `${campaign.name} Sequence`
      });
      sequence = await sequenceRepository.getByCampaignId(campaignId);
    }

    if (!sequence) {
      throw new NotFoundError('Sequence');
    }
    return sequence;
  }

  async addStep(campaignId: string, data: { subject: string; body: string; delayDays: number }): Promise<EmailSequence> {
    const sequence = await this.getSequenceByCampaignId(campaignId);
    const existingSteps = sequence.steps || [];
    const nextStepNumber = existingSteps.length + 1;

    await sequenceRepository.addStep({
      id: randomUUID(),
      sequenceId: sequence.id,
      campaignId,
      stepNumber: nextStepNumber,
      subject: data.subject.trim(),
      body: data.body.trim(),
      delayDays: Math.max(0, data.delayDays || 0)
    });

    return this.getSequenceByCampaignId(campaignId);
  }

  async updateStep(stepId: string, campaignId: string, data: Partial<EmailStep>): Promise<EmailSequence> {
    await sequenceRepository.updateStep(stepId, data);
    return this.getSequenceByCampaignId(campaignId);
  }

  async deleteStep(stepId: string, campaignId: string): Promise<EmailSequence> {
    await sequenceRepository.deleteStep(stepId);
    return this.getSequenceByCampaignId(campaignId);
  }
}

export const sequenceService = new SequenceService();
