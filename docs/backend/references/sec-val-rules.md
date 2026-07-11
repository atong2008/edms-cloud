> 权威定义，由 edms-be-governance skill 管理。认证见 [../../shared/auth-contract.md](../../shared/auth-contract.md)。

# SEC - 安全规则

## SEC-001 禁止日志输出敏感信息

**等级**: 🔴 严重

禁止原样输出：`password`、`token`、`secret`、`apiKey`、`credential`。

```java
log.info("Login user={}", username);           // ✅
log.info("Login password=" + password);        // ❌
```

## SEC-002 API 入参 @Valid

**等级**: 🔴 严重

见 VAL-001。

## SEC-003 DTO 不暴露敏感字段

**等级**: 🔴 严重

对外 VO/DTO 禁止包含 `password`、内部密钥。Entity 中 password 字段用 `@JsonIgnore`。

## SEC-004 配置禁止硬编码

**等级**: 🔴 严重

URL、密钥、DB 密码使用 Nacos 配置或环境变量，不入 Git。

## SEC-005 文件上传校验

**等级**: 🟡 警告

文件上传必须校验类型白名单和大小上限。

---

# AUTH - 认证规则

## AUTH-001 OAuth2 Token 机制

**等级**: 🔴 严重

见 [shared/auth-contract.md](../../shared/auth-contract.md)：Spring Authorization Server + Bearer Token。

## AUTH-002 密码 BCrypt

**等级**: 🔴 严重

- 存储：`BCryptPasswordEncoder`
- API 响应：**永不**返回 password 字段

## AUTH-003 受保护接口鉴权

**等级**: 🔴 严重

管理接口使用 `@HasPermission("sys_xxx")`。内部 Feign 接口使用 `@Inner`。

## AUTH-004 操作审计

**等级**: 🟡 警告

写操作使用 `@SysLog("操作描述")` 记录审计日志。

---

# VAL - 校验规则

## VAL-001 Controller 入参 @Valid / @Validated

**等级**: 🔴 严重

```java
@PostMapping
@HasPermission("sys_user_add")
public R user(@Valid @RequestBody UserDTO userDto) {
    return R.ok(userService.saveUser(userDto));
}
```

Request DTO 使用 Bean Validation（`@NotBlank`、`@Size` 等）。

## VAL-002 业务校验在 Service

**等级**: 🟡 警告

格式/非空校验在 DTO；唯一性、状态机在 Service（抛 `CheckedException` 或返回 `R.failed()`）。

## VAL-003 自定义校验器

**等级**: 🔵 建议

可复用校验逻辑实现 `ConstraintValidator`。
