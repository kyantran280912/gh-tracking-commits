# Hướng Dẫn Setup PostgreSQL Database

Tài liệu này hướng dẫn cách thiết lập PostgreSQL database cho hệ thống tracking GitHub commits.

## Yêu Cầu

- PostgreSQL 12 trở lên
- Đã có PostgreSQL database (đã tạo sẵn)
- Quyền truy cập để tạo tables, indexes và triggers
- psql command-line tool hoặc SQL editor (pgAdmin, DBeaver, etc.)

## 1. Chạy Schema SQL

### Cách 1: Sử dụng psql command-line

```bash
# Kết nối đến database và chạy schema
psql -U your_username -d your_database_name -f schema.sql

# Hoặc kết nối trước rồi chạy file
psql -U your_username -d your_database_name
\i schema.sql
```

### Cách 2: Sử dụng Connection String

```bash
psql postgresql://username:password@localhost:5432/database_name -f schema.sql
```

### Cách 3: Sử dụng SQL Editor (pgAdmin, DBeaver, etc.)

1. Mở file `schema.sql`
2. Copy toàn bộ nội dung
3. Paste vào SQL editor window
4. Execute/Run query

## 2. Verify Tables Đã Được Tạo

Sau khi chạy schema, verify bằng các commands sau:

```sql
-- Liệt kê tất cả tables
\dt

-- Xem cấu trúc chi tiết của từng table
\d repositories
\d commits
\d tracking_metadata

-- Hoặc dùng SQL query
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

Bạn sẽ thấy 3 tables:
- `repositories` - Lưu thông tin repos/branches được track
- `commits` - Lưu commits đã được notify
- `tracking_metadata` - Lưu settings và metadata

## 3. Kiểm Tra Indexes

```sql
-- Xem tất cả indexes
\di

-- Hoặc dùng query
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

Expected indexes:
- `idx_repositories_repo_string`
- `idx_repositories_owner_repo`
- `idx_repositories_last_check_time`
- `idx_commits_sha`
- `idx_commits_repository_id`
- `idx_commits_commit_date`
- `idx_commits_notified_at`

## 4. Configuration trong Application

### Thêm PostgreSQL Connection vào .env

```env
# Thêm các biến này vào file .env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name

# Hoặc tách riêng từng phần
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database_name
```

### Cài đặt PostgreSQL client library

```bash
npm install pg
npm install --save-dev @types/pg
```

## 5. Migration từ lowdb (Nếu Có Dữ Liệu Cũ)

Nếu bạn đã có data trong `db.json`, bạn cần migrate sang PostgreSQL:

### Script Migration Mẫu

```typescript
// migrate-to-postgres.ts
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import pg from 'pg';

interface OldData {
  repositories: Array<{
    repoString: string;
    lastCheckTime: string;
  }>;
  commits: Array<{
    sha: string;
    repoString: string;
    authorName: string;
    authorEmail: string;
    message: string;
    date: string;
    url: string;
  }>;
}

async function migrate() {
  // Read from lowdb
  const adapter = new JSONFile<OldData>('db.json');
  const db = new Low(adapter, { repositories: [], commits: [] });
  await db.read();

  // Connect to PostgreSQL
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();

  try {
    // Migrate repositories
    for (const repo of db.data.repositories) {
      // Parse repo string to get owner, repo, branch
      const [path, branch] = repo.repoString.split(':');
      const [owner, repoName] = path.split('/');

      await client.query(
        `INSERT INTO repositories (repo_string, owner, repo, branch, last_check_time)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (repo_string) DO NOTHING`,
        [repo.repoString, owner, repoName, branch || null, repo.lastCheckTime]
      );
    }

    // Migrate commits
    for (const commit of db.data.commits) {
      // Get repository_id
      const repoResult = await client.query(
        'SELECT id FROM repositories WHERE repo_string = $1',
        [commit.repoString]
      );

      if (repoResult.rows.length > 0) {
        const repositoryId = repoResult.rows[0].id;

        await client.query(
          `INSERT INTO commits (sha, repository_id, author_name, author_email, message, commit_date, html_url)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (sha) DO NOTHING`,
          [
            commit.sha,
            repositoryId,
            commit.authorName,
            commit.authorEmail,
            commit.message,
            commit.date,
            commit.url,
          ]
        );
      }
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
```

