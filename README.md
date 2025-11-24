# GitHub Commit Tracker

Automatically track new commits from GitHub repositories and send notifications via Telegram.

## 📚 Quick Links

- **⚡ [QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes
- **📖 [SETUP.md](SETUP.md)** - Detailed step-by-step guide
- **🧪 Test Connection**: `npm test`

## Features

- 🔍 Track commits from one or multiple GitHub repositories
- 📱 Send automatic notifications via Telegram Bot
- ⏰ Run periodically (default: every 3 hours)
- 💾 Save state to avoid duplicate notifications
- 🆓 Deploy for free on GitHub Actions
- 🔒 Type-safe with TypeScript

## Requirements

- Node.js 20+
- GitHub Personal Access Token
- Telegram Bot Token and Chat ID

## Installation

### 1. Clone repository

```bash
git clone <your-repo-url>
cd tracking-commit-github
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create GitHub Personal Access Token

1. Visit [GitHub Settings > Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select scopes:
   - `public_repo` (if only tracking public repos)
   - `repo` (if tracking private repos too)
4. Copy token

### 4. Create Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send command `/newbot`
3. Follow instructions to name your bot
4. Copy Bot Token (format: `1234567890:ABCdefGHI...`)

### 5. Get Telegram Chat ID

**Method 1: Use GetIDs bot**
1. Search for [@getidsbot](https://t.me/getidsbot) on Telegram
2. Start chat with the bot
3. Copy Chat ID

**Method 2: Use API**
1. Send a message to your bot
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find `"chat":{"id":123456789}` and copy the ID

### 6. Configure environment variables

Create `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your information:

```env
GITHUB_TOKEN=ghp_your_token_here
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHI...
TELEGRAM_CHAT_ID=123456789
GITHUB_REPOS=facebook/react,microsoft/typescript
```

## Usage

### Run locally

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start

# Run tracker once
npm run track
```

### Deploy to GitHub Actions (Recommended - Free)

1. **Push code to your GitHub repository**

2. **Create GitHub Secrets**

   Go to your repository on GitHub:
   - Settings > Secrets and variables > Actions
   - Click "New repository secret"

   Create these secrets:
   - `GH_TOKEN`: GitHub Personal Access Token
   - `TELEGRAM_BOT_TOKEN`: Telegram Bot Token
   - `TELEGRAM_CHAT_ID`: Telegram Chat ID
   - `GITHUB_REPOS`: List of repos to track (e.g., `facebook/react,vercel/next.js`)

3. **Enable GitHub Actions**

   - Go to "Actions" tab in repository
   - If disabled, click "Enable Actions"

4. **Test workflow**

   - Go to "Actions" tab
   - Select "Track GitHub Commits" workflow
   - Click "Run workflow" > "Run workflow"
   - Check logs and Telegram messages

5. **Workflow will automatically run every 3 hours**

### Change check frequency

Edit file [.github/workflows/track-commits.yml](.github/workflows/track-commits.yml):

```yaml
on:
  schedule:
    # Every 6 hours
    - cron: '0 */6 * * *'

    # Or every 12 hours
    - cron: '0 */12 * * *'

    # Or daily at 9am UTC
    - cron: '0 9 * * *'
```

## Project Structure

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

## Notification Format

### Single Commit

```
🔔 New Commit in facebook/react

Message: Fix: resolve memory leak in useEffect
Author: Dan Abramov
SHA: a1b2c3d (clickable link)
Date: 11/24/2025, 10:30:45 AM
```

### Multiple Commits

```
📢 5 new commits in facebook/react

1. a1b2c3d Add TypeScript support
   by Dan Abramov

2. b2c3d4e Fix linting errors
   by Sophie Alpert

... and 3 more commits
```

## Troubleshooting

### Not receiving Telegram notifications

1. Check if Bot Token and Chat ID are correct
2. Make sure you've started chat with bot (send `/start`)
3. Check logs in GitHub Actions

### GitHub API rate limit

- Free tier: 5,000 requests/hour (authenticated)
- Each script run uses 1 request per repo
- With 10 repos and check every 3 hours: only ~80 requests/day

### Database not persisting in GitHub Actions

- GitHub Actions workflow is configured with artifacts to save `db.json`
- Artifacts are kept for 90 days
- If artifacts expire, script will create new database automatically

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

If you encounter issues, please create an issue on the GitHub repository.
