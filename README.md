# Echoon2 — 导游口试训练系统

基于 pnpm monorepo 的全栈学习应用。

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | Vite + React 19 + TypeScript |
| UI | shadcn/ui (base-nova) + Tailwind CSS + next-themes |
| 表单 | react-hook-form + zod |
| 表格 | @tanstack/react-table |
| 状态 | Zustand（题库绑定由登录后 `GET /bootstrap` 注入内存；部分偏好/收藏仍可用 persist） |
| 国际化 | i18next + react-i18next |
| 后端 | NestJS 10 |
| 数据库 | PostgreSQL + Prisma 6 |
| API | RESTful `/api/v1/guide-exam` |

## 快速开始

```bash
# 安装依赖
pnpm install

# 配置环境变量
cp .env.example apps/backend/.env
# 编辑 DATABASE_URL 等配置

# 数据库初始化
cd apps/backend
pnpm prisma:migrate
pnpm prisma:seed

# 启动开发服务器
cd ../..
pnpm dev
```

## 目录结构

```
echoon2/
├── apps/
│   ├── backend/      # NestJS 后端
│   └── frontend/     # React 前端
├── docs/             # 需求与架构文档
└── pnpm-workspace.yaml
```

## API 基础路径

所有接口以 `/api/v1/guide-exam` 为前缀。认证方式：Better Auth 会话 + `Authorization: Bearer <token>`；业务数据按登录用户 `userId` 落库。

## 前端路由

| 路由 | 页面 |
|---|---|
| `#/` | 题库首页 |
| `#/practice/:topicId` | 题目练习页 |
| `#/mock` | 模考页 |
| `#/profile` | 个人中心 |
| `#/member` | 会员权益页 |

## Docker + SSH 自动部署

项目已提供以下部署文件：

- `docker-compose.yml`：统一编排 `nginx + backend + postgres`
- `docker/nginx.Dockerfile` + `docker/nginx.conf`：统一入口（前端静态资源 + `/api` 反代后端）
- `docker/backend.Dockerfile`：NestJS + Prisma 生产镜像
- `.github/workflows/deploy.yml`：push 到 `main` 后通过 SSH 自动部署

### 1) GitHub Variables（仓库变量）

- `DEPLOY_HOST`：部署地址（域名或服务器 IP）
- `DEPLOY_PATH`：服务器部署目录（可选，默认 `/opt/echoon2`）
- `FRONTEND_URL`：前端公网地址（可选，默认 `https://DEPLOY_HOST`）

### 2) GitHub Secrets（仓库密钥）

- `SSH_USER`
- `SSH_PRIVATE_KEY`
- `SSH_PORT`（可选，默认 `22`）
- `POSTGRES_USER`（可选，默认 `echoon2`）
- `POSTGRES_PASSWORD`（必填）
- `POSTGRES_DB`（可选，默认 `echoon2`）

### 3) 服务器准备

- 安装 `docker` 和 `docker compose`
- 放通 `80` 端口
- SSH 用户有权限执行 Docker 命令

### 4) 本地参考环境变量

可参考 `.env.production.example`，按实际值填写后用于手动部署或排障。
