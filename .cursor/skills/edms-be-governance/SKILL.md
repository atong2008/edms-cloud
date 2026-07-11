---
name: edms-be-governance
description: >-
  ALWAYS invoke before generating, modifying, or reviewing EDMS backend Java code.
  Enforces microservice boundaries, MyBatis-Plus conventions, transaction discipline,
  API contract (R<T>), OAuth2 security rules. Triggers on backend Java development,
  "后端规范", "edms-be-guard", or .java files under edms-auth/edms-upms/edms-common/edms-visual.
---

# EDMS 后端 Guard（Cursor Skill）

**权威规范（必须先读）**：[`docs/backend/SKILL.md`](../../docs/backend/SKILL.md)

## 执行步骤

1. 读取 `docs/backend/SKILL.md` Layer 0 规则
2. 按当前文件类型加载 `docs/backend/references/` 对应细则
3. 生成代码时参照 `docs/backend/assets/templates/`
4. 联调契约见 `docs/shared/api-contract.md`
5. 架构与新模块接入见 `docs/backend/overview.md`

## Layer 0 摘要

- 包名 `com.edmscloud.edms.{domain}`；依赖 biz → api → common
- 跨服务仅 Feign；common 禁止领域 Entity
- Controller：`R<T>` + `@Valid` + `@HasPermission`；禁止事务、禁止 Mapper
- Service：`@Transactional`；Entity ↔ DTO/VO 转换
- 事务内禁止 HTTP/文件/MQ/OSS
- 新表 DDL 遵循 `docs/database/mysql-table-standard.md`

不得生成违反 references 的代码。Review 输出格式见 `docs/backend/SKILL.md` Guard 输出规范。
