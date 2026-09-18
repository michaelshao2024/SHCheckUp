# 涉外体检信息检索平台 — 技术方案设计

## 概述

面向海外用户的上海涉外体检服务搜索与比对平台。用户可搜索、比对、评价体检套餐，并通过表单提交人工服务需求。

**技术定位：** 全栈 Next.js 单仓库架构，自托管于阿里云欧洲区域，全球 CDN 加速。

---

## 1. 技术栈

| 层级 | 技术 | 版本 | 用途 |
|:----|:-----|:----|:-----|
| 前端框架 | Next.js (App Router) | 14+ | SSR/SSG 页面 + API Routes + Server Actions |
| 语言 | TypeScript | 5.x | 全栈类型安全 |
| UI 组件 | Shadcn UI + Tailwind CSS | 最新 | 轻量、可定制、无障碍 |
| 数据库 | PostgreSQL (阿里云 RDS PostgreSQL) | 16.x | 关系型主存储 |
| ORM | Prisma | 5.x | 类型安全数据库访问、迁移 |
| 认证 | NextAuth.js (Auth.js v5) | 5.x | Google OAuth + 邮箱注册 |
| 搜索引擎 | Meilisearch | 1.x | 英文全文搜索、筛选、分面 |
| 后台管理 | next admin (自建, 基于 Shadcn) | — | 数据导入/编辑、表单管理 |
| 部署 | Docker → 阿里云 SAE (Serverless) | — | 容器化，Serverless 应用引擎 |
| CDN | 阿里云 CDN / DCDN | — | 全球全站加速 |
| 对象存储 | 阿里云 OSS (同区域) | — | 图片、导入文件存储 |
| 邮件 | 阿里云 DirectMail | — | 表单通知邮件 |
| 监控 | Sentry + 阿里云 SLS | — | 错误追踪 + 日志服务 |
| CI/CD | GitHub Actions | — | 自动构建 → 测试 → 部署 |

---

## 2. 架构概览

```
                           ┌──────────────┐
                           │  阿里云 CDN   │  ← 全球全站加速
                           │  DCDN + WAF   │
                           └──────┬───────┘
                                  │
                     ┌────────────┴────────────┐
                     │  Next.js (SAE / ECS)    │
                     │                         │
                     │  ├── Pages (SSR/SSG)    │
                     │  ├── API Routes         │
                     │  │  ├─ /api/auth/*      │  ← NextAuth.js
                     │  │  ├─ /api/search/*    │  ← Meilisearch 代理
                     │  │  ├─ /api/hospitals/* │
                     │  │  ├─ /api/packages/*  │
                     │  │  ├─ /api/reviews/*   │
                     │  │  ├─ /api/inquiries/* │
                     │  │  └─ /api/admin/*     │  ← 后台管理
                     │  └── Server Actions     │
                     └────────────┬────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ┌──────┴──────┐      ┌────────┴────────┐     ┌────────┴────────┐
          │  PostgreSQL  │      │   Meilisearch   │     │ 阿里云 Direct  │
          │  (阿里云 RDS)│      │   (ECS/SAE)     │     │  Mail(邮件通知)│
          │  Frankfurt) │      │   Frankfurt     │     │                │
          └─────────────┘      └─────────────────┘     └─────────────────┘
```

### 部署拓扑

| 资源 | 区域 | 规格（起步） |
|:----|:----|:------------|
| SAE / ECS (Next.js) | eu-central-1 (Frankfurt) | 1 vCPU, 2GB RAM × 2 实例 |
| 阿里云 RDS PostgreSQL | eu-central-1 | pg.n2.small (2GB RAM, 20GB) |
| Meilisearch (ECS/SAE) | eu-central-1 | 0.5 vCPU, 1GB RAM |
| OSS (图片/文件) | eu-central-1 | 按量 |
| 阿里云 CDN / DCDN | 全球边缘 | 按量 |

---

## 3. 数据模型核心设计

```
┌─────────────┐     ┌──────────────────┐
│   Hospital   │     │  CheckupPackage  │
│─────────────│     │──────────────────│
│ id          │────→│ id               │
│ name        │     │ hospitalId (FK)  │
│ nameEn      │     │ name             │
│ address     │     │ price            │
│ phone       │     │ currency (USD)   │
│ email       │     │ duration         │
│ website     │     │ items (JSON[])   │  ← 灵活存储检查项目列表
│ description │     │ includesTrasnsl │
│ imageUrl    │     │ tags (String[])  │
│ status      │     │ isActive         │
└─────────────┘     │ avgRating        │  ← 异步更新
                    │ reviewCount      │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐     ┌──────────────┐
                    │     Review       │     │    User      │
                    │──────────────────│     │──────────────│
                    │ id               │     │ id           │
                    │ packageId (FK)   │←───→│ name         │
                    │ userId (FK)      │     │ email        │
                    │ rating (1-5)     │     │ googleId     │
                    │ comment          │     │ role (user/  │
                    │ status (visible/ │     │       admin) │
                    │        hidden)   │     │ createdAt    │
                    │ createdAt        │     └──────────────┘
                    └──────────────────┘

┌──────────────────┐    ┌───────────────────┐
│    Inquiry       │    │   ImportLog       │
│──────────────────│    │───────────────────│
│ id               │    │ id                │
│ userId (FK)      │    │ fileName          │
│ hospitalId (FK)  │    │ totalRows         │
│ packageId (FK)   │    │ successRows       │
│ name             │    │ failedRows        │
│ email            │    │ errors (JSON[])   │
│ preferredDate    │    │ importedBy (FK)   │
│ message          │    │ createdAt         │
│ status (pending/ │    └───────────────────┘
│        processing/
│        done)
└──────────────────┘
```

