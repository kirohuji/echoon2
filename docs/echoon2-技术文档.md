# Echoon2 — 导游口试训练系统 技术文档

## 目录

1. [项目概述](#1-项目概述)
2. [系统架构](#2-系统架构)
3. [技术栈](#3-技术栈)
4. [项目目录结构](#4-项目目录结构)
5. [Monorepo 组织](#5-monorepo-组织)
6. [数据库设计](#6-数据库设计)
7. [认证系统](#7-认证系统)
8. [API 设计](#8-api-设计)
9. [核心业务模块](#9-核心业务模块)
10. [TTS 语音合成](#10-tts-语音合成)
11. [AI 口语反馈](#11-ai-口语反馈)
12. [文件资产管理](#12-文件资产管理)
13. [前端架构](#13-前端架构)
14. [DevOps 与部署](#14-devops-与部署)
15. [环境变量配置](#15-环境变量配置)
16. [开发指南](#16-开发指南)
17. [附录](#17-附录)

---

## 1. 项目概述

### 1.1 项目定位

Echoon2 是一个面向导游资格证口语考试的**全栈训练系统**。系统模拟真实考试场景，提供题库浏览、口语练习、模拟考试、AI 发音反馈、TTS 语音合成等核心功能，帮助考生高效备考。

### 1.2 核心功能

| 功能模块 | 描述 |
|---|---|
| 题库浏览 | 按省份、语种、考试类型筛选题库，支持关键词搜索 |
| 口语练习 | 逐题练习，支持录音、播放标准音频、查看中英答案 |
| AI 反馈 | DeepSeek 驱动的口语评分与发音纠正（流式响应） |
| 模拟考试 | 标准化试卷模考，记录分数与薄弱点 |
| TTS 语音 | MiniMax / Cartesia 多厂商 TTS，自动缓存音频 |
| 学习档案 | 练习热力图、掌握度进度、收藏与生词本 |
| 会员系统 | 月度/季度/年度会员套餐与权益 |
| 支付系统 | 支付宝 / 微信支付订单创建与回调处理 |
| 消息通知 | 站内通知（用户端列表+详情 / 管理端 CRUD） |
| 管理后台 | 用户管理、会员管理、订单管理、通知管理、资源管理 |
| 门户页面 | 产品介绍 Landing Page（动画、特性展示、CTA） |
| 法律合规 | 服务条款、隐私政策、ICP 备案等系统文档 |
| 多端支持 | Web SPA（响应式） + iOS 原生 (Capacitor) |

### 1.3 关键指标

- **API 模块数**：15 个 NestJS 业务模块
- **数据库模型数**：21+ 个 Prisma 模型 + 3 个枚举
- **前端路由数**：20+ 个页面路由
- **TTS 提供商**：2 个（MiniMax、Cartesia）
- **支付方式**：2 个（支付宝、微信支付）
- **外部服务数**：6 个（腾讯云 COS、DeepSeek、MiniMax、Cartesia、Whisper、支付宝/微信支付）

---

## 2. 系统架构

### 2.1 整体架构图

```
┌────────────────────────────────────────────────────────────┐
│                       用户层                                │
│     Web 浏览器（hash 路由 SPA）  │  iOS 原生 (Capacitor)    │
└──────────────────────┬─────────────────────────────────────┘
                       │ HTTPS (443)
                       ▼
┌────────────────────────────────────────────────────────────┐
│                     Nginx 网关                              │
│         SSL 终止  │  静态托管  │  /api/ 反向代理            │
└──────────────────────┬─────────────────────────────────────┘
                       │ /api/
                       ▼
┌────────────────────────────────────────────────────────────┐
│                NestJS 10 后端 (:3001)                       │
│  ┌──────────┬──────────┬──────────┬──────────┐            │
│  │ Auth     │ Practice │ MockExam │ TTS      │            │
│  │ Config   │ Q-Bank   │ Profile  │ File     │            │
│  │ Assets   │ Member   │ AI       │ Pay      │            │
│  │ Admin    │ Notify   │ Resource │          │            │
│  └──────────┴──────────┴──────────┴──────────┘            │
│  Prisma ORM  │  ValidationPipe  │  TransformInterceptor     │
└──────┬────────────┬──────────┬───────────┬─────────────────┘
       │            │          │           │
       ▼            ▼          ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │TencentCOS│ │DeepSeek  │ │MiniMax   │
│  16      │ │对象存储   │ │AI 评分   │ │Cartesia  │
└──────────┘ └──────────┘ └──────────┘ │Whisper   │
                                        └──────────┘
```

### 2.2 请求生命周期

```
用户请求 → Nginx (SSL → /api/ 反代) → NestJS
  → CORS 中间件 (Better Auth 路径特殊处理)
  → ValidationPipe (DTO 校验 & 转换)
  → Controller (路由分发)
  → Service (业务逻辑)
     → PrismaService (数据库操作)
     → 外部服务调用 (TTS / AI / COS / Whisper)
  → TransformInterceptor (统一响应封装)
  → AllExceptionsFilter (异常处理)
```

### 2.3 统一响应格式

所有 API 返回遵循统一结构：

```typescript
{
  code: number;    // HTTP 状态码
  message: string; // 状态描述
  data: T;         // 业务数据
}
```

---

## 3. 技术栈

### 3.1 后端

| 技术 | 版本 | 用途 |
|---|---|---|
| NestJS | 10 | 后端 MVC 框架 |
| TypeScript | 5.5 | 类型系统 |
| Prisma | 6 | ORM + 数据库迁移 |
| PostgreSQL | 16 | 关系型数据库 |
| Better Auth | 1.6.9 | 认证鉴权 |
| @ai-sdk/openai | 3.0 | DeepSeek AI SDK |
| ai (Vercel AI SDK) | 6.0 | 流式 AI 响应 |
| class-validator | 0.14 | DTO 校验 |
| class-transformer | 0.5 | 对象转换 |
| @nestjs/schedule | 6.1 | 定时任务 |
| cos-nodejs-sdk-v5 | 2.15 | 腾讯云 COS SDK |
| zod | 3.25 | Schema 验证 |
| multer | 2.1 | 文件上传 |
| axios | 1.15 | HTTP 客户端 |

### 3.2 前端

| 技术 | 版本 | 用途 |
|---|---|---|
| React | 19.1 | UI 框架 |
| Vite | 6.3 | 构建工具 |
| TypeScript | 5.5 | 类型系统 |
| Tailwind CSS | 3.4 | 原子化 CSS |
| shadcn/ui | — | UI 组件库（26 个组件） |
| Radix UI | 1.x | 无样式无障碍组件 |
| react-router-dom | 7.5 | 客户端路由（Hash 模式） |
| react-hook-form | 7.6 | 表单管理 |
| Zustand | 5.0 | 状态管理 |
| react-i18next | 15 | 国际化 |
| next-themes | 0.4 | 暗色模式切换 |
| Recharts | 2.15 | 图表可视化 |
| wavesurfer.js | 7.12 | 音频波形 |
| @tanstack/react-table | 8.21 | 数据表格 |
| motion | 12.38 | 动画库 |
| lucide-react | 0.511 | 图标库 |
| Capacitor | 8.3 | iOS 移动框架 |

### 3.3 DevOps

| 技术 | 用途 |
|---|---|
| pnpm | 包管理器 + Workspace Monorepo |
| Docker | 容器化 |
| Docker Compose | 多服务编排 |
| Nginx | 反向代理 + 静态托管 + SSL |
| GitHub Actions | CI/CD (self-hosted runner) |

### 3.4 外部服务

| 服务 | 用途 | 说明 |
|---|---|---|
| MiniMax | TTS 语音合成 | 文本转语音 |
| Cartesia | TTS 语音合成 | 支持词级时间戳 |
| DeepSeek | AI 评分反馈 | 口语评分、教学指导 |
| Whisper (自部署) | 语音转文字 | whisper.cpp 推理服务 |
| 腾讯云 COS | 对象存储 | 文件资产 + TTS 音频缓存 |

---

## 4. 项目目录结构

```
echoon2/
├── .agents/                         # AI Agent 技能（Better Auth / Capacitor / shadcn 等）
│   └── skills/                      # 11 个技能定义
├── .cursor/                         # Cursor IDE 配置
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD 自动部署工作流
├── apps/
│   ├── backend/                     # @echoon2/backend — NestJS 后端
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # 数据库模型定义（362 行）
│   │   │   ├── seed.ts              # 种子数据（含广东英语/日语题库）
│   │   │   └── migrations/          # 数据库迁移文件
│   │   ├── src/
│   │   │   ├── main.ts              # 应用入口（Better Auth + CORS + 中间件）
│   │   │   ├── app.module.ts        # 根模块（聚合 12 个子模块）
│   │   │   ├── common/              # 公共层
│   │   │   │   ├── dto/             # 通用 DTO（分页等）
│   │   │   │   ├── filters/         # 全局异常过滤器
│   │   │   │   ├── interceptors/    # 全局响应拦截器
│   │   │   │   ├── prisma/          # Prisma 模块 + Service
│   │   │   │   └── response/        # 统一响应格式
│   │   │   └── modules/             # 业务模块（10 个）
│   │   │       ├── auth/            # Better Auth 认证
│   │   │       ├── config-guide/    # 题库绑定引导
│   │   │       ├── question-bank/   # 题库首页
│   │   │       ├── practice/        # 练习 + 词典
│   │   │       ├── mock-exam/       # 模拟考试
│   │   │       ├── profile/         # 个人中心 + 用户档案
│   │   │       ├── membership/      # 会员计划
│   │   │       ├── assets/          # 收藏 + 生词本
│   │   │       ├── tts/             # TTS 语音合成
│   │   │       ├── practice-ai/     # AI 口语反馈
│   │   │       ├── file-assets/     # 文件资产管理
│   │   │       ├── notification/    # 消息通知
│   │   │       ├── admin/           # 管理后台
│   │   │       ├── pay/             # 支付系统
│   │   │       └── resource-library/# 资源管理
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── nest-cli.json
│   └── frontend/                    # @echoon2/frontend — React 前端
│       ├── ios/                     # iOS 原生项目 (Capacitor)
│       ├── src/
│       │   ├── main.tsx             # React 入口
│       │   ├── App.tsx              # 路由配置 + Provider 链
│       │   ├── index.css            # 全局样式（shadcn CSS 变量）
│       │   ├── components/          # 组件
│       │   │   ├── ui/              # shadcn/ui 组件（26 个）
│       │   │   └── common/          # 业务通用组件（9 个）
│       │   ├── features/            # 按功能域组织
│       │   │   ├── auth/            # 登录/注册页
│       │   │   ├── account/         # 账户管理页
│       │   │   ├── admin/           # 管理后台（用户/会员/订单/通知/资源）
│       │   │   ├── question-bank/   # 题库首页 API + 页面
│       │   │   ├── practice/        # 练习页 API + 页面
│       │   │   ├── mock-exam/       # 模考页 API + 页面
│       │   │   ├── profile/         # 个人中心 API + 页面
│       │   │   ├── membership/      # 会员页 API + 页面
│       │   │   ├── notification/    # 通知列表/详情页
│       │   │   ├── portal/          # 门户 Landing Page
│       │   │   ├── system/          # 法律文档（条款/隐私/ICP等）
│       │   │   ├── assets/          # 收藏/生词 API
│       │   │   └── file-assets/     # 文件资产 API
│       │   ├── hooks/               # 自定义 Hook
│       │   ├── layout/              # Header/Footer/Sidebar 布局
│       │   ├── lib/                 # 工具库
│       │   │   ├── request.ts       # Axios 封装（自动解包 + 401 处理）
│       │   │   ├── i18n/            # 国际化配置
│       │   │   ├── tts-api.ts       # TTS 客户端 API
│       │   │   ├── dictionary-api.ts# 词典 API
│       │   │   └── practice-ai-api.ts # AI 练习 API
│       │   ├── providers/           # Context Provider
│       │   │   ├── auth-provider.tsx
│       │   │   ├── auth-route-guard.tsx
│       │   │   └── theme-provider.tsx
│       │   └── stores/              # Zustand 状态（3 个 store）
│       ├── capacitor.config.ts      # Capacitor 配置
│       ├── vite.config.ts           # Vite 配置
│       ├── components.json          # shadcn/ui 配置
│       └── tailwind.config.js       # Tailwind CSS 配置
├── docker/
│   ├── backend.Dockerfile           # 后端多阶段构建
│   ├── nginx.Dockerfile             # 前端 + Nginx 构建
│   └── nginx.conf                   # Nginx 配置
├── docs/                            # 项目文档
├── docker-compose.yml               # Docker Compose 编排
├── package.json                     # 根 package.json
├── pnpm-workspace.yaml              # pnpm 工作区声明
└── .env.example                     # 环境变量模板
```

---

## 5. Monorepo 组织

### 5.1 包管理器：pnpm workspace

```yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
```

两个工作区包：

| 包名 | 路径 | 入口 |
|---|---|---|
| `@echoon2/backend` | `apps/backend` | `node dist/main.js` |
| `@echoon2/frontend` | `apps/frontend` | Vite 构建 → Nginx 托管 |

### 5.2 顶层脚本

```json
{
  "dev": "pnpm --parallel -r dev",
  "dev:backend": "pnpm --filter @echoon2/backend dev",
  "dev:frontend": "pnpm --filter @echoon2/frontend dev",
  "build": "pnpm -r build",
  "lint": "pnpm -r lint",
  "typecheck": "pnpm -r typecheck"
}
```

### 5.3 依赖隔离策略

- 通过 `pnpm --filter` 精确安装每个子项目的依赖
- Docker 构建中同样使用 `--filter` 避免安装前端依赖到后端镜像
- `pnpm-lock.yaml` 统一锁定所有依赖版本

---

## 6. 数据库设计

### 6.1 数据库选型

- **数据库**：PostgreSQL 16
- **ORM**：Prisma 6
- **迁移策略**：`prisma migrate dev` (开发) / `prisma db push` (测试环境 CI)

### 6.2 模型 ER 关系

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    User     │────→│ UserBindingConfig│────→│  QuestionBank   │
│  (认证用户)  │  1:1 │  (题库绑定配置)   │  N:1 │   (题库主表)     │
└──────┬──────┘     └──────────────────┘     └────────┬────────┘
       │                                              │ 1:N
       │                                   ┌──────────┴──────────┐
       │                                   ▼                     ▼
       │                          ┌─────────────────┐  ┌─────────────────┐
       │                          │  QuestionTopic  │  │   MockPaper     │
       │                          │  (题目分类/专题)  │  │   (模考试卷)     │
       │                          └────────┬────────┘  └────────┬────────┘
       │                                   │ 1:N                 │ 1:N
       │                                   ▼                     ▼
       │                          ┌─────────────────┐  ┌─────────────────────┐
       │                          │  QuestionItem   │←─│ MockPaperQuestion   │
       │                          │    (题目主数据)   │  │   (试卷-题目关联)     │
       │                          └────────┬────────┘  └─────────────────────┘
       │                                   │ 1:1
       │                                   ▼
       │                          ┌─────────────────┐
       │                          │ QuestionContent │
       │                          │  (题目中英内容)   │
       │                          └─────────────────┘
       │
       │        ┌───────────────────────────────────────┐
       ├───────→│ FavoriteQuestion    (收藏, N:M)        │
       ├───────→│ VocabularyWord      (生词本, N:M)       │
       ├───────→│ PracticeRecord      (练习记录, 1:N)     │
       ├───────→│ PracticeProgress    (练习进度, 1:N)     │
       ├───────→│ MockExamRecord      (模考成绩, 1:N)     │
       ├───────→│ DailyActivity       (每日活动, 1:N)     │
       ├───────→│ UserPreference      (用户偏好, 1:1)     │
       └───────→│ FileReference       (文件引用, 1:N)     │
                └───────────────────────────────────────┘

┌─────────────────┐     ┌───────────────────┐     ┌─────────────────┐
│   FileAsset     │────→│  FileReference    │     │  QuestionAudio  │
│  (文件主表/SHA256)│ 1:N │  (业务引用关联)    │     │ (TTS 音频缓存)   │
└─────────────────┘     └───────────────────┘     └─────────────────┘
```

### 6.3 模型分类

#### 认证域（Better Auth 标准模型）

| 模型 | 表名 | 说明 |
|---|---|---|
| `User` | `user` | 用户（含 username、phoneNumber 扩展字段） |
| `Session` | `session` | 登录会话 |
| `Account` | `account` | OAuth 账号关联（微信等） |
| `Verification` | `verification` | 验证码/令牌 |

#### 题库域

| 模型 | 表名 | 说明 |
|---|---|---|
| `QuestionBank` | `question_bank` | 题库（省份×语种×考试类型组合） |
| `QuestionTopic` | `question_topic` | 题目专题（景点介绍、导游规范、应变能力等） |
| `QuestionItem` | `question_item` | 题目主体（难度、关键词、核心词、建议时长） |
| `QuestionContent` | `question_content` | 题目内容（中英文题目、答案、摘要） |

#### 学习行为域

| 模型 | 表名 | 说明 |
|---|---|---|
| `UserBindingConfig` | `user_binding_config` | 用户绑定题库配置（userId 唯一） |
| `FavoriteQuestion` | `favorite_question` | 收藏题目（userId + questionId 唯一） |
| `VocabularyWord` | `vocabulary_word` | 生词本（userId + term 唯一） |
| `PracticeRecord` | `practice_record` | 练习行为记录（JSON payload） |
| `PracticeProgress` | `practice_progress` | 练习进度（掌握度评分） |

#### 模考域

| 模型 | 表名 | 说明 |
|---|---|---|
| `MockPaper` | `mock_paper` | 试卷（标准卷/强化卷、建议时长、考察范围） |
| `MockPaperQuestion` | `mock_paper_question` | 试卷-题目关联（含排序） |
| `MockExamRecord` | `mock_exam_record` | 考试成绩（分数、薄弱点） |

#### 用户看板域

| 模型 | 表名 | 说明 |
|---|---|---|
| `DailyActivity` | `daily_activity` | 每日学习活动计数（userId + date 唯一） |
| `UserPreference` | `user_preference` | 用户偏好（自动播放、语言、主题，userId 唯一） |
| `MembershipPlan` | `membership_plan` | 会员计划（名称、价格、周期、权益列表） |

#### 文件资产域

| 模型 | 表名 | 说明 |
|---|---|---|
| `FileAsset` | `file_asset` | 文件资产（SHA256 去重、COS 信息、引用计数） |
| `FileReference` | `file_reference` | 文件业务引用关联 |
| `QuestionAudio` | `question_audio` | TTS 题目音频缓存 |

#### 枚举类型

| 枚举 | 值 | 说明 |
|---|---|---|
| `FileAssetGroup` | `avatar`, `library`, `tts` | 文件分组 |
| `FileAssetStatus` | `active`, `deleted` | 文件状态 |
| `TtsProvider` | `minimax`, `cartesia` | TTS 提供商 |

### 6.4 关键设计模式

**TTS 缓存去重**

`QuestionAudio` 使用 `configHash` 实现同一题目的多配置缓存：

```
configHash = SHA1(provider + model + voiceId + serializedParams)
```

同一题目使用相同配置时，直接复用已有音频，避免重复生成。

**文件 SHA256 去重**

`FileAsset` 以 `sha256` 为唯一键，相同内容只存一份，通过 `refCount` 引用计数管理生命周期。定时任务自动清理 `refCount=0` 且超期的文件。

**级联删除**

所有用户相关的关联表均设置 `onDelete: Cascade`，删除用户时自动清理所有关联数据。

**复合唯一约束**

- `FavoriteQuestion`: `[userId, questionId]` — 防止重复收藏
- `VocabularyWord`: `[userId, term]` — 防止重复生词
- `PracticeProgress`: `[userId, questionId]` — 每用户每题目一条进度
- `DailyActivity`: `[userId, date]` — 每日一条活动记录
- `QuestionAudio`: `[questionId, configHash]` — 每个配置一条缓存

---

## 7. 认证系统

### 7.1 认证框架：Better Auth

项目使用 **Better Auth** 作为认证框架，提供开箱即用的会话管理。

**配置要点**：

```typescript
// apps/backend/src/modules/auth/auth.ts
import { betterAuth } from 'better-auth';

const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    wechat: {
      clientId: process.env.WECHAT_CLIENT_ID,
      clientSecret: process.env.WECHAT_CLIENT_SECRET,
    },
  },
  // OTP 支持手机号验证
  // Bearer Token 插件：Authorization: Bearer <token>
});
```

### 7.2 认证路由集成

Better Auth 通过 `toNodeHandler` 挂载到 NestJS 的底层 Express 实例：

```typescript
// main.ts 中的关键集成
const expressApp = app.getHttpAdapter().getInstance();

// Better Auth 需要手动设置 CORS（因为 cookie 跨域）
expressApp.use('/api/auth', (req, res, next) => {
  // 手动处理 CORS 头
});

// 挂载 Better Auth 所有路由
expressApp.all('/api/auth/*', toNodeHandler(auth));
```

### 7.3 支持认证方式

| 方式 | 说明 |
|---|---|
| 邮箱密码 | email + password 注册/登录 |
| 微信 OAuth | 社交登录 |
| 邮箱 OTP | 邮箱验证码登录 |
| 手机 OTP | 短信验证码登录 |
| Bearer Token | API 调用认证（前端自动携带） |

### 7.4 业务 API 认证

业务模块通过 `requireAuthSession()` 工具函数验证并提取用户身份：

```typescript
// 典型用法
const session = await requireAuthSession(request);
const userId = session.user.id;
// 后续数据库操作以 userId 为 owner
```

### 7.5 前端认证集成

前端使用 `better-auth/client` SDK + Bearer Token 插件：

- Token 存储在 `localStorage` 的 `echoon2-bearer-token` 键
- Axios 请求拦截器自动添加 `Authorization: Bearer <token>` 头
- 收到 401 响应时自动清除 Token 并跳转登录页
- `AuthRouteGuard` 组件包裹路由，未认证用户重定向到 `#/auth/login`

### 7.6 跨域配置

认证路由需要特殊 CORS 处理（Cookie 传递）：

- 开发环境：`http://localhost:5173`
- 生产环境：`https://hope.lourd.top:2605`
- 移动端：`capacitor://localhost`, `ionic://localhost`

---

## 8. API 设计

### 8.1 基础规范

- **前缀**：`/api/v1/guide-exam`（业务 API）
- **认证路由**：`/api/auth/*`（Better Auth 原生路由）
- **请求方式**：RESTful (GET/POST/PATCH/DELETE)
- **请求体**：JSON
- **认证**：`Authorization: Bearer <token>`（业务 API）

### 8.2 统一响应格式

```typescript
// 成功响应
{
  "code": 200,
  "message": "Success",
  "data": { /* 业务数据 */ }
}

// 错误响应
{
  "code": 400,
  "message": "Validation failed",
  "data": null
}
```

`TransformInterceptor` 自动将控制器返回值封装为该格式（已封装的跳过）。

### 8.3 接口清单

#### 认证相关 (`/api/auth/*` + `/api/v1/guide-exam/auth`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| ALL | `/api/auth/*` | — | Better Auth 所有路由 |
| GET | `/api/v1/guide-exam/auth/ok` | — | 健康检查 |
| GET | `/api/v1/guide-exam/auth/session` | 是 | 获取当前会话 |

#### 引导配置 (`/config`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/config/options` | — | 获取省份/语种/考试类型等配置选项 |
| POST | `/config/bind` | 是 | 绑定当前用户的题库配置 |
| GET | `/config/current` | 是 | 获取当前绑定配置 |
| GET | `/bootstrap` | 是 | 启动注入（配置状态 + 题库摘要） |

#### 题库首页 (`/question-bank`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/question-bank/home?mode=&keyword=` | 是 | 题库首页（Hero 数据 + 分类卡片） |

#### 练习 (`/practice`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/practice/topic/:topicId/questions` | 是 | 获取专题下题目列表 |
| GET | `/practice/question/:questionId` | 是 | 获取题目详情（含中英内容） |
| POST | `/practice/action` | 是 | 记录用户行为（播放/显隐答案等） |
| GET | `/dictionary/lookup?term=` | 是 | 词典查词 |

#### 模拟考试 (`/mock`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/mock/papers` | 是 | 获取可用试卷列表 |
| GET | `/mock/recent-scores` | 是 | 获取近期成绩 |
| GET | `/mock/scores?limit=` | 是 | 获取历史成绩列表 |
| GET | `/mock/dashboard` | 是 | 模考看板数据 |
| POST | `/mock/start` | 是 | 开始考试（返回试卷内容） |
| POST | `/mock/submit` | 是 | 提交考试（记录分数 + 薄弱点） |

#### 个人中心 (`/profile` + `/user`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/profile/overview` | 是 | 个人概览（统计汇总） |
| GET | `/profile/activity-heatmap` | 是 | 活动热力图数据 |
| GET | `/profile/practice-records` | 是 | 练习记录列表 |
| GET | `/user/profile` | 是 | 获取个人信息 |
| PATCH | `/user/profile` | 是 | 更新个人信息 |

#### 会员 (`/membership`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/membership/plans` | — | 会员计划列表 |
| GET | `/membership/current` | 是 | 当前会员状态 |
| GET | `/membership/benefits` | — | 会员权益信息 |

#### 资产 (`/assets`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/assets/favorites` | 是 | 收藏列表 |
| POST | `/assets/favorites/:questionId` | 是 | 添加收藏 |
| DELETE | `/assets/favorites/:questionId` | 是 | 取消收藏 |
| GET | `/assets/words` | 是 | 生词列表 |
| POST | `/assets/words` | 是 | 添加生词 |
| DELETE | `/assets/words/:term` | 是 | 删除生词 |

#### TTS 语音 (`/tts`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/tts/params-schema` | — | 获取 TTS 参数 Schema |
| POST | `/tts/synthesize-question` | — | 合成题目音频 |
| POST | `/tts/synthesize-text` | — | 合成自由文本音频 |
| GET | `/tts/audio/:id` | — | 获取音频文件 |
| POST | `/tts/transcribe-recording` | — | 录音转写 |
| DELETE | `/tts/question/:questionId/cache` | — | 清除题目音频缓存 |

#### AI 练习 (`/practice-ai`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/practice-ai/feedback` | — | AI 评分反馈（流式 SSE） |
| POST | `/practice-ai/teach` | — | AI 教学指导 |
| POST | `/practice-ai/word-enrichment` | — | 单词增强 |

#### 文件资产 (`/file-assets`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/file-assets/cos-policy` | — | 获取 COS 上传临时密钥 |
| POST | `/file-assets/complete` | — | 上传完成回调（创建 FileAsset） |
| POST | `/file-assets/references` | 是 | 创建文件引用 |
| DELETE | `/file-assets/references` | 是 | 删除文件引用 |
| GET | `/file-assets/avatar/current` | 是 | 获取当前头像 |
| POST | `/file-assets/avatar/current` | 是 | 设置头像 |
| GET | `/file-assets/:id/private-url` | — | 获取私有文件临时访问 URL |
| GET | `/file-assets/:id/references` | — | 获取文件引用列表 |

#### 消息通知 (`/notifications` + `/admin/notifications`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/notifications` | 是 | 获取用户通知列表（分页） |
| GET | `/notifications/unread-count` | 是 | 未读通知数量 |
| POST | `/notifications/:id/read` | 是 | 标记已读 |
| POST | `/notifications/read-all` | 是 | 全部标记已读 |
| GET | `/admin/notifications` | Admin | 管理端通知列表 |
| POST | `/admin/notifications` | Admin | 创建通知 |
| GET | `/admin/notifications/:id` | Admin | 通知详情 |
| PATCH | `/admin/notifications/:id` | Admin | 更新通知 |
| DELETE | `/admin/notifications/:id` | Admin | 删除通知 |
| GET | `/admin/notifications/stats` | Admin | 通知统计 |
| POST | `/admin/notifications/upload-image` | Admin | 上传通知图片 |

#### 管理后台 (`/admin`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/users` | Admin | 用户列表 |
| GET | `/admin/users/:id` | Admin | 用户详情 |
| PATCH | `/admin/users/:id/role` | Admin | 更新用户角色 |
| GET | `/admin/members` | Admin | 会员列表 |
| GET | `/admin/members/:userId` | Admin | 会员详情 |
| POST | `/admin/members/:userId/cancel` | Admin | 取消会员 |
| GET | `/admin/orders` | Admin | 订单列表（可按状态筛选） |
| GET | `/admin/orders/stats` | Admin | 订单统计 |
| POST | `/admin/test-payment` | Admin | 测试支付（模拟） |

#### 支付 (`/pay`)

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/pay/orders` | 是 | 创建支付订单 |
| GET | `/pay/orders/:orderNo` | 是 | 查询订单状态 |
| POST | `/pay/callback/alipay` | — | 支付宝异步回调 |
| POST | `/pay/callback/wechat` | — | 微信支付异步回调 |

---

## 9. 核心业务模块

### 9.1 模块总览

后端采用 NestJS 模块化架构，`AppModule` 聚合所有业务模块：

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),  // 全局配置
    ScheduleModule.forRoot(),                    // 定时任务
    PrismaModule,                                // 数据库
    AuthModule,                                  // 认证 (Better Auth)
    ConfigGuideModule,                          // 题库引导配置
    QuestionBankModule,                         // 题库首页
    PracticeModule,                             // 练习 + 词典
    AssetsModule,                               // 收藏 + 生词
    MockExamModule,                             // 模拟考试
    ProfileModule,                              // 个人中心
    MembershipModule,                           // 会员
    TtsModule,                                  // TTS 语音
    PracticeAiModule,                           // AI 反馈
    FileAssetsModule,                           // 文件管理
    NotificationModule,                         // 消息通知
    AdminModule,                                // 管理后台
    PayModule,                                  // 支付系统
    ResourceLibraryModule,                      // 资源管理
  ],
})
export class AppModule {}
```

### 9.2 配置引导模块 (config-guide)

**核心功能**：首次登录用户绑定题库配置。

**业务流程**：

```
用户登录 → GET /bootstrap → configured=false
  → 前端弹出绑定 Dialog
  → 选择省份、语种、考试类型、面试形式
  → POST /config/bind → 创建 UserBindingConfig
  → 返回匹配的 QuestionBank
  → 后续请求基于绑定题库
```

**关键点**：
- `UserBindingConfig` 与 `User` 一对一关系
- 用户可随时重新绑定（更新现有记录）
- `GET /config/options` 返回所有可选配置项

### 9.3 题库模块 (question-bank)

**核心功能**：题库首页数据聚合。

**接口**：`GET /question-bank/home?mode=&keyword=`

**返回数据结构**：
```typescript
{
  hero: {
    totalTopics: number;
    totalQuestions: number;
    completedCount: number;
  };
  topics: TopicCard[];  // 按 mode 筛选 + keyword 搜索
}
```

**筛选模式**：
- `all`：全部专题
- `incomplete`：未完成专题
- `completed`：已完成专题

### 9.4 练习模块 (practice)

**核心功能**：题目口语练习 + 行为记录。

**核心接口**：
- `GET /practice/topic/:topicId/questions` — 获取专题题目序列
- `GET /practice/question/:questionId` — 获取题目详情（中英内容）
- `POST /practice/action` — 记录用户行为

**行为类型**：
```typescript
type ActionType =
  | 'view'                  // 查看题目
  | 'play'                  // 播放音频
  | 'toggle_answer'         // 显示/隐藏答案
  | 'toggle_translation'    // 显示/隐藏翻译
  | 'favorite'              // 收藏
  | 'word_add'              // 添加生词
  | 'next_question'         // 下一题
  | 'prev_question';        // 上一题
```

### 9.5 模拟考试模块 (mock-exam)

**核心功能**：标准化模拟考试。

**考试流程**：
```
GET /mock/papers → 选择试卷
  → POST /mock/start → 返回试卷内容（题目列表 + 题目详情）
  → 用户答题（前端完成）
  → POST /mock/submit → 提交分数 + 薄弱点 → 记录 MockExamRecord
```

**试卷类型**：
- `standard`：标准卷
- `intensive`：强化卷

**成绩数据**：
```typescript
{
  score: number;       // 得分
  weakness: string[];  // 薄弱点标识
  takenAt: Date;       // 考试时间
}
```

### 9.6 个人中心模块 (profile)

**核心功能**：学习数据可视化。

**子接口**：

| 接口 | 返回数据 |
|---|---|
| `/profile/overview` | 总练习次数、连续天数、收藏数、生词数、模考最佳成绩 |
| `/profile/activity-heatmap` | DailyActivity 数组（热力图数据） |
| `/profile/practice-records` | 分页练习记录（含题目信息） |

**活跃度记录机制**：

每次 `POST /practice/action` 时，自动 `upsert` 当日的 `DailyActivity` 记录，`count` 递增。

### 9.7 会员模块 (membership)

**核心功能**：会员计划展示。

**数据模型**：
```typescript
model MembershipPlan {
  id        String
  name      String      // 月度会员 / 季度会员 / 年度会员
  price     Int         // 价格（分）
  period    String      // monthly / quarterly / yearly
  features  String[]    // 权益列表
  sortOrder Int         // 排序
}
```

### 9.8 资产模块 (assets)

**核心功能**：收藏与生词本管理。

**收藏**：
- 支持添加/取消收藏题目
- `FavoriteQuestion` 复合唯一约束 `[userId, questionId]`
- 级联删除（删题时自动清理收藏）

**生词本**：
- 支持添加/删除生词
- `VocabularyWord` 复合唯一约束 `[userId, term]`
- `term` 支持关联来源题目 `sourceQuestionId`

### 9.9 通知模块 (notification)

**核心功能**：站内消息通知系统，支持用户端查看和管理端推送。

**用户端接口**：

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/notifications` | 是 | 获取通知列表（分页） |
| GET | `/notifications/unread-count` | 是 | 获取未读通知数量 |
| POST | `/notifications/:id/read` | 是 | 标记单条已读 |
| POST | `/notifications/read-all` | 是 | 全部标记已读 |

**管理端接口**（`/admin/notifications`）：

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/notifications` | Admin | 通知列表（含搜索） |
| POST | `/admin/notifications` | Admin | 创建通知 |
| GET | `/admin/notifications/:id` | Admin | 通知详情 |
| PATCH | `/admin/notifications/:id` | Admin | 更新通知 |
| DELETE | `/admin/notifications/:id` | Admin | 删除通知 |
| GET | `/admin/notifications/stats` | Admin | 通知统计 |
| POST | `/admin/notifications/upload-image` | Admin | 上传通知图片 |

### 9.10 管理模块 (admin)

**核心功能**：管理员后台，提供用户、会员、订单管理。

**接口列表**（`/admin`）：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/admin/users` | 用户列表（分页） |
| GET | `/admin/users/:id` | 用户详情 |
| PATCH | `/admin/users/:id/role` | 更新用户角色 |
| GET | `/admin/members` | 会员列表 |
| GET | `/admin/members/:userId` | 会员详情 |
| POST | `/admin/members/:userId/cancel` | 取消会员 |
| GET | `/admin/orders` | 订单列表（可按状态筛选） |
| GET | `/admin/orders/stats` | 订单统计 |
| POST | `/admin/test-payment` | 测试支付（1元模拟订单） |

**权限控制**：所有 `/admin/*` 接口通过 `requireAdmin()` 中间件校验 `user.role === 'admin'`，非管理员返回 403。

### 9.11 支付模块 (pay)

**核心功能**：会员支付订单创建、状态查询、支付回调处理。

**接口列表**（`/pay`）：

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/pay/orders` | 是 | 创建支付订单 |
| GET | `/pay/orders/:orderNo` | 是 | 查询订单状态 |
| POST | `/pay/callback/alipay` | — | 支付宝异步回调 |
| POST | `/pay/callback/wechat` | — | 微信支付异步回调 |

**支持支付方式**：
- 支付宝（当面付/扫码）
- 微信支付（JSAPI/Native）

**回调处理**：支付平台异步通知 → 验签 → 更新订单状态 → 激活会员权益。

### 9.12 资源管理模块 (resource-library)

**核心功能**：管理员上传/管理公共资源文件（文档、音频、图片等），供通知等模块引用。

**接口**（`/admin/resources`）：资源的 CRUD 操作，支持文件上传和分类管理。

---

## 10. TTS 语音合成

### 10.1 架构设计

TTS 模块采用**工厂模式 + 缓存策略**：

```
Controller (tts.controller.ts)
  → Service (tts.service.ts)
    → TtsProviderFactory.create(provider)
      → MiniMaxProvider
      → CartesiaProvider
    → 音频上传 COS → 创建 FileAsset → 创建 QuestionAudio
```

### 10.2 支持提供商

| 提供商 | 特点 | 时间戳支持 |
|---|---|---|
| MiniMax | 国内服务，延迟低 | 否 |
| Cartesia | 国际服务，支持词级时间戳 | 是 |

### 10.3 缓存策略

```
同一题目 + 相同配置 → configHash(SHA1) 匹配
  ├── 命中缓存 → 直接返回已有音频
  └── 未命中 → 调用 TTS API → 上传 COS → 写入 QuestionAudio
```

缓存可以手动清除：`DELETE /tts/question/:questionId/cache`

### 10.4 核心接口

| 接口 | 说明 |
|---|---|
| `POST /tts/synthesize-question` | 合成题目音频（输入 questionId + 配置参数） |
| `POST /tts/synthesize-text` | 合成自由文本音频 |
| `GET /tts/audio/:id` | 获取音频（从 COS 或缓存返回） |
| `POST /tts/transcribe-recording` | 用户录音转写（代理到 Whisper 服务） |
| `GET /tts/params-schema` | 获取支持的 TTS 参数 Schema |

### 10.5 音频合成流程

```
1. 接收请求（questionId + provider + model + voiceId + params）
2. 计算 configHash = SHA1(provider + model + voiceId + JSON.stringify(params))
3. 查询 QuestionAudio 表：WHERE questionId AND configHash
4. 命中缓存 → 返回 FileAsset 的临时 URL
5. 未命中缓存：
   a. TtsProviderFactory.create(provider) 创建提供商实例
   b. 调用 TTS API 获取音频二进制
   c. 计算 SHA256 检查文件是否已存在于 FileAsset 表
   d. 不存在 → 上传到腾讯云 COS
   e. 创建 FileAsset 记录（sha256 去重，refCount++）
   f. 创建 QuestionAudio 记录（关联 questionId + configHash）
   g. 返回 FileAsset 的临时 URL
```

---

## 11. AI 口语反馈

### 11.1 技术选型

| 组件 | 用途 |
|---|---|
| DeepSeek API | 大语言模型（评分与反馈） |
| @ai-sdk/openai | Vercel AI SDK OpenAI 兼容 Provider |
| ai (Vercel AI SDK) | 流式响应管理 |

### 11.2 核心接口

| 接口 | 说明 | 响应方式 |
|---|---|---|
| `POST /practice-ai/feedback` | 口语评分反馈 | SSE 流式响应 |
| `POST /practice-ai/teach` | AI 教学指导 | 流式/非流式 |
| `POST /practice-ai/word-enrichment` | 单词增强（发音/释义/例句） | 流式/非流式 |

### 11.3 AI 评分流程

```
1. 接收用户录音文本 + 参考文本
2. 构建 Prompt：
   - 发音准确度
   - 语法正确性
   - 流利度
   - 词汇使用
   - 改进建议
3. 调用 DeepSeek API（@ai-sdk/openai 兼容模式）
4. 流式返回评分结果（SSE）给前端
```

### 11.4 流式响应实现

使用 Vercel AI SDK 的 `streamText`：

```typescript
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

const result = streamText({
  model: deepseek('deepseek-chat'),
  prompt: buildFeedbackPrompt(userText, referenceText),
});

// 通过 SSE 返回给前端
return result.toDataStreamResponse();
```

---

## 12. 文件资产管理

### 12.1 设计理念

文件资产模块实现**内容去重 + 引用计数**的通用文件管理层。

### 12.2 核心概念

| 概念 | 说明 |
|---|---|
| FileAsset | 文件主记录，以 SHA256 为唯一键 |
| FileReference | 业务引用关联（bizType + bizId + userId） |
| refCount | 引用计数，归零后定时清理 |

### 12.3 文件分组

| 分组 | 枚举值 | 用途 | 存储策略 |
|---|---|---|---|
| 头像 | `avatar` | 用户头像 | COS 公开/私有 |
| 资料库 | `library` | 通用文件 | COS 存储 |
| TTS 音频 | `tts` | TTS 合成音频缓存 | COS 存储 |

### 12.4 COS 上传流程

```
1. 前端请求 POST /file-assets/cos-policy（获取临时密钥 + 上传策略）
2. 前端使用 cos-js-sdk-v5 直传文件到 COS
3. 上传完成后调用 POST /file-assets/complete（通知后端）
4. 后端计算 SHA256 → 查询是否已存在 → 创建/更新 FileAsset（refCount++）
5. 业务侧调用 POST /file-assets/references 创建引用
```

### 12.5 定时清理

通过 `@nestjs/schedule` 定时任务，扫描 `refCount=0` 且超过 `FILE_CLEANUP_DAYS` 天的文件：

```typescript
@Cron(process.env.FILE_CLEANUP_CRON || '0 30 3 * * *') // 默认每天凌晨 3:30
async cleanupExpiredFiles() {
  const files = await this.prisma.fileAsset.findMany({
    where: {
      refCount: 0,
      status: 'active',
      updatedAt: { lt: cutoffDate },
    },
  });
  // 标记为 deleted，清理 COS 文件
}
```

环境变量控制：
- `FILE_CLEANUP_CRON`：Cron 表达式（默认 `0 30 3 * * *`）
- `FILE_CLEANUP_DAYS`：保留天数（默认 7 天）
- `FILE_CLEANUP_DRY_RUN`：干运行模式（默认 false）

---

## 13. 前端架构

### 13.1 技术选型理由

| 选择 | 理由 |
|---|---|
| React 19 | 最新稳定版，Suspense/Transitions 原生支持 |
| Vite 6 | 极速 HMR，原生 ESM 构建 |
| shadcn/ui | 组件源码可控，Tailwind CSS 深度集成 |
| Zustand | 轻量状态管理，按需订阅 |
| Hash Router | 兼容静态部署 + Capacitor iOS |
| i18next | 成熟的国际化方案 |

### 13.2 Provider 链

```typescript
// App.tsx
<ThemeProvider>        // next-themes 暗色模式
  <AuthProvider>       // Better Auth 客户端
    <AuthRouteGuard>   // 认证路由守卫
      <RouterProvider>  // react-router 路由
    </AuthRouteGuard>
  </AuthProvider>
</ThemeProvider>
```

### 13.3 状态管理架构

| Store | 用途 | 持久化 |
|---|---|---|
| `config.store` | 题库绑定配置 | 内存（由 bootstrap 注入） |
| `assets.store` | 收藏/生词列表 | 内存 + localStorage |
| `preferences.store` | 用户偏好（主题/语言/练习设置） | localStorage |
| `layout.store` | 布局状态（底部导航显隐、侧边栏等） | 内存 |
| `search.store` | 搜索关键词与历史 | 内存 |

### 13.4 HTTP 请求封装

Axios 实例统一处理：

```typescript
// request.ts
const request = axios.create({
  baseURL: '/api/v1/guide-exam',
  timeout: 30000,
});

// 请求拦截器：自动注入 Bearer Token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('echoon2-bearer-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 响应拦截器：自动解包 data.data + 处理 401
request.interceptors.response.use(
  (response) => response.data.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('echoon2-bearer-token');
      window.location.hash = '#/auth/login';
    }
    return Promise.reject(error);
  },
);
```

### 13.5 路由设计

| 路由 | 页面 | 认证 | 说明 |
|---|---|---|---|
| `#/` | 题库首页 (HomePage) | 需要 | 题库浏览，模式切换，搜索 |
| `#/portal` | 门户页 (PortalPage) | 不需要 | 产品 Landing Page |
| `#/practice/:topicId` | 练习页 (PracticePage) | 需要 | 逐题口语练习 |
| `#/mock` | 模考页 (MockPage) | 需要 | 模拟考试 |
| `#/profile` | 个人中心 (ProfilePage) | 需要 | 学习档案与设置 |
| `#/account` | 账户管理 (AccountPage) | 需要 | 账户信息管理 |
| `#/member` | 会员页 (MemberPage) | 需要 | 会员套餐与权益 |
| `#/notifications` | 通知列表 (NotificationListPage) | 需要 | 站内消息列表 |
| `#/notifications/:id` | 通知详情 (NotificationDetailPage) | 需要 | 消息详情查看 |
| `#/auth/login` | 登录页 (LoginPage) | 不需要 | 邮箱/密码登录 |
| `#/auth/register` | 注册页 (RegisterPage) | 不需要 | 新用户注册 |

#### 系统文档路由（法律与隐私）

| 路由 | 页面 | 说明 |
|---|---|---|
| `#/system/terms` | SystemTermsPage | 服务条款 |
| `#/system/privacy` | SystemPrivacyPage | 隐私政策 |
| `#/system/privacy-children` | SystemChildrenPrivacyPage | 儿童信息保护 |
| `#/system/privacy-concise` | SystemPrivacyConcisePage | 隐私政策简明版 |
| `#/system/icp` | SystemIcpPage | ICP 备案信息 |
| `#/system/permissions` | SystemPermissionsPage | 权限申请说明 |
| `#/system/sdk-list` | SystemSdkListPage | 第三方 SDK 目录 |
| `#/system/collect-info` | SystemCollectInfoPage | 个人信息收集清单 |
| `#/system/contact` | SystemContactPage | 联系我们 |

#### 管理后台路由（独立 AdminLayout）

| 路由 | 页面 | 说明 |
|---|---|---|
| `#/admin/users` | AdminUsersPage | 用户管理 |
| `#/admin/members` | AdminMembersPage | 会员管理 |
| `#/admin/billing` | AdminBillingPage | 订单/账单管理 |
| `#/admin/notifications` | AdminNotificationsPage | 通知管理 |
| `#/admin/resources` | AdminResourcesPage | 资源管理 |

### 13.6 布局架构

项目支持三种布局模式：

| 布局 | 组件 | 适用场景 |
|---|---|---|
| `RootLayout` | `Header` + `Footer` + `BottomNav` | 用户端所有页面（PC 端 Header/Footer，移动端底部导航） |
| `AdminLayout` | `AdminSidebar` | 管理后台（独立侧边栏布局，Admin 角色鉴权） |
| 无布局 | 无外层包裹 | 认证页（登录/注册） |

**移动端响应式策略**：
- PC 端显示顶部 Header（题库、模考、会员导航）+ 底部 Footer
- 移动端隐藏 Header，改用底部 `BottomNav` 固定导航栏
- 法律文档等系统页面使用全屏 `Drawer` 展示（从设置页弹出）
- 内容最大宽度 1480px，居中约束

### 13.7 核心业务组件

| 组件 | 功能 |
|---|---|
| `ai-feedback-card` | AI 评分反馈卡片（分数、建议、修正） |
| `audio-player` | 通用音频播放器（播放/暂停/进度） |
| `audio-waveform` | 音频波形可视化 (wavesurfer.js) |
| `voice-recorder` | 语音录制器（录音/停止/重录） |
| `interactive-speech-block` | 交互式语音模块（题目 + 录音 + AI 反馈） |
| `markdown-content` | Markdown 渲染组件（用于法律文档、通知详情） |
| `system-document-drawer` | 全屏 Drawer（移动端法律文档查看） |
| `binding-dialog` | 题库绑定弹窗 |
| `ios-section / ios-row` | iOS 风格设置列表组件 |

### 13.8 移动端支持 (Capacitor)

```typescript
// capacitor.config.ts
{
  appId: 'lourd.echoon.app',
  appName: 'enchoon',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}
```

iOS 原生项目位于 `ios/App/`，包含完整的 Xcode 工程和 Swift 入口代码。

---

## 14. DevOps 与部署

### 14.1 容器架构

```
┌──────────────┐
│    nginx     │  :443 (2605)
│  SSL + 反代   │
└──────┬───────┘
       │ /api/
       ▼
┌──────────────┐
│   backend    │  :3001
│   NestJS 10  │
└──────┬───────┘
       │ Prisma
       ▼
┌──────────────┐
│      db      │  :5432
│ PostgreSQL 16│
└──────────────┘
```

三个服务通过 Docker Compose 编排，Nginx 对外暴露 2605 端口映射到 443。

### 14.2 后端 Dockerfile（多阶段构建）

```dockerfile
# Stage 1: Builder
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
RUN pnpm install --frozen-lockfile --filter @echoon2/backend
COPY apps/backend/ ./apps/backend/
RUN pnpm --filter @echoon2/backend exec prisma generate
RUN pnpm --filter @echoon2/backend build

# Stage 2: Runner
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod --filter @echoon2/backend
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma/schema.prisma ./apps/backend/prisma/
RUN pnpm --filter @echoon2/backend exec prisma generate
EXPOSE 3001
CMD ["pnpm", "--filter", "@echoon2/backend", "start:prod"]
```

### 14.3 前端 Dockerfile（多阶段构建）

```dockerfile
# Stage 1: Frontend Builder
FROM node:22-alpine AS frontend-builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/frontend/package.json ./apps/frontend/
RUN pnpm install --frozen-lockfile --filter @echoon2/frontend
COPY apps/frontend/ ./apps/frontend/
ARG VITE_API_BASE_URL=/api/v1/guide-exam
RUN pnpm --filter @echoon2/frontend build

# Stage 2: Nginx Runner
FROM nginx:alpine
COPY --from=frontend-builder /app/apps/frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
```

### 14.4 Nginx 配置

```nginx
server {
    listen 80;
    server_name hope.lourd.top;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name hope.lourd.top;

    ssl_certificate     /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # 前端静态资源
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;  # SPA fallback
    }

    # API 反向代理
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";  # WebSocket 支持
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 14.5 CI/CD (GitHub Actions)

**触发条件**：push 到 `main` 分支

**Runner**：self-hosted（部署在自有服务器）

**工作流程**：

```
push to main
  → Checkout 代码
  → docker compose up -d --build（构建并启动所有服务）
  → 等待 backend 容器就绪（最多 150 秒，每 5 秒检查一次）
  → prisma db push --force-reset（推送 Schema，测试环境）
  → prisma:seed（填充种子数据）
  → docker image prune -f（清理悬空镜像）
```

**环境变量**：所有敏感信息通过 GitHub Secrets 注入，包括：
- 数据库连接信息
- Better Auth 密钥
- 微信 OAuth 凭证
- 各 API 密钥（MiniMax、Cartesia、DeepSeek）
- COS 凭证
- 文件清理配置
- SSL 证书路径

---

## 15. 环境变量配置

### 15.1 完整环境变量清单

#### 基础配置

| 变量 | 说明 | 示例 |
|---|---|---|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://user:pass@host:5432/db` |
| `PORT` | 后端端口 | `3001` |
| `FRONTEND_URL` | 前端地址（CORS） | `http://localhost:5173,capacitor://localhost` |

#### Better Auth

| 变量 | 说明 |
|---|---|
| `BETTER_AUTH_URL` | Auth 服务地址 |
| `BETTER_AUTH_SECRET` | Auth 加密密钥（32 字符随机串） |
| `WECHAT_CLIENT_ID` | 微信 OAuth Client ID |
| `WECHAT_CLIENT_SECRET` | 微信 OAuth Client Secret |
| `OTP_DELIVERY_MODE` | OTP 发送模式（`dev-mock` / `real`） |

#### TTS 提供商

| 变量 | 说明 |
|---|---|
| `MINIMAX_API_KEY` | MiniMax API 密钥 |
| `MINIMAX_GROUP_ID` | MiniMax 分组 ID |
| `CARTESIA_API_KEY` | Cartesia API 密钥 |

#### Whisper

| 变量 | 说明 |
|---|---|
| `WHISPER_INFERENCE_URL` | Whisper 推理服务地址 |
| `WHISPER_LANGUAGE` | 转写语言（默认 `en`） |

#### AI 评分

| 变量 | 说明 |
|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek API 密钥 |

#### 文件清理

| 变量 | 说明 | 默认值 |
|---|---|---|
| `FILE_CLEANUP_CRON` | 清理 Cron 表达式 | `0 30 3 * * *` |
| `FILE_CLEANUP_DAYS` | 保留天数 | `7` |
| `FILE_CLEANUP_DRY_RUN` | 干运行模式 | `false` |

#### COS 对象存储

| 变量 | 说明 |
|---|---|
| `COS_BUCKET` | 存储桶名称 |
| `COS_REGION` | 存储桶区域 |
| `COS_SECRET_ID` | 腾讯云 SecretId |
| `COS_SECRET_KEY` | 腾讯云 SecretKey |
| `COS_PRIVATE_URL_EXPIRES_SECONDS` | 私有 URL 过期时间（秒） |

---

## 16. 开发指南

### 16.1 环境要求

- **Node.js** >= 22
- **pnpm** >= 9
- **PostgreSQL** >= 16
- **Docker** (可选，用于容器化部署)

### 16.2 快速开始

```bash
# 1. 克隆项目
git clone <repo-url>
cd echoon2

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example apps/backend/.env
# 编辑 .env，填写 DATABASE_URL 等必要配置

# 4. 初始化数据库
cd apps/backend
pnpm prisma:migrate    # 运行迁移
pnpm prisma:seed       # 填充种子数据
cd ../..

# 5. 启动开发服务器（前后端并行）
pnpm dev               # 后端 :3001 + 前端 :5173
```

### 16.3 开发工作流

#### 后端开发

```bash
# 单独启动后端
pnpm dev:backend

# 数据库操作
cd apps/backend
pnpm prisma:generate    # 生成 Prisma Client
pnpm prisma:migrate     # 创建迁移
pnpm prisma:push        # 直接推送 Schema（无迁移文件）
pnpm prisma:seed        # 填充种子数据
pnpm prisma:studio      # 打开 Prisma Studio 可视化

# 类型检查
pnpm typecheck
```

#### 前端开发

```bash
# 单独启动前端
pnpm dev:frontend       # 端口 5173，/api 代理到 3001

# 构建前端
cd apps/frontend
pnpm build              # 输出到 dist/

# 添加 shadcn/ui 组件
pnpm dlx shadcn-ui@latest add <component-name>
```

### 16.4 添加新业务模块

```bash
# 生成 NestJS 模块
cd apps/backend
nest g module modules/<new-module>
nest g controller modules/<new-module>
nest g service modules/<new-module>
```

### 16.5 Docker 本地开发

```bash
# 构建并启动所有服务
docker compose up -d --build

# 查看日志
docker compose logs -f backend

# 停止服务
docker compose down

# 重置数据库（开发环境）
docker compose exec backend pnpm --filter @echoon2/backend prisma:seed
```

### 16.6 常见问题

**Q：前后端联调跨域问题**

确保 `apps/backend/.env` 中 `FRONTEND_URL` 包含前端开发地址：
```env
FRONTEND_URL=http://localhost:5173
```

**Q：Prisma 迁移冲突**

```bash
cd apps/backend
pnpm prisma migrate reset    # 重置数据库（清除所有数据）
pnpm prisma:seed             # 重新填充种子
```

**Q：Docker 构建缓慢**

```bash
# 使用国内镜像源加速
NPM_REGISTRY=https://registry.npmmirror.com docker compose build
```

---

## 17. 附录

### 17.1 项目版本历史

| 版本 | 日期 | 变更 |
|---|---|---|
| 初始初始化 | 2026-04 | 完整 Prisma Schema + 迁移 + 种子数据 |

### 17.2 文档导航

| 文档 | 说明 |
|---|---|
| [导游口试训练-需求文档.md](./导游口试训练-需求文档.md) | 产品需求说明 |
| [导游口试训练-页面布局文档.md](./导游口试训练-页面布局文档.md) | 页面布局与交互设计 |
| [导游口试训练-后端与数据库实现文档.md](./导游口试训练-后端与数据库实现文档.md) | 后端 API 与数据库详细设计 |
| [echoon2-MVP前端实现方案.md](./echoon2-MVP前端实现方案（shadcn+base-ui+主题化+国际化）.md) | 前端技术方案 |
| [TTS-后端前端实现逻辑梳理.md](./TTS-后端前端实现逻辑梳理.md) | TTS 模块实现细节 |
| [待办需求.md](./待办需求.md) | 待开发功能清单（排除模考+练习） |
| [echoon-技术架构文档.md](./echoon-技术架构文档.md) | 旧版架构文档（参考） |

### 17.3 关键依赖版本锁定

```
Node.js  >= 22
pnpm     >= 9
NestJS   10.x
React    19.1.x
Prisma   6.x
PostgreSQL 16
```

### 17.4 代码规范

- TypeScript strict mode
- NestJS 模块按功能域拆分（每个模块含 controller + service + module + dto）
- 前端按功能域组织（features/ 下每域含 api.ts + pages/）
- Git 提交推荐 [Conventional Commits](https://www.conventionalcommits.org/) 格式
