# Setup Guide - GitHub Commit Tracker

Chọn hướng dẫn setup phù hợp với nhu cầu của bạn:

## 📱 CLI Tracker Only (Simple)

Nếu bạn chỉ cần:
- ✅ Track commits từ GitHub repos
- ✅ Nhận notifications qua Telegram
- ✅ Chạy tự động với GitHub Actions (free)
- ❌ Không cần web interface

**👉 Đọc: [CLI Setup Guide](./cli-setup.md)**

---

## 🌐 Full Dashboard System (Advanced)

Nếu bạn cần:
- ✅ Web dashboard để xem commits
- ✅ Authentication & user management
- ✅ PostgreSQL database
- ✅ REST API
- ✅ CLI tracker integrate với dashboard

**👉 Đọc: [Dashboard Setup Guide](./dashboard-setup.md)**

---

## 🔄 Hybrid Setup (CLI + Dashboard)

Để sử dụng cả hai:

### 1. Setup Dashboard trước
Follow [Dashboard Setup Guide](./dashboard-setup.md) để:
- Install PostgreSQL
- Setup environment variables (DATABASE_URL, JWT secrets, etc.)
- Run migrations
- Start API server & Web UI

### 2. Setup CLI Tracker
Follow [CLI Setup Guide](./cli-setup.md) để:
- Tạo GitHub token
- Tạo Telegram bot
- Configure GITHUB_REPOS trong `.env`

### 3. Connect CLI to Dashboard
Đảm bảo trong `.env`:
```env
# Database (shared between CLI and Dashboard)
DATABASE_URL=postgresql://username:password@localhost:5432/github_tracker

# CLI Tracker settings
GITHUB_TOKEN=ghp_your_token
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
GITHUB_REPOS=facebook/react,microsoft/typescript
```

### 4. Run CLI Tracker
```bash
npm run track
```

CLI sẽ:
- Fetch commits từ GitHub
- Save vào PostgreSQL (shared database)
- Send Telegram notifications
- Commits sẽ hiển thị trong Dashboard web UI

---

## ⚡ Quick Start

**Nếu không chắc bắt đầu từ đâu:**

1. **Mới bắt đầu?** → Dùng [CLI Setup](./cli-setup.md) (5 phút setup)
2. **Cần web interface?** → Dùng [Dashboard Setup](./dashboard-setup.md) (15 phút setup)

---

## 📚 Additional Docs

- [Quickstart Guide](./quickstart.md) - CLI tracker trong 5 phút
- [PostgreSQL Setup](./postgres-setup.md) - Chi tiết về database setup
- [Dashboard Documentation](./dashboard.md) - Full dashboard features
- [Demo Guide](./demo-guide.md) - Chạy demo với test data

---

## 🆘 Need Help?

Check [README.md](../README.md) hoặc tạo issue trên GitHub.
