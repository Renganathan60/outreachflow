import { z } from 'zod';

export const createLeadSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Must be a valid email address').max(255),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().min(1, 'Company is required').max(150),
  jobTitle: z.string().min(1, 'Job title is required').max(150),
  industry: z.string().min(1, 'Industry is required').max(100),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional().default('11-50'),
  source: z.enum(['LINKEDIN', 'WEBSITE', 'REFERRAL', 'IMPORT', 'MANUAL']).optional().default('MANUAL'),
  status: z.enum(['NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'MEETING', 'CONVERTED', 'NOT_INTERESTED', 'UNRESPONSIVE']).optional().default('NEW')
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(15),
  search: z.string().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'REPLIED', 'INTERESTED', 'MEETING', 'CONVERTED', 'NOT_INTERESTED', 'UNRESPONSIVE']).optional(),
  industry: z.string().optional(),
  source: z.enum(['LINKEDIN', 'WEBSITE', 'REFERRAL', 'IMPORT', 'MANUAL']).optional(),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  emailVerificationStatus: z.enum(['VALID', 'INVALID', 'UNKNOWN']).optional(),
  leadHealth: z.enum(['ACTIVE', 'NEEDS_FOLLOW_UP', 'HIGH_INTENT', 'UNRESPONSIVE', 'DO_NOT_CONTACT']).optional(),
  priorityTier: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
  sortBy: z.enum(['createdAt', 'priorityScore', 'company', 'status', 'firstName']).optional().default('createdAt'),
  sortOrder: z.enum(['ASC', 'DESC']).optional().default('DESC')
});
