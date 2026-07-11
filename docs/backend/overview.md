# 后端架构概览

面向开发者的后端标准总览。细则与 Guard 规则见 [SKILL.md](SKILL.md) 与 [references/](references/)。

## 技术栈

| 组件 | 版本 |
|------|------|
| Java | 17 |
| Spring Boot | 4.0.x |
| Spring Cloud | 2025.1.x |
| Spring Cloud Alibaba | 2025.1.0.0 |
| MyBatis-Plus | 3.5.x |
| Spring Authorization Server | 7.x |
| MySQL | 8.x |

## 模块拓扑

```
                    edms-gateway [9999]
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   edms-auth [3000]  edms-upms [4000]  edms-visual/*
         │                 │                 │
         └──────── edms-common-* ────────────┘
                           │
                      edms-register (Nacos)
```

| 服务 | 职责 | 网关前缀 |
|------|------|----------|
| edms-gateway | 路由、超时 | — |
| edms-auth | OAuth2、Token | `/auth/**` |
| edms-upms | 用户/角色/菜单/部门/字典 | `/admin/**` |
| edms-codegen | 代码生成 | `/gen/**` |
| edms-quartz | 定时任务 | `/job/**` |
| edms-monitor | 监控 | `/monitor/**` |

## 标准模块结构

新业务模块命名：`edms-{domain}-api` + `edms-{domain}-biz`。

```
edms-{domain}/
├── edms-{domain}-api/
│   └── src/main/java/com/edmscloud/edms/{domain}/
│       ├── entity/          # 仅本模块 ORM 实体（不跨服务传递）
│       ├── dto/             # 入参 / Feign 传输对象
│       ├── vo/              # 出参视图对象
│       ├── feign/           # Feign Client（供其他服务调用）
│       └── constant/        # 模块常量
└── edms-{domain}-biz/
    └── src/main/java/com/edmscloud/edms/{domain}/
        ├── controller/      # HTTP 适配，返回 R<T>
        ├── service/
        │   └── impl/        # 业务逻辑 + @Transactional
        └── mapper/          # MyBatis-Plus 数据访问
```

### 依赖方向（强制）

```
edms-{domain}-biz  →  edms-{domain}-api  →  edms-common-*
        ↓
   其他模块仅通过 Feign（定义在 *-api/feign）调用，禁止 biz → biz 直依赖
```

- **禁止** `api` 依赖 `biz`
- **禁止** `common` 依赖任何 `api` / `biz`
- **禁止** 跨服务注入其他模块的 Mapper / Service / Entity

## 分层职责

| 层 | 职责 | 禁止 |
|----|------|------|
| Controller | 参数校验、权限、调用 Service、返回 `R<T>` | 事务、直调 Mapper、业务逻辑 |
| Service | 业务逻辑、事务边界、Entity ↔ DTO/VO 转换 | 暴露 HTTP 细节 |
| Mapper | 数据访问 | 业务逻辑 |

## 数据模型：存量表 vs 新表

| 场景 | 主键 | 审计字段（Java / DB） | 规范来源 |
|------|------|----------------------|----------|
| 存量 `sys_*` 等 Pig 表 | 雪花 ID `ASSIGN_ID` | `createTime` / `create_time` | 保持现状，不迁移 |
| **新增业务表** | `AUTO` + `bigint unsigned` | `createdAt` / `created_at` | [mysql-table-standard.md](../database/mysql-table-standard.md) |

详见 [references/db-rules.md](references/db-rules.md)、[references/mbp-rules.md](references/mbp-rules.md)。

## 新模块接入清单

新增 `edms-{domain}` 时按序完成：

- [ ] **1. Maven 模块**：创建 `edms-{domain}-api`、`edms-{domain}-biz`，注册到根 `pom.xml`
- [ ] **2. 包名**：`com.edmscloud.edms.{domain}`
- [ ] **3. 依赖**：biz 依赖 api + 所需 `edms-common-*`；api 仅依赖 common-core 等轻量库
- [ ] **4. 启动类**：`edms-{domain}-biz` 下 `{Domain}Application.java`
- [ ] **5. 配置**：Nacos dataId `edms-{domain}-biz-dev.yml`；更新 `database/edms_config.sql` 或 Nacos 控制台
- [ ] **6. 网关路由**：`edms-gateway` 增加 `/admin/{path}/**` → `{domain}-biz` 路由
- [ ] **7. 数据库**：增量脚本 `database/migrations/YYYYMMDD_*.sql`，同步 `database/edms.sql`
- [ ] **8. Feign**（若需被调用）：在 `-api/feign/` 定义接口，消费方通过 Feign 调用
- [ ] **9. 权限**：Controller `@HasPermission` 与 `sys_menu.permission` 注册
- [ ] **10. 文档**：API 遵循 [shared/api-contract.md](../shared/api-contract.md)

## 规范阅读顺序

1. 本文（overview）
2. [SKILL.md](SKILL.md) — Agent / Review 硬规则
3. [references/](references/) — 分域细则
4. [assets/templates/](assets/templates/) — 代码模板
5. [shared/](../shared/) — 前后端契约
