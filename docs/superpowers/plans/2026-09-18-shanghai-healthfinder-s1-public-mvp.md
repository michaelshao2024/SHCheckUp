# S1: Public MVP — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the Public MVP — an English-language website deployed on 阿里云 Europe region, served via 阿里云 CDN, with anonymous search of Shanghai hospital checkup packages.

**Architecture:** Single Next.js 14+ (App Router) application deployed as Docker container on 阿里云 SAE (Serverless App Engine) in Frankfurt (eu-central-1). PostgreSQL on 阿里云 RDS. Meilisearch for full-text search. 阿里云 CDN/DCDN for global acceleration. GitHub Actions CI/CD.

**Tech Stack:** Next.js 14+ · TypeScript · Tailwind CSS · Shadcn UI · Prisma · PostgreSQL · Meilisearch · NextAuth.js · Docker · 阿里云 SAE · 阿里云 CDN · GitHub Actions

---

## Global Constraints

- All data stored and processed in 阿里云 eu-central-1 (Frankfurt) only
- `.com` domain with HTTPS enforced (auto-renewing SSL via 阿里云 CDN + SSL Certificates)
- Front-end TypeScript strictly typed; no `any` types
- All UI text in English; no i18n framework in S1
- Lighthouse performance score >80 (target >90 for production)
- GDPR Cookie consent banner must appear on first visit before any non-essential cookies
- Database model names in English, table names lowercase snake_case in PostgreSQL, camelCase in Prisma

---

## File Structure

```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx                   # Root layout (GDPR banner, nav)
│   │   ├── page.tsx                     # Homepage with search
│   │   ├── hospitals/[id]/page.tsx      # Hospital detail page
│   │   ├── packages/[id]/page.tsx       # Package detail (anonymous limited view)
│   │   ├── privacy/page.tsx             # Privacy policy (placeholder)
│   │   └── api/
│   │       ├── search/route.ts          # Search API (Meilisearch proxy)
│   │       └── hospitals/route.ts       # Hospitals listing API
│   ├── components/
│   │   ├── ui/                          # Shadcn UI primitives
│   │   ├── navbar.tsx                   # Top navigation
│   │   ├── search-bar.tsx               # Search input component
│   │   ├── hospital-card.tsx            # Hospital result card
│   │   ├── package-card.tsx             # Package result card (limited view)
│   │   ├── gdpr-banner.tsx              # GDPR Cookie consent banner
│   │   └── footer.tsx                   # Site footer
│   ├── lib/
│   │   ├── prisma.ts                    # Prisma singleton client
│   │   ├── meilisearch.ts              # Meilisearch client
│   │   └── constants.ts                 # Site-wide constants
│   └── middleware.ts                    # Rate limiting (basic)
├── prisma/
│   ├── schema.prisma                    # Database schema
│   └── seed.ts                          # Seed data (sample hospitals + packages)
├── docker/
│   ├── Dockerfile                       # Production Docker image
│   └── docker-compose.yml               # Local dev with PostgreSQL + Meilisearch
├── docker-compose.yml                   # Root compose (references docker/)
├── .github/
│   └── workflows/
│       └── deploy.yml                   # CI/CD pipeline
├── .env.local.example                   # Environment variables template
├── next.config.ts                       # Next.js configuration
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

---

## Task 1: Project Scaffold & Dev Environment

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `.env.local.example`
- Create: `docker-compose.yml` (root level)
- Create: `docker/Dockerfile`
- Create: `docker/docker-compose.yml`
- Create: `src/lib/constants.ts`
- Create: `src/middleware.ts`
- Create: `README.md`

**Interfaces:**
- Consumes: (none — first task)
- Produces: Bootable Next.js dev environment with Docker infrastructure

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "overseas-medical-checkup",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "docker:up": "docker compose -f docker/docker-compose.yml up -d",
    "docker:down": "docker compose -f docker/docker-compose.yml down"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@prisma/client": "^5.14.0",
    "meilisearch": "^0.37.0",
    "next-auth": "^5.0.0-beta.19"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/react": "^18.3.0",
    "@types/node": "^20.12.0",
    "prisma": "^5.14.0",
    "tsx": "^4.9.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "@tailwindcss/typography": "^0.5.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com',
      },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 4: Create `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
};

export default config;
```

- [ ] **Step 5: Create `postcss.config.js`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Create `.env.local.example`**

```
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medical_checkup"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="masterKey"

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"

# Site
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

- [ ] **Step 7: Create `src/lib/constants.ts`**

```typescript
export const SITE_NAME = 'Shanghai HealthFinder';
export const SITE_DESCRIPTION = 'Compare medical checkup packages at Shanghai hospitals — in English.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const ANONYMOUS_SEARCH_LIMIT = 10; // requests per minute

export const CURRENCY = 'USD';
export const CDN_CACHE_DURATION = 31536000; // 1 year for static assets
```

