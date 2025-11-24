#!/usr/bin/env tsx
/**
 * Verify PostgreSQL Database
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function verifyDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL không được tìm thấy trong .env');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Đã kết nối đến PostgreSQL\n');

    // Check tables
    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('📊 Tables trong database:');
    tablesResult.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check metadata
    const metadataResult = await client.query('SELECT * FROM tracking_metadata');
    console.log('\n📝 Tracking metadata:');
    metadataResult.rows.forEach((row) => {
      console.log(`  - ${row.key}: ${row.value}`);
    });

    // Check repositories count
    const repoCount = await client.query('SELECT COUNT(*) FROM repositories');
    console.log(`\n📁 Repositories: ${repoCount.rows[0].count}`);

    // Check commits count
    const commitCount = await client.query('SELECT COUNT(*) FROM commits');
    console.log(`📝 Commits: ${commitCount.rows[0].count}`);

    console.log('\n✅ Database đang hoạt động tốt!');

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Lỗi:', error.message);
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

verifyDatabase();
