import { query } from '../config/db.js';
import { Lead, LeadFilterParams, PaginatedResult } from '../types/index.js';

export class LeadRepository {
  async findById(id: string): Promise<Lead | null> {
    const rows = await query<Lead[]>(
      `SELECT * FROM leads WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByEmail(email: string): Promise<Lead | null> {
    const rows = await query<Lead[]>(
      `SELECT * FROM leads WHERE email = ? LIMIT 1`,
      [email.toLowerCase().trim()]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async findByIds(ids: string[]): Promise<Lead[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(',');
    return query<Lead[]>(
      `SELECT * FROM leads WHERE id IN (${placeholders})`,
      ids
    );
  }

  async list(params: LeadFilterParams): Promise<PaginatedResult<Lead>> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 15));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ['1=1'];
    const values: any[] = [];

    // Search query across name, email, company, jobTitle
    if (params.search && params.search.trim()) {
      const s = `%${params.search.trim()}%`;
      whereClauses.push('(firstName LIKE ? OR lastName LIKE ? OR email LIKE ? OR company LIKE ? OR jobTitle LIKE ?)');
      values.push(s, s, s, s, s);
    }

    if (params.status) {
      whereClauses.push('status = ?');
      values.push(params.status);
    }

    if (params.industry) {
      whereClauses.push('industry = ?');
      values.push(params.industry);
    }

    if (params.source) {
      whereClauses.push('source = ?');
      values.push(params.source);
    }

    if (params.companySize) {
      whereClauses.push('companySize = ?');
      values.push(params.companySize);
    }

    if (params.emailVerificationStatus) {
      whereClauses.push('emailVerificationStatus = ?');
      values.push(params.emailVerificationStatus);
    }

    if (params.leadHealth) {
      whereClauses.push('leadHealth = ?');
      values.push(params.leadHealth);
    }

    if (params.priorityTier) {
      if (params.priorityTier === 'HIGH') {
        whereClauses.push('priorityScore >= 80');
      } else if (params.priorityTier === 'MEDIUM') {
        whereClauses.push('priorityScore >= 50 AND priorityScore < 80');
      } else if (params.priorityTier === 'LOW') {
        whereClauses.push('priorityScore < 50');
      }
    }

    const whereSql = whereClauses.join(' AND ');

    // Sorting
    const allowedSortFields = ['createdAt', 'priorityScore', 'company', 'status', 'firstName'];
    const sortBy = allowedSortFields.includes(params.sortBy || '') ? params.sortBy : 'createdAt';
    const sortOrder = params.sortOrder === 'ASC' ? 'ASC' : 'DESC';

    // 1. Get Total Count
    const countRows = await query<[{ total: number }]>(
      `SELECT COUNT(*) as total FROM leads WHERE ${whereSql}`,
      values
    );
    const total = countRows[0]?.total || 0;

    // 2. Get Paginated Records
    const safeLimit = Number(limit);
    const safeOffset = Number(offset);
    const items = await query<Lead[]>(
      `SELECT * FROM leads WHERE ${whereSql} ORDER BY ${sortBy} ${sortOrder} LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      values
    );

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  async create(lead: Partial<Lead>): Promise<void> {
    await query(
      `INSERT INTO leads 
       (id, firstName, lastName, email, phone, company, jobTitle, industry, companySize, source, status, priorityScore, leadHealth, emailVerificationStatus, createdBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lead.id,
        lead.firstName,
        lead.lastName,
        lead.email?.toLowerCase().trim(),
        lead.phone || null,
        lead.company,
        lead.jobTitle,
        lead.industry,
        lead.companySize || '11-50',
        lead.source || 'MANUAL',
        lead.status || 'NEW',
        lead.priorityScore ?? 0,
        lead.leadHealth || 'ACTIVE',
        lead.emailVerificationStatus || 'UNKNOWN',
        lead.createdBy
      ]
    );
  }

  async update(id: string, updates: Partial<Lead>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    const allowedKeys: (keyof Lead)[] = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'company',
      'jobTitle',
      'industry',
      'companySize',
      'source',
      'status',
      'priorityScore',
      'leadHealth',
      'emailVerificationStatus'
    ];

    for (const key of allowedKeys) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(key === 'email' ? String(updates[key]).toLowerCase().trim() : updates[key]);
      }
    }

    if (fields.length === 0) return;

    values.push(id);
    await query(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);
  }

  async delete(id: string): Promise<void> {
    await query('DELETE FROM leads WHERE id = ?', [id]);
  }
}

export const leadRepository = new LeadRepository();
