# Phase 1 Guard 索引与工程底座 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在已有 Guard 治理体系（`docs/backend/`、`docs/frontend/` 的 SKILL + references + assets）基础上，创建共享契约、完善索引、消除文档矛盾，建立开发指南和 CI。

**Architecture:** 规范权威来源为 `{backend,frontend}/SKILL.md` + `references/`。**不再**创建 `backend/architecture.md` 等重复文件。Phase 1 创建 `docs/shared/`，重写各 README，修正顶层文档与 references 的矛盾。

**Tech Stack:** JDK 17、Maven 3.9+、Spring Boot 4.0.x、pnpm 11、GitHub Actions

## Global Constraints

- 后端 Guard：`docs/backend/SKILL.md`，细则 `references/`，模板 `assets/templates/`
- 前端 Guard：`docs/frontend/SKILL.md`，API 权威 `references/api-rules.md`
- 共享契约：`docs/shared/api-contract.md`、`auth-contract.md`
- API 路径：`/admin/**`（业务）、`/auth/**`（OAuth2）；禁止 `/api/**` pig 遗留
- 响应：`R<T>` code=0；分页 `records/total/current/size`
- 权限：后端 `@HasPermission`，前端 `PERM` + `AccessControl`
- 新表 DDL：`docs/database/mysql-table-standard.md`；存量 `sys_*` 不迁移
- 业务需求：`docs/requirements/{domain}/`，不按前后端拆分

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `docs/shared/api-contract.md` | 创建 | 前后端 API 共享契约 |
| `docs/shared/auth-contract.md` | 创建 | OAuth2 + 权限码对照 |
| `docs/README.md` | 创建 | 文档总索引 |
| `docs/backend/README.md` | 修改 | Guard 索引 |
| `docs/frontend/README.md` | 创建 | Guard 索引 |
| `docs/database/README.md` | 修改 | DDL 存量/增量说明 |
| `docs/frontend/api-conventions.md` | 修改 | 薄索引 → references |
| `docs/frontend/architecture.md` | 修改 | 网关 9999，去掉 mock |
| `docs/backend/SKILL.md` | 修改 | 修正 shared/ 与路径引用 |
| `docs/frontend/SKILL.md` | 修改 | 修正路径引用 |
| `docs/development.md` | 创建 | 本地开发指南 |
| `docs/requirements/README.md` | 创建 | 需求文档说明 |
| `db/migrations/.gitkeep` | 创建 | 增量 SQL |
| `edms-ui/README.md` | 创建 | 前端占位 |
| `.github/workflows/ci.yml` | 创建 | CI |
| `AGENTS.md` | 修改 | Guard 索引 |
| `README.md` | 修改 | 文档链接 |
| `db/README.md` | 修改 | migrations + database 链接 |
| `.gitignore` | 修改 | edms-ui env |

**明确不创建：** `docs/backend/architecture.md`、`api-design.md`、`security.md`、`backend-conventions.md`、`frontend-conventions.md`

---

### Task 1: 脚手架目录

**Files:** `db/migrations/.gitkeep`, `edms-ui/README.md`

- [ ] **Step 1: 创建目录**

```powershell
New-Item -ItemType Directory -Force -Path "db/migrations","edms-ui"
New-Item -ItemType File -Force -Path "db/migrations/.gitkeep"
```

- [ ] **Step 2: 创建 edms-ui/README.md**

```markdown
# edms-ui

Vue Vben Admin 5.7 Monorepo，Phase 2 迁入。

## 规范

- Guard 入口：[docs/frontend/SKILL.md](../docs/frontend/SKILL.md)
- 细则：[docs/frontend/references/](../docs/frontend/references/)
- 模板：[docs/frontend/assets/templates/](../docs/frontend/assets/templates/)

## 命令（迁入后）

```bash
pnpm install
pnpm dev      # apps/web-app，端口 5666
pnpm build
```
```

- [ ] **Step 3: Commit**

```bash
git add db/migrations/.gitkeep edms-ui/README.md
git commit -m "chore: scaffold db/migrations and edms-ui placeholder"
```

---

### Task 2: 创建 docs/shared/ 共享契约

**Files:**
- Create: `docs/shared/api-contract.md`
- Create: `docs/shared/auth-contract.md`

**Interfaces:**
- Consumes: `backend/references/api-rules.md`、`frontend/references/api-rules.md`
- Produces: 被 SKILL.md 引用的共享契约

