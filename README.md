# Shanghai HealthFinder

Search and compare medical checkup packages at Shanghai hospitals for overseas users.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (see .env.local.example)
cp .env.local.example .env.local

# 3. Generate Prisma client and push schema
npm run db:generate
npm run db:push

# 4. Seed sample data
npm run db:seed

# 5. Start dev server
npm run dev
```

Visit http://localhost:3000

## Deployment (Vercel + Neon)

The app deploys to [Vercel](https://vercel.com) with a [Neon](https://neon.tech)
serverless PostgreSQL database. No Docker or Alibaba Cloud services are required.

### One-time setup

1. **Neon**: create a project, copy the pooled connection string
   (`postgresql://...-pooler....neon.tech/neondb?sslmode=require`).
2. **Vercel**: Import the GitHub repository (framework is auto-detected as Next.js).
3. Set the environment variables below in Vercel → Project → Settings → Environment Variables.
4. Initialize the database (from any machine with the env vars set):
   ```bash
   npm run db:push   # create schema
   npm run db:seed   # optional sample data
   ```

Every push to `main` triggers a production deployment; pull requests get
preview deployments automatically.

### Required environment variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon pooled PostgreSQL connection string (sslmode=require) |
| `AUTH_SECRET` | NextAuth secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` | Google OAuth client ID (optional if only email/password auth is used) |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |
| `NEXT_PUBLIC_SITE_URL` | Production site URL, e.g. `https://your-app.vercel.app` |
| `MEILISEARCH_HOST` | Meilisearch Cloud URL (optional — falls back to Prisma search) |
| `MEILISEARCH_API_KEY` | Meilisearch API key (optional) |
| `NOTIFY_PROVIDER` | `wecom` (default) \| `dingtalk` \| `telegram` (optional) |
| `NOTIFY_WEBHOOK_URL` | Webhook URL for new-inquiry notifications (optional) |
| `NOTIFY_CHAT_ID` | Telegram chat ID (optional, telegram only) |
