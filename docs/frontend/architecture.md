# 前端架构说明

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | Vue 3.5 + TypeScript |
| 构建 | Vite 8 |
| UI 库 | Ant Design Vue 4 |
| 基础框架 | Vue Vben Admin 5.7 |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 5 |
| 样式 | Tailwind CSS 4 |
| 包管理 | pnpm 11 + Turbo 2 |

## Monorepo 分层

```
apps/web-app          业务入口（页面、API、路由、业务配置）
    ↓
packages/effects      通用能力（layouts、request、access、hooks）
    ↓
packages/@core        基础 SDK + UI 组件（不含业务逻辑）
```

### 职责边界

| 层级 | 职责 | 禁止 |
|------|------|------|
| `apps/web-app` | EDMS 业务页面、API、路由、i18n | 修改框架核心逻辑 |
| `packages/effects` | 布局、请求封装、权限 | 写入 EDMS 业务代码 |
| `packages/@core` | 底层 UI 组件、工具 | 写入任何业务逻辑 |

## 应用结构

```
apps/web-app/src/
├── adapter/          # VxeTable、Form、backend 分页适配
├── api/              # API 层（见 api-conventions.md）
├── layouts/          # 布局组件
├── locales/          # 国际化
├── router/           # 路由与权限
├── store/            # 应用级 Pinia store
├── views/            # 页面组件（见 page-conventions.md）
├── app.vue
├── bootstrap.ts
├── main.ts
└── preferences.ts
```

## 开发环境

| 服务 | 端口 | 说明 |
|------|------|------|
| web-app | 5666 | 前端开发服务 |
| edms-gateway | 9999 | 后端 API 网关 |

API 代理（Phase 3 联调，写入 `apps/web-app/vite.config.ts`）：

```
/admin、/auth → http://localhost:9999
```

> Nitro Mock（5320）仅用于无后端的 UI 开发，**联调时必须走网关 9999**。

## 常用命令

```bash
cd frontend
pnpm install
pnpm dev              # 启动 web-app
pnpm build            # 构建 web-app
pnpm lint             # 代码检查
pnpm check:type       # 类型检查
```

## 规范入口

- Guard：[SKILL.md](SKILL.md)
- API 权威：[references/api-rules.md](references/api-rules.md)
- 共享契约：[../shared/api-contract.md](../shared/api-contract.md)
