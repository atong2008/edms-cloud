> 权威定义，由 edms-be-governance skill 管理。

# TXN - 事务规则

## TXN-001 写操作必须 @Transactional

**等级**: 🔴 严重

所有 insert/update/delete 必须在 Service 方法上声明 `@Transactional`。

```java
// ✅ 正确
@Transactional
public RoleVo create(RoleSaveRequest request) {
    sysRoleMapper.insert(role);
    savePermissions(role.getId(), request.getPermissions());
    return toVo(role);
}
```

只读方法可加 `@Transactional(readOnly = true)`。

## TXN-002 禁止 Controller 开启事务

**等级**: 🔴 严重

`@Transactional` 不得出现在 `@RestController` 类或方法上。

## TXN-003 禁止长事务

**等级**: 🔴 严重

`@Transactional` 方法体内禁止：HTTP 调用、文件 IO、MQ、循环中的外部操作。

同时检查: ARCH-004。

涉及 file-service、workflow-service、search-service 时必须拆分：
1. 事务内：DB 状态变更 + 发布事件
2. 事务外：文件上传、索引更新、通知发送
