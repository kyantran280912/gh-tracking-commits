# 🎬 Demo & URL Support Guide

## ✨ Tính năng mới

### 1. Hỗ trợ GitHub URLs

Bây giờ bạn có thể dùng **cả 2 formats** trong `.env`:

#### Format 1: GitHub URL đầy đủ ✅
```env
GITHUB_REPOS=https://github.com/facebook/react
```

#### Format 2: Short format (như trước) ✅
```env
GITHUB_REPOS=facebook/react
```

#### Format 3: Mix cả 2! ✅
```env
GITHUB_REPOS=https://github.com/facebook/react,vercel/next.js,https://github.com/nodejs/node
```

### Các format được hỗ trợ:

✅ `https://github.com/owner/repo`
✅ `http://github.com/owner/repo`
✅ `github.com/owner/repo`
✅ `owner/repo`
✅ `https://github.com/owner/repo.git` (auto remove .git)

---

## 🎬 Demo Mode

### Chạy Demo

```bash
npm run demo
```

### Demo làm gì?

1. ✅ Fetch **5 commits mới nhất** từ mỗi repo
2. ✅ Format và gửi **TẤT CẢ** qua Telegram
3. ✅ **KHÔNG** check database (hiện tất cả commits)
4. ✅ **KHÔNG** lưu vào database (không ảnh hưởng tracking)

### Khi nào dùng Demo?

- ✅ Test message format
- ✅ Xem notification trước khi deploy
- ✅ Debug Telegram connection
- ✅ Preview commits style
- ✅ Không muốn chờ có commits mới

### Demo vs Normal Tracking

| Feature | `npm run demo` | `npm run dev` |
|---------|----------------|---------------|
| Fetch commits | ✅ Latest 5 | ✅ Since last check |
| Check database | ❌ Skip | ✅ Yes |
| Save to database | ❌ No | ✅ Yes |
| Show all commits | ✅ Yes | ❌ Only new |
| Use case | Testing | Production |

---

## 📋 Commands Cheat Sheet

```bash
# Demo mode - Show recent commits (không save database)
npm run demo

# Normal tracking - Chỉ notify commits mới
npm run dev

# Test connections (GitHub + Telegram)
npm test

# Build TypeScript
npm run build

# Run production build
npm start
```

---

## 🔧 Troubleshooting

### ❌ Error: "Not Found" khi fetch repo

**Nguyên nhân:**
- Repository không tồn tại
- Repository là private nhưng token không có quyền

**Giải pháp:**

1. **Nếu repo là public:**
   - Kiểm tra tên repo đúng chưa
   - Thử format khác: `owner/repo` hoặc URL đầy đủ

2. **Nếu repo là private:**
   - Token phải có scope `repo` (full access)
   - Không phải `public_repo`
   - Tạo token mới tại: https://github.com/settings/tokens
   - Chọn scope: ✅ `repo` (Private repositories)

### 🔐 Check token scopes

1. Vào: https://github.com/settings/tokens
2. Click vào token bạn đang dùng
3. Kiểm tra scopes:
   - ✅ `repo` - Cho phép access private repos
   - ⚠️ `public_repo` - Chỉ public repos

### 🧪 Test với public repo trước

```env
# Test với public repo
GITHUB_REPOS=https://github.com/facebook/react

# Hoặc nhiều repos
GITHUB_REPOS=facebook/react,vercel/next.js,microsoft/typescript
```

Sau khi confirm format đúng, đổi về repo của bạn:

```env
# Your private repo (need 'repo' scope token)
GITHUB_REPOS=https://github.com/your-username/your-private-repo
```

---

## 💡 Tips

### 1. Test Demo trước khi deploy

```bash
# Test connections
npm test

# Test demo
npm run demo

# Kiểm tra Telegram messages
# Nếu format OK → Deploy lên GitHub Actions
```

### 2. Mix public + private repos

```env
# Works!
GITHUB_REPOS=https://github.com/facebook/react,your-org/private-repo
```

### 3. Nhiều repos để track nhiều projects

```env
GITHUB_REPOS=project1/api,project1/frontend,project2/backend,https://github.com/org/shared-lib
```

### 4. Customize message format

Edit file [src/utils/formatter.ts](src/utils/formatter.ts):
- `formatSingleCommit()` - Single commit style
- `formatMultipleCommits()` - Multiple commits style
- `formatDetailedCommit()` - Detailed style

---

## 📱 Demo Output Example

Khi chạy `npm run demo`, bạn sẽ nhận được:

### Header Message:
```
🎬 Demo Mode

Hiển thị 5 commit(s) gần đây từ 1 repository(ies).

Đây là demo - commits này KHÔNG được lưu vào database.
```

### Commit Messages:
```
📢 5 commits mới trong facebook/react

1. a1b2c3d Add TypeScript support
   by Dan Abramov

2. b2c3d4e Fix linting errors
   by Sophie Alpert

3. c3d4e5f Update documentation
   by React Team

4. d4e5f6g Improve performance
   by Sebastian Markbåge

5. e5f6g7h Fix memory leak
   by Andrew Clark
```

---

## 🎯 Next Steps

1. ✅ Đã setup URL support
2. ✅ Đã test demo mode
3. ⏭️ Update token nếu cần access private repos
4. ⏭️ Chạy `npm run dev` để tracking thực
5. ⏭️ Deploy lên GitHub Actions

---

## 📖 Related Docs

- [README.md](README.md) - Tổng quan
- [QUICKSTART.md](QUICKSTART.md) - Setup nhanh
- [SETUP.md](SETUP.md) - Hướng dẫn chi tiết
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Tổng kết project
