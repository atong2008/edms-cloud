> 权威定义，由 edms-be-governance skill 管理。

# ARCH - 架构规则

## ARCH-001 服务内 Entity 不跨层暴露

**等级**: 🔴 严重

Entity 仅在 Service/Mapper 层使用。新接口 Controller 应返回 VO 或 DTO。

```java
// ❌ 错误（新代码）
@GetMapping("/{id}")
public R<SysUser> get(@PathVariable Long id) {
    return R.ok(userService.getById(id));
}

// ✅ 正确
@GetMapping("/details/{id}")
public R user(@PathVariable Long id) {
    return R.ok(userService.selectUserVoById(id));
}
```

## ARCH-002 关联用 ID 不用对象引用

**等级**: 🔴 严重

表间关联使用 ID 字段，禁止在 Entity 中嵌套其他聚合根对象。

```java
// ✅ 正确
private Long deptId;

// ❌ 错误
private SysDept dept;
```

## ARCH-003 禁止 Controller 直调 Mapper

**等级**: 🔴 严重

Controller 仅注入 Service，禁止注入 Mapper 或 Repository。

```java
// ❌ 错误
@RestController
public class SysRoleController {
    private final SysRoleMapper roleMapper;
}

// ✅ 正确
@RestController
@AllArgsConstructor
public class SysRoleController {
    private final SysRoleService roleService;
}
```

## ARCH-004 禁止事务中调用外部系统

**等级**: 🔴 严重

事务内禁止：HTTP、文件 IO、MQ、OSS 写入。

```java
// ❌ 错误
@Transactional
public void save(SysFile file) {
    fileMapper.insert(file);
    ossClient.putObject(...); // 禁止
}

// ✅ 正确 - 事务内仅 DB
@Transactional
public void saveMeta(SysFile file) {
    fileMapper.insert(file);
}
// 事务外上传文件
```

同时检查: TXN-003。

## ARCH-005 禁止 Entity 暴露到 API 层

**等级**: 🔴 严重

新代码 Controller 返回 VO/DTO，包装在 `R<T>` 中。存量代码不强制批量重构。
