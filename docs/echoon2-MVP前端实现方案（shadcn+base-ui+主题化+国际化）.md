# echoon2 MVP 前端实现方案（shadcn + base-ui + 主题化 + 国际化）

本文面向 `echoon2` 的 MVP 前端落地，参考：

- `lingoPath/apps/frontend/components.json`（shadcn 配置风格与别名）
- `lingoPath/apps/frontend/package.json`（依赖选型）
- `echoon2/docs/导游口试训练-页面布局文档.md`（页面信息架构与区域布局，**必须严格对齐**）
- `echoon2/docs/导游口试训练-需求文档.md`（功能需求与业务规则，**必须严格对齐**）

目标是快速搭建一套可扩展前端基线：**组件体系统一、支持主题切换、支持中英文国际化**。

---

## 1. 目标与范围

MVP 阶段建议聚焦三件事：

1. **UI 基线**：用 `shadcn` 生成组件，底层交互能力采用 `base-ui` 生态  
2. **主题化**：支持 light/dark + 品牌色变量  
3. **国际化**：支持 `zh-CN` / `en` 双语切换，文案可持续维护

非 MVP 必做（可后续迭代）：

- SSR/SEO
- 完整权限系统
- 复杂可视化国际化（数字/日期多地区深度适配）

## 1.1 布局约束（强制）

`echoon2` 的页面布局必须严格遵循 `导游口试训练-页面布局文档.md`，本方案只负责技术落地，不改变原布局定义。

硬性要求：

- 不调整全局骨架：顶部导航 / 中部最大宽度内容区 / 底部 Footer
- 不调整页面结构顺序：各页面模块从上到下的层级保持一致
- 不减少关键区块：如练习页三列信息区、模考页左右列、个人中心左右布局
- 不改变关键交互入口：题库绑定弹窗、导航流转、个人中心入口
- 可做的仅限：视觉样式升级、组件替换、交互细节优化（不改信息架构）

## 1.2 功能约束（强制）

`echoon2` 的 MVP 功能范围与交互规则必须严格遵循 `导游口试训练-需求文档.md`，不得自行删减核心能力。

硬性要求：

- 路由必须覆盖：`#/`、`#/practice/:topicId`、`#/mock`、`#/profile`、`#/member`
- 首次进入必须弹出题库绑定 Dialog（含 4 个配置项联动）
- 顶部导航与个人入口必须保持全局可达
- 练习页快捷键必须完整支持：`Space/A/T/F/←/→/Enter`
- 持久化与数据源：
  - 题库绑定：登录后 `GET /bootstrap` 写入内存 `config.store`（不再使用 `guide-exam-config` localStorage）
  - `guide-exam-favorites` / `guide-exam-words` / `guide-exam-preferences`：按需求文档的本地键（可与后端同步演进）
- 业务规则必须保持：
  - 进入练习页自动回到顶部
  - 开启自动播放后，切题自动播放
  - 同时仅允许一个语音块播放

---

## 2. 技术选型（对齐 lingoPath）

### 2.1 核心依赖

建议对齐以下组合（来自参考项目）：

- 框架：`react` + `react-dom` + `vite`
- 组件体系：`shadcn` + `@base-ui/react` + `@base-ui-components/react`
- 样式：`tailwindcss` + `class-variance-authority` + `tailwind-merge` + `clsx`
- 图标：`lucide-react`
- 路由：`react-router-dom`
- 状态：`zustand`
- 表单与校验：`react-hook-form` + `zod`
- 通知：`sonner`
- 主题：`next-themes`

### 2.2 shadcn 配置建议

参考 `components.json`，建议保留这些关键项：

- `style: base-nova`
- `tailwind.cssVariables: true`（主题变量必需）
- `tailwind.baseColor: neutral`
- 别名：
  - `@/components`
  - `@/components/ui`
  - `@/lib`
  - `@/hooks`
- 图标库：`lucide`

---

## 3. 目录结构（建议）