Chạy migration:
```bash
tsx migrate-to-postgres.ts
```

## 6. Example Queries

### Xem tất cả repositories đang track

```sql
SELECT
    repo_string,
    owner,
    repo,
    branch,
    last_check_time,
    created_at
FROM repositories
ORDER BY created_at DESC;
```

### Đếm số commits per repository

```sql
SELECT
    r.repo_string,
    COUNT(c.id) as commit_count,
    MAX(c.commit_date) as last_commit_date
FROM repositories r
LEFT JOIN commits c ON r.id = c.repository_id
GROUP BY r.repo_string
ORDER BY commit_count DESC;
```

### Xem 10 commits mới nhất đã được notify

```sql
SELECT
    r.repo_string,
    c.sha,
    c.author_name,
    c.message,
    c.commit_date,
    c.notified_at
FROM commits c
JOIN repositories r ON c.repository_id = r.id
ORDER BY c.notified_at DESC
LIMIT 10;
```

### Tìm commits của một repository cụ thể

```sql
SELECT
    c.sha,
    c.author_name,
    c.message,
    c.commit_date,
    c.html_url
FROM commits c
JOIN repositories r ON c.repository_id = r.id
WHERE r.repo_string = 'owner/repo:branch'
ORDER BY c.commit_date DESC;
```

### Xem metadata

```sql
SELECT * FROM tracking_metadata;
```

## 7. Maintenance Commands

### Xóa commits cũ hơn 30 ngày

```sql
DELETE FROM commits
WHERE notified_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### Xem dung lượng của tables

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Reset tất cả data (CẨNTHẬN!)

```sql
TRUNCATE TABLE commits CASCADE;
TRUNCATE TABLE repositories CASCADE;
TRUNCATE TABLE tracking_metadata CASCADE;

-- Reinsert default metadata
INSERT INTO tracking_metadata (key, value) VALUES
    ('last_global_check', CURRENT_TIMESTAMP::TEXT),
    ('schema_version', '1.0.0');
```

## 8. Troubleshooting

### Lỗi: "permission denied for schema public"

```sql
-- Grant quyền cho user
GRANT ALL ON SCHEMA public TO your_username;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_username;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_username;
```

### Lỗi: "relation already exists"

Tables đã tồn tại. Bạn có thể:
- Drop tables cũ trước (xem phần DROP trong schema.sql)
- Hoặc skip error nếu structure giống nhau

### Lỗi: "could not connect to server"

Kiểm tra:
- PostgreSQL service có đang chạy không: `sudo systemctl status postgresql`
- Connection string có đúng không
- Firewall có block port 5432 không

### Kiểm tra PostgreSQL có đang chạy

```bash
# Linux
sudo systemctl status postgresql

# macOS với Homebrew
brew services list

# Windows
# Check Services app hoặc
net start postgresql
```

### Khởi động PostgreSQL

```bash
# Linux
sudo systemctl start postgresql

# macOS với Homebrew
brew services start postgresql

# Windows
net start postgresql
```

## 9. Security Best Practices

1. **Không commit credentials vào git**
   - Đảm bảo `.env` trong `.gitignore`
   - Sử dụng environment variables

2. **Sử dụng connection pooling**
   - Implement pg.Pool thay vì pg.Client cho production
   - Giới hạn số connections

3. **Backup database thường xuyên**
   ```bash
   pg_dump -U username database_name > backup_$(date +%Y%m%d).sql
   ```

4. **Sử dụng SSL cho production**
   ```typescript
   const client = new pg.Client({
     connectionString: process.env.DATABASE_URL,
     ssl: {
       rejectUnauthorized: false
     }
   });
   ```

## 10. Next Steps

Sau khi setup xong PostgreSQL:

1. ✅ Tables đã được tạo
2. ✅ Indexes đã được thêm
3. ✅ Triggers đang hoạt động
4. 🔄 Implement PostgreSQL service trong code (thay thế lowdb)
5. 🔄 Update `src/index.ts` để sử dụng PostgreSQL
6. 🔄 Test tracking flow với PostgreSQL
7. 🔄 Deploy với PostgreSQL connection

## Tài Liệu Tham Khảo

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [node-postgres (pg) Documentation](https://node-postgres.com/)
- [PostgreSQL Tutorial](https://www.postgresqltutorial.com/)
