# Echoon2 — 导游口试训练系统

基于 pnpm monorepo 的全栈学习应用。

## 技术栈

| 层级 | 技术 |
|---|---|
| 前端 | Vite + React 19 + TypeScript |
| UI | shadcn/ui (base-nova) + Tailwind CSS + next-themes |
| 表单 | react-hook-form + zod |
| 表格 | @tanstack/react-table |
| 状态 | Zustand (persist) |
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

所有接口以 `/api/v1/guide-exam` 为前缀。认证方式：`x-device-id` header（匿名 deviceId）。

## 前端路由

| 路由 | 页面 |
|---|---|
| `#/` | 题库首页 |
| `#/practice/:topicId` | 题目练习页 |
| `#/mock` | 模考页 |
| `#/profile` | 个人中心 |
| `#/member` | 会员权益页 |