```txt
apps/frontend/src
  app/
    providers/
      theme-provider.tsx
      i18n-provider.tsx
    router/
      index.tsx
  components/
    ui/                  # shadcn 生成组件
    common/              # 业务公共组件
    layout/              # Header/Sidebar/PageShell
  features/
    home/
    training/
    document/
  hooks/
  lib/
    cn.ts
    request.ts
    i18n/
      index.ts
      locales/
        zh-CN.json
        en.json
  stores/
    app-preference.store.ts
  styles/
    globals.css
  main.tsx
```

---

## 4. MVP 页面与组件清单

建议第一版页面：

1. **首页**（功能入口 + 最近记录）
2. **训练页**（题目区 + 操作区 + 结果区）
3. **资料页**（文档列表 + 详情抽屉/弹窗）
4. **设置页**（语言切换 + 主题切换）

### 4.1 页面布局映射（严格按布局文档）

- **题库首页**
  - 必须包含：Hero 信息卡 -> 景点介绍模块 -> 其他题型模块（表格）
- **题目练习页**
  - 必须包含：顶部操作条 -> 居中主体（进度卡+题目大卡）-> 底部三列信息区
  - 题目大卡内必须包含：题目语音块、参考答案语音块、控制按钮区、快捷键提示区
- **模考页**
  - 必须是双列：左（选卷+成绩）/右（配置+看板）
- **个人中心**
  - 必须是左侧固定边栏 + 右侧内容切换区
- **会员权益页**
  - 必须是双列：左（套餐+对比）/右（绑定信息+服务说明）

### 4.2 功能映射（严格按需求文档）

- **全局导航与路由**
  - Hash 路由与导航入口必须一一对应需求文档
- **题库绑定**
  - 首次强制绑定、二次可编辑、配置联动筛题库、无结果提示
- **题库首页**
  - 模式切换（练习/学习）
  - 景点介绍搜索（当前仅景点分类生效）
  - 卡片收藏、开始练习、摘要/掌握度展示
  - 其他题型表格进度与跳转
- **练习页**
  - 进度、上一题/下一题、双语音块、翻译显隐、答案显隐规则
  - 收藏与生词本操作
  - 单词释义与词汇扩展
  - 快捷键全量支持
- **模考页**
  - 试卷类型、建议时长、考察重点、最近成绩、配置摘要、模考看板
- **个人中心**
  - 概览、活跃度、练习记录、收藏、生词本、设置等子模块完整可达
- **会员权益页**
  - 套餐卡、权益对比表、当前绑定信息与服务说明

优先使用的基础组件（shadcn）：

- `Button`、`Input`、`Textarea`
- `Card`、`Tabs`、`Dialog`、`Sheet`
- `DropdownMenu`、`Tooltip`、`Toast/Sonner`
- `Form`（结合 RHF + Zod）

涉及复杂浮层/菜单/组合输入时，可逐步引入 `base-ui` 组件增强可访问性与交互细节。

---

## 5. 主题化方案

### 5.1 主题能力目标

- 支持：`light` / `dark` / `system`
- 可扩展品牌主题（如 `echoon`、`echoon-pro`）
- 全局通过 CSS Variables 管理颜色语义，不在业务组件中写死颜色

### 5.2 实施建议

1. 使用 `next-themes` 建立 `ThemeProvider`
2. 在 `globals.css` 定义语义变量，例如：
   - `--background`
   - `--foreground`
   - `--primary`
   - `--muted`
   - `--border`
3. 在 Tailwind 中映射到 `hsl(var(--xxx))`
4. 组件仅使用语义 token（如 `bg-background text-foreground`）

### 5.3 推荐实践

- 品牌色只在“主题层”配置，不在组件层散落
- 暗色模式设计先保证可读性，再做风格化
- 图表/插图也要有 dark 适配（MVP 至少避免刺眼）

---

## 6. 国际化方案（i18n）

### 6.1 目标

- 首版支持 `zh-CN` + `en`
- 支持运行时切换并记忆用户偏好
- 文案按 namespace 管理，避免单文件过大

### 6.2 推荐方案

建议采用 `i18next + react-i18next`（`echoon` 里已有使用经验），结构如下：

