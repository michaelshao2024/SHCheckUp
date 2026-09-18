#!/bin/bash
# ======================================================
# Shanghai HealthFinder — 本地开发一键启动脚本
# 环境要求: Node.js 20+, Docker Desktop
# ======================================================

set -e

echo "🚀 Shanghai HealthFinder 本地开发环境启动..."

# 1. 检查环境
echo "📋 检查环境..."
command -v node >/dev/null 2>&1 || { echo "❌ 需要安装 Node.js 20+: https://nodejs.org"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "❌ 需要安装 Docker Desktop: https://docker.com"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未找到"; exit 1; }

NODE_VER=$(node -v | cut -d. -f1 | tr -d 'v')
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node.js 版本过低 ($(node -v))，需要 18+"
  exit 1
fi
echo "✅ Node.js $(node -v), Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# 2. 安装依赖
echo "📦 安装项目依赖..."
npm install

# 3. 启动基础设施 (PostgreSQL + Meilisearch)
echo "🐳 启动 PostgreSQL + Meilisearch..."
docker compose up -d
echo "⏳ 等待数据库就绪..."
sleep 3

# 4. 初始化数据库
echo "🗄️ 生成 Prisma 客户端..."
npx prisma generate

echo "🗄️ 推送数据库 Schema..."
npx prisma db push

echo "🌱 导入种子数据..."
npx tsx prisma/seed.ts

# 5. 启动开发服务器
echo ""
echo "============================================"
echo "✅ 启动开发服务器！"
echo "   访问 http://localhost:3000"
echo ""
echo "   搜索: comprehensive, huashan, basic..."
echo "   管理数据库: npx prisma studio"
echo "============================================"
echo ""

npx next dev