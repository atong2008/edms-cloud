> 权威定义，由 edms-be-governance skill 管理。

# ERR - 错误码与异常规则

## ERR-001 统一响应仍用 R<T>

**等级**: 🔴 严重

业务失败通过 `R.failed()` 返回，HTTP 状态码由全局异常处理器统一映射。禁止 Controller 自行构造非标准 JSON。

```java
return R.failed("角色名称已存在");
return R.failed(CommonConstants.FAIL, "参数无效");
```

## ERR-002 业务错误码枚举

**等级**: 🟡 警告

模块级业务错误使用枚举集中管理，避免魔法字符串：

```java
@Getter
@AllArgsConstructor
public enum DocumentErrorCode {
    CATEGORY_NOT_FOUND("DOC_001", "分类不存在"),
    FILE_TOO_LARGE("DOC_002", "文件超过大小限制");

    private final String code;
    private final String message;
}
```

- `code`：模块前缀 + 序号（如 `DOC_001`），便于日志检索
- 对用户可见文案可后续接 i18n；当前阶段中文 msg 即可

## ERR-003 异常分层

**等级**: 🔴 严重

| 类型 | 用途 | 处理 |
|------|------|------|
| 参数校验失败 | `@Valid` 不通过 | 400 + 统一格式 |
| 未认证 | Token 无效/过期 | 401 |
| 无权限 | `@HasPermission` 失败 | 403 |
| 业务异常 | 可预期业务规则违反 | `R.failed` 或 `CheckedException` |
| 系统异常 | 未捕获运行时错误 | 500 + 日志，不返回堆栈 |

**禁止** Controller/Service 直接抛裸 `RuntimeException` 给前端。

## ERR-004 禁止向客户端返回堆栈

**等级**: 🔴 严重

`GlobalExceptionHandler` 仅返回 `code` + `msg`（+ 必要时 `data`），完整堆栈只写服务端日志。
