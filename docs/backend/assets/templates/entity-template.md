> edms-be Entity 模板。遵循 MBP-001, ARCH-002, DB-005。

## 存量表（sys_* 等）

```java
@Data
@Schema(description = "角色")
@TableName("sys_role")
@EqualsAndHashCode(callSuper = true)
public class SysRole extends Model<SysRole> implements Serializable {

	@Serial
	private static final long serialVersionUID = 1L;

	@TableId(value = "role_id", type = IdType.ASSIGN_ID)
	@Schema(description = "角色ID")
	private Long roleId;

	@Schema(description = "角色名称")
	private String roleName;

	@TableField(fill = FieldFill.INSERT)
	private LocalDateTime createTime;

	@TableField(fill = FieldFill.INSERT_UPDATE)
	private LocalDateTime updateTime;
}
```

## 新增业务表

遵循 [../../../database/mysql-table-standard.md](../../../database/mysql-table-standard.md)：

```java
@Data
@Schema(description = "文档")
@TableName("document")
@EqualsAndHashCode(callSuper = true)
public class Document extends Model<Document> implements Serializable {

	@TableId(type = IdType.AUTO)
	private Long id;

	private String title;

	@TableField("is_deleted")
	private Integer isDeleted;

	@TableField(value = "created_at", fill = FieldFill.INSERT)
	private LocalDateTime createdAt;

	@TableField(value = "updated_at", fill = FieldFill.INSERT_UPDATE)
	private LocalDateTime updatedAt;
}
```
