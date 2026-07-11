> 权威定义，由 edms-be-governance skill 管理。
>
> **阶段说明**：EVENT / FILE / WF / SEARCH 章节为 **Phase 4+ 预留**，当前开源版不包含 workflow/search 模块；ASYNC 章节适用于当前开发。

# ASYNC - 异步规则

## ASYNC-001 @Async 必须自定义线程池

**等级**: 🔴 严重

禁止默认 `SimpleAsyncTaskExecutor`。配置 `ThreadPoolTaskExecutor`（core/max/queue）。

## ASYNC-002 异步方法必须处理异常

**等级**: 🔴 严重

配置 `AsyncUncaughtExceptionHandler`，避免异常被吞。

## ASYNC-003 异步方法需日志

**等级**: 🟡 警告

void 异步方法至少记录开始/完成/失败。

---

# EVENT - 事件驱动（Phase 4+ 预留，当前开源版不启用）

## EVENT-001 事件使用 record

**等级**: 🟡 警告

```java
public record ArchiveCreatedEvent(String archiveId, LocalDateTime createdAt) {}
```

## EVENT-002 事件原则

**等级**: 🟡 警告

- 表达已发生事实
- 不包含业务逻辑
- 不传 Entity

## EVENT-003 监听器

**等级**: 🟡 警告

```java
@TransactionalEventListener(phase = AFTER_COMMIT)
public void on(ArchiveCreatedEvent event) {
    // 事务提交后执行（如 ES 索引）
}
```

## EVENT-004 事务内仅发布，事务外执行

**等级**: 🔴 严重

档案入库 → 发布事件 → search-service 异步索引。同 ARCH-004 / TXN-003。

---

# 阶段预留（Phase 4+，当前不实现）

| 域 | 启用阶段 | 要点 |
|----|----------|------|
| FILE-* | Phase 4 file-service | MinIO 上传在事务外；类型/大小校验 |
| WF-* | Phase 4+ workflow-service | 状态机；事务内改状态，事务外通知 |
| SEARCH-* | Phase 4+ search-service | 事件驱动索引 |
