# 🚀 Setup Guide - GitHub Commit Tracker

Detailed setup guide from start to finish.

## Step 1: Setup GitHub Token 🔑

### Create Personal Access Token

1. Log in to GitHub
2. Go to [Settings > Developer settings > Personal access tokens > Tokens (classic)](https://github.com/settings/tokens)
3. Click **"Generate new token"** > **"Generate new token (classic)"**
4. Name your token: `commit-tracker` or whatever you prefer
5. Select expiration: `No expiration` or your preferred duration
6. Select **scopes**:
   - ✅ `public_repo` - If only tracking public repositories
   - ✅ `repo` (full control) - If you need to track private repositories
7. Click **"Generate token"**
8. **⚠️ IMPORTANT**: Copy the token immediately (it won't be shown again)

Token format: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Setup Telegram Bot 🤖

### Create Bot with BotFather

1. Open Telegram app
2. Search for **@BotFather** (official Telegram bot)
3. Start conversation: Click **"START"** or send `/start`
4. Send command: `/newbot`
5. BotFather will ask for a bot name:
   ```
   Alright, a new bot. How are we going to call it? Please choose a name for your bot.
   ```
   Answer example: `My Commit Tracker`

6. BotFather asks for username (must end with `bot`):
   ```
   Good. Now let's choose a username for your bot. It must end in `bot`. Like this, for example: TetrisBot or tetris_bot.
   ```
   Answer example: `my_commit_tracker_bot`

7. **✅ Success!** BotFather will return:
   ```
   Done! Congratulations on your new bot. You will find it at t.me/my_commit_tracker_bot.
   You can now add a description...

   Use this token to access the HTTP API:
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-EXAMPLE
   ```

8. **Copy the Bot Token** (the line starting with numbers)

---

## Step 3: Get Chat ID 💬

### Method 1: Use @getidsbot (Easiest)

1. Search for **@getidsbot** on Telegram
2. Click **START**
3. Bot will return your Chat ID:
   ```
   Your user ID: 123456789
   ```
4. Copy this number

### Method 2: Use API (If method 1 doesn't work)

1. Find your bot on Telegram (e.g., `@my_commit_tracker_bot`)
2. Click **START** and send any message (e.g., `Hello`)
3. Open browser and visit:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Replace `<YOUR_BOT_TOKEN>` with the token from BotFather

4. You'll see a JSON response, find:
   ```json
   {
     "message": {
       "chat": {
         "id": 123456789,  👈 This is your Chat ID
         "first_name": "Your Name",
         ...
       }
     }
   }
   ```

5. Copy the `id` number in `chat`

---

## Step 4: Configure Environment Variables ⚙️

The `.env` file has been created. Now you need to fill in the information:

### Open .env file

```bash
# MacOS/Linux
nano .env

# Or use VSCode
code .env
```

### Fill in the values

```env
# Paste the GitHub token you just created
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Paste Telegram bot token from BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Paste the Chat ID you just got
TELEGRAM_CHAT_ID=123456789

# List of repos to track (format: owner/repo, separated by commas)
GITHUB_REPOS=facebook/react,microsoft/typescript,vercel/next.js

# Optional: Check interval (hours)
CHECK_INTERVAL_HOURS=3

# Optional: Database path
DB_PATH=./db.json
```

### Complete .env example

```env
GITHUB_TOKEN=ghp_a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8s9T0
TELEGRAM_BOT_TOKEN=5234567890:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw
TELEGRAM_CHAT_ID=987654321
GITHUB_REPOS=facebook/react,vercel/next.js,nodejs/node
CHECK_INTERVAL_HOURS=3
DB_PATH=./db.json
```

**💾 Save the file**

---

## Step 5: Test Locally 🧪

### Test run the script

```bash
npm run dev
```

### Expected output

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
   Resets at: 11/24/2025, 2:30:00 PM

⏱️  Last check: 1/1/1970, 8:00:00 AM

🔍 Fetching commits since: 11/23/2025, 1:00:00 PM

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

### Check Telegram

You will receive messages on Telegram with this format:

```
🔔 New Commit in facebook/react

Message: Fix: resolve memory leak in hooks
Author: Dan Abramov
SHA: a1b2c3d (clickable link)
Date: 11/24/2025, 10:30:45 AM
```

---

## Step 6: Deploy to GitHub Actions (Free) 🌐

### 6.1. Push code to GitHub

```bash
# Init git if not already
git init

# Add remote (replace YOUR_USERNAME and YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Add and commit
git add .
git commit -m "Initial commit: GitHub commit tracker"

# Push to GitHub
git push -u origin main
```

### 6.2. Add GitHub Secrets

1. Go to repository on GitHub
2. Click **Settings** tab
3. Sidebar: **Secrets and variables** > **Actions**
4. Click **"New repository secret"**

Create these **4 secrets**:

| Name | Value | Example |
|------|-------|---------|
| `GH_TOKEN` | GitHub Personal Access Token | `ghp_a1B2c3...` |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | `5234567890:AAH...` |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | `987654321` |
| `GITHUB_REPOS` | List of repos | `facebook/react,vercel/next.js` |

**⚠️ Note**:
- Secret names must be EXACTLY as shown (uppercase)
- No quotes or spaces

### 6.3. Enable GitHub Actions

1. Go to **Actions** tab in repository
2. If disabled, click **"I understand my workflows, go ahead and enable them"**
3. You'll see the **"Track GitHub Commits"** workflow

### 6.4. Test Workflow

1. In **Actions** tab, click **"Track GitHub Commits"** workflow
2. Click **"Run workflow"** dropdown (on the right)
3. Click **"Run workflow"** button (green)
4. Wait a few seconds, workflow will run
5. Click on the workflow run to see logs
6. Check Telegram for notifications

### 6.5. Automatic workflow

- Workflow will **automatically run every 3 hours**
- You can trigger it manually anytime
- Logs are saved in Actions tab

---

## Step 7: Customize (Optional) 🎨

### Change check frequency

Edit file `.github/workflows/track-commits.yml`:

```yaml
on:
  schedule:
    # Every 6 hours
    - cron: '0 */6 * * *'
```

Cron examples:
- `0 */3 * * *` - Every 3 hours
- `0 */6 * * *` - Every 6 hours
- `0 9,18 * * *` - 9am and 6pm UTC daily
- `0 0 * * *` - Daily at midnight UTC

### Add/remove repositories

Edit in `.env` (local) or GitHub Secret `GITHUB_REPOS`:

```env
GITHUB_REPOS=owner1/repo1,owner2/repo2,owner3/repo3
```

### Change notification format

Edit file `src/utils/formatter.ts` to customize message format.

---

## Troubleshooting 🔧

### ❌ Error: "GITHUB_TOKEN is required"

- Check if `.env` file exists
- Make sure `GITHUB_TOKEN` is filled in
- No extra whitespace

### ❌ Error: "Bot connection failed"

- Check if `TELEGRAM_BOT_TOKEN` is correct
- Copy token again from BotFather
- Make sure no whitespace or line breaks

### ❌ Not receiving Telegram messages

- Check if `TELEGRAM_CHAT_ID` is correct
- Make sure you've **/start** conversation with bot
- Test by sending a message to bot first

### ❌ GitHub Actions not running

- Check if secrets have been added
- Secret names must be EXACT (case-sensitive)
- Check if workflow file has correct syntax

### ❌ Rate limit exceeded

- GitHub free tier: 5,000 requests/hour
- Reduce number of repos or increase interval time
- Check limit: `npm run dev` will display remaining requests

---

## Complete! 🎉

You've successfully set up GitHub Commit Tracker!

**Next steps:**
- Check Telegram notifications
- Monitor GitHub Actions logs
- Customize message format if desired
- Add more repos to track

**Support:**
- If you encounter issues, create an issue on GitHub
- Check logs in GitHub Actions for debugging
- Read README.md for more details
