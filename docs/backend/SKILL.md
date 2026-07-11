---
name: edms-be-governance
description: >-
  ALWAYS invoke before generating, modifying, or reviewing EDMS backend Java code.
  Enforces microservice boundaries, MyBatis-Plus conventions, transaction discipline,
  API contract (R<T>), OAuth2 security rules. Triggers on backend Java development,
  "后端规范", "edms-be-guard", or .java files under edms-auth/edms-upms/edms-common/edms-visual.
metadata:
  pattern: reviewer
  domain: edms-java-microservices
  rule-count: "42"
---

# EDMS 后端工程 Guard

## 概述

强制执行 EDMS 微服务后端架构边界、事务纪律、MyBatis-Plus 规范、API 契约及安全规则。

**平台基线（强制）**：Spring Boot **4.0.x** + Java **17** + MyBatis-Plus 3.5.x + Spring Cloud 2025.1。共享契约见 [../shared/](../shared/)。

**核心理念**：
> 服务边界即契约，DTO 优先于 Entity，ID 语义优先于对象引用，事务边界必须可解释。

## 整体分层模型

```
edms-{module}-api/     entity、dto、vo、feign、constant
  包名: com.edmscloud.edms.{domain}
edms-{module}-biz/
  包名: com.edmscloud.edms.{domain}
  controller/          → HTTP 适配（返回 R<T>，@Valid 入参）
  service/impl/        → 业务逻辑 + 事务边界
  mapper/              → MyBatis-Plus 数据访问
```

人类可读架构见 [overview.md](overview.md)。

### edms-common-*（共享基础设施）

- `edms-common-core`：R、异常、常量、工具类
- `edms-common-security`：OAuth2、@HasPermission、@Inner
- `edms-common-data`：MyBatis-Plus 配置、MetaObjectHandler、Redis
- `edms-common-feign`：Feign 扩展、@NoToken

**严禁**：在 common 模块中放置领域 Entity（如 SysUser、SysRole）

---

## Layer 0 核心规则 (Always Inject)

| ID | 规则 | 要点 |
|----|------|------|
| TECH-001 | 平台基线 | Boot 4.0 + Java 17 + MyBatis-Plus |
| EDMS-SCOPE-001 | 开源版边界 | 不引入商业版模块 |
| MSV-001 | 跨服务 Feign | 跨服务仅通过 {module}-api/feign |
| MSV-003 | common 不泄漏领域 | edms-common-* 禁止领域模型 |
| MSV-007 | 依赖方向 | biz → api → common，禁止 api → biz |
| ARCH-003 | 禁止 Controller 直调 Mapper | Controller 仅注入 Service |
| ARCH-005 | 新接口返回 VO/DTO | Controller 包装 R<T> |
| TXN-001 | 写操作 @Transactional | Service 层声明事务 |
| TXN-002 | 禁止 Controller 开事务 | 事务边界在 Service |
| ARCH-004 | 禁止事务内外部调用 | 事务内禁 HTTP/文件/MQ |
| API-001 | 统一 R<T> | 见 shared/api-contract.md |
| VAL-001 | 入参 @Valid | Controller 请求体必须校验 |
| AUTH-002 | 密码不出 API | password 永不返回 |
| SEC-001 | 日志脱敏 | 禁止输出 token/password |

## Layer 1 文件类型匹配

| 文件类型 | 加载 references/ |
|----------|------------------|
| Entity | arch-rules.md, mbp-rules.md, db-rules.md |
| Service | txn-rules.md, complex-rules.md |
| Controller | api-rules.md, sec-val-rules.md |
| Mapper | mbp-rules.md, db-rules.md |
| Feign | msv-rules.md, feign-rules.md |

## Layer 2 全量加载

执行 `/edms-be-review` 时加载全部 references/ 和 assets/。

---

## 规则索引

| 分类 | 文件 | 🔴 严重 | 🟡 警告 | 🔵 建议 |
|------|------|---------|---------|---------|
| TECH | references/tech-rules.md | 2 | — | — |
| MSV 微服务 | references/msv-rules.md | 5 | 2 | — |
| ARCH 架构 | references/arch-rules.md | 5 | — | — |
| TXN 事务 | references/txn-rules.md | 3 | — | — |
| API | references/api-rules.md | 4 | 3 | — |
| ERR 错误码 | references/error-code-rules.md | 2 | 1 | — |
| FEIGN | references/feign-rules.md | 2 | 2 | 1 |
| CACHE | references/cache-rules.md | 1 | 3 | 1 |
| JAVA | references/java-rules.md | — | 4 | 3 |
| MBP MyBatis | references/mbp-rules.md | 3 | 2 | — |
| SEC + VAL | references/sec-val-rules.md | 6 | 3 | 1 |
| DB | references/db-rules.md | 2 | 2 | 1 |
| COMPLEX | references/complex-rules.md | 2 | — | — |
| OBS/LOG/DTO | references/obs-log-rules.md | — | 4 | 1 |
| ASYNC/EVENT | references/async-event-rules.md | 2 | 3 | 1 |
| ANTI | references/anti-patterns.md | — | — | — |

共享契约：[../shared/api-contract.md](../shared/api-contract.md) · [../shared/auth-contract.md](../shared/auth-contract.md)

---

## 路径约定

`references/`、`assets/` 相对于本 skill 目录（`docs/backend/`）；`shared/` 位于 `docs/shared/`。

Cursor 入口：`.cursor/skills/edms-be-governance/SKILL.md`（已配置）；编辑 `edms-*/**/*.java` 时由 `.cursor/rules/edms-backend-java.mdc` 自动注入。

## 自动注入 Context

```
📌 EDMS Backend Guard 已激活

🔴 必须遵守:
- TECH: Boot 4.0 + Java 17 + MyBatis-Plus
- MSV: 跨服务走 {module}-api/feign，禁止共享 Entity
- API: R<T> + Page<T>，网关 /admin/** /auth/**
- ARCH: 新接口返回 VO/DTO，Controller 不写 @Transactional、不注入 Mapper
- TXN: Service 写操作 @Transactional，事务内禁 HTTP/文件/MQ
- SEC: @Valid 入参，@HasPermission 鉴权，password 不出 API

详细: references/ 或 docs/backend/
```

## Guard 输出规范

```
❌ 违反规则: MSV-001
问题: 跨服务直接注入 SysUserMapper
位置: XxxService.java:23
建议: 通过 RemoteUserService Feign 接口获取用户摘要

替代方案:
1. 在 upms-api/feign 定义 RemoteUserService
2. 仅传递 userId，本地查关联表
```

不得生成违规代码。
