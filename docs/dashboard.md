# GitHub Commit Tracker Dashboard

Modern React dashboard for managing GitHub commit tracking with PostgreSQL, authentication, and real-time monitoring.

## Features (MVP)

### ✅ Completed
- **Authentication System**
  - User registration and login
  - JWT-based authentication
  - Role-based access control (Admin, User, Viewer)
  - Session management

- **Repository Management**
  - Add/Remove repositories to track
  - Support for specific branches
  - Search and filter repositories
  - View repository details

- **Commit Tracking**
  - View all tracked commits
  - Search and filter commits
  - Pagination support
  - Detailed commit information

- **Dashboard Statistics**
  - Total repositories and commits
  - Commits in last 24h, 7d, 30d
  - Top authors by commit count
  - Top repositories by activity

### 🚧 Future Enhancements
- Real-time updates with Server-Sent Events
- Advanced charts and visualizations
- Webhook notifications
- Multi-user management (Admin panel)
- Custom notification rules
- Export data to CSV/JSON

## Tech Stack

### Frontend (Next.js)
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Shadcn/ui + Tailwind CSS
- **State Management**: Zustand (auth) + React Query (data)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React

### Backend (Express)
- **Framework**: Express.js
- **Database**: PostgreSQL with pg driver
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod schemas
- **Security**: Helmet, CORS, Rate limiting

### Monorepo
- **Build System**: Turborepo
- **Package Manager**: npm workspaces
- **Shared Packages**: Types, schemas, utilities

## Project Structure

```
tracking-commit-github/
├── apps/
│   ├── web/                    # Next.js Dashboard
│   │   ├── src/
│   │   │   ├── app/            # App Router pages
│   │   │   ├── components/     # React components
│   │   │   ├── hooks/          # Custom hooks
│   │   │   └── lib/            # Utilities
│   │   └── package.json
│   │
│   └── api/                    # Express API Server
│       ├── src/
│       │   ├── routes/         # API endpoints
│       │   ├── middleware/     # Auth, validation, errors
│       │   └── config/         # Environment config
│       └── package.json
│
├── packages/
│   ├── shared/                 # Shared types & utils
│   │   └── src/
│   │       ├── types/          # TypeScript types
│   │       ├── schemas/        # Zod schemas
│   │       └── utils/          # Helper functions
│   │
│   └── database/               # Database service
│       └── src/
│           ├── postgres.service.ts  # DB operations
│           └── migrations/          # SQL migrations
│
└── src/                        # Original tracker (unchanged)
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- GitHub Personal Access Token
- Telegram Bot Token (for original tracker)

### 1. Install Dependencies

```bash
# Install root dependencies and all workspaces
npm install
```

### 2. Environment Setup

Copy and configure environment variables:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
# Required for dashboard
DATABASE_URL=postgresql://username:password@localhost:5432/github_tracker
JWT_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Optional: Original tracker config
GITHUB_TOKEN=ghp_your_github_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
GITHUB_REPOS=facebook/react,microsoft/typescript
```

Generate secrets:
```bash
openssl rand -base64 32
```

### 3. Database Setup

Run migrations to create tables:

```bash
cd packages/database
npm run migrate
```

This will create:
- `users` table (authentication)
- `sessions` table (JWT sessions)
- `audit_logs` table (user actions)
- `repositories` table (tracked repos)
- `commits` table (commit history)

### 4. Start Development Servers

Open 3 terminal windows:

**Terminal 1: API Server**
```bash
cd apps/api
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2: Web Dashboard**
```bash
cd apps/web
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3: Original Tracker (Optional)**
```bash
npm run dev:tracker
# Runs the original commit tracker
```

Or use Turborepo to run all at once:
```bash
npm run dev
```

### 5. First Login

1. Open http://localhost:3000
2. Click "Sign up" to create an account
3. Register with email, username, and password
4. You'll be auto-logged in and redirected to dashboard

**Default Admin Account** (created by migration):
- Email: `admin@example.com`
- Password: You need to set this in the migration or create via UI

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Repositories
- `GET /api/repositories` - List repositories
- `POST /api/repositories` - Add repository
- `GET /api/repositories/:id` - Get repository
- `PATCH /api/repositories/:id` - Update repository
- `DELETE /api/repositories/:id` - Delete repository

### Commits
- `GET /api/commits` - List commits (with filters)
- `GET /api/commits/:sha` - Get commit details

### Statistics
- `GET /api/stats` - Get dashboard statistics

### Health
- `GET /api/health` - Health check

## Development

### Build All Packages

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

### Run Production Build

```bash
# Build all packages
npm run build

# Start API
cd apps/api && npm start

# Start Web (in another terminal)
cd apps/web && npm start
```

## Database Schema

### Users
- Authentication and user management
- Roles: admin, user, viewer
- Password hashing with bcrypt

### Repositories
- Tracked GitHub repositories
- Support for specific branches
- Last check timestamp

### Commits
- All notified commits
- Full commit metadata
- Links to GitHub

### Sessions
- JWT token tracking
- Session expiration
- IP address logging

### Audit Logs
- User action tracking
- Security auditing
- Resource changes

## Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet**: Security headers
- **CORS**: Configured allowed origins
- **Input Validation**: Zod schemas
- **SQL Injection**: Parameterized queries
- **Audit Logging**: Track all user actions

## Deployment

### Vercel (Recommended for Next.js)

1. Push code to GitHub
2. Import project to Vercel
3. Set environment variables
4. Deploy

**Note**: API server needs separate deployment (Railway, Render, or Vercel Functions)

### Environment Variables for Production

```env
# Production values
NODE_ENV=production
DATABASE_URL=<production-postgresql-url>
JWT_SECRET=<strong-secret-32+chars>
NEXTAUTH_SECRET=<strong-secret-32+chars>
NEXTAUTH_URL=https://yourdomain.com
CORS_ORIGIN=https://yourdomain.com
```

## Troubleshooting

### "Cannot find module @repo/shared"

```bash
# Install all dependencies
npm install

# Build shared package
cd packages/shared && npm run build
```

### Database Connection Failed

1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Ensure database exists
4. Run migrations: `cd packages/database && npm run migrate`

### JWT Token Invalid

1. Ensure JWT_SECRET matches between requests
2. Check token expiration (JWT_EXPIRES_IN)
3. Clear browser localStorage and re-login

### Port Already in Use

```bash
# API port 3001
lsof -ti:3001 | xargs kill -9

# Web port 3000
lsof -ti:3000 | xargs kill -9
```

## Contributing

This is an MVP (Minimum Viable Product). Future contributions welcome:

1. Real-time updates with SSE
2. Advanced charting with Recharts
3. Webhook integrations
4. Admin user management panel
5. Email notifications
6. Docker compose setup
7. E2E tests with Playwright

## License

MIT

## Support

For issues and questions:
1. Check QUICKSTART.md for original tracker
2. Check this README for dashboard
3. Open GitHub issue with details
