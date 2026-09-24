# 云端开发环境配置 ToDo List

> 目标：纯云端开发闭环 — AI 在云端工作区开发 → GitHub → Vercel 自动部署 → Neon 数据库，不依赖任何本地机器。

## 一、GitHub（代码托管）

- [ ] 准备仓库：`github.com/michaelshao2024/SHCheckUp`（或新仓库）
- [ ] 创建 GitHub Personal Access Token（github.com/settings/tokens）
  - 建议 fine-grained token，权限只需：该仓库的 **Contents: Read & Write**
  - ⚠️ token 发给 AI 使用后，建议定期撤销换新

## 二、Neon（数据库）

- [ ] neon.tech 注册并创建项目（区域按需，当前为 us-east-1）
- [ ] 复制 **Pooled connection** 连接串，形如：
  `postgresql://user:pass@xxx-pooler.xxx.aws.neon.tech/neondb?sslmode=require`

## 三、Vercel（部署平台）

- [ ] vercel.com/new → Import GitHub 仓库（Next.js 自动识别，构建设置无需改动）
- [ ] Settings → Environment Variables 配置（勾选 Production + Preview）：

| 变量 | 必需性 | 说明 |
|---|---|---|
| `DATABASE_URL` | 必需 | Neon pooled 连接串 |
| `AUTH_SECRET` | 必需 | `openssl rand -base64 32` 生成，不配则用代码兜底值（有安全风险） |
| `NEXT_PUBLIC_SITE_URL` | 必需 | 生产站点 URL |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | 可选 | Google 登录 |
| `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY` | 可选 | 不配则搜索自动回退数据库查询 |
| `NOTIFY_PROVIDER` / `NOTIFY_WEBHOOK_URL` | 可选 | 询盘通知（企业微信/钉钉/Telegram） |

- [ ] Settings → Domains 绑定自定义域名（当前：www.sanensheng.com，DNS 加 CNAME 到 `cname.vercel-dns.com`）
- [ ] 配置完环境变量后：Deployments → 最新一条 → Redeploy（使变量生效）

## 四、数据库初始化（交给 AI 在云端执行）

- [ ] 提供 DATABASE_URL 给 AI，执行 `prisma db push`（建表/同步结构，不破坏已有数据）
- [ ] 需要示例数据时执行 `db:seed`；创建管理员执行 `create-admin`

## 五、验证清单（AI 执行）

- [ ] 工作区内 `npm run build` 通过
- [ ] push 到 main 后，Vercel API 确认新部署 READY
- [ ] 线上路由冒烟：首页 / 搜索 API / 登录注册 / sitemap 均 200
- [ ] 注册测试账号验证会话签名，用完删除测试数据

## 六、日常使用规则

- 提需求即可，AI 在云端开发、自测、push，约 1~2 分钟自动上线
- 换设备/换会话继续开发：只需告诉 AI 仓库地址 + 提供 token，它会 clone 最新代码接着干
- ⚠️ 在对话中出现过的 token 用完后到平台撤销（GitHub Settings → Tokens；vercel.com/account/tokens）
