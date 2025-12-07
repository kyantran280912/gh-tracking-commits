import { z } from 'zod';

export const commitQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  repositoryId: z.coerce.number().int().positive().optional(),
  authorEmail: z.string().email().optional(),
  search: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const commitByRepoQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
