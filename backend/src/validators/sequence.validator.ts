import { z } from 'zod';

export const addStepSchema = z.object({
  subject: z.string().min(1, 'Subject line is required').max(255),
  body: z.string().min(1, 'Email body is required'),
  delayDays: z.coerce.number().int().min(0, 'Delay days must be >= 0').optional().default(0)
});

export const updateStepSchema = addStepSchema.partial().extend({
  stepNumber: z.coerce.number().int().positive().optional()
});
