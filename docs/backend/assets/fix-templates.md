> edms-be 修复模板。

## MSV-001 Fix（跨服务 → Feign）

1. 在 `{module}-api/feign/` 定义 Feign 接口 + 契约 DTO
2. 移除对其他服务 Mapper/Entity 的 import
3. 注入 Feign Client，使用 `ServiceNameConstants`

## VAL-001 Fix（补 @Valid）

1. Request DTO 添加 Bean Validation 注解
2. Controller 参数加 `@Valid @RequestBody`
3. 业务规则校验保留在 Service

## ARCH-004 Fix（事务内外部调用）

1. 识别 `@Transactional` 方法中的 HTTP/文件/MQ 调用
2. 移出事务：事务外调用或 `@TransactionalEventListener(AFTER_COMMIT)`
3. 事务内仅 DB + 事件发布

## API-001 Fix（统一 R<T>）

```java
// 改为
return R.ok(data);
// 而非裸返回
```

## DB-003 Fix（pageSize 上限）

MyBatis-Plus 分页插件配置 maxLimit，或 Service 层限制 size ≤ 100。
