import { analyticsRepository } from '../repositories/analytics.repository.js';
import { campaignRepository } from '../repositories/campaign.repository.js';
import { DashboardOverview, CampaignStats } from '../types/index.js';

export class AnalyticsService {
  async getDashboardOverview(): Promise<DashboardOverview> {
    return analyticsRepository.getDashboardOverview();
  }

  async getCampaignAnalytics(campaignId: string): Promise<CampaignStats> {
    return campaignRepository.getCampaignStats(campaignId);
  }

  async getPipelineAnalytics(): Promise<any> {
    return analyticsRepository.getPipelineAnalytics();
  }
}

export const analyticsService = new AnalyticsService();
