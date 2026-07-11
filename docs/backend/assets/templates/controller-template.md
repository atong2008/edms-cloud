> edms-be Controller 模板。遵循 ARCH-003, ARCH-005, TXN-002, API-001, VAL-001。

```java
@RestController
@AllArgsConstructor
@RequestMapping("/role")
@Tag(description = "role", name = "角色管理模块")
@SecurityRequirement(name = HttpHeaders.AUTHORIZATION)
public class SysRoleController {

	private final SysRoleService roleService;

	@GetMapping("/page")
	@HasPermission("sys_role_view")
	@Operation(summary = "分页查询角色")
	public R<Page<RoleVo>> getRolePage(
			@ParameterObject Page page,
			@ParameterObject RoleQuery query) {
		return R.ok(roleService.pageVo(page, query));
	}

	@GetMapping("/details/{id}")
	@HasPermission("sys_role_view")
	public R<RoleVo> getById(@PathVariable Long id) {
		return R.ok(roleService.getVoById(id));
	}

	@SysLog("添加角色")
	@PostMapping
	@HasPermission("sys_role_add")
	public R<Boolean> save(@Valid @RequestBody RoleSaveRequest request) {
		return R.ok(roleService.createRole(request));
	}

	@SysLog("修改角色")
	@PutMapping
	@HasPermission("sys_role_edit")
	public R<Boolean> update(@Valid @RequestBody RoleSaveRequest request) {
		return R.ok(roleService.updateRole(request));
	}

	@SysLog("删除角色")
	@DeleteMapping
	@HasPermission("sys_role_del")
	public R<Boolean> remove(@RequestBody Long[] ids) {
		return R.ok(roleService.removeRoles(CollUtil.toList(ids)));
	}
}
```

- `RoleQuery` / `RoleSaveRequest` → `dto/`
- `RoleVo` → `vo/`
- **禁止** Controller 入参/出参使用 Entity
