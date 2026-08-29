import { query } from '../config/db.js';
import { Activity } from '../types/index.js';

export class ActivityRepository {
  async create(activity: {
    id: string;
    leadId: string;
    campaignId?: string | null;
    userId?: string | null;
    type: string;
    title: string;
    description?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<void> {
    await query(
      `INSERT INTO activities (id, leadId, campaignId, userId, type, title, description, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activity.id,
        activity.leadId,
        activity.campaignId || null,
        activity.userId || null,
        activity.type,
        activity.title,
        activity.description || null,
        activity.metadata ? JSON.stringify(activity.metadata) : null
      ]
    );
  }

  async getByLeadId(leadId: string, limit: number = 50): Promise<Activity[]> {
    const rows = await query<any[]>(
      `SELECT * FROM activities WHERE leadId = ? ORDER BY createdAt DESC LIMIT ?`,
      [leadId, limit]
    );
    return rows.map(r => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
    }));
  }

  async getRecent(limit: number = 10): Promise<any[]> {
    const rows = await query<any[]>(
      `SELECT a.*, l.firstName, l.lastName, l.company, l.email, c.name as campaignName
       FROM activities a
       INNER JOIN leads l ON a.leadId = l.id
       LEFT JOIN campaigns c ON a.campaignId = c.id
       ORDER BY a.createdAt DESC
       LIMIT ?`,
      [limit]
    );
    return rows.map(r => ({
      ...r,
      metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
    }));
  }
}

export const activityRepository = new ActivityRepository();
