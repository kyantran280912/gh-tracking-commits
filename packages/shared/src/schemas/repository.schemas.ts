import { z } from 'zod';

// Support multiple formats:
// - owner/repo
// - owner/repo:branch
// - https://github.com/owner/repo
// - https://github.com/owner/repo/tree/branch
export const repositoryCreateSchema = z.object({
  repoString: z
    .string()
    .min(1, 'Repository string is required')
    .refine(
      (val) => {
        // Must contain at least one slash (owner/repo or URL)
        return val.includes('/');
      },
      {
        message: 'Invalid format. Use "owner/repo", "owner/repo:branch", or GitHub URL',
      }
    ),
});

const VALID_INTERVALS = [1, 2, 3, 6, 12, 24] as const;

export const repositoryUpdateSchema = z.object({
  branch: z.string().min(1, 'Branch name cannot be empty').optional(),
  notification_interval: z
    .union([
      // Accept string from form/dropdown (e.g., "3")
      z.enum(['1', '2', '3', '6', '12', '24']).transform(Number),
      // Accept number directly from API
      z.number().refine((n) => VALID_INTERVALS.includes(n as (typeof VALID_INTERVALS)[number]), {
        message: 'Invalid interval. Must be 1, 2, 3, 6, 12, or 24 hours',
      }),
    ])
    .optional(),
});

export const repositoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  search: z.string().optional(),
});
