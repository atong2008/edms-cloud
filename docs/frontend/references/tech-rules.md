> 权威定义，由 edms-fe-governance skill 管理。共享契约见 [../../shared/api-contract.md](../../shared/api-contract.md)。

# TECH - 前端平台基线

## FE-TECH-001 Vben Admin 基线

**等级**: 🔴 严重（项目级）

EDMS 前端基于 **Vben Admin 5.7.0**，业务应用位于 monorepo 的 `edms-ui/` 目录。

| 项 | 值 |
|----|-----|
| 框架版本 | Vben 5.7.0 |
| 应用目录 | `edms-ui/apps/web-app/` |
| npm 包名 | `@edms/web-app` |
| UI 库 | Ant Design Vue |
| 构建工具 | Vite + Turbo |

**禁止**：在 `apps/web-app` 中引入与 Vben 冲突的 UI 框架（Element Plus、Naive UI 等）作为主 UI 层。

## FE-TECH-002 包管理与 Node 版本

**等级**: 🔴 严重（项目级）

| 项 | 要求 |
|----|------|
| 包管理器 | pnpm ≥ 11（`packageManager: pnpm@11.2.2`） |
| Node | `^22.18.0 \|\| ^24.0.0` |
| 安装 | `cd edms-ui && pnpm install` |
| 本地开发 | `pnpm dev:edms`（等价于 `pnpm -F @edms/web-app run dev`） |
| 静态检查 | `pnpm lint`（全量 Vben monorepo）；EDMS 业务应用用 `pnpm check:edms`（CI 门禁） |
| 类型检查 | `pnpm check:type` |

**禁止**：使用 npm/yarn 安装依赖（`preinstall` 已通过 `only-allow pnpm` 拦截）。

## FE-TECH-003 路径别名

**等级**: 🔴 严重

业务代码统一使用 `#/*` 别名，映射至 `apps/web-app/src/*`（见 `apps/web-app/package.json` 的 `imports` 字段）。

```typescript
// ✅ 正确
import { requestClient } from '#/api/request';
import { PERM } from '#/constants/permissions';
import { $t } from '#/locales';

// ❌ 错误 - 相对路径穿越过深
import { requestClient } from '../../../api/request';
```

## FE-TECH-004 目录约定

**等级**: 🟡 警告

`apps/web-app/src/` 下按职责划分：

| 目录 | 用途 |
|------|------|
| `api/` | HTTP 封装与按模块划分的 API 函数（`system/`、`core/`） |
| `views/` | 页面级 Vue 组件（按业务域分子目录） |
| `components/` | 跨页面复用的公共组件 |
| `adapter/` | Vben/后端契约适配（分页、表单、表格、OAuth 等） |
| `constants/` | 常量（含 `permissions.ts` 权限码） |
| `locales/langs/` | i18n 语言包（`zh-CN/`、`en-US/`） |
| `store/` | Pinia 业务 store |
| `router/` | 路由与权限守卫 |

**规则作用域**：EDMS 自定义 Layer 0 规则（ESLint `edms/*`）仅约束 `apps/web-app/src/**`；`edms-ui/packages/`、`playground/` 沿用 Vben 默认 lint。

## FE-SCOPE-001 开源版边界

**等级**: 🔴 严重（项目级）

开源版**不包含**以下商业版 UI 能力，新功能不得引入相关页面、路由或依赖：

- 多租户切换与管理
- 工作流（BPMN）设计器与审批流
- 支付、公众号、报表、BI、移动端专属模块
- 动态网关路由管理 UI

## FE-TECH-005 Lint 与 CI

**等级**: 🟡 警告

提交前在 `edms-ui/` 目录执行：

```bash
pnpm check:edms    # EDMS 门禁：插件测试 + apps/web-app lint + typecheck（CI frontend-check）
pnpm lint          # 全量 Vben monorepo 静态检查（lefthook pre-commit 亦会执行）
pnpm check:type    # 全 monorepo typecheck
```

Vben 自带 oxlint/eslint/stylelint 负责通用代码风格；EDMS 契约规则由 `internal/eslint-plugin-edms` 补充。
