import { query, withTransaction } from '../config/db.js';
import { EmailSequence, EmailStep } from '../types/index.js';

export class SequenceRepository {
  async getByCampaignId(campaignId: string): Promise<EmailSequence | null> {
    const sequences = await query<EmailSequence[]>(
      'SELECT * FROM email_sequences WHERE campaignId = ? LIMIT 1',
      [campaignId]
    );
    if (sequences.length === 0) return null;

    const sequence = sequences[0];
    const steps = await query<EmailStep[]>(
      'SELECT * FROM email_steps WHERE sequenceId = ? ORDER BY stepNumber ASC',
      [sequence.id]
    );
    sequence.steps = steps;
    return sequence;
  }

  async getStepsByCampaignId(campaignId: string): Promise<EmailStep[]> {
    return query<EmailStep[]>(
      `SELECT es.* 
       FROM email_steps es
       INNER JOIN email_sequences seq ON es.sequenceId = seq.id
       WHERE seq.campaignId = ?
       ORDER BY es.stepNumber ASC`,
      [campaignId]
    );
  }

  async createSequence(data: { id: string; campaignId: string; name: string }): Promise<void> {
    await query(
      'INSERT INTO email_sequences (id, campaignId, name) VALUES (?, ?, ?)',
      [data.id, data.campaignId, data.name]
    );
  }

  async addStep(step: {
    id: string;
    sequenceId: string;
    campaignId: string;
    stepNumber: number;
    subject: string;
    body: string;
    delayDays: number;
  }): Promise<void> {
    await query(
      `INSERT INTO email_steps (id, sequenceId, campaignId, stepNumber, subject, body, delayDays)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [step.id, step.sequenceId, step.campaignId, step.stepNumber, step.subject, step.body, step.delayDays]
    );
  }

  async updateStep(id: string, updates: Partial<EmailStep>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.subject !== undefined) {
      fields.push('subject = ?');
      values.push(updates.subject);
    }
    if (updates.body !== undefined) {
      fields.push('body = ?');
      values.push(updates.body);
    }
    if (updates.delayDays !== undefined) {
      fields.push('delayDays = ?');
      values.push(updates.delayDays);
    }
    if (updates.stepNumber !== undefined) {
      fields.push('stepNumber = ?');
      values.push(updates.stepNumber);
    }

    if (fields.length === 0) return;

    values.push(id);
    await query(`UPDATE email_steps SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async deleteStep(id: string): Promise<void> {
    await query('DELETE FROM email_steps WHERE id = ?', [id]);
  }

  async deleteSequence(id: string): Promise<void> {
    await query('DELETE FROM email_sequences WHERE id = ?', [id]);
  }
}

export const sequenceRepository = new SequenceRepository();
