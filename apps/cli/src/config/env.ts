import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  GITHUB_TOKEN: z.string().min(1, 'GITHUB_TOKEN is required'),
  TELEGRAM_BOT_TOKEN: z.string().min(1, 'TELEGRAM_BOT_TOKEN is required'),
  TELEGRAM_CHAT_ID: z.string().min(1, 'TELEGRAM_CHAT_ID is required'),
  GITHUB_REPOS: z
    .string()
    .min(1, 'GITHUB_REPOS is required')
    .transform((str) => str.split(',').map((s) => s.trim())),
  CHECK_INTERVAL_HOURS: z
    .string()
    .optional()
    .default('3')
    .transform((val) => parseInt(val, 10)),
  DB_PATH: z.string().optional().default('./db.json'),
  DATABASE_URL: z.string().optional(), // PostgreSQL connection string
});

export type EnvConfig = z.infer<typeof envSchema>;

let config: EnvConfig;

export function loadConfig(): EnvConfig {
  try {
    config = envSchema.parse(process.env);
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export function getConfig(): EnvConfig {
  if (!config) {
    return loadConfig();
  }
  return config;
}
