> 权威定义，由 edms-be-governance skill 管理。

# JAVA - Java 命名与编码约定

## JAVA-001 包与类命名

**等级**: 🟡 警告

| 类型 | 规范 | 示例 |
|------|------|------|
| 包名 | 全小写 | `com.edmscloud.edms.document` |
| Entity | 名词，与表对应 | `SysUser`, `Document` |
| DTO 入参 | `{Entity}SaveRequest` / `{Entity}Query` | `RoleSaveRequest` |
| VO 出参 | `{Entity}Vo` | `RoleVo` |
| Service 接口 | `{Entity}Service` | `SysRoleService` |
| Service 实现 | `{Entity}ServiceImpl` | `SysRoleServiceImpl` |
| Controller | `{Entity}Controller` | `SysRoleController` |
| Mapper | `{Entity}Mapper` | `SysRoleMapper` |
| Feign | `Remote{Entity}Service` | `RemoteUserService` |
| 常量类 | `{Module}Constants` | `ServiceNameConstants` |

## JAVA-002 方法命名

**等级**: 🟡 警告

| 操作 | 前缀 | 示例 |
|------|------|------|
| 查询单个 | `get` / `find` | `getVoById` |
| 分页 | `page` | `pageVo` |
| 列表 | `list` | `listByDeptId` |
| 新增 | `create` / `save` | `createRole` |
| 更新 | `update` | `updateRole` |
| 删除 | `remove` / `delete` | `removeRoles` |
| 布尔判断 | `is` / `has` / `exists` | `existsByName` |

## JAVA-003 Service 接口约定

**等级**: 🟡 警告

新业务模块**建议**定义 `XxxService` 接口 + `XxxServiceImpl` 实现，便于测试与代理。

## JAVA-004 Lombok 使用

**等级**: 🔵 建议

- Entity / DTO / VO：`@Data` 或 `@Getter` + `@Setter`
- 构造注入：`@AllArgsConstructor` + `private final` 字段
- 禁止在 Entity 上使用 `@Builder` 替代无参构造（MyBatis-Plus 需要）

## JAVA-005 对象转换

**等级**: 🔵 建议

- 简单转换：Service 内 `toVo()` / `toEntity()` 私有方法
- 字段多、跨模块复用：考虑 MapStruct（单模块内优先简单方法，避免过度抽象）
