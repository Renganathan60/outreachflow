import { z } from 'zod';

export const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters').max(150),
  description: z.string().max(1000).optional().nullable()
});

export const updateCampaignSchema = z.object({
  name: z.string().min(2).max(150).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']).optional()
});

export const enrollLeadsSchema = z.object({
  leadIds: z.array(z.string().uuid().or(z.string().min(1))).min(1, 'Must provide at least one lead ID')
});
