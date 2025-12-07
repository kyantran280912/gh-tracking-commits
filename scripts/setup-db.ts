#!/usr/bin/env tsx
/**
 * Setup PostgreSQL Database
 * Reads and executes schema.sql to create tables
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL không được tìm thấy trong .env');
    process.exit(1);
  }

  console.log('🔄 Đang kết nối đến PostgreSQL...');

  const client = new pg.Client({
    connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Đã kết nối đến PostgreSQL');

    // Read schema.sql
    const schemaPath = join(__dirname, '..', 'packages', 'database', 'schema', 'schema.sql');
    const schemaSql = readFileSync(schemaPath, 'utf-8');

    console.log('🔄 Đang chạy schema.sql...');

    // Execute schema
    await client.query(schemaSql);

    console.log('✅ Đã tạo tables thành công!');
    console.log('\n📊 Tables đã được tạo:');
    console.log('  - repositories');
    console.log('  - commits');
    console.log('  - tracking_metadata');
    console.log('\n🔍 Verify tables với query:');

    // Verify tables
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.log('\nTables trong database:');
    result.rows.forEach((row) => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check initial metadata
    const metadataResult = await client.query('SELECT * FROM tracking_metadata');
    console.log('\n📝 Initial metadata:');
    metadataResult.rows.forEach((row) => {
      console.log(`  - ${row.key}: ${row.value}`);
    });

  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Lỗi khi setup database:', error.message);

      // Provide helpful error messages
      if (error.message.includes('already exists')) {
        console.log('\n💡 Tables đã tồn tại. Nếu bạn muốn recreate:');
        console.log('   1. Drop tables cũ (uncomment DROP commands trong schema.sql)');
        console.log('   2. Hoặc chạy lại script này');
      }
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Đã đóng kết nối database');
  }
}

// Run setup
setupDatabase();
