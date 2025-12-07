#!/usr/bin/env node
import { runMigrations } from './index';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables from root .env file
dotenv.config({ path: join(process.cwd(), '../../.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

console.log('🚀 Starting database migrations...\n');

runMigrations(DATABASE_URL)
  .then(() => {
    console.log('\n✅ Migration process completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration process failed:', error);
    process.exit(1);
  });