---

## 4. 目录结构

```
/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (public)/           # 公开页面布局
│   │   │   ├── page.tsx        # 首页（搜索入口）
│   │   │   ├── hospitals/      # 医院列表/详情
│   │   │   ├── packages/       # 套餐详情/比对
│   │   │   └── compare/        # 比对页面
│   │   ├── (auth)/             # 认证页面
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── profile/
│   │   ├── (admin)/            # 管理后台
│   │   │   ├── dashboard/
│   │   │   ├── hospitals/
│   │   │   ├── packages/
│   │   │   ├── import/         # 批量导入页面
│   │   │   ├── inquiries/
│   │   │   └── reviews/
│   │   ├── api/                # API Routes
│   │   │   ├── auth/           # NextAuth.js
│   │   │   ├── hospitals/
│   │   │   ├── packages/
│   │   │   ├── search/
│   │   │   ├── reviews/
│   │   │   ├── inquiries/
│   │   │   └── admin/
│   │   └── privacy/            # GDPR 隐私政策
│   ├── components/             # 共享 UI 组件
│   ├── lib/                    # 工具函数
│   │   ├── prisma.ts           # Prisma 客户端
│   │   ├── meilisearch.ts      # 搜索引擎客户端
│   │   ├── auth.ts             # NextAuth 配置
│   │   └── email.ts            # DirectMail 邮件发送
│   ├── types/                  # TypeScript 类型定义
│   └── middleware.ts           # 权限守卫/国际化
├── prisma/
│   └── schema.prisma           # 数据库模型定义
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml      # 本地开发（含 Meilisearch）
├── .github/
│   └── workflows/
│       └── deploy.yml          # CI/CD 流水线
├── infrastructure/             # IaC（可选）
│   └── aliyun/                 # Terraform / ROS
└── docker-compose.yml
```

---

## 5. 关键设计决策

### 5.1 搜索方案：Meilisearch 而非 Elasticsearch

- **理由：** Meilisearch 开箱即用支持英文全文搜索、拼写容错、分面筛选、排序，部署极简（单容器），完全满足搜索+筛选+比对场景
- 部署：同区域阿里云 ECS 或 SAE
- 数据同步：Prisma event hook → Meilisearch index 实时同步

### 5.2 数据导入方案

- 管理员上传 CSV/Excel → 前端解析预览（使用 SheetJS/xlsx 库）
- 预览确认后 → API Route 接收 JSON 数组 → 批量写入数据库
- 同步更新 Meilisearch 索引
- 写入导入日志表

### 5.3 认证方案

- NextAuth.js v5 配置 Google OAuth + Credentials（邮箱注册）
- 数据库会话（PostgreSQL session 表），而非 JWT（支持 GDPR 会话管理）
- 中间件层权限守卫：`/admin/*` 路由检查 `role === 'admin'`
- API Route 内部校验：搜索 API 区分匿名/已登录返回字段

### 5.4 全球加速方案

- 静态资源：阿里云 CDN + OSS origin，长期缓存（1年），版本化文件名
- 页面：Next.js SSR 运行在 Frankfurt，阿里云 DCDN 作为反向代理缓存 HTML
- API：动态请求直连 Frankfurt，但通过 DCDN 的 HTTP/2 + 连接复用减少延迟
- 图片：阿里云 CDN + OSS，自动 WebP 转换

### 5.5 GDPR 合规设计

- 数据存储声明：所有数据仅存储于阿里云 eu-central-1
- Cookie：自建轻量 Cookie 同意横幅，非必要 Cookie 默认不加载
- 用户数据导出：`/api/user/export` → 聚合所有用户数据 → JSON 下载
- 账号删除：标志位删除 + 7天缓冲期后清理 + 评价匿名化
- 日志：不记录个人身份信息的访问日志

---

## 6. S1 技术实施范围

S1 (Public MVP) 的最小技术范围：

1. **项目脚手架**：Next.js 14 + TypeScript + Tailwind + Shadcn UI
2. **数据库**：Prisma Schema → PostgreSQL (本地 Docker + RDS)
3. **基础页面**：首页 + 医院列表 + 搜索框 + 结果展示
4. **搜索 API**：Meilisearch 集成 → 粗粒度返回
5. **基础部署**：Dockerfile → 阿里云 SAE / ECS (Frankfurt)
6. **CDN**：阿里云 CDN / DCDN 加速
7. **CI/CD**：GitHub Actions 流水线
8. **GDPR Cookie 横幅**：基础版
9. **域名 + SSL**：.com 域名 + 全站 HTTPS

---

## 7. 非功能性需求

| 需求 | 目标 | 实现方式 |
|:----|:----|:--------|
| 全球加载时间 | 美/英/荷/澳 <3s | SSR + 阿里云 DCDN + 静态资源 CDN |
| 可用性 | 99.9% | SAE 多 AZ 部署 + 健康检查 |
| 安全性 | A+ | CSP/HSTS 头、WAF、速率限制、HTTPS |
| 可观测性 | 错误 <1% 告警 | Sentry + 阿里云 SLS 告警 |
| 合规性 | GDPR 全合规 | 数据区域隔离、用户数据管理、Cookie 同意 |

---

## 8. 技术预研项

- ✅ Google OAuth 注册流程（NextAuth 已内置）
- ✅ Meilisearch 与 Prisma 数据同步（社区已有方案）
- ✅ CSV 解析与预览（SheetJS 成熟方案）
- ⏳ GDPR Cookie 框架（待确认是否使用第三方如 CookieYes 或自建）
