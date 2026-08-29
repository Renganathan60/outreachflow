import { query, withTransaction } from '../config/db.js';
import { Campaign, CampaignLead, CampaignStats } from '../types/index.js';

export class CampaignRepository {
  async findById(id: string): Promise<Campaign | null> {
    const rows = await query<any[]>(
      `SELECT c.*, COUNT(cl.id) as leadCount 
       FROM campaigns c 
       LEFT JOIN campaign_leads cl ON c.id = cl.campaignId 
       WHERE c.id = ? 
       GROUP BY c.id 
       LIMIT 1`,
      [id]
    );
    if (rows.length === 0) return null;
    const campaign = rows[0];
    campaign.leadCount = Number(campaign.leadCount || 0);
    return campaign;
  }

  async findAll(createdBy?: string): Promise<Campaign[]> {
    const whereSql = createdBy ? 'WHERE c.createdBy = ?' : '';
    const params = createdBy ? [createdBy] : [];

    const rows = await query<any[]>(
      `SELECT c.*, COUNT(cl.id) as leadCount 
       FROM campaigns c 
       LEFT JOIN campaign_leads cl ON c.id = cl.campaignId 
       ${whereSql}
       GROUP BY c.id 
       ORDER BY c.createdAt DESC`,
      params
    );

    return rows.map(r => ({
      ...r,
      leadCount: Number(r.leadCount || 0)
    }));
  }

  async create(campaign: { id: string; name: string; description?: string | null; status?: string; createdBy: string }): Promise<void> {
    await query(
      'INSERT INTO campaigns (id, name, description, status, createdBy) VALUES (?, ?, ?, ?, ?)',
      [campaign.id, campaign.name, campaign.description || null, campaign.status || 'DRAFT', campaign.createdBy]
    );
  }

