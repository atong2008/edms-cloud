---
name: edms-fe-governance
description: >-
  ALWAYS invoke before generating, modifying, or reviewing EDMS frontend code
  under frontend/apps/web-app. Enforces Vben 5.7 patterns, R<T> API contract,
  OAuth2 Bearer, PERM/AccessControl, $t i18n. Triggers on "前端规范",
  "edms-fe-review", or frontend/** .vue/.ts changes.
---

# EDMS 前端 Guard

**权威规则**：`docs/frontend/SKILL.md`（本文件）

Cursor 入口：`.cursor/skills/edms-fe-governance/SKILL.md`（已配置）；编辑 `frontend/**` 时由 `.cursor/rules/edms-frontend.mdc` 自动注入。

## Layer 0 核心（必须遵守）

| ID | 要点 |
|----|------|
| FE-TECH-001 | Vben 5.7 + Vue 3 + Ant Design Vue + pnpm ≥11 |
| FE-SCOPE-001 | 不引入多租户、工作流、支付等商业版 UI |
| FE-API-001 | 业务 API 仅用 `requestClient` |
| FE-API-002 | 路径 `/admin/**` 或 `/auth/**` |
| FE-API-003 | 响应 `code/data/msg`，成功码 `0` |
| FE-API-004 | 分页 `toBackendPageParams` / `toFrontendPageResult` |
| FE-AUTH-001 | `PERM` + `AccessControl` |
| FE-AUTH-002 | password/token 不出 UI 持久化/日志 |
| FE-I18N-001 | 用户可见文案 `$t()` |
| FE-SEC-001 | 日志禁止 token/password |

共享契约：[../shared/api-contract.md](../shared/api-contract.md) · [../shared/auth-contract.md](../shared/auth-contract.md)

## Layer 1 按文件类型

| 类型 | references |
|------|------------|
| `api/**/*.ts` | api-rules.md |
| `views/**/*.vue` | view-patterns.md, access-i18n-rules.md |
| `components/**/*.vue` | component-rules.md |

## Layer 2 全量

`/edms-fe-review` 加载全部 references/ + anti-patterns.md + assets/

## Guard 输出格式

```
❌ 违反规则: FE-API-002
问题: API 路径使用 /api/system/user
位置: frontend/apps/web-app/src/api/system/user.ts:12
建议: 改为 /admin/user/page
```

不得生成违规代码。