- `lib/i18n/index.ts`：初始化 i18n
- `lib/i18n/locales/zh-CN/*.json`
- `lib/i18n/locales/en/*.json`
- 按页面拆 namespace：
  - `common`
  - `question-bank`
  - `practice`
  - `mock`
  - `profile`
  - `member`
  - `settings`

### 6.3 落地规则

- 禁止在组件里硬编码中文/英文，统一 `t('xxx')`
- key 命名语义化：`training.submit`, `settings.language.title`
- 提供缺失兜底：开发环境输出 missing key 日志
- 日期/数字格式用 `Intl.DateTimeFormat` / `Intl.NumberFormat`，避免手写

---

## 7. 状态管理与持久化

MVP 推荐 `zustand`，按需求文档拆三类状态：

1. `config.store`
   - 题库绑定配置（province/language/examType/interviewForm），由 `GET /bootstrap` 与 `POST /config/bind` 驱动；**不**再 `persist` 到 `guide-exam-config`
2. `learning-asset.store`
   - 收藏题目 ID 集合（`guide-exam-favorites`）
   - 生词 term 集合（`guide-exam-words`）
3. `app-preference.store`
   - `theme`
   - `language`
   - 练习偏好（如自动播放，对应 `guide-exam-preferences`）

持久化策略：

- 题库绑定：服务端为准，前端仅内存；收藏、生词、偏好仍可用 `localStorage`（`persist`）
- 用户登录态：Better Auth + Bearer；业务 API 需登录

---

## 8. 与后端接口协作（MVP）

建议建立统一请求层 `lib/request.ts`：

- axios 实例 + baseURL（来自 `.env`）
- 请求/响应拦截器
- 标准错误映射（toast + 页面级兜底）

接口分层：

- `features/*/api.ts`：按领域组织，不做大一统 API 文件

---

## 9. 开发阶段里程碑（2 周示例）

### 里程碑 A（第 1-3 天）

- 初始化 Vite + TS + Tailwind + shadcn
- 接入主题 Provider
- 接入 i18n Provider
- 完成页面骨架与路由

### 里程碑 B（第 4-7 天）

- 完成题库首页 / 题库绑定弹窗 / 设置页
- 完成路由切换与导航闭环
- 落地本地持久化四大键

### 里程碑 C（第 8-14 天）

- 完成练习页 / 模考页 / 个人中心 / 会员页
- 完成快捷键、自动播放、单语音并发控制
- 补齐中英文文案
- 统一主题 token 与组件样式
- 基础测试与发布检查

---

## 10. 质量门槛（MVP 最低标准）

- **UI 一致性**：统一使用 `ui/` 组件，不重复造轮子
- **主题一致性**：无硬编码颜色（例外需备注）
- **国际化一致性**：可见文案 100% 走 i18n
- **需求一致性**：功能点与业务规则逐条对照需求文档通过
- **可维护性**：页面按 feature 分层，避免巨型组件
- **可发布性**：`build` 成功、关键路径可用

---

## 11. 快速执行清单（可直接按此开始）

1. 对齐依赖（参考 `lingoPath` 的 `package.json`）
2. 初始化 `shadcn`，按参考 `components.json` 落配置
3. 建立 `ThemeProvider` + `i18nProvider`
4. 生成第一批基础组件（button/input/card/dialog/tabs/form）
5. 完成路由与 4 个 MVP 页面骨架
6. 接入请求层与最小业务流
7. 全量替换硬编码文案为 `t()` 调用
8. 逐页对照 `导游口试训练-页面布局文档.md` 做布局验收（通过后才允许进入联调）
9. 逐条对照 `导游口试训练-需求文档.md` 做功能验收（通过后才允许提测）

---

## 12. 备注：为什么这套组合适合 echoon2 MVP

- `shadcn` 提供高质量起步组件，开发速度快
- `base-ui` 让复杂交互有稳定底座，后续可扩展性好
- 主题变量 + i18n 分层让“后期改版/出海”成本显著降低
- 与现有 `echoon`/`lingoPath` 技术栈接近，团队迁移学习成本低