- [ ] **Step 1: 创建 api-contract.md**

Create `docs/shared/api-contract.md`:

```markdown
# API 共享契约

前后端联调与 Code Review 的统一参考。细则见：
- 后端：[../backend/references/api-rules.md](../backend/references/api-rules.md)
- 前端：[../frontend/references/api-rules.md](../frontend/references/api-rules.md)

## 响应格式 R<T>

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 0=成功，1=失败 |
| `msg` | string | 提示信息 |
| `data` | T | 业务数据 |

后端：`com.edmscloud.edms.common.core.util.R<T>`
前端：`requestClient` 拦截器 successCode=0，responseReturn='data'

## 路径前缀

| 前缀 | 服务 | 示例 |
|------|------|------|
| `/admin/**` | UPMS 等业务 | `/admin/user/page` |
| `/auth/**` | OAuth2 | `/auth/oauth2/token` |

**禁止** `/api/**` 统一前缀（pig 遗留）。

## 分页

后端 MyBatis-Plus `Page<T>`：

| 字段 | 说明 |
|------|------|
| `records` | 当前页数据 |
| `total` | 总条数 |
| `current` | 当前页码 |
| `size` | 每页条数 |

前端适配：`toBackendPageParams()` / `toFrontendPageResult()`（`#/adapter/backend`）

## REST 约定（UPMS 示例）

| 操作 | 方法 | 服务内路径 | 网关完整路径 |
|------|------|-----------|-------------|
| 分页列表 | GET | `/user/page` | `/admin/user/page` |
| 详情 | GET | `/user/details/{id}` | `/admin/user/details/{id}` |
| 新增 | POST | `/user` | `/admin/user` |
| 修改 | PUT | `/user` | `/admin/user` |
| 删除 | DELETE | `/user` | `/admin/user` |

## 前端路由 vs API 路径

| 类型 | 示例 | 说明 |
|------|------|------|
| Vue Router path | `/system/user` | 浏览器 URL，非 API |
| API path | `/admin/user/page` | requestClient 请求 |
```

- [ ] **Step 2: 创建 auth-contract.md**

Create `docs/shared/auth-contract.md`:

```markdown
# 鉴权共享契约

## OAuth2

| 项 | 值 |
|----|-----|
| Token 端点 | `POST /auth/oauth2/token` |
| 前端实现 | `apps/web-app/src/adapter/backend/auth.ts` |
| 客户端 | `baseRequestClient` + `responseReturn: 'body'` |
| 业务 API | `requestClient` + `Authorization: Bearer {token}` |

## 权限码对照

前端 `src/constants/permissions.ts` 的 `PERM` 必须与后端 `@HasPermission` 值一致。

| 功能 | PERM 常量 | @HasPermission |
|------|-----------|----------------|
| 用户查看 | `USER_VIEW` → `'sys_user_view'` | `@HasPermission("sys_user_view")` |
| 用户新增 | `USER_ADD` → `'sys_user_add'` | `@HasPermission("sys_user_add")` |
| 角色查看 | `ROLE_VIEW` → `'sys_role_view'` | `@HasPermission("sys_role_view")` |

完整权限码以后端 `sys_menu.permission` 及现有 Controller 为准。

## 前端权限组件

```vue
<AccessControl :codes="[PERM.USER_ADD]" type="code">
  <Button>{{ $t('common.create') }}</Button>
</AccessControl>
```

## 禁止

- password、refresh_token 写入日志或持久化到非安全存储
- 业务 API 层使用 `/api/admin/oauth/token` 等 pig 遗留端点
```

- [ ] **Step 3: 验证**

```powershell
Test-Path "docs/shared/api-contract.md"
Test-Path "docs/shared/auth-contract.md"
```

- [ ] **Step 4: Commit**

```bash
git add docs/shared/
git commit -m "docs(shared): add api and auth contracts for frontend-backend alignment"
```

---

### Task 3: 重写 Guard 索引 README

**Files:**
- Modify: `docs/backend/README.md`
- Create: `docs/frontend/README.md`
- Modify: `docs/database/README.md`
- Create: `docs/README.md`

- [ ] **Step 1: 重写 docs/backend/README.md**

```markdown
# 后端开发规范（Guard）

## 阅读顺序

1. [SKILL.md](SKILL.md) — Layer 0 核心规则（Agent 入口）
2. [references/](references/) — 分域细则（按文件类型加载）
3. [assets/templates/](assets/templates/) — 代码模板
4. [../shared/api-contract.md](../shared/api-contract.md) — 前后端 API 契约

## references 索引

| 文件 | 域 |
|------|-----|
| [tech-rules.md](references/tech-rules.md) | 平台基线 |
| [msv-rules.md](references/msv-rules.md) | 微服务边界 |
| [arch-rules.md](references/arch-rules.md) | 架构分层 |
| [txn-rules.md](references/txn-rules.md) | 事务 |
| [api-rules.md](references/api-rules.md) | API 设计 |
| [mbp-rules.md](references/mbp-rules.md) | MyBatis-Plus |
| [sec-val-rules.md](references/sec-val-rules.md) | 安全与校验 |
| [db-rules.md](references/db-rules.md) | 数据库运行时规则 |
| [anti-patterns.md](references/anti-patterns.md) | 反模式 |

## 数据库 DDL

新表：[../database/mysql-table-standard.md](../database/mysql-table-standard.md)
```

- [ ] **Step 2: 创建 docs/frontend/README.md**

```markdown
# 前端开发规范（Guard）

## 阅读顺序

1. [SKILL.md](SKILL.md) — Layer 0 核心规则
2. [references/](references/) — 分域细则（**API 权威：references/api-rules.md**）
3. [assets/templates/](assets/templates/) — 代码模板
4. [../shared/](../shared/) — 前后端共享契约

## 人类速查

| 文档 | 用途 |
|------|------|
| [architecture.md](architecture.md) | Monorepo 结构、技术栈 |
| [coding-standards.md](coding-standards.md) | 编码风格 |
| [page-conventions.md](page-conventions.md) | 页面目录 + Checklist |
| [component-patterns.md](component-patterns.md) | CRUD 列表页模式 |
| [api-conventions.md](api-conventions.md) | API 目录约定（索引） |

## references 索引

| 文件 | 域 |
|------|-----|
| [api-rules.md](references/api-rules.md) | HTTP 与契约 ★ |
| [view-patterns.md](references/view-patterns.md) | 视图层 |
| [component-rules.md](references/component-rules.md) | 组件 |
| [access-i18n-rules.md](references/access-i18n-rules.md) | 权限与 i18n |
| [anti-patterns.md](references/anti-patterns.md) | 反模式 |
```

- [ ] **Step 3: 更新 docs/database/README.md**（补全索引 + 存量/增量）

- [ ] **Step 4: 创建 docs/README.md**（总索引，链接 backend/frontend/database/shared/requirements/superpowers）

- [ ] **Step 5: Commit**

```bash
git add docs/README.md docs/backend/README.md docs/frontend/README.md docs/database/README.md
git commit -m "docs: rewrite Guard index READMEs for backend, frontend, database"
```

---

### Task 4: 修正文档矛盾与 SKILL 路径

**Files:**
- Modify: `docs/frontend/api-conventions.md`
- Modify: `docs/frontend/architecture.md`
- Modify: `docs/backend/SKILL.md`
- Modify: `docs/frontend/SKILL.md`

- [ ] **Step 1: api-conventions.md 改为薄索引**

在文件顶部追加（或替换 REST 路径章节）：

```markdown
> **权威 API 规则**：[references/api-rules.md](references/api-rules.md) · [../shared/api-contract.md](../shared/api-contract.md)
>
> API 请求路径必须使用 `/admin/**` 或 `/auth/**`。下文旧示例 `/system/user/list` 已废弃。

## REST 路径（当前标准）

- 系统管理 API：`/admin/{resource}/...`（如 `/admin/user/page`）
- 认证：`/auth/oauth2/token`
- 前端 Vue Router path 仍为 `/system/user`（UI 路由，非 API）
```

更新代码模板示例中的路径为 `/admin/user/page` + `toBackendPageParams`。

- [ ] **Step 2: architecture.md 更新开发环境**

替换开发环境表格：

```markdown
| 服务 | 端口 | 说明 |
|------|------|------|
| web-app | 5666 | 前端开发服务 |
| edms-gateway | 9999 | 后端 API 网关 |

API 代理（Phase 3 联调）：`/admin`、`/auth` → `http://localhost:9999`
```

删除或标注 `backend-mock 5320` 为「仅 mock 开发可选，联调不用」。

- [ ] **Step 3: 修正 backend/SKILL.md 路径**

- `docs/governance/edms-be/` → `docs/backend/`
- `../../shared/` 保持不变（Task 2 已创建）

- [ ] **Step 4: 修正 frontend/SKILL.md 路径**

- `docs/governance/edms-fe/SKILL.md（本文件）` → `docs/frontend/SKILL.md（本文件）`

- [ ] **Step 5: Commit**

```bash
git add docs/frontend/api-conventions.md docs/frontend/architecture.md docs/backend/SKILL.md docs/frontend/SKILL.md
git commit -m "docs: align top-level frontend docs and SKILL paths with references"
```

---

### Task 5: 开发指南与需求目录

**Files:** `docs/development.md`, `docs/requirements/README.md`, `db/README.md`

- [ ] **Step 1: 创建 docs/development.md**

必须包含：环境要求、后端编译/启动、数据库初始化链接、端口表、Guard 文档阅读指引、Phase 2 前端命令、Nacos 缓存清理。

- [ ] **Step 2: 创建 docs/requirements/README.md**（业务需求模板与目录约定）

- [ ] **Step 3: db/README.md 追加 migrations + database 规范链接**

- [ ] **Step 4: Commit**

```bash
git add docs/development.md docs/requirements/README.md db/README.md
git commit -m "docs: add development guide and requirements convention"
```

---

### Task 6: GitHub Actions CI

**Files:** `.github/workflows/ci.yml`

- [ ] **Step 1: 创建 CI**（backend `mvn verify -Pcloud`；frontend `if: false` + pnpm）

- [ ] **Step 2: 本地验证** `mvn verify -Pcloud -B` → BUILD SUCCESS

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions with pnpm frontend placeholder"
```

---

### Task 7: AGENTS.md、根 README、.gitignore

**Files:** `AGENTS.md`, `README.md`, `.gitignore`

- [ ] **Step 1: AGENTS.md 追加 Guard 索引**

关键引用：
- `docs/backend/SKILL.md`、`docs/frontend/SKILL.md`
- `docs/shared/`
- New Feature Checklist 指向 references 而非已废弃的 architecture.md

- [ ] **Step 2: README.md 文档表**（链接 docs/README.md）

- [ ] **Step 3: .gitignore edms-ui env 规则**

- [ ] **Step 4: Commit**

```bash
git add AGENTS.md README.md .gitignore
git commit -m "docs: extend AGENTS.md with Guard documentation index"
```

---

### Task 8: Phase 1 整体验收

- [ ] **Step 1: Guard 文件清单**

```powershell
@(
  "docs/shared/api-contract.md",
  "docs/shared/auth-contract.md",
  "docs/README.md",
  "docs/backend/SKILL.md",
  "docs/backend/references/api-rules.md",
  "docs/frontend/SKILL.md",
  "docs/frontend/references/api-rules.md",
  "docs/frontend/README.md",
  "docs/database/mysql-table-standard.md",
  "docs/development.md",
  "docs/requirements/README.md",
  "db/migrations/.gitkeep",
  "edms-ui/README.md"
) | ForEach-Object { "$_ : $(Test-Path $_)" }
```

- [ ] **Step 2: 确认废弃文件不存在**

```powershell
@("docs/backend/architecture.md","docs/backend-conventions.md","docs/frontend-conventions.md") | ForEach-Object {
  if (Test-Path $_) { "UNEXPECTED: $_ exists" } else { "OK: $_ absent" }
}
```

- [ ] **Step 3: 后端构建** `mvn verify -Pcloud -B`

- [ ] **Step 4: 链接检查** — SKILL.md 中 `shared/api-contract.md` 可访问

Phase 1 完成 → Phase 2 前端迁入。

---

## Spec Coverage Check

| Spec §5 Phase 1 | Task |
|-----------------|------|
| docs/shared/ | Task 2 |
| README 索引 | Task 3 |
| 修正 api-conventions / architecture | Task 4 |
| 修正 SKILL 路径 | Task 4 |
| development.md | Task 5 |
| requirements/ | Task 5 |
| CI | Task 6 |
| AGENTS.md | Task 7 |
| migrations + edms-ui | Task 1 |
| 不创建 backend/architecture.md 等 | 全计划 |

## Self-Review

- [x] 对齐 Guard 三层模型（SKILL + references + assets）
- [x] references 为权威，顶层文档为索引/速查
- [x] 取消与 references 重复的 Phase 1 交付物
- [x] Phase 3 API 路径改为「迁移 pig 遗留」而非「二选一」
- [x] 无 TBD
