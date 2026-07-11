# 数据库规范

本目录存放 EDMS Cloud 数据库设计与 DDL 相关规范。

## 文档索引

| 文档 | 说明 |
|------|------|
| [mysql-table-standard.md](mysql-table-standard.md) | MySQL 建表规范（v1.2.0） |

## 存量与增量

| 场景 | 规范 |
|------|------|
| 现有 `sys_*` 表（Pig 遗留） | 保持现有字段（`create_time`、`del_flag` 等），不做迁移 |
| 新增业务表 | 严格遵循 [mysql-table-standard.md](mysql-table-standard.md) |
| 增量脚本 | `db/migrations/YYYYMMDD_描述.sql`，同步更新 `db/edms.sql` |
| 运行时规则 | [../backend/references/db-rules.md](../backend/references/db-rules.md) |

## Cursor 规则

编辑本目录或项目内 `.sql` 文件时，自动应用 `.cursor/rules/edms-database.mdc`。
