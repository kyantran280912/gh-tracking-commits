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

export const repositoryUpdateSchema = z.object({
  branch: z.string().min(1, 'Branch name cannot be empty').optional(),
});

export const repositoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20).optional(),
  search: z.string().optional(),
});
