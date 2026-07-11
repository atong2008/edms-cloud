# EDMS Cloud 近期路线图设计

**日期：** 2026-07-08  
**状态：** 已确认  
**策略：** 方案 A — 规范优先  
**修订：** 2026-07-08 v3 — 对齐 Guard 治理体系（SKILL + references + assets + shared）

---

## 1. 背景与目标

### 1.1 项目定位

EDMS Cloud 是公司内部使用的文档/企业管理系统，基于 Spring Cloud 微服务架构，从 Pig 开源框架改造而来。后端微服务栈已可正常运行；前后端规范已整理为 **Guard 治理体系**（非简单 Markdown 说明）。

### 1.2 约束与前提

| 维度 | 决策 |
|------|------|
| 项目性质 | 公司内部 EDMS |
| 近期里程碑 | 2–4 周内前后端联调 + 系统管理功能可用 |
| 前端 | Vue Vben Admin 5.7 Monorepo，Phase 2 迁入 `edms-ui/` |
| 团队 | 一人全栈 |
| 推进策略 | 规范优先 — **完善 Guard 索引与共享契约**，再迁前端、联调 |

### 1.3 成功标准

- [ ] 浏览器登录成功，Token 正常刷新
- [ ] 用户、角色、菜单、字典管理功能正常
- [ ] CI 后端 + 前端 build 通过
- [ ] 规范文档索引完整、链接无断裂，可按文档启动开发环境

---

## 2. 总体路线图

```
Phase 1（第 1 周）  Guard 索引 + shared 契约 + 工程底座
    ↓
Phase 2（第 2 周）  edms-ui/ Vben Monorepo 迁入
    ↓
Phase 3（第 2–3 周）  联调（API 已规范为 /admin/**，迁移 pig 遗留路径）
    ↓
Phase 4（第 4 周起）  EDMS 业务模块
```

| 阶段 | 核心产出 |
|------|----------|
| Phase 1 | `docs/shared/`、各 README 索引、`development.md`、CI、修正文档矛盾 |
| Phase 2 | `edms-ui/` 迁入，`pnpm build` 通过 |
| Phase 3 | OAuth + 系统管理四模块联调 |
| Phase 4 | `edms-document` 等业务模块 |

---

## 3. Monorepo 目录结构

```
edms-cloud/
├── edms-*/                     # 后端 Maven 模块（不变）
├── edms-ui/                    # Phase 2：Vben Monorepo
│   └── apps/web-app/           # 业务入口
├── db/
│   ├── edms.sql
│   ├── migrations/
│   └── README.md
├── docs/
│   ├── README.md               # 文档总入口
│   ├── development.md          # 本地开发指南
│   ├── shared/                 # 前后端共享契约
│   │   ├── api-contract.md
│   │   └── auth-contract.md
│   ├── backend/                # 后端 Guard
│   │   ├── README.md
│   │   ├── SKILL.md            # L0 入口（42 条规则摘要）
│   │   ├── references/         # L1/L2 分域规则（11 文件）
│   │   └── assets/             # 模板 + Review 清单
│   ├── frontend/               # 前端 Guard
│   │   ├── README.md
│   │   ├── SKILL.md            # L0 入口
│   │   ├── references/         # L1/L2 规则（6 文件）
│   │   ├── assets/             # 模板 + Review 清单
│   │   ├── architecture.md     # 人类可读架构概览
│   │   ├── coding-standards.md
│   │   ├── page-conventions.md
│   │   ├── component-patterns.md
│   │   └── api-conventions.md  # 薄索引 → references/api-rules.md
│   ├── database/
│   │   ├── README.md
│   │   └── mysql-table-standard.md
│   ├── requirements/           # 业务需求（按业务域）
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── .cursor/skills/             # Phase 1 可选：指向 docs/*/SKILL.md
├── .github/workflows/ci.yml
└── AGENTS.md
```

---

## 4. 规范文档体系（Guard 三层模型）

### 4.1 文档分层

