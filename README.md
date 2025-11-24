# GitHub Commit Tracker

Tự động theo dõi commits mới từ các GitHub repositories và gửi thông báo qua Telegram.

## 📚 Quick Links

- **⚡ [QUICKSTART.md](QUICKSTART.md)** - Bắt đầu trong 5 phút
- **📖 [SETUP.md](SETUP.md)** - Hướng dẫn chi tiết từng bước
- **🧪 Test Connection**: `npm test`

## Tính năng

- 🔍 Theo dõi commits từ một hoặc nhiều GitHub repositories
- 📱 Gửi thông báo tự động qua Telegram Bot
- ⏰ Chạy định kỳ (mặc định: mỗi 3 giờ)
- 💾 Lưu trạng thái để tránh thông báo trùng lặp
- 🆓 Deploy miễn phí trên GitHub Actions
- 🔒 Type-safe với TypeScript

## Yêu cầu

- Node.js 20+
- GitHub Personal Access Token
- Telegram Bot Token và Chat ID

## Cài đặt

### 1. Clone repository

```bash
git clone <your-repo-url>
cd tracking-commit-github
```

### 2. Cài đặt dependencies

```bash
npm install
```

### 3. Tạo GitHub Personal Access Token

1. Truy cập [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Chọn scopes:
   - `public_repo` (nếu chỉ track public repos)
   - `repo` (nếu track cả private repos)
4. Copy token

### 4. Tạo Telegram Bot

1. Mở Telegram và tìm [@BotFather](https://t.me/BotFather)
2. Gửi lệnh `/newbot`
3. Làm theo hướng dẫn để đặt tên bot
4. Copy Bot Token (dạng: `1234567890:ABCdefGHI...`)

### 5. Lấy Telegram Chat ID

**Cách 1: Dùng bot GetIDs**
1. Tìm [@getidsbot](https://t.me/getidsbot) trên Telegram
2. Start chat với bot
3. Copy Chat ID

**Cách 2: Dùng API**
1. Gửi message cho bot của bạn
2. Truy cập: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Tìm `"chat":{"id":123456789}` và copy ID

### 6. Cấu hình environment variables

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Chỉnh sửa `.env` với thông tin của bạn:

```env
GITHUB_TOKEN=ghp_your_token_here
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
TELEGRAM_CHAT_ID=123456789
GITHUB_REPOS=facebook/react,microsoft/typescript
```

## Sử dụng

### Chạy local

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Run tracker once
npm run track
```

### Deploy lên GitHub Actions (Khuyên dùng - Miễn phí)

1. **Push code lên GitHub repository của bạn**

2. **Tạo GitHub Secrets**

   Vào repository của bạn trên GitHub:
   - Settings > Secrets and variables > Actions
   - Click "New repository secret"

   Tạo các secrets sau:
   - `GH_TOKEN`: GitHub Personal Access Token
   - `TELEGRAM_BOT_TOKEN`: Telegram Bot Token
   - `TELEGRAM_CHAT_ID`: Telegram Chat ID
   - `GITHUB_REPOS`: Danh sách repos cần track (VD: `facebook/react,vercel/next.js`)

3. **Enable GitHub Actions**

   - Vào tab "Actions" trong repository
   - Nếu bị disable, click "Enable Actions"

4. **Test workflow**

   - Vào tab "Actions"
   - Chọn workflow "Track GitHub Commits"
   - Click "Run workflow" > "Run workflow"
   - Kiểm tra logs và Telegram messages

5. **Workflow sẽ tự động chạy mỗi 3 giờ**

### Thay đổi tần suất check

Chỉnh sửa file [.github/workflows/track-commits.yml](.github/workflows/track-commits.yml):

```yaml
on:
  schedule:
    # Mỗi 6 giờ
    - cron: '0 */6 * * *'

    # Hoặc mỗi 12 giờ
    - cron: '0 */12 * * *'

    # Hoặc mỗi ngày lúc 9am UTC
    - cron: '0 9 * * *'
```

## Cấu trúc Project

```
tracking-commit-github/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/
│   │   └── env.ts              # Environment validation
│   ├── services/
│   │   ├── github.service.ts   # GitHub API logic
│   │   ├── telegram.service.ts # Telegram notifications
│   │   └── storage.service.ts  # Database operations
│   ├── types/
│   │   ├── commit.types.ts     # Commit data types
│   │   └── database.types.ts   # Database schema
│   └── utils/
│       └── formatter.ts        # Message formatting
├── .github/
│   └── workflows/
│       └── track-commits.yml   # GitHub Actions workflow
└── db.json                     # State file (auto-generated)
```

## Định dạng Notification

### Single Commit

```
🔔 New Commit trong facebook/react

Message: Fix: resolve memory leak in useEffect
Author: Dan Abramov
SHA: a1b2c3d (clickable link)
Date: 24/11/2025, 10:30:45
```

### Multiple Commits

```
📢 5 commits mới trong facebook/react

1. a1b2c3d Add TypeScript support
   by Dan Abramov

2. b2c3d4e Fix linting errors
   by Sophie Alpert

... và 3 commits nữa
```

## Troubleshooting

### Không nhận được Telegram notifications

1. Kiểm tra Bot Token và Chat ID có đúng không
2. Đảm bảo đã start chat với bot (gửi `/start`)
3. Check logs trong GitHub Actions

### GitHub API rate limit

- Free tier: 5,000 requests/hour (authenticated)
- Mỗi lần chạy script dùng 1 request cho mỗi repo
- Với 10 repos và check mỗi 3 giờ: chỉ dùng ~80 requests/day

### Database không persist trong GitHub Actions

- GitHub Actions workflow đã config artifacts để lưu `db.json`
- Artifacts giữ trong 90 ngày
- Nếu artifacts expire, script sẽ tự tạo database mới

## Tech Stack

- **TypeScript**: Type-safe development
- **Octokit**: Official GitHub API client
- **Telegraf**: Modern Telegram Bot framework
- **lowdb**: Lightweight JSON database
- **Zod**: Runtime type validation
- **GitHub Actions**: Free CI/CD platform

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first.

## Support

Nếu gặp vấn đề, vui lòng tạo issue trên GitHub repository.
