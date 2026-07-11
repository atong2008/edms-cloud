> 权威定义，由 edms-be-governance skill 管理。

# OBS - 可观测性

## OBS-001 关键业务操作记录结构化日志

**等级**: 🟡 警告

创建、状态变更、删除应记录：操作类型、资源 ID、操作者（如有）。

## OBS-002 异常包含 TraceId

**等级**: 🟡 警告

跨服务调用时传递 requestId/traceId（gateway 透传，后续 P1+ 完善）。

---

# LOG - 日志规范

## LOG-001 使用占位符

**等级**: 🟡 警告

```java
log.info("Create role: id={}", role.getId()); // ✅
log.info("Create role: " + role.getId());     // ❌
```

---

# DTO - DTO/VO 规范

## DTO-001 设计原则

**等级**: 🟡 警告

- Request DTO 放在 `edms-{module}-api/.../dto/`
- Response VO 放在 `edms-{module}-api/.../vo/`
- 命名：`XxxSaveRequest` / `XxxQuery` / `XxxVo`
- 不含业务逻辑
- 转换在 Service 层：`toVo(Entity)` 或静态工厂 / MapStruct
- 与 Entity 字段解耦（不 1:1 暴露所有列）

---

# 异常体系

允许：
- `BusinessException`
- `UnauthorizedException`
- `ResourceNotFoundException`（如有）

禁止：
- Controller/Service 直接抛裸 `RuntimeException`
- `GlobalExceptionHandler` 向客户端返回完整堆栈

---

# 测试规范

| 项目 | 要求 |
|------|------|
| 单元测试 | 建议 Service 层核心逻辑有测试 |
| 命名 | `should_预期_when_条件` |
| 模式 | Given-When-Then |