| 层级 | 位置 | 用途 | 读者 |
|------|------|------|------|
| **共享契约** | `docs/shared/` | 前后端对齐的 API、鉴权约定 | 联调、Review |
| **L0 入口** | `{backend,frontend}/SKILL.md` | 核心硬规则 + 按文件类型加载指引 | Cursor Agent |
| **L1/L2 细则** | `{backend,frontend}/references/` | 分域规则（带 ID、等级） | 开发、Review |
| **模板资产** | `{backend,frontend}/assets/` | 代码模板、Review 清单 | 新模块脚手架 |
| **人类速查** | `architecture.md` 等顶层文件 | 快速了解，细则以 references 为准 | 开发者 |

### 4.2 后端 Guard（`docs/backend/`）— 已完成

| 组件 | 内容 |
|------|------|
| `SKILL.md` | MSV、ARCH、TXN、API、SEC 等 Layer 0 规则 |
| `references/` | tech、msv、arch、txn、api、mbp、sec-val、db、complex、obs-log、async-event、anti-patterns |
| `assets/templates/` | controller、service、mapper、entity 模板 |

**核心约束：** 跨服务 Feign、Controller 返回 `R<T>`、`@HasPermission`、`@Transactional` 在 Service、网关路径 `/admin/**` `/auth/**`。

### 4.3 前端 Guard（`docs/frontend/`）— 已完成，部分顶层文档待同步

| 组件 | 权威 | 状态 |
|------|------|------|
| `SKILL.md` + `references/api-rules.md` | API 路径 `/admin/**` `/auth/**` | ✅ 权威 |
| `references/anti-patterns.md` | 禁止 `/api/system/**` pig 遗留 | ✅ |
| `api-conventions.md` | 仍含 `/system/user/list` 示例 | ⚠️ Phase 1 改为索引页 |
| `architecture.md` | 仍指向 mock 5320 | ⚠️ Phase 1 改为网关 9999 |

**UI 路由 vs API 路径（不冲突）：**

| 类型 | 示例 | 说明 |
|------|------|------|
| 前端路由 path | `/system/user` | Vue Router，用户看到的 URL |
| API 请求 path | `/admin/user/page` | `requestClient`，对接网关 |

### 4.4 共享契约（`docs/shared/`）— Phase 1 创建

| 文档 | 内容 |
|------|------|
| `api-contract.md` | `R<T>`（code/data/msg）、MyBatis `Page` 分页字段、路径前缀表 |
| `auth-contract.md` | OAuth2 端点、`PERM` ↔ `@HasPermission` 对照表 |

被 `backend/SKILL.md`、`frontend/SKILL.md` 及各 `references/` 引用。

### 4.5 数据库规范（`docs/database/`）

| 场景 | 规范来源 |
|------|----------|
| **新增业务表** | `mysql-table-standard.md`（`created_at`、`is_deleted` 等） |
| **存量 sys_* 表** | 保持 Pig 字段（`create_time`、`del_flag`、雪花 ID），不迁移 |
| **运行时规则** | `backend/references/db-rules.md`（索引、禁止跨库 FK） |

### 4.6 业务需求（`docs/requirements/`）

按业务域组织，**不按前后端拆分**：

```
docs/requirements/system-management/2026-07-08-系统管理改造.md
```

---

## 5. Phase 1：Guard 索引与工程底座

**Phase 1 不再**创建 `docs/backend/architecture.md` 等（已由 `SKILL.md` + `references/` 覆盖）。

### 5.1 Phase 1 任务

1. 创建 `docs/shared/api-contract.md`、`auth-contract.md`
2. 重写 `docs/backend/README.md`、`docs/frontend/README.md`、`docs/database/README.md`、`docs/README.md`
3. 修正 `frontend/api-conventions.md`、`architecture.md` 与 references 的矛盾
4. 修正 `SKILL.md` 内错误路径（`docs/governance/` → `docs/backend|frontend/`）
5. 新增 `docs/development.md`、`docs/requirements/README.md`
6. CI、`db/migrations/`、`edms-ui/README.md`、扩展 `AGENTS.md`
7. （可选）`.cursor/skills/` 入口指向 Guard SKILL

### 5.2 Phase 1 交付物

