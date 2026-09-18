# Shanghai HealthFinder — 阿里云部署指南

> 基于 Alibaba Cloud (阿里云) 欧洲区域 (eu-central-1, Frankfurt) 的完整部署方案

---

## 1. 准备工作

### 1.1 GitHub 仓库设置

代码已在 `main` 分支，但 workflow 文件因权限限制未推送。完成以下两步后，CI/CD 将自动运行：

**步骤 A：添加 Workflow 文件**

在 GitHub 仓库创建 `.github/workflows/deploy.yml`，内容：

<details>
<summary>展开 deploy.yml 内容</summary>

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

      - name: Login to ACR
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
</details>

**步骤 B：配置 GitHub Secrets**

| Secret | 说明 | 获取方式 |
|--------|------|---------|
| `ALIYUN_ACCESS_KEY_ID` | RAM 用户 AccessKey | 阿里云 RAM 控制台 |
| `ALIYUN_ACCESS_KEY_SECRET` | RAM 用户 SecretKey | 阿里云 RAM 控制台 |
| `ALIYUN_ACR_USERNAME` | ACR 登录用户名 | ACR 控制台 → 访问凭证 |
| `ALIYUN_ACR_PASSWORD` | ACR 登录密码 | ACR 控制台 → 访问凭证 |
| `SAE_APP_ID` | SAE 应用 ID | SAE 控制台 → 应用详情 |
| `DATABASE_URL` | PostgreSQL 连接串 | RDS 控制台 |
| `MEILISEARCH_HOST` | Meilisearch 服务地址 | ECS/SAE 上部署的 Meilisearch |
| `MEILISEARCH_API_KEY` | Meilisearch 密钥 | 自行设置 |
| `AUTH_SECRET` | NextAuth 密钥 | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth Secret | Google Cloud Console |

---

## 2. 阿里云资源创建清单

### 2.1 ACR (容器镜像仓库)

```bash
# 创建命名空间
aliyun cr CreateNamespace --Namespace shanghai-healthfinder

# 创建镜像仓库
aliyun cr CreateRepository \
  --Namespace shanghai-healthfinder \
  --RepoName healthfinder \
  --RepoType PUBLIC \
  --Summary "Shanghai HealthFinder application"
```

### 2.2 RDS PostgreSQL

- **引擎**：PostgreSQL 16
- **规格**：pg.n2.small (2核4GB) — 起步
- **存储**：20GB SSD
- **区域**：eu-central-1 (Frankfurt)
- **网络**：创建专有网络 VPC，SAE 同 VPC 内网连接

创建后获取内网地址，格式：
```
postgresql://user:password@rds-inner-url:5432/healthfinder
```

### 2.3 SAE (Serverless 应用引擎)

**创建应用：**
1. 应用名称：`healthfinder`
2. 区域：法兰克福 (eu-central-1)
3. 部署类型：镜像部署
4. 镜像地址：后续由 CI/CD 自动推送至 ACR
5. 规格：1 vCPU, 2GB RAM × 2 实例 (起步)
6. 环境变量：

| 变量名 | 示例值 |
|--------|--------|
| `DATABASE_URL` | `postgresql://user:pass@rds:5432/healthfinder` |
| `MEILISEARCH_HOST` | `http://meilisearch:7700` |
| `MEILISEARCH_API_KEY` | `your-key` |
| `AUTH_SECRET` | `your-secret` |
| `AUTH_GOOGLE_ID` | `client-id` |
| `AUTH_GOOGLE_SECRET` | `client-secret` |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `NODE_ENV` | `production` |

创建后将 `SAE_APP_ID` 添加到 GitHub Secrets。

### 2.4 Meilisearch (搜索服务)

推荐部署方式：在 SAE 或 ECS 上部署 Meilisearch 容器

```yaml
# docker-compose.meilisearch.yml
version: '3.8'
services:
  meilisearch:
    image: getmeili/meilisearch:v1.8
    environment:
      MEILI_MASTER_KEY: your-master-key
      MEILI_NO_ANALYTICS: 'true'
    ports:
      - '7700:7700'
    volumes:
      - meilidata:/meili_data

volumes:
  meilidata:
```

SAE 部署后获取内网地址，配置到环境变量 `MEILISEARCH_HOST`。

### 2.5 OSS (对象存储)

- Bucket 名称：`shanghai-healthfinder-assets`
- 区域：eu-central-1
- 权限：私有读写 + CDN 公开访问
- 用途：存储医院图片、用户上传文件

### 2.6 CDN / DCDN (全站加速)

- **CDN**：加速 OSS 静态资源（图片、JS/CSS）
- **DCDN**：全站加速，反向代理 SAE 应用
- **SSL 证书**：在阿里云 SSL 证书服务申请或上传

### 2.7 DirectMail (邮件通知)

- 配置发信域名
- 获取 SMTP 密码
- 配置模板（用于咨询表单通知）

---

## 3. 部署步骤

### 3.1 初始化数据库

首次部署后，SSH 进入 SAE 容器或本地执行：

```bash
# 生成 Prisma 客户端
npx prisma generate

# 推送数据库 Schema
npx prisma db push

# 导入种子数据
npx tsx prisma/seed.ts
```

### 3.2 触发自动部署

推送代码到 GitHub `main` 分支 → GitHub Actions 自动执行：
1. Install dependencies → Lint → Build
2. Docker 构建并推送到 ACR
3. SAE 部署新版本

### 3.3 验证部署

- 访问 `https://yourdomain.com` — 首页显示搜索入口
- 搜索 "comprehensive" — 返回结果
- 访问 `https://yourdomain.com/privacy` — 隐私政策页
- Cookie 横幅在首次访问时显示

---

## 4. 本地开发环境

```bash
# 1. 启动 PostgreSQL + Meilisearch
docker compose up -d

# 2. 复制环境变量
cp .env.local.example .env.local

# 3. 初始化数据库
npm run db:generate
npm run db:push
npm run db:seed

# 4. 启动开发服务器
npm run dev
# → http://localhost:3000
```

---

## 5. 项目文件结构摘要

```
├── src/                        # 源代码
│   ├── app/                    # Next.js App Router 页面
│   │   ├── page.tsx            # 首页（搜索入口）
│   │   ├── layout.tsx          # 根布局
│   │   ├── globals.css         # 全局样式
│   │   ├── privacy/            # 隐私政策
│   │   ├── hospitals/[id]/     # 医院详情
│   │   ├── packages/[id]/      # 套餐详情
│   │   └── api/                # API 路由
│   ├── components/             # UI 组件
│   ├── lib/                    # 工具库
│   └── middleware.ts           # 安全中间件
├── prisma/                     # 数据库
│   ├── schema.prisma           # 9 个数据表
│   └── seed.ts                 # 3 家医院 + 8 个套餐
├── docker/                     # Docker 配置
└── .github/workflows/          # CI/CD 流水线
```