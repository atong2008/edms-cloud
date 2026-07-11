---
name: edms-fe-governance
description: >-
  ALWAYS invoke before generating, modifying, or reviewing EDMS frontend code
  under edms-ui/apps/web-app. Enforces Vben 5.7 patterns, R<T> API contract,
  OAuth2 Bearer, PERM/AccessControl, $t i18n. Triggers on "前端规范",
  "edms-fe-review", or edms-ui/** .vue/.ts changes.
---

# EDMS 前端 Guard（Cursor Skill）

**权威规范（必须先读）**：[`docs/frontend/SKILL.md`](../../docs/frontend/SKILL.md)

## 执行步骤

1. 读取 `docs/frontend/SKILL.md` Layer 0 规则
2. API 细则以 `docs/frontend/references/api-rules.md` 为准
3. 页面结构见 `docs/frontend/page-conventions.md`
4. CRUD 模式见 `docs/frontend/component-patterns.md`
5. 联调契约见 `docs/shared/api-contract.md`、`docs/shared/auth-contract.md`

## Layer 0 摘要

- Vben 5.7 + Vue 3 + Ant Design Vue + pnpm ≥11
- 业务 API 仅用 `requestClient`；路径 `/admin/**` 或 `/auth/**`
- 分页 `toBackendPageParams` / `toFrontendPageResult`
- 权限 `PERM` + `AccessControl`；文案 `$t()`
- 禁止 `/api/**` pig 遗留路径

不得生成违反 references 的代码。Review 输出格式见 `docs/frontend/SKILL.md`。