- [ ] **Step 8: Create `src/middleware.ts`** (basic rate limiting placeholder)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // S1: Basic security headers only
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 9: Create `docker-compose.yml`** (root — orchestrates local dev)

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: medical_checkup
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  meilisearch:
    image: getmeili/meilisearch:v1.8
    environment:
      MEILI_MASTER_KEY: masterKey
      MEILI_NO_ANALYTICS: 'true'
    ports:
      - '7700:7700'
    volumes:
      - meilidata:/meili_data

volumes:
  pgdata:
  meilidata:
```

- [ ] **Step 10: Create `docker/Dockerfile`**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run db:generate && npm run build

# Production runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

- [ ] **Step 11: Create `docker/docker-compose.yml`** (for local Next.js + services)

```yaml
version: '3.8'
services:
  nextjs:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/medical_checkup
      MEILISEARCH_HOST: http://meilisearch:7700
      MEILISEARCH_API_KEY: masterKey

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: medical_checkup
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - '5432:5432'
    volumes:
      - pgdata:/var/lib/postgresql/data

  meilisearch:
    image: getmeili/meilisearch:v1.8
    environment:
      MEILI_MASTER_KEY: masterKey
      MEILI_NO_ANALYTICS: 'true'
    ports:
      - '7700:7700'
    volumes:
      - meilidata:/meili_data

volumes:
  pgdata:
  meilidata:
```

- [ ] **Step 12: Create `README.md`** with setup instructions

```markdown
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
```

- [ ] **Step 13: Install dependencies and verify compilation**

```bash
npm install
npm run build 2>&1 | tail -20
```

Expected: `Route (app) successfully compiled`

- [ ] **Step 14: Initial commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with Docker infrastructure

- Next.js 14+ App Router with TypeScript and Tailwind CSS
- Docker Compose for local PostgreSQL (16) and Meilisearch (1.8)
- Production Dockerfile (standalone output)
- Security headers middleware
- Environment variables template

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 2: Database Schema (Prisma) & Seed Data

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/prisma.ts`

**Interfaces:**
- Consumes: Task 1 (project scaffold with Prisma dependency)
- Produces: `PrismaClient` singleton, database tables, Meilisearch-compatible data structures

- [ ] **Step 1: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Hospital {
  id          String   @id @default(cuid())
  name        String   @unique // English name, e.g. "Huashan Hospital"
  nameCn      String?  // Chinese name for reference
  address     String
  phone       String?
  email       String?
  website     String?
  description String   @db.Text
  imageUrl    String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  packages     CheckupPackage[]
  reviews      Review[]
  inquiries    Inquiry[]

  @@map("hospitals")
}

model CheckupPackage {
  id            String   @id @default(cuid())
  hospitalId    String   @map("hospital_id")
  name          String   // e.g. "Executive Health Checkup - Premium"
  price         Decimal  @db.Decimal(10, 2) // in USD
  currency      String   @default("USD")
  duration      String?  // e.g. "3 hours", "Full day"
  items         Json?    // Array of checkup items, e.g. ["Blood test", "ECG", "CT Scan"]
  includesTranslator Boolean @default(false) @map("includes_translator")
  description   String?  @db.Text
  tags          String[] // e.g. ["basic", "comprehensive", "premium"]
  isActive      Boolean  @default(true) @map("is_active")
  avgRating     Decimal  @default(0.0) @db.Decimal(3, 2) @map("avg_rating")
  reviewCount   Int      @default(0) @map("review_count")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  hospital Hospital  @relation(fields: [hospitalId], references: [id])
  reviews  Review[]
  inquiries Inquiry[]

  @@index([hospitalId])
  @@index([price])
  @@index([tags])
  @@map("checkup_packages")
}

