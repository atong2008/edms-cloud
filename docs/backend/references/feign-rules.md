> 权威定义，由 edms-be-governance skill 管理。边界见 [msv-rules.md](msv-rules.md)。

# FEIGN - 服务间调用规则

## FEIGN-001 接口定义在 *-api 模块

**等级**: 🔴 严重

```java
@FeignClient(contextId = "remoteUserService", value = ServiceNameConstants.UPMS_SERVICE)
public interface RemoteUserService {

    @GetMapping("/user/info/{username}")
    R<UserInfo> info(@PathVariable("username") String username);
}
```

- 路径为**被调服务内部短路径**（非网关 `/admin` 前缀）
- 返回类型使用 DTO/VO，禁止 Entity
- 内部接口在被调方 Controller 标注 `@Inner`

## FEIGN-002 超时配置

**等级**: 🟡 警告

在 Nacos 或 `application.yml` 配置合理超时，避免默认值过长：

```yaml
spring:
  cloud:
    openfeign:
      client:
        config:
          default:
            connectTimeout: 3000
            readTimeout: 10000
```

## FEIGN-003 重试策略

**等级**: 🟡 警告

- **读操作**（GET）：可配置有限重试（≤2 次）
- **写操作**（POST/PUT/DELETE）：**默认不重试**，避免重复提交
- 禁止无界重试

## FEIGN-004 降级与熔断

**等级**: 🔵 建议

非核心路径可配置 fallback 返回 `R.failed("服务暂不可用")`。核心路径（如鉴权、用户摘要）应快速失败并记录日志。

## FEIGN-005 禁止 Feign 循环依赖

**等级**: 🔴 严重

服务 A → B → A 的 Feign 调用链禁止出现。必要时引入第三个服务或事件驱动解耦。
