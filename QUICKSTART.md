# ⚡ Quick Start - Get Running in 5 Minutes

Quick setup guide in 5 minutes!

## Step 1: Install (✅ Done)

```bash
npm install  # ✅ Already done
```

## Step 2: Create GitHub Token (1 minute)

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token (classic)"**
3. Select scope: `public_repo` (or `repo` if you need private repos)
4. Copy token (format: `ghp_xxxxx...`)

## Step 3: Create Telegram Bot (2 minutes)

1. Open Telegram, search for **@BotFather**
2. Send: `/newbot`
3. Name your bot: `My Commit Tracker`
4. Set username: `my_commit_tracker_bot`
5. Copy **Bot Token** (format: `1234567890:ABC...`)

## Step 4: Get Chat ID (1 minute)

1. Search for **@getidsbot** on Telegram
2. Click START
3. Copy **Chat ID** (format: `123456789`)

## Step 5: Configure .env (1 minute)

Open `.env` file and fill in:

```env
GITHUB_TOKEN=ghp_paste_your_token_here
TELEGRAM_BOT_TOKEN=1234567890:paste_bot_token_here
TELEGRAM_CHAT_ID=paste_chat_id_here
GITHUB_REPOS=facebook/react,vercel/next.js
```

## Step 6: Test! (30 seconds)

```bash
npm test
```

You should see:
- ✅ All connections successful
- 📱 Test message on Telegram

## Step 7: Run Tracker

```bash
npm run dev
```

🎉 **Done!** You'll receive new commits via Telegram!

---

## Deploy to GitHub Actions (Bonus - Free Forever)

```bash
# Push to GitHub
git add .
git commit -m "Setup commit tracker"
git push

# Go to GitHub repo > Settings > Secrets > Actions
# Add 4 secrets:
- GH_TOKEN
- TELEGRAM_BOT_TOKEN
- TELEGRAM_CHAT_ID
- GITHUB_REPOS

# Enable Actions tab
# Click "Run workflow" to test
```

✅ Workflow will run automatically every 3 hours!

---

## Commands Cheat Sheet

```bash
npm test              # Test connections
npm run dev           # Run tracker once
npm run build         # Build TypeScript
npm start             # Run compiled version
```

## Need Help?

📖 Read **SETUP.md** for detailed instructions
🐛 Got errors? Check **Troubleshooting** section in SETUP.md