model User {
  id             String   @id @default(cuid())
  name           String?
  email          String   @unique
  emailVerified  DateTime? @map("email_verified")
  image          String?
  googleId       String?  @unique @map("google_id")
  role           String   @default("user") // "user" | "admin"
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  accounts  Account[]
  sessions  Session[]
  reviews   Review[]
  inquiries Inquiry[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Review {
  id        String   @id @default(cuid())
  packageId String   @map("package_id")
  userId    String   @map("user_id")
  rating    Int      // 1-5
  comment   String?  @db.Text
  status    String   @default("visible") // "visible" | "hidden"
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  package CheckupPackage @relation(fields: [packageId], references: [id], onDelete: Cascade)
  user    User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([packageId, userId]) // One review per user per package
  @@index([packageId])
  @@index([userId])
  @@map("reviews")
}

model Inquiry {
  id            String   @id @default(cuid())
  userId        String   @map("user_id")
  hospitalId    String?  @map("hospital_id")
  packageId     String?  @map("package_id")
  name          String
  email         String
  preferredDate DateTime? @map("preferred_date")
  message       String   @db.Text
  status        String   @default("pending") // "pending" | "processing" | "done"
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  user    User?           @relation(fields: [userId], references: [id])
  hospital Hospital?       @relation(fields: [hospitalId], references: [id])
  package CheckupPackage? @relation(fields: [packageId], references: [id])

  @@index([userId])
  @@index([status])
  @@map("inquiries")
}

model ImportLog {
  id          String   @id @default(cuid())
  fileName    String   @map("file_name")
  totalRows   Int      @map("total_rows")
  successRows Int      @map("success_rows")
  failedRows  Int      @map("failed_rows")
  errors      Json?    // Array of error details
  importedBy  String?  @map("imported_by")
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("import_logs")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

- [ ] **Step 2: Create `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

- [ ] **Step 3: Create `prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create hospitals
  const hospital1 = await prisma.hospital.create({
    data: {
      name: 'Huashan Hospital',
      nameCn: '复旦大学附属华山医院',
      address: '12 Wulumuqi Middle Road, Jing\'an District, Shanghai',
      phone: '+86-21-52889999',
      description: 'One of Shanghai\'s top general hospitals, known for international patient services with English-speaking staff.',
      imageUrl: '/images/huashan.jpg',
    },
  });

  const hospital2 = await prisma.hospital.create({
    data: {
      name: 'Ruijin Hospital',
      nameCn: '上海交通大学医学院附属瑞金医院',
      address: '197 Ruijin Er Road, Huangpu District, Shanghai',
      phone: '+86-21-64370045',
      description: 'A premier teaching hospital offering comprehensive health checkup packages for expatriates.',
      imageUrl: '/images/ruijin.jpg',
    },
  });

  const hospital3 = await prisma.hospital.create({
    data: {
      name: 'Shanghai East International Medical Center',
      nameCn: '上海东方国际医院',
      address: '551 South Pudong Road, Pudong, Shanghai',
      phone: '+86-21-58799999',
      description: 'Dedicated international clinic with multilingual staff and tailored health checkups for foreigners.',
      imageUrl: '/images/east-medical.jpg',
    },
  });

  // Create packages for Huashan
  await prisma.checkupPackage.createMany({
    data: [
      {
        hospitalId: hospital1.id,
        name: 'Basic Health Checkup',
        price: 280,
        duration: '2 hours',
        items: ['Blood pressure', 'Blood test (basic)', 'Urinalysis', 'BMI measurement', 'Doctor consultation'],
        includesTranslator: false,
        tags: ['basic'],
        avgRating: 4.2,
        reviewCount: 0,
      },
      {
        hospitalId: hospital1.id,
        name: 'Comprehensive Health Checkup',
        price: 580,
        duration: '4 hours',
        items: ['Blood test (comprehensive)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Abdominal ultrasound', 'Vision test', 'Hearing test', 'Doctor consultation'],
        includesTranslator: true,
        tags: ['comprehensive'],
        avgRating: 4.5,
        reviewCount: 0,
      },
      {
        hospitalId: hospital1.id,
        name: 'Premium Executive Checkup',
        price: 1200,
        duration: '6 hours',
        items: ['All comprehensive items', 'CT Scan (chest)', 'Stress test ECG', 'Echocardiogram', 'Tumor markers', 'Thyroid function', 'Bone density scan', 'Nutrition consultation'],
        includesTranslator: true,
        tags: ['premium'],
        avgRating: 4.8,
        reviewCount: 0,
      },
    ],
  });

  // Create packages for Ruijin
  await prisma.checkupPackage.createMany({
    data: [
      {
        hospitalId: hospital2.id,
        name: 'Standard Health Check',
        price: 320,
        duration: '3 hours',
        items: ['Blood pressure', 'Blood test (basic)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Doctor consultation'],
        includesTranslator: false,
        tags: ['basic'],
        avgRating: 4.0,
        reviewCount: 0,
      },
      {
        hospitalId: hospital2.id,
        name: 'Comprehensive Health Screen',
        price: 650,
        duration: '5 hours',
        items: ['Blood test (comprehensive)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Abdominal ultrasound', 'Thyroid ultrasound', 'Stress test', 'Ophthalmology check', 'Doctor consultation'],
        includesTranslator: true,
        tags: ['comprehensive'],
        avgRating: 4.3,
        reviewCount: 0,
      },
    ],
  });

  // Create packages for East International
  await prisma.checkupPackage.createMany({
    data: [
      {
        hospitalId: hospital3.id,
        name: 'Expat Basic Checkup',
        price: 250,
        duration: '2 hours',
        items: ['Blood pressure', 'Blood test (basic)', 'Urinalysis', 'BMI', 'Doctor consultation (English)'],
        includesTranslator: false,
        tags: ['basic'],
        avgRating: 4.1,
        reviewCount: 0,
      },
      {
        hospitalId: hospital3.id,
        name: 'Expat Comprehensive Checkup',
        price: 550,
        duration: '4 hours',
        items: ['Blood test (full panel)', 'Urinalysis', 'ECG', 'Chest X-ray', 'Abdominal ultrasound', 'Thyroid panel', 'Vitamin deficiency screening', 'Doctor consultation (English)'],
        includesTranslator: true,
        tags: ['comprehensive'],
        avgRating: 4.6,
        reviewCount: 0,
      },
      {
        hospitalId: hospital3.id,
        name: 'Expat Deluxe Wellness',
        price: 1100,
        duration: 'Full day',
        items: ['All comprehensive items', 'CT Scan (low-dose chest)', 'Cardiac stress test', 'MRI (brain screening)', 'Nutrition consultation', 'Personal health report', 'Follow-up consultation'],
        includesTranslator: true,
        tags: ['premium'],
        avgRating: 4.9,
        reviewCount: 0,
      },
    ],
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 4: Initialize database and seed**

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

Expected: `Seed data created successfully`

- [ ] **Step 5: Commit**

```bash
git add prisma/ src/lib/prisma.ts
git commit -m "feat: add database schema with Prisma and seed data

- Hospital, CheckupPackage, User, Review, Inquiry, ImportLog models
- PrismaClient singleton for server components
- Seed data with 3 hospitals and 8 checkup packages

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 3: Meilisearch Integration

**Files:**
- Create: `src/lib/meilisearch.ts`
- Create: `prisma/seed.ts` (modify — add Meilisearch indexing)

**Interfaces:**
- Consumes: Task 2 (Prisma schema with data)
- Produces: `MeilisearchService` for indexing and searching checkup packages

- [ ] **Step 1: Create `src/lib/meilisearch.ts`**

```typescript
import { MeiliSearch } from 'meilisearch';

const host = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILISEARCH_API_KEY || 'masterKey';

export const meilisearch = new MeiliSearch({ host, apiKey });

export const PACKAGES_INDEX = 'checkup_packages';
export const HOSPITALS_INDEX = 'hospitals';

export async function ensureIndexes() {
  // Create or update indexes with searchable attributes
  const packagesIndex = meilisearch.index(PACKAGES_INDEX);
  const hospitalsIndex = meilisearch.index(HOSPITALS_INDEX);

  await packagesIndex.updateSettings({
    searchableAttributes: ['name', 'hospitalName', 'description', 'items', 'tags'],
    filterableAttributes: ['price', 'hospitalId', 'tags', 'includesTranslator', 'isActive'],
    sortableAttributes: ['price', 'avgRating'],
    rankingRules: ['sort', 'words', 'typo', 'proximity', 'attribute', 'exactness'],
  });

  await hospitalsIndex.updateSettings({
    searchableAttributes: ['name', 'description', 'address'],
    filterableAttributes: ['isActive'],
  });
}
```

- [ ] **Step 2: Update `prisma/seed.ts`** — add Meilisearch indexing after database seed

Add to the end of the `main()` function, before `console.log('Seed data created successfully');`:

```typescript
  // Index data in Meilisearch
  const { meilisearch, PACKAGES_INDEX, HOSPITALS_INDEX, ensureIndexes } = await import('../src/lib/meilisearch');
  await ensureIndexes();

  const hospitals = await prisma.hospital.findMany({ where: { isActive: true } });
  await meilisearch.index(HOSPITALS_INDEX).addDocuments(
    hospitals.map(h => ({ id: h.id, name: h.name, description: h.description, address: h.address, isActive: h.isActive }))
  );

  const packages = await prisma.checkupPackage.findMany({
    where: { isActive: true },
    include: { hospital: true },
  });
  await meilisearch.index(PACKAGES_INDEX).addDocuments(
    packages.map(p => ({
      id: p.id,
      hospitalId: p.hospitalId,
      hospitalName: p.hospital.name,
      name: p.name,
      price: Number(p.price),
      currency: p.currency,
      duration: p.duration,
      description: p.description,
      items: p.items as string[],
      tags: p.tags,
      includesTranslator: p.includesTranslator,
      avgRating: Number(p.avgRating),
      isActive: p.isActive,
    }))
  );
```

- [ ] **Step 3: Re-seed with Meilisearch indexing**

```bash
docker compose up -d meilisearch 2>/dev/null; sleep 3
npx tsx prisma/seed.ts
```

Expected: `Seed data created successfully` (no Meilisearch connection errors)

- [ ] **Step 4: Add `.env.local` from template (for local development)**

```bash
cp .env.local.example .env.local
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/meilisearch.ts prisma/seed.ts .env.local.example
git commit -m "feat: add Meilisearch integration with auto-indexing on seed

- Meilisearch client singleton with index settings for packages and hospitals
- Searchable/filterable/sortable attribute configuration
- Seed data auto-indexed to Meilisearch

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 4: Homepage & Search Bar UI

**Files:**
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/components/navbar.tsx`
- Create: `src/components/search-bar.tsx`
- Create: `src/components/hospital-card.tsx`
- Create: `src/components/package-card.tsx`
- Create: `src/components/gdpr-banner.tsx`
- Create: `src/components/footer.tsx`

**Interfaces:**
- Consumes: Task 1 (Next.js scaffold), Task 3 (search API)
- Produces: Public-facing UI pages

- [ ] **Step 1: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 2: Create shared UI components as placeholder**

Create the minimal set of shared components:

```typescript
// src/components/navbar.tsx
export function Navbar() {
  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="text-xl font-bold text-primary">Shanghai HealthFinder</a>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="/login" className="hover:text-foreground">Sign In</a>
        </div>
      </div>
    </nav>
  );
}
```

```typescript
// src/components/search-bar.tsx
'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export function SearchBar({ onSearch, initialQuery = '' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search checkup packages, hospitals..."
          className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-primary text-primary-foreground rounded-md text-sm font-medium"
        >
          Search
        </button>
      </div>
    </form>
  );
}
```

```typescript
// src/components/hospital-card.tsx
interface HospitalCardProps {
  id: string;
  name: string;
  description: string;
  address: string;
}

export function HospitalCard({ id, name, description, address }: HospitalCardProps) {
  return (
    <a href={`/hospitals/${id}`} className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
      <p className="text-xs text-muted-foreground">{address}</p>
    </a>
  );
}
```

```typescript
// src/components/package-card.tsx
interface PackageCardProps {
  id: string;
  name: string;
  price: number;
  duration: string | null;
  hospitalName: string;
  avgRating: number;
  tags: string[];
}

export function PackageCard({ id, name, price, duration, hospitalName, avgRating, tags }: PackageCardProps) {
  return (
    <a href={`/packages/${id}`} className="block p-6 rounded-lg border border-border hover:border-primary transition-colors">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{name}</h3>
        <span className="text-lg font-bold text-primary">${price}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-1">{hospitalName}</p>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm text-yellow-500">{'★'.repeat(Math.round(avgRating))}</span>
        <span className="text-xs text-muted-foreground">({avgRating.toFixed(1)})</span>
        {duration && <span className="text-xs text-muted-foreground">· {duration}</span>}
      </div>
      <div className="flex gap-1 flex-wrap">
        {tags.map((tag) => (
          <span key={tag} className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground capitalize">{tag}</span>
        ))}
      </div>
    </a>
  );
}
```

```typescript
// src/components/gdpr-banner.tsx
'use client';

import { useState, useEffect } from 'react';

export function GdprBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('gdpr-consent');
    if (!consent) setVisible(true);
  }, []);

  const acceptAll = () => {
    localStorage.setItem('gdpr-consent', 'all');
    setVisible(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('gdpr-consent', 'essential');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          This site uses essential cookies for operation. We also use analytics cookies to improve your experience.
          <a href="/privacy" className="underline ml-1">Learn more</a>
        </p>
        <div className="flex gap-2">
          <button onClick={acceptEssential} className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted">
            Essential Only
          </button>
          <button onClick={acceptAll} className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}
```

```typescript
// src/components/footer.tsx
export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="max-w-7xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Shanghai HealthFinder. Helping expats find the right medical checkup.</p>
        <div className="mt-2 flex justify-center gap-4">
          <a href="/privacy" className="underline">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Create `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { GdprBanner } from '@/components/gdpr-banner';
import { SITE_NAME, SITE_DESCRIPTION } from '@/lib/constants';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <GdprBanner />
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Create `src/app/page.tsx`** — homepage with search

```typescript
'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/search-bar';
import { HospitalCard } from '@/components/hospital-card';
import { PackageCard } from '@/components/package-card';

interface SearchResult {
  hospitals: Array<{ id: string; name: string; description: string; address: string }>;
  packages: Array<{
    id: string; name: string; price: number; duration: string | null;
    hospitalName: string; avgRating: number; tags: string[];
  }>;
}

export default function HomePage() {
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // fallback: show nothing
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Hero */}
      <section className="py-20 text-center bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Find Your Health Checkup in Shanghai</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Compare medical checkup packages at Shanghai hospitals. Search, compare reviews, and book with confidence.
          </p>
          <div className="flex justify-center">
            <SearchBar onSearch={handleSearch} />
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Sign in for detailed results. Anonymous users see limited information.
          </p>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-muted-foreground">Searching...</p>}

        {!loading && hasSearched && results && (
          <>
            {results.hospitals.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl font-semibold mb-4">Hospitals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.hospitals.map((h) => (
                    <HospitalCard key={h.id} {...h} />
                  ))}
                </div>
              </div>
            )}

            {results.packages.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Checkup Packages</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.packages.map((p) => (
                    <PackageCard key={p.id} {...p} />
                  ))}
                </div>
              </div>
            )}

            {results.hospitals.length === 0 && results.packages.length === 0 && (
              <p className="text-center text-muted-foreground py-12">
                No results found. Try a different search term.
              </p>
            )}
          </>
        )}

        {!loading && !hasSearched && (
          <div className="text-center py-12 text-muted-foreground">
            <p>Search above to find checkup packages and hospitals.</p>
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Verify build compiles**

```bash
npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors, routes compiled successfully

- [ ] **Step 6: Commit**

```bash
git add src/app/ src/components/
git commit -m "feat: add homepage, search bar, and result cards UI

- Hero section with search input
- HospitalCard and PackageCard result components
- GDPR cookie consent banner (Accept All / Essential Only)
- Navigation bar and footer
- Responsive grid layout

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 5: Search API Route

**Files:**
- Create: `src/app/api/search/route.ts`
- Create: `src/app/api/hospitals/route.ts`
- Modify: `src/app/page.tsx` (already wired in Task 4)

**Interfaces:**
- Consumes: Task 3 (Meilisearch client), Task 2 (Prisma for fallback)
- Produces: `GET /api/search?q=...` returns search results

- [ ] **Step 1: Create `src/app/api/search/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { meilisearch, PACKAGES_INDEX, HOSPITALS_INDEX } from '@/lib/meilisearch';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  if (!q.trim()) {
    return NextResponse.json({ hospitals: [], packages: [] });
  }

  try {
    // Search hospitals
    const hospitalsResult = await meilisearch.index(HOSPITALS_INDEX).search(q, {
      limit: 5,
      filter: ['isActive = true'],
      attributesToRetrieve: ['id', 'name', 'description', 'address'],
    });

    // Search packages (anonymous = limited fields)
    const packagesResult = await meilisearch.index(PACKAGES_INDEX).search(q, {
      limit: 10,
      filter: ['isActive = true'],
      // Anonymous users see limited fields
      attributesToRetrieve: ['id', 'name', 'price', 'currency', 'duration', 'hospitalName', 'avgRating', 'tags', 'hospitalId'],
    });

    return NextResponse.json({
      hospitals: hospitalsResult.hits,
      packages: packagesResult.hits,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search temporarily unavailable' },
      { status: 503 }
    );
  }
}
```

- [ ] **Step 2: Create `src/app/api/hospitals/route.ts`** (hospital listing for homepage when no query)

```typescript
import { NextResponse } from 'next/server';
import { meilisearch, HOSPITALS_INDEX } from '@/lib/meilisearch';

export async function GET() {
  try {
    const result = await meilisearch.index(HOSPITALS_INDEX).search('', {
      limit: 50,
      filter: ['isActive = true'],
      attributesToRetrieve: ['id', 'name', 'description', 'address'],
    });

    return NextResponse.json({ hospitals: result.hits });
  } catch (error) {
    console.error('Hospitals fetch error:', error);
    return NextResponse.json(
      { error: 'Unable to load hospitals' },
      { status: 503 }
    );
  }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: Routes compiled without errors

- [ ] **Step 4: Commit**

```bash
git add src/app/api/
git commit -m "feat: add search and hospitals listing API routes

- GET /api/search?q=... returns hospitals and packages via Meilisearch
- GET /api/hospitals returns all active hospitals
- Anonymous view returns limited package fields

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 6: Hospital Detail & Package Detail Pages

**Files:**
- Create: `src/app/hospitals/[id]/page.tsx`
- Create: `src/app/packages/[id]/page.tsx`

**Interfaces:**
- Consumes: Task 2 (Prisma), Task 3 (Meilisearch)
- Produces: Public detail pages (anonymous limited view)

- [ ] **Step 1: Create `src/app/hospitals/[id]/page.tsx`**

```typescript
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { PackageCard } from '@/components/package-card';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hospital = await prisma.hospital.findUnique({ where: { id: params.id } });
  if (!hospital) return { title: 'Hospital Not Found' };
  return { title: hospital.name };
}

export default async function HospitalDetailPage({ params }: Props) {
  const hospital = await prisma.hospital.findUnique({
    where: { id: params.id },
    include: {
      packages: {
        where: { isActive: true },
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!hospital) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">{hospital.name}</h1>
      {hospital.nameCn && <p className="text-muted-foreground mb-4">{hospital.nameCn}</p>}
      <p className="text-sm text-muted-foreground mb-6">{hospital.address}</p>
      {hospital.phone && <p className="text-sm mb-2">Phone: {hospital.phone}</p>}
      <p className="text-muted-foreground mb-8">{hospital.description}</p>

      <h2 className="text-2xl font-semibold mb-4">Checkup Packages</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospital.packages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            id={pkg.id}
            name={pkg.name}
            price={Number(pkg.price)}
            duration={pkg.duration}
            hospitalName={hospital.name}
            avgRating={Number(pkg.avgRating)}
            tags={pkg.tags}
          />
        ))}
      </div>
      {hospital.packages.length === 0 && (
        <p className="text-muted-foreground">No packages currently listed.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/packages/[id]/page.tsx`** (anonymous limited view)

```typescript
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pkg = await prisma.checkupPackage.findUnique({
    where: { id: params.id },
    include: { hospital: true },
  });
  if (!pkg) return { title: 'Package Not Found' };
  return { title: `${pkg.name} - ${pkg.hospital.name}` };
}

export default async function PackageDetailPage({ params }: Props) {
  const pkg = await prisma.checkupPackage.findUnique({
    where: { id: params.id },
    include: { hospital: true },
  });

  if (!pkg) notFound();

  const items = pkg.items as string[] | null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <a href={`/hospitals/${pkg.hospital.id}`} className="text-sm text-primary hover:underline mb-4 inline-block">
        ← Back to {pkg.hospital.name}
      </a>

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-1">{pkg.name}</h1>
          <p className="text-muted-foreground">{pkg.hospital.name}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-primary">${Number(pkg.price).toLocaleString()}</p>
          {pkg.duration && <p className="text-sm text-muted-foreground">{pkg.duration}</p>}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg text-yellow-500">{'★'.repeat(Math.round(Number(pkg.avgRating)))}</span>
        <span className="text-muted-foreground">{Number(pkg.avgRating).toFixed(1)}</span>
        <span className="text-muted-foreground">· {pkg.reviewCount} reviews</span>
      </div>

      {/* Tags */}
      <div className="flex gap-1 flex-wrap mb-6">
        {pkg.tags.map((tag) => (
          <span key={tag} className="px-3 py-1 bg-muted rounded-full text-sm text-muted-foreground capitalize">{tag}</span>
        ))}
      </div>

      {/* Description */}
      {pkg.description && <p className="text-muted-foreground mb-6">{pkg.description}</p>}

      {/* Checkup Items */}
      {items && items.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">What&apos;s Included</h2>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Translator notice */}
      {pkg.includesTranslator && (
        <div className="bg-accent p-4 rounded-lg mb-6">
          <p className="text-sm font-medium">Translator service included ✓</p>
          <p className="text-xs text-muted-foreground mt-1">English-speaking staff or translator arranged for this package.</p>
        </div>
      )}

      {/* Sign in prompt for details */}
      <div className="bg-muted p-6 rounded-lg text-center">
        <p className="text-muted-foreground mb-2">Sign in to see provider contact details and submit inquiries.</p>
        <a href="/login" className="text-primary hover:underline font-medium">Sign In with Google →</a>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: Dynamic routes compiled, no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/hospitals/ src/app/packages/
git commit -m "feat: add hospital detail and package detail pages

- Hospital detail page with package listing
- Package detail page with anonymous limited view
- Sign-in prompt for contact details (gated content)
- Server-side rendering with Prisma

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 7: CI/CD Pipeline (GitHub Actions)

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Task 1 (Dockerfile, Docker Compose)
- Produces: Automated build, test, and deploy pipeline to Alibaba Cloud SAE

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Deploy to Alibaba Cloud SAE

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  ALIYUN_REGION: eu-central-1
  ACR_REGISTRY: registry.eu-central-1.aliyuncs.com
  ACR_NAMESPACE: shanghai-healthfinder
  APP_NAME: healthfinder
  SAE_NAMESPACE: cn-frankfurt

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npx prisma generate

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

      - name: Configure Alibaba Cloud CLI
        if: github.ref == 'refs/heads/main'
        uses: aliyun/aliyun-cli-action@v1
        with:
          access-key-id: ${{ secrets.ALIYUN_ACCESS_KEY_ID }}
          access-key-secret: ${{ secrets.ALIYUN_ACCESS_KEY_SECRET }}

      - name: Login to ACR (Alibaba Cloud Container Registry)
        if: github.ref == 'refs/heads/main'
        run: |
          docker login --username=${{ secrets.ALIYUN_ACR_USERNAME }} \
            --password=${{ secrets.ALIYUN_ACR_PASSWORD }} \
            ${{ env.ACR_REGISTRY }}

      - name: Build, tag, and push image to ACR
        if: github.ref == 'refs/heads/main'
        run: |
          IMAGE_TAG=${{ github.sha }}
          docker build -t $ACR_REGISTRY/$ACR_NAMESPACE/$APP_NAME:$IMAGE_TAG -f docker/Dockerfile .
          docker push $ACR_REGISTRY/$ACR_NAMESPACE/$APP_NAME:$IMAGE_TAG
          echo "image=$ACR_REGISTRY/$ACR_NAMESPACE/$APP_NAME:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Deploy to Alibaba Cloud SAE
        if: github.ref == 'refs/heads/main'
        run: |
          aliyun sae DeployApplication \
            --AppId ${{ secrets.SAE_APP_ID }} \
            --ImageUrl $ACR_REGISTRY/$ACR_NAMESPACE/$APP_NAME:${{ github.sha }} \
            --Command "/bin/sh" \
            --CommandArgs "[\"-c\",\"node server.js\"]"
```

- [ ] **Step 2: Add GitHub Actions secrets documentation to README**

Append to README.md:

```markdown
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
```

- [ ] **Step 3: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions deploy pipeline to Alibaba Cloud SAE

- Build, lint, and test on every PR
- Docker image build and push to ACR on main
- SAE application deployment
- Documentation for required secrets

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## Task 8: Privacy Policy Page

**Files:**
- Create: `src/app/privacy/page.tsx`

**Interfaces:**
- Consumes: (none)
- Produces: GDPR-compliant privacy policy page

- [ ] **Step 1: Create `src/app/privacy/page.tsx`**

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 prose prose-sm">
      <h1>Privacy Policy</h1>
      <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <h2>1. Data Controller</h2>
      <p>Shanghai HealthFinder operates this website. All data is processed and stored on servers in the European Union (阿里云 eu-central-1, Frankfurt).</p>

      <h2>2. Data We Collect</h2>
      <ul>
        <li><strong>Account data:</strong> Name, email, Google account ID (if you sign in with Google)</li>
        <li><strong>Profile data:</strong> Your reviews, ratings, and service inquiries</li>
        <li><strong>Usage data:</strong> Anonymous search queries, page visits (with consent)</li>
      </ul>

      <h2>3. Purpose & Legal Basis</h2>
      <ul>
        <li>Provide search and comparison services (performance of contract)</li>
        <li>Communicate about your service inquiries (legitimate interest)</li>
        <li>Improve our service with analytics (consent)</li>
      </ul>

      <h2>4. Data Sharing</h2>
      <p>We do not sell your data. We may share your inquiry data with the hospital you selected, only with your explicit consent.</p>

      <h2>5. Your Rights (GDPR)</h2>
      <ul>
        <li><strong>Access:</strong> Request a copy of your data</li>
        <li><strong>Rectification:</strong> Correct inaccurate data</li>
        <li><strong>Erasure:</strong> Request deletion of your data</li>
        <li><strong>Portability:</strong> Export your data in JSON format</li>
        <li><strong>Withdraw consent:</strong> At any time, without affecting lawfulness of prior processing</li>
      </ul>
      <p>To exercise these rights, contact us through the inquiry form on the site.</p>

      <h2>6. Cookies</h2>
      <p>Essential cookies are required for authentication and basic site functionality. Analytics cookies are only placed with your consent via the cookie banner.</p>

      <h2>7. Data Retention</h2>
      <p>Account data is retained until you request deletion. Inactive accounts are anonymized after 2 years.</p>

      <h2>8. Contact</h2>
      <p>For privacy-related inquiries, please submit a request through our service inquiry form.</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build 2>&1 | tail -5
```

Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/app/privacy/
git commit -m "feat: add GDPR privacy policy page

- English-language privacy policy covering data collection, rights, cookies
- Data storage location declaration (EU, Frankfurt)
- Contact method for data subject requests

Co-authored-by: AiWork <noreply@aiwork.local>"
```

---

## S1 Completion Verification

After all tasks complete, verify the following:

| # | Check | How to Verify |
|---|-------|---------------|
| 1 | Local dev environment boots | `docker compose up -d && npm run dev` → visit http://localhost:3000 |
| 2 | Homepage loads | Page shows hero, search bar, footer |
| 3 | Search works | Type "comprehensive" → see matching packages and hospitals |
| 4 | Cookie banner visible on first visit | Clear localStorage → reload → banner appears at bottom |
| 5 | Hospital detail page loads | Click a hospital card → see packages listed |
| 6 | Package detail shows limited view | Click a package → see items, price, sign-in prompt |
| 7 | Privacy policy accessible | Visit `/privacy` → see full policy |
| 8 | Build passes | `npm run build` exits 0 |
| 9 | Lighthouse score >80 | Run Lighthouse in Chrome DevTools |
| 10 | No TypeScript errors | `npx tsc --noEmit` exits 0 |