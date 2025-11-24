# ⚡ Quick Start - 5 phút để chạy

Hướng dẫn setup nhanh trong 5 phút!

## Bước 1: Cài đặt (✅ Đã xong)

```bash
npm install  # ✅ Đã chạy rồi
```

## Bước 2: Tạo GitHub Token (1 phút)

1. Vào: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Chọn scope: `public_repo` (hoặc `repo` nếu cần private repos)
4. Copy token (dạng: `ghp_xxxxx...`)

## Bước 3: Tạo Telegram Bot (2 phút)

1. Mở Telegram, tìm **@BotFather**
2. Gửi: `/newbot`
3. Đặt tên bot: `My Commit Tracker`
4. Đặt username: `my_commit_tracker_bot`
5. Copy **Bot Token** (dạng: `1234567890:ABC...`)

## Bước 4: Lấy Chat ID (1 phút)

1. Tìm **@getidsbot** trên Telegram
2. Click START
3. Copy **Chat ID** (dạng: `123456789`)

## Bước 5: Cấu hình .env (1 phút)

Mở file `.env` và điền:

```env
GITHUB_TOKEN=ghp_paste_token_của_bạn_ở_đây
TELEGRAM_BOT_TOKEN=1234567890:paste_bot_token_ở_đây
TELEGRAM_CHAT_ID=paste_chat_id_ở_đây
GITHUB_REPOS=facebook/react,vercel/next.js
```

## Bước 6: Test! (30 giây)

```bash
npm test
```

Bạn sẽ thấy:
- ✅ All connections successful
- 📱 Test message trên Telegram

## Bước 7: Chạy Tracker

```bash
npm run dev
```

🎉 **Xong!** Bạn sẽ nhận commits mới qua Telegram!

---

## Deploy lên GitHub Actions (Bonus - Free forever)

```bash
# Push lên GitHub
git add .
git commit -m "Setup commit tracker"
git push

# Vào GitHub repo > Settings > Secrets > Actions
# Thêm 4 secrets:
- GH_TOKEN
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- GITHUB_REPOS

# Enable Actions tab
# Click "Run workflow" để test
```

✅ Workflow sẽ tự chạy mỗi 3 giờ!

---

## Commands Cheat Sheet

```bash
npm test              # Test kết nối
npm run dev           # Chạy tracker một lần
npm run build         # Build TypeScript
npm start             # Chạy compiled version
```

## Cần trợ giúp?

📖 Đọc **SETUP.md** để có hướng dẫn chi tiết
🐛 Gặp lỗi? Check **Troubleshooting** section trong SETUP.md
