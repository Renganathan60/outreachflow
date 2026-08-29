import { query } from '../config/db.js';
import { DashboardOverview } from '../types/index.js';
import { activityRepository } from './activity.repository.js';

export class AnalyticsRepository {
  async getDashboardOverview(): Promise<DashboardOverview> {
    // 1. Overall counts
    const [leadStats]: any = await query(
      `SELECT 
        COUNT(*) as totalLeads,
        SUM(CASE WHEN status = 'INTERESTED' THEN 1 ELSE 0 END) as interestedLeads,
        SUM(CASE WHEN status = 'MEETING' THEN 1 ELSE 0 END) as meetingsScheduled,
        SUM(CASE WHEN status = 'CONVERTED' THEN 1 ELSE 0 END) as conversions,
        SUM(CASE WHEN priorityScore >= 80 THEN 1 ELSE 0 END) as highPriority,
        SUM(CASE WHEN priorityScore >= 50 AND priorityScore < 80 THEN 1 ELSE 0 END) as mediumPriority,
        SUM(CASE WHEN priorityScore < 50 THEN 1 ELSE 0 END) as lowPriority,
        SUM(CASE WHEN leadHealth = 'ACTIVE' THEN 1 ELSE 0 END) as healthActive,
        SUM(CASE WHEN leadHealth = 'NEEDS_FOLLOW_UP' THEN 1 ELSE 0 END) as healthNeedsFollowUp,
        SUM(CASE WHEN leadHealth = 'HIGH_INTENT' THEN 1 ELSE 0 END) as healthHighIntent,
        SUM(CASE WHEN leadHealth = 'UNRESPONSIVE' THEN 1 ELSE 0 END) as healthUnresponsive,
        SUM(CASE WHEN leadHealth = 'DO_NOT_CONTACT' THEN 1 ELSE 0 END) as healthDoNotContact
       FROM leads`
    );

    const [campaignStats]: any = await query(
      `SELECT COUNT(*) as activeCampaigns FROM campaigns WHERE status = 'ACTIVE'`
    );

    const [activityStats]: any = await query(
      `SELECT 
        SUM(CASE WHEN type = 'EMAIL_SENT' OR type = 'FOLLOW_UP_SENT' THEN 1 ELSE 0 END) as emailsSent,
        SUM(CASE WHEN type = 'EMAIL_OPENED' THEN 1 ELSE 0 END) as emailsOpened,
        SUM(CASE WHEN type = 'EMAIL_REPLIED' THEN 1 ELSE 0 END) as replies
       FROM activities`
    );

    const totalLeads = Number(leadStats?.totalLeads || 0);
    const activeCampaigns = Number(campaignStats?.activeCampaigns || 0);
    const emailsSent = Number(activityStats?.emailsSent || 0);
    const emailsOpened = Number(activityStats?.emailsOpened || 0);
    const replies = Number(activityStats?.replies || 0);
    const interestedLeads = Number(leadStats?.interestedLeads || 0);
    const meetingsScheduled = Number(leadStats?.meetingsScheduled || 0);
    const conversions = Number(leadStats?.conversions || 0);

    const conversionRate = totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0;

    // 2. Top priority leads
    const topPriorityLeads = await query(
      `SELECT * FROM leads ORDER BY priorityScore DESC, createdAt DESC LIMIT 5`
    );

    // 3. Recent activities
    const recentActivities = await activityRepository.getRecent(8);

    return {
      totalLeads,
      activeCampaigns,
      emailsSent,
      emailsOpened,
      replies,
      interestedLeads,
      meetingsScheduled,
      conversions,
      conversionRate,
      priorityDistribution: {
        high: Number(leadStats?.highPriority || 0),
        medium: Number(leadStats?.mediumPriority || 0),
        low: Number(leadStats?.lowPriority || 0)
      },
      healthDistribution: {
        active: Number(leadStats?.healthActive || 0),
        needsFollowUp: Number(leadStats?.healthNeedsFollowUp || 0),
        highIntent: Number(leadStats?.healthHighIntent || 0),
        unresponsive: Number(leadStats?.healthUnresponsive || 0),
        doNotContact: Number(leadStats?.healthDoNotContact || 0)
      },
      recentActivities,
      topPriorityLeads
    };
  }

  async getPipelineAnalytics(): Promise<any> {
    const statusDistribution = await query(
      `SELECT status, COUNT(*) as count FROM leads GROUP BY status`
    );

    const industryDistribution = await query(
      `SELECT industry, COUNT(*) as count, AVG(priorityScore) as avgScore FROM leads GROUP BY industry ORDER BY count DESC`
    );

    const sourcePerformance = await query(
      `SELECT 
        source, 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('INTERESTED', 'MEETING', 'CONVERTED') THEN 1 ELSE 0 END) as qualifiedCount
       FROM leads 
       GROUP BY source`
    );

    return {
      statusDistribution,
      industryDistribution,
      sourcePerformance
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
