> edms-be Service 模板。遵循 TXN-001, MBP-005, ARCH-005。

```java
@Slf4j
@Service
@AllArgsConstructor
public class SysRoleServiceImpl extends ServiceImpl<SysRoleMapper, SysRole>
		implements SysRoleService {

	@Override
	@Transactional(readOnly = true)
	public Page<RoleVo> pageVo(Page page, RoleQuery query) {
		Page<SysRole> entityPage = baseMapper.selectPage(page, buildQueryWrapper(query));
		Page<RoleVo> voPage = new Page<>(entityPage.getCurrent(), entityPage.getSize(), entityPage.getTotal());
		voPage.setRecords(entityPage.getRecords().stream().map(this::toVo).toList());
		return voPage;
	}

	@Override
	@Transactional(rollbackFor = Exception.class)
	public Boolean createRole(RoleSaveRequest request) {
		// 业务校验在 Service
		SysRole role = toEntity(request);
		return this.save(role);
	}

	private RoleVo toVo(SysRole entity) {
		RoleVo vo = new RoleVo();
		vo.setRoleId(entity.getRoleId());
		vo.setRoleName(entity.getRoleName());
		return vo;
	}

	private SysRole toEntity(RoleSaveRequest request) {
		SysRole role = new SysRole();
		role.setRoleName(request.getRoleName());
		return role;
	}
}
```

- 写操作必须 `@Transactional(rollbackFor = Exception.class)`
- Entity ↔ DTO/VO 转换在 Service，不在 Controller
