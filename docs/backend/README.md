# 后端开发规范（Guard）

## 阅读顺序

1. [overview.md](overview.md) — 架构鸟瞰、新模块接入清单（**人类首选**）
2. [SKILL.md](SKILL.md) — Layer 0 核心规则（Agent 入口）
3. [references/](references/) — 分域细则（按文件类型加载）
4. [assets/templates/](assets/templates/) — 代码模板
5. [../shared/api-contract.md](../shared/api-contract.md) — 前后端 API 契约

## references 索引

| 文件 | 域 |
|------|-----|
| [tech-rules.md](references/tech-rules.md) | 平台基线 |
| [msv-rules.md](references/msv-rules.md) | 微服务边界、依赖方向 |
| [arch-rules.md](references/arch-rules.md) | 架构分层 |
| [txn-rules.md](references/txn-rules.md) | 事务 |
| [api-rules.md](references/api-rules.md) | API 设计 |
| [error-code-rules.md](references/error-code-rules.md) | 错误码与异常 |
| [feign-rules.md](references/feign-rules.md) | Feign 调用 |
| [cache-rules.md](references/cache-rules.md) | Redis 缓存 |
| [java-rules.md](references/java-rules.md) | Java 命名与编码 |
| [mbp-rules.md](references/mbp-rules.md) | MyBatis-Plus |
| [sec-val-rules.md](references/sec-val-rules.md) | 安全与校验 |
| [db-rules.md](references/db-rules.md) | 数据库运行时规则 |
| [complex-rules.md](references/complex-rules.md) | 复杂度限制 |
| [obs-log-rules.md](references/obs-log-rules.md) | 日志与 DTO |
| [async-event-rules.md](references/async-event-rules.md) | 异步与事件（部分 Phase 4+ 预留） |
| [anti-patterns.md](references/anti-patterns.md) | 反模式 |

## 数据模型分轨

| 场景 | 规范 |
|------|------|
| 存量 `sys_*` 表 | 雪花 ID + `createTime`，不迁移 |
| 新增业务表 | [mysql-table-standard.md](../database/mysql-table-standard.md) |

## 相关

- [本地开发指南](../development.md)
- [鉴权契约](../shared/auth-contract.md)
