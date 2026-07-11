> 权威定义，由 edms-be-governance skill 管理。

# MBP - MyBatis-Plus 规则

## MBP-001 Entity 注解规范

**等级**: 🔴 严重

- 表名用 `@TableName`
- 主键用 `@TableId`
- 禁止 JPA 注解（`@Entity`、`@Column`）

### 存量表（sys_* 等 Pig 遗留）

```java
@TableName("sys_user")
public class SysUser extends Model<SysUser> {
    @TableId(value = "user_id", type = IdType.ASSIGN_ID)
    private Long userId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
}
```

### 新增业务表

遵循 [../../database/mysql-table-standard.md](../../database/mysql-table-standard.md)：

```java
@TableName("document")
public class Document extends Model<Document> {
    @TableId(type = IdType.AUTO)
    private Long id;

    @TableField("created_at")
    private LocalDateTime createdAt;

    @TableField("updated_at")
    private LocalDateTime updatedAt;

    @TableField("is_deleted")
    private Integer isDeleted;
}
```

## MBP-002 Mapper 继承 BaseMapper

**等级**: 🔴 严重

```java
@Mapper
public interface SysUserMapper extends BaseMapper<SysUser> {
}
```

复杂 SQL 放 `resources/mapper/*.xml`。

## MBP-003 索引与迁移走 SQL 脚本

**等级**: 🔴 严重

表结构和索引在 `db/edms.sql` 与 `db/migrations/` 中维护，Nacos 配置在 `db/edms_config.sql`。

```sql
CREATE INDEX idx_sys_user_dept ON sys_user(dept_id);
```

## MBP-004 MetaObjectHandler 自动填充

**等级**: 🟡 警告

`createTime`、`updateTime` 等通过 `edms-common-data` 的 `MybatisPlusMetaObjectHandler` 自动填充，不在 Controller 手动设置。

## MBP-005 Service 继承 ServiceImpl

**等级**: 🟡 警告

```java
@Service
public class SysUserServiceImpl extends ServiceImpl<SysUserMapper, SysUser>
        implements SysUserService {
}
```

分页使用 `Page<T>` + `baseMapper` 或自定义 Mapper 方法。