| 序号 | 文件 | 说明 |
|------|------|------|
| 1 | `docs/shared/api-contract.md` | 前后端 API 共享契约 |
| 2 | `docs/shared/auth-contract.md` | OAuth2 + 权限码对照 |
| 3 | `docs/README.md` | 文档总索引 |
| 4 | `docs/backend/README.md` | Guard 索引（SKILL → references → assets） |
| 5 | `docs/frontend/README.md` | Guard 索引 |
| 6 | `docs/database/README.md` | 存量/增量 DDL 说明 |
| 7 | `docs/frontend/api-conventions.md` | 改为薄索引 |
| 8 | `docs/frontend/architecture.md` | 更新代理为网关 9999 |
| 9 | `docs/development.md` | 本地开发指南 |
| 10 | `docs/requirements/README.md` | 需求文档说明 |
| 11 | `.github/workflows/ci.yml` | CI（pnpm） |
| 12 | `AGENTS.md` | 指向 Guard 体系 |
| 13 | `db/migrations/.gitkeep` | 增量 SQL |
| 14 | `edms-ui/README.md` | 前端占位 |

---

## 6. Phase 2：前端迁入

1. Vben Monorepo 复制到 `edms-ui/`
2. 按 `frontend/SKILL.md` + `references/` 检查结构
3. 启用 CI frontend job（`pnpm install` + `pnpm build`）

```bash
cd edms-ui && pnpm install && pnpm dev   # 端口 5666
```

---

## 7. Phase 3：前后端联调

### 7.1 API 路径（已规范，执行迁移即可）

权威来源：`docs/shared/api-contract.md`、`frontend/references/api-rules.md`。

| 用途 | 路径 |
|------|------|
| 业务 API | `/admin/{resource}/page` 等 |
| OAuth2 | `/auth/oauth2/token` |
| 网关 | `http://localhost:9999` |

Phase 3 任务：将前端代码中 pig 遗留的 `/api/system/**` 迁移为 `/admin/**`（见 `anti-patterns.md` FE-ANTI-001）。

### 7.2 Vite 代理

```typescript
// edms-ui/apps/web-app/vite.config.ts
server: {
  port: 5666,
  proxy: {
    '/auth':  { target: 'http://localhost:9999', changeOrigin: true },
    '/admin': { target: 'http://localhost:9999', changeOrigin: true },
  }
}
```

### 7.3 联调检查项

- OAuth2 客户端与 Nacos `edms-auth-dev.yml` 一致
- 分页：`records/total` ↔ `toFrontendPageResult`
- 权限：`PERM.xxx` ↔ `@HasPermission("xxx")`
- 用户/角色/菜单/字典 CRUD

---

## 8. Phase 4：业务模块

### 8.1 后端

新模块 `edms-{domain}-api/biz`，遵循 `backend/SKILL.md` + `assets/templates/`。

### 8.2 前端

遵循 `frontend/page-conventions.md` Checklist + `assets/templates/api-template.md`。

### 8.3 数据库

新表 DDL 遵循 `database/mysql-table-standard.md`，脚本放 `db/migrations/`。

### 8.4 需求文档

`docs/requirements/{domain}/YYYY-MM-DD-xxx.md`

---

## 9. 延后项

| 项 | 时机 |
|----|------|
| 存量 sys_* 表迁移至新 DDL 规范 | 不做 |
| `.cursor/rules/edms-database.mdc` | Phase 1 可选 |
| 生产部署文档 | Phase 4 后 |

---

## 10. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 顶层文档与 references 矛盾 | Phase 1 统一；references 为权威 |
| `docs/shared/` 链接断裂 | Phase 1 优先创建 |
| SKILL 路径指向 `docs/governance/` | Phase 1 修正为 `docs/backend/` |
| 按旧 api-conventions 写代码 | 改为索引页，指向 references |

---

## 11. 决策记录

| 日期 | 决策 | 理由 |
|------|------|------|
| 2026-07-08 | 方案 A 规范优先 | 长期可维护 |
| 2026-07-08 | Guard 三层：SKILL + references + assets | 团队已整理 |
| 2026-07-08 v3 | references 为权威，顶层文档为人类速查 | 消除双源矛盾 |
| 2026-07-08 v3 | 新增 docs/shared/ 共享契约 | SKILL 已引用但未创建 |
| 2026-07-08 v3 | 取消 backend/architecture.md 等单文件 | 与 references 重复 |
| 2026-07-08 v3 | API 路径统一 /admin/**，Phase 3 做 pig 路径迁移 | references 已明确 |
