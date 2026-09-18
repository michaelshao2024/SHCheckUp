# Shanghai HealthFinder

Search and compare medical checkup packages at Shanghai hospitals for overseas users.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start local infrastructure (PostgreSQL + Meilisearch)
docker compose up -d

# 3. Generate Prisma client and push schema
npm run db:generate
npm run db:push

# 4. Seed sample data
npm run db:seed

# 5. Start dev server
npm run dev
```

Visit http://localhost:3000

## Deployment

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `ALIYUN_ACCESS_KEY_ID` | RAM access key for ACR + SAE deployment |
| `ALIYUN_ACCESS_KEY_SECRET` | Corresponding secret key |
| `ALIYUN_ACR_USERNAME` | ACR login username |
| `ALIYUN_ACR_PASSWORD` | ACR login password |
| `SAE_APP_ID` | SAE application ID to deploy |
| `DATABASE_URL` | PostgreSQL connection string (阿里云 RDS) |
| `MEILISEARCH_HOST` | Meilisearch service URL |
| `MEILISEARCH_API_KEY` | Meilisearch master key |
| `AUTH_SECRET` | NextAuth secret |
| `AUTH_GOOGLE_ID` | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret |