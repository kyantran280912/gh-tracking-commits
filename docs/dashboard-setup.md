# Setup Guide - GitHub Commit Tracker Dashboard

Step-by-step guide để setup và chạy dashboard.

## 📋 Prerequisites

### 1. Cài đặt Node.js và npm
```bash
# Check version (cần Node 18+)
node --version
npm --version
```

### 2. Cài đặt PostgreSQL

**macOS (với Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Tải về từ: https://www.postgresql.org/download/windows/

### 3. Tạo Database

```bash
# Kết nối vào PostgreSQL
psql postgres

# Trong psql console:
CREATE DATABASE github_tracker;
CREATE USER your_username WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE github_tracker TO your_username;
\q
```

## 🚀 Installation Steps

### Step 1: Clone và Install Dependencies

```bash
cd tracking-commit-github

# Install tất cả dependencies (root + workspaces)
npm install
```

### Step 2: Setup Environment Variables

```bash
# Copy file mẫu
cp .env.example .env

# Generate JWT secrets
openssl rand -base64 32
# Copy output và paste vào JWT_SECRET

openssl rand -base64 32
# Copy output và paste vào NEXTAUTH_SECRET
```

Edit `.env` file:

```env
# Database (REQUIRED)
DATABASE_URL=postgresql://your_username:your_password@localhost:5432/github_tracker

# JWT Secret (REQUIRED - paste từ openssl command)
JWT_SECRET=<paste-your-generated-secret-here>

# NextAuth Secret (REQUIRED - paste từ openssl command)
NEXTAUTH_SECRET=<paste-your-generated-secret-here>

# API Settings (có thể giữ nguyên)
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Frontend Settings (có thể giữ nguyên)
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000

# Original Tracker (Optional - nếu muốn dùng tracker gốc)
GITHUB_TOKEN=ghp_your_github_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GITHUB_REPOS=facebook/react,microsoft/typescript
```

### Step 3: Run Database Migrations

```bash
cd packages/database
npm run migrate
```

Output sẽ hiển thị:
```
✅ Running migration 001: auth_tables...
✅ Migration 001 completed
✅ All migrations completed
```

### Step 4: Start Development Servers

**Option A: Start từng service riêng (Recommended for debugging)**

Terminal 1 - API Server:
```bash
cd apps/api
npm run dev
# Should see: 🚀 API Server running on http://localhost:3001
```

Terminal 2 - Web Dashboard:
```bash
cd apps/web
npm run dev
# Should see: ✓ Ready on http://localhost:3000
```

**Option B: Start tất cả với Turborepo**

```bash
# Từ root directory
npm run dev
```

### Step 5: First Login

1. Mở browser: http://localhost:3000
2. Nhấn "Sign up" để tạo account
3. Điền:
   - Email: your-email@example.com
   - Username: your-username
   - Password: YourPassword123! (tối thiểu 8 ký tự, có uppercase, lowercase, số)
   - Confirm Password: YourPassword123!
4. Nhấn "Sign Up"
5. Tự động login và redirect về dashboard

**Default Admin Account (optional):**
- Email: admin@example.com
- Password: Admin@12345
- ⚠️ Đổi password sau khi login lần đầu!

## ✅ Verification Checklist

### 1. API Server Health
```bash
curl http://localhost:3001/api/health

# Should return:
# {"status":"ok","database":true,"timestamp":"...","uptime":123}
```

### 2. Database Tables
```bash
psql github_tracker -c "\dt"

# Should list:
# - users
# - sessions
# - audit_logs
# - repositories
# - commits
# - tracking_metadata
# - migrations
```

### 3. Web Dashboard

- [ ] Mở http://localhost:3000 → thấy login page
- [ ] Sign up account mới → success
- [ ] Login → redirect về /dashboard
- [ ] Dashboard hiển thị stats cards
- [ ] Sidebar navigation hoạt động
- [ ] Thêm repository → success
- [ ] View commits page

## 🐛 Common Issues

### Issue 1: "Cannot find module @repo/shared"

**Fix:**
```bash
cd packages/shared
npm run type-check

cd packages/database
npm run type-check
```

### Issue 2: Database connection failed

**Fix:**
```bash
# Check PostgreSQL đang chạy
brew services list | grep postgresql
# or
sudo systemctl status postgresql

# Test connection
psql -U your_username -d github_tracker

# Nếu không connect được, check DATABASE_URL format
```

### Issue 3: Port already in use

**Fix:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Issue 4: JWT Token Invalid

**Fix:**
```bash
# Clear browser localStorage
# In browser console:
localStorage.clear()

# Reload page và login lại
```

### Issue 5: Migration already applied

**Fix:**
```bash
# Check migrations
psql github_tracker -c "SELECT * FROM migrations;"

# If need to reset (⚠️ deletes all data):
psql github_tracker -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Run migrations again
cd packages/database && npm run migrate
```

## 📊 Next Steps

### 1. Add Repositories

1. Vào "Repositories" page
2. Click "Add Repository"
3. Nhập: `facebook/react` hoặc `microsoft/typescript:main`
4. Click "Add Repository"

### 2. Run Original Tracker

Để tracker tự động fetch commits và lưu vào database:

```bash
# Make sure DATABASE_URL, GITHUB_TOKEN đã set trong .env
npm run track
```

Tracker sẽ:
- Fetch commits từ các repos trong `GITHUB_REPOS`
- Lưu vào PostgreSQL database
- Gửi notifications qua Telegram (nếu configured)

### 3. Schedule Tracker với Cron

**Linux/macOS:**
```bash
crontab -e

# Add line (chạy mỗi 3 tiếng):
0 */3 * * * cd /path/to/tracking-commit-github && npm run track >> tracker.log 2>&1
```

**Windows Task Scheduler:**
- Tạo task mới
- Trigger: Repeat every 3 hours
- Action: Run `npm run track`

## 🎯 Usage Examples

### Example 1: Track React Repo

```bash
# 1. Add to .env
GITHUB_REPOS=facebook/react

# 2. Add via dashboard
# Go to Repositories → Add Repository → "facebook/react"

# 3. Run tracker
npm run track

# 4. View commits
# Go to Commits page in dashboard
```

### Example 2: Track Multiple Repos

```env
GITHUB_REPOS=facebook/react,microsoft/typescript:main,vercel/next.js:canary
```

### Example 3: Use Different Database

```env
# Neon.tech (serverless Postgres)
DATABASE_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# Supabase
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Railway
DATABASE_URL=postgresql://postgres:pass@xxx.railway.app:7945/railway
```

## 🌐 Production Deployment

See [DASHBOARD_README.md](./DASHBOARD_README.md) section "Deployment"

Quick summary:
1. Deploy PostgreSQL (Neon, Supabase, Railway)
2. Deploy API (Railway, Render, Vercel Functions)
3. Deploy Web (Vercel)
4. Set environment variables
5. Run migrations

## 📚 Additional Resources

- [DASHBOARD_README.md](./DASHBOARD_README.md) - Full dashboard documentation
- [QUICKSTART.md](./QUICKSTART.md) - Original tracker quickstart
- [README.md](./README.md) - Project overview

## 🆘 Getting Help

Nếu gặp issue:

1. Check logs trong terminal
2. Check browser console (F12)
3. Check database: `psql github_tracker -c "SELECT * FROM users LIMIT 5;"`
4. Check API health: `curl http://localhost:3001/api/health`
5. Open GitHub issue với error message

---

Happy tracking! 🚀
