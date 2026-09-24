# Shanghai HealthFinder Review Profile

Project: Next.js 14 (App Router) + Prisma (PostgreSQL) + Meilisearch + NextAuth + TailwindCSS

## Gates

- Admin API routes must verify authentication and admin role before mutating data.
- Public search API must not expose internal fields.
- Excel import must validate row-level data and report per-row errors.
- Prisma client must safely handle missing DATABASE_URL at runtime.
- Comparison page must not depend on admin API endpoints.
- All API error responses must include an `error` string.
- Middleware must cover admin routes with auth checks, not only security headers.

## Review Scope

This review covers the S1 Public MVP diff: homepage, search, compare, admin CRUD, batch import, Prisma+Meilisearch integration, and deployment config.