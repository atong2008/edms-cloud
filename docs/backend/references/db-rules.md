> 权威定义，由 edms-be-governance skill 管理。DDL 见 [../../database/mysql-table-standard.md](../../database/mysql-table-standard.md)。

# DB - 数据库规则

## DB-001 必须声明索引

**等级**: 🔴 严重

常用查询条件、外键 ID、status 字段在 `db/edms.sql` 或 `db/migrations/` 中声明索引。

## DB-002 禁止跨服务数据库外键

**等级**: 🔴 严重

跨服务关联仅使用 ID 字段，禁止 DB 级 FOREIGN KEY 跨服务表。同服务内关联表（如 sys_user_role）允许。

## DB-003 分页 size 上限

**等级**: 🟡 警告

MyBatis-Plus 分页插件或 Service 层限制 `size` 上限（建议 ≤100）。

## DB-004 批量操作分批

**等级**: 🟡 警告

批量 insert/update/delete 每批 ≤100 条，禁止单事务无上限大批量写。

## DB-005 审计字段（分轨）

**等级**: 🔵 建议

| 场景 | Java 字段 | DB 列 | 填充 |
|------|-----------|-------|------|
| 存量 `sys_*` 表 | `createTime` / `updateTime` | `create_time` / `update_time` | MetaObjectHandler |
| **新增业务表** | `createdAt` / `updatedAt` | `created_at` / `updated_at` | MetaObjectHandler 或 DB DEFAULT |

`createBy` / `updatedBy`（或 `created_by` / `updated_by`）按业务需要补充。

## DB-006 新表 DDL 规范

**等级**: 🔴 严重（新表）

新增业务表**必须**遵循 [mysql-table-standard.md](../../database/mysql-table-standard.md)：

- 主键 `bigint unsigned AUTO_INCREMENT`
- 逻辑删除 `is_deleted`
- 禁止对存量表做字段迁移式「统一 renamed」

增量脚本：`db/migrations/YYYYMMDD_描述.sql`，并同步更新 `db/edms.sql`。
