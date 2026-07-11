> 权威定义，由 edms-be-governance skill 管理。

# MSV - 微服务边界规则

## MSV-001 跨服务通信仅通过 Feign API

**等级**: 🔴 严重

服务间禁止直接注入其他服务的 Bean、Mapper 或 Entity。

```java
// ❌ 错误 - 跨服务直接依赖
@Service
public class SomeService {
    private final SysUserMapper sysUserMapper; // 其他服务的 Mapper
}

// ✅ 正确 - Feign API（定义在 {module}-api/feign/）
@FeignClient(contextId = "remoteUserService", value = ServiceNameConstants.UPMS_SERVICE)
public interface RemoteUserService {
    @GetMapping("/user/info/{username}")
    R<UserInfo> info(@PathVariable String username);
}
```

## MSV-002 禁止跨服务共享 Entity

**等级**: 🔴 严重

每个模块的 `api/entity/` 仅在本模块内使用。跨服务传输对象定义在 `{module}-api/dto/` 或 `{module}-api/vo/`。

Feign 调用方使用 DTO/VO，不直接传递其他模块的 Entity。

## MSV-003 edms-common 禁止领域泄漏

**等级**: 🔴 严重

`edms-common-*` 中禁止出现：

- 业务 Entity（如 SysUser、SysRole）
- 业务枚举（如 UserStateEnum 应放 upms-api）
- 业务语义 DTO

仅允许：R、异常、JWT 工具、MyBatis 配置、Redis 工具、Feign 扩展等基础设施。

## MSV-004 Gateway 只做路由

**等级**: 🔴 严重

Gateway 职责：路由转发、超时配置。**禁止**在 Gateway 做业务逻辑或权限判断。鉴权由各服务 OAuth2 Resource Server 处理。

## MSV-005 包结构约定

**等级**: 🟡 警告

```
edms-{module}/
├── edms-{module}-api/
│   └── com.edmscloud.edms.{domain}/
│       ├── entity/
│       ├── dto/
│       ├── vo/
│       ├── feign/
│       └── constant/
└── edms-{module}-biz/
    └── com.edmscloud.edms.{domain}/
        ├── controller/
        ├── service/
        │   └── impl/
        └── mapper/
```

## MSV-007 模块依赖方向

**等级**: 🔴 严重

```
edms-{domain}-biz  →  edms-{domain}-api  →  edms-common-*
```

- **禁止** `api` 依赖 `biz`
- **禁止** `common` 依赖任何业务 `api` / `biz`
- **禁止** `edms-{a}-biz` 直接依赖 `edms-{b}-biz`（跨域仅 Feign）

新模块接入步骤见 [../overview.md](../overview.md#新模块接入清单)。

## MSV-006 服务职责单一

**等级**: 🟡 警告

| 服务 | 职责 |
|------|------|
| edms-gateway | 路由、超时 |
| edms-auth | OAuth2、Token、验证码 |
| edms-upms-biz | 用户/角色/菜单/部门/字典 CRUD |
| edms-codegen | 代码生成 |
| edms-quartz | 定时任务 |
| edms-monitor | 服务监控 |

禁止在 edms-auth 中实现系统管理 CRUD，反之亦然。
