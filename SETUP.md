# 🚀 Setup Guide - GitHub Commit Tracker

Hướng dẫn setup chi tiết từ đầu đến cuối.

## Bước 1: Setup GitHub Token 🔑

### Tạo Personal Access Token

1. Đăng nhập GitHub
2. Vào [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
3. Click **"Generate new token"** > **"Generate new token (classic)"**
4. Đặt tên cho token: `commit-tracker` hoặc tên bạn thích
5. Chọn expiration: `No expiration` hoặc thời gian bạn muốn
6. Chọn **scopes**:
   - ✅ `public_repo` - Nếu chỉ track public repositories
   - ✅ `repo` (full control) - Nếu cần track private repositories
7. Click **"Generate token"**
8. **⚠️ QUAN TRỌNG**: Copy token ngay lập tức (sẽ không hiển thị lại)

Token sẽ có format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Bước 2: Setup Telegram Bot 🤖

### Tạo Bot với BotFather

1. Mở Telegram app
2. Tìm kiếm **@BotFather** (bot chính thức của Telegram)
3. Start conversation: Click **"START"** hoặc gửi `/start`
4. Gửi lệnh: `/newbot`
5. BotFather sẽ hỏi tên bot:
   ```
   Alright, a new bot. How are we going to call it? Please choose a name for your bot.
   ```
   Trả lời VD: `My Commit Tracker`

6. BotFather hỏi username (phải kết thúc bằng `bot`):
   ```
   Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
   ```
   Trả lời VD: `my_commit_tracker_bot`

7. **✅ Thành công!** BotFather sẽ trả về:
   ```
   Done! Congratulations on your new bot. You will find it at t.me/my_commit_tracker_bot.
   You can now add a description...

   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-EXAMPLE
   ```

8. **Copy Bot Token** (dòng bắt đầu bằng số)

---

## Bước 3: Lấy Chat ID 💬

### Cách 1: Dùng @getidsbot (Dễ nhất)

1. Tìm **@getidsbot** trên Telegram
2. Click **START**
3. Bot sẽ trả về Chat ID của bạn:
   ```
   Your user ID: 123456789
   ```
4. Copy số này

### Cách 2: Dùng API (Nếu cách 1 không work)

1. Tìm bot của bạn trên Telegram (VD: `@my_commit_tracker_bot`)
2. Click **START** và gửi một message bất kỳ (VD: `Hello`)
3. Mở browser và truy cập:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Thay `<YOUR_BOT_TOKEN>` bằng token bạn lấy từ BotFather

4. Bạn sẽ thấy JSON response, tìm:
   ```json
   {
     "message": {
       "chat": {
         "id": 123456789,  👈 Đây là Chat ID của bạn
         "first_name": "Your Name",
         ...
       }
     }
   }
   ```

5. Copy số `id` trong `chat`

---

## Bước 4: Cấu hình Environment Variables ⚙️

File `.env` đã được tạo sẵn. Bây giờ bạn cần điền thông tin:

### Mở file .env

```bash
# MacOS/Linux
nano .env

# Hoặc dùng VSCode
code .env
```

### Điền các giá trị

```env
# Paste GitHub token bạn vừa tạo
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Paste Telegram bot token từ BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Paste Chat ID bạn vừa lấy
TELEGRAM_CHAT_ID=123456789

# Danh sách repos muốn track (format: owner/repo, ngăn cách bằng dấu phẩy)
GITHUB_REPOS=facebook/react,microsoft/typescript,vercel/next.js

# Tùy chọn: Thời gian check (giờ)
CHECK_INTERVAL_HOURS=3

# Tùy chọn: Đường dẫn database
DB_PATH=./db.json
```

### Ví dụ .env hoàn chỉnh

```env
GITHUB_TOKEN=ghp_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0
TELEGRAM_BOT_TOKEN=5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_CHAT_ID=987654321
GITHUB_REPOS=facebook/react,vercel/next.js,nodejs/node
CHECK_INTERVAL_HOURS=3
DB_PATH=./db.json
```

**💾 Lưu file**

---

## Bước 5: Test Local 🧪

### Test chạy script

```bash
npm run dev
```

### Kết quả mong đợi

```
🚀 Starting GitHub Commit Tracker...

✅ Configuration loaded successfully
📝 Tracking 3 repositories:
   - facebook/react
   - vercel/next.js
   - nodejs/node

✅ Storage initialized

✅ Bot connected: @my_commit_tracker_bot

📊 GitHub API Rate Limit: 4999/5000 remaining
   Resets at: 24/11/2025, 14:30:00

⏱️  Last check: 1/1/1970, 08:00:00

🔍 Fetching commits since: 23/11/2025, 13:00:00

🔍 Fetching commits from facebook/react since 2025-11-23T...
✅ Found 15 commits in facebook/react
...

📊 Total new commits: 25

📤 Sending notifications...

✅ Message sent to Telegram successfully
...

✅ Tracking completed successfully!
📊 Summary: 25 new commit(s) from 3 repository(ies)
```

### Kiểm tra Telegram

Bạn sẽ nhận được messages trên Telegram với format:

```
🔔 New Commit trong facebook/react

Message: Fix: resolve memory leak in hooks
Author: Dan Abramov
SHA: a1b2c3d (clickable link)
Date: 24/11/2025, 10:30:45
```

---

## Bước 6: Deploy lên GitHub Actions (Miễn phí) 🌐

### 6.1. Push code lên GitHub

```bash
# Init git nếu chưa có
git init

# Add remote (thay YOUR_USERNAME và YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Add và commit
git add .
git commit -m "Initial commit: GitHub commit tracker"

# Push lên GitHub
git push -u origin main
```

### 6.2. Thêm GitHub Secrets

1. Vào repository trên GitHub
2. Click **Settings** tab
3. Sidebar: **Secrets and variables** > **Actions**
4. Click **"New repository secret"**

Tạo **4 secrets** sau:

| Name | Value | Ví dụ |
|------|-------|-------|
| `GH_TOKEN` | GitHub Personal Access Token | `ghp_a1B2c3...` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `5234567890:AAH...` |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | `987654321` |
| `GITHUB_REPOS` | Danh sách repos | `facebook/react,vercel/next.js` |

**⚠️ Lưu ý**:
- Secret names phải CHÍNH XÁC như trên (viết hoa)
- Không có dấu ngoặc kép hoặc spaces

### 6.3. Enable GitHub Actions

1. Vào tab **Actions** trong repository
2. Nếu bị disabled, click **"I understand my workflows, go ahead and enable them"**
3. Bạn sẽ thấy workflow **"Track GitHub Commits"**

### 6.4. Test Workflow

1. Trong tab **Actions**, click workflow **"Track GitHub Commits"**
2. Click **"Run workflow"** dropdown (bên phải)
3. Click button **"Run workflow"** (xanh lá)
4. Đợi vài giây, workflow sẽ chạy
5. Click vào workflow run để xem logs
6. Kiểm tra Telegram để xem notifications

### 6.5. Workflow tự động

- Workflow sẽ **tự động chạy mỗi 3 giờ**
- Bạn có thể trigger manually bất cứ lúc nào
- Logs được lưu trong tab Actions

---

## Bước 7: Tùy chỉnh (Optional) 🎨

### Thay đổi tần suất check

Edit file `.github/workflows/track-commits.yml`:

```yaml
on:
  schedule:
    # Mỗi 6 giờ
    - cron: '0 */6 * * *'
```

Cron examples:
- `0 */3 * * *` - Mỗi 3 giờ
- `0 */6 * * *` - Mỗi 6 giờ
- `0 9,18 * * *` - 9am và 6pm UTC mỗi ngày
- `0 0 * * *` - Mỗi ngày lúc midnight UTC

### Thêm/bớt repositories

Chỉnh sửa trong `.env` (local) hoặc GitHub Secret `GITHUB_REPOS`:

```env
GITHUB_REPOS=owner1/repo1,owner2/repo2,owner3/repo3
```

### Thay đổi format notification

Edit file `src/utils/formatter.ts` để customize message format.

---

## Troubleshooting 🔧

### ❌ Lỗi: "GITHUB_TOKEN is required"

- Kiểm tra file `.env` có tồn tại không
- Đảm bảo `GITHUB_TOKEN` đã được điền
- Không có khoảng trắng thừa

### ❌ Lỗi: "Bot connection failed"

- Kiểm tra `TELEGRAM_BOT_TOKEN` có đúng không
- Copy lại token từ BotFather
- Đảm bảo không có khoảng trắng hoặc line breaks

### ❌ Không nhận được Telegram message

- Kiểm tra `TELEGRAM_CHAT_ID` có đúng không
- Đảm bảo đã **/start** conversation với bot
- Test lại bằng cách gửi message cho bot trước

### ❌ GitHub Actions không chạy

- Kiểm tra secrets đã được thêm chưa
- Secret names phải CHÍNH XÁC (case-sensitive)
- Kiểm tra workflow file có đúng syntax không

### ❌ Rate limit exceeded

- GitHub free tier: 5,000 requests/hour
- Giảm số repos hoặc tăng interval time
- Check limit: `npm run dev` sẽ hiển thị remaining requests

---

## Hoàn tất! 🎉

Bạn đã setup thành công GitHub Commit Tracker!

**Next steps:**
- Kiểm tra Telegram notifications
- Monitor GitHub Actions logs
- Customize message format nếu muốn
- Thêm repos cần track

**Support:**
- Nếu gặp vấn đề, tạo issue trên GitHub
- Check logs trong GitHub Actions để debug
- Đọc README.md để biết thêm chi tiết