  async update(id: string, updates: Partial<Campaign>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (fields.length === 0) return;

    values.push(id);
    await query(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM campaigns WHERE id = ?', [id]);
  }

  async getCampaignLeads(campaignId: string): Promise<any[]> {
    return query<any[]>(
      `SELECT 
        cl.id as enrollmentId,
        cl.campaignId,
        cl.leadId,
        cl.status as enrollmentStatus,
        cl.enrolledAt,
        cl.lastContactedAt,
        l.firstName,
        l.lastName,
        l.email,
        l.company,
        l.jobTitle,
        l.industry,
        l.companySize,
        l.status as leadStatus,
        l.priorityScore,
        l.leadHealth,
        l.emailVerificationStatus
       FROM campaign_leads cl
       INNER JOIN leads l ON cl.leadId = l.id
       WHERE cl.campaignId = ?
       ORDER BY cl.enrolledAt DESC`,
      [campaignId]
    );
  }

  async getEnrollment(campaignId: string, leadId: string): Promise<CampaignLead | null> {
    const rows = await query<CampaignLead[]>(
      'SELECT * FROM campaign_leads WHERE campaignId = ? AND leadId = ? LIMIT 1',
      [campaignId, leadId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async getEnrollmentsByLeadId(leadId: string): Promise<any[]> {
    return query<any[]>(
      `SELECT cl.*, c.name as campaignName, c.status as campaignStatus, c.description as campaignDescription
       FROM campaign_leads cl
       INNER JOIN campaigns c ON cl.campaignId = c.id
       WHERE cl.leadId = ?
       ORDER BY cl.enrolledAt DESC`,
      [leadId]
    );
  }

  async updateEnrollmentStatus(campaignId: string, leadId: string, status: string): Promise<void> {
    await query(
      `UPDATE campaign_leads 
       SET status = ?, lastContactedAt = CURRENT_TIMESTAMP 
       WHERE campaignId = ? AND leadId = ?`,
      [status, campaignId, leadId]
    );
  }

  async addLeadsBatch(campaignId: string, leadIds: string[]): Promise<number> {
    if (leadIds.length === 0) return 0;

    return withTransaction(async (conn) => {
      let insertedCount = 0;
      for (const leadId of leadIds) {
        const id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        });

        const [res]: any = await conn.execute(
          `INSERT IGNORE INTO campaign_leads (id, campaignId, leadId, status) VALUES (?, ?, ?, 'PENDING')`,
          [id, campaignId, leadId]
        );
        if (res.affectedRows > 0) insertedCount++;
      }
      return insertedCount;
    });
  }

  async removeLead(campaignId: string, leadId: string): Promise<void> {
    await query(
      'DELETE FROM campaign_leads WHERE campaignId = ? AND leadId = ?',
      [campaignId, leadId]
    );
  }

  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    // Aggregation query based on activities and lead statuses in campaign
    const [leadCounts]: any = await query(
      `SELECT 
        COUNT(cl.id) as totalLeads,
        SUM(CASE WHEN cl.status != 'PENDING' OR cl.lastContactedAt IS NOT NULL THEN 1 ELSE 0 END) as contactedCount,
        SUM(CASE WHEN l.status IN ('REPLIED', 'INTERESTED', 'MEETING', 'CONVERTED') OR cl.status = 'REPLIED' THEN 1 ELSE 0 END) as repliedCount,
        SUM(CASE WHEN l.status IN ('INTERESTED', 'MEETING', 'CONVERTED') THEN 1 ELSE 0 END) as interestedCount,
        SUM(CASE WHEN l.status IN ('MEETING', 'CONVERTED') THEN 1 ELSE 0 END) as meetingCount,
        SUM(CASE WHEN l.status = 'CONVERTED' OR cl.status = 'CONVERTED' THEN 1 ELSE 0 END) as convertedCount
       FROM campaign_leads cl
       INNER JOIN leads l ON cl.leadId = l.id
       WHERE cl.campaignId = ?`,
      [campaignId]
    );

    const [activityCounts]: any = await query(
      `SELECT 
        SUM(CASE WHEN type IN ('EMAIL_SENT', 'FOLLOW_UP_SENT') THEN 1 ELSE 0 END) as emailsSent,
        SUM(CASE WHEN type = 'EMAIL_OPENED' THEN 1 ELSE 0 END) as opened,
        SUM(CASE WHEN type = 'EMAIL_REPLIED' THEN 1 ELSE 0 END) as repliedActivities,
        SUM(CASE WHEN type = 'MEETING_SCHEDULED' THEN 1 ELSE 0 END) as meetingActivities
       FROM activities 
       WHERE campaignId = ?`,
      [campaignId]
    );

    const totalLeads = Number(leadCounts?.totalLeads || 0);
    const emailsSent = Math.max(Number(activityCounts?.emailsSent || 0), Number(leadCounts?.contactedCount || 0));
    const opened = Number(activityCounts?.opened || 0);
    const replies = Math.max(Number(activityCounts?.repliedActivities || 0), Number(leadCounts?.repliedCount || 0));
    const interested = Number(leadCounts?.interestedCount || 0);
    const meetings = Math.max(Number(activityCounts?.meetingActivities || 0), Number(leadCounts?.meetingCount || 0));
    const converted = Number(leadCounts?.convertedCount || 0);

    const openRate = emailsSent > 0 ? Math.min(100, Math.round((opened / emailsSent) * 100)) : 0;
    const replyRate = emailsSent > 0 ? Math.min(100, Math.round((replies / emailsSent) * 100)) : 0;
    const interestRate = replies > 0 ? Math.min(100, Math.round((interested / replies) * 100)) : 0;
    const conversionRate = totalLeads > 0 ? Math.min(100, Math.round((converted / totalLeads) * 100)) : 0;

    return {
      totalLeads,
      emailsSent,
      opened,
      replies,
      interested,
      meetings,
      converted,
      openRate,
      replyRate,
      interestRate,
      conversionRate
    };
  }
}

export const campaignRepository = new CampaignRepository();
