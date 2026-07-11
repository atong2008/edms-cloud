> 权威定义，由 edms-be-governance skill 管理。共享契约见 [../../shared/api-contract.md](../../shared/api-contract.md)。

# API - API 设计规则

## API-001 统一使用 R<T> 包装响应

**等级**: 🔴 严重

所有 REST 响应使用 `com.edmscloud.edms.common.core.util.R<T>`。

```java
// ✅ 正确 — 新代码建议写泛型
@GetMapping("/page")
public R<Page<UserVo>> getUserPage(@ParameterObject Page page, @ParameterObject UserQuery query) {
    return R.ok(userService.getUsersWithRolePage(page, query));
}

// ❌ 错误 - 裸返回
@GetMapping("/details/{id}")
public UserVo get(@PathVariable Long id) {
    return userService.selectUserVoById(id);
}
```

## API-002 分页使用 MyBatis-Plus Page<T>

**等级**: 🔴 严重

分页返回 `R<Page<T>>` 或 `R` 包装的分页对象。禁止返回裸 `List` 作为分页结果。

Controller 使用 `@ParameterObject Page page` 接收 `current`/`size` 参数。

## API-003 HTTP 状态码

**等级**: 🔴 严重

- 401：未认证
- 403：`@HasPermission` 校验失败
- 业务错误：`R.failed(msg)` 或 `GlobalExceptionHandler` 统一处理
- 禁止在成功接口返回 500

## API-004 路径格式

**等级**: 🔴 严重

- 服务内短路径：`/user`、`/role`、`/menu` 等
- 网关前缀：`/admin/**`（upms）、`/auth/**`（auth）等
- **无** `/api/**` 统一前缀，**无** `/v1` 版本段

## API-005 Swagger 注解

**等级**: 🟡 警告

Controller 类使用 `@Tag`，方法使用 `@Operation`。类级别 `@SecurityRequirement(name = HttpHeaders.AUTHORIZATION)`。

## API-006 禁止 URL 传递敏感信息

**等级**: 🟡 警告

token、password 等禁止放在 URL 查询串。

## API-007 新代码优先返回 VO/DTO

**等级**: 🟡 警告

新接口优先返回 VO/DTO 而非 Entity。存量代码渐进改进，不批量重构。
