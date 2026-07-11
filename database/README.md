# 数据库导入

初始化两个库：

| 脚本 | 数据库 | 用途 |
|------|--------|------|
| `edms_config.sql` | `edms_config` | Nacos 配置中心 |
| `edms.sql` | `edms` | 业务数据 |

在项目根目录执行（务必带 `--default-character-set=utf8mb4`）：

```powershell
mysql -h 127.0.0.1 -P 3306 -u admin_user -p --default-character-set=utf8mb4 < db\edms_config.sql
mysql -h 127.0.0.1 -P 3306 -u admin_user -p --default-character-set=utf8mb4 < db\edms.sql
```

重新导入后，若之前已启动过 `edms-register`，需先清理 Nacos 本地配置缓存：

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\nacos\data\tenant-config-data" -ErrorAction SilentlyContinue
```

## 增量变更

- 增量脚本：`db/migrations/YYYYMMDD_描述.sql`
- 同步更新全量脚本 `edms.sql`
- 新表 DDL 遵循 [docs/database/mysql-table-standard.md](../docs/database/mysql-table-standard.md)
- 存量 `sys_*` 表保持现有结构，不做字段迁移
