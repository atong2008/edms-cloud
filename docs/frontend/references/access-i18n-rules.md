> 权威定义，由 edms-fe-governance skill 管理。鉴权契约见 [../../shared/auth-contract.md](../../shared/auth-contract.md)。

# AUTH & I18N - 权限与国际化规则

## FE-AUTH-001 权限码 PERM 对齐后端

**等级**: 🔴 严重

前端权限码集中定义于 `src/constants/permissions.ts`，**必须与后端 `@HasPermission` 注解值一致**。

```typescript
// ✅ 正确 — constants/permissions.ts
export const PERM = {
  USER_VIEW: 'sys_user_view',
  USER_ADD: 'sys_user_add',
  USER_EDIT: 'sys_user_edit',
  USER_DEL: 'sys_user_del',
  // ...
} as const;

export type PermissionCode = (typeof PERM)[keyof typeof PERM];
```

```java
// 后端对应 — @HasPermission("sys_user_add")
@HasPermission("sys_user_add")
@PostMapping
public R save(@Valid @RequestBody UserDTO userDto) { ... }
```

**禁止**在 views/components 中硬编码权限字符串 `'sys_user_add'`；一律引用 `PERM.USER_ADD`。

## FE-AUTH-002 AccessControl 组件

**等级**: 🔴 严重

模板中控制按钮/区块可见性，使用 `@vben/access` 的 `AccessControl`：

```vue
<!-- ✅ 正确 — views/system/user/list.vue 模式 -->
<script lang="ts" setup>
import { AccessControl } from '@vben/access';
import { PERM } from '#/constants/permissions';
import { $t } from '#/locales';
</script>

<template>
  <AccessControl type="code" :codes="[PERM.USER_ADD]">
    <Button type="primary" @click="onCreate">
      {{ $t('ui.actionTitle.create', [$t('system.user.name')]) }}
    </Button>
  </AccessControl>
</template>

<!-- ❌ 错误 - 无权限包裹的敏感操作 -->
<Button type="primary" @click="onCreate">新增用户</Button>
```

`type="code"` 表示按权限码校验（与后端 accessMode 为 `backend` 时一致）。

## FE-AUTH-003 编程式权限判断

**等级**: 🟡 警告

脚本逻辑中需要条件分支时，使用 `useAccess().hasAccessByCodes`：

```typescript
import { useAccess } from '@vben/access';
import { PERM } from '#/constants/permissions';

const { hasAccessByCodes } = useAccess();

// ✅ 正确
if (hasAccessByCodes([PERM.USER_EXPORT])) {
  // 显示导出逻辑
}

// ❌ 错误 - 直接读 localStorage 判断权限
if (localStorage.getItem('permissions')?.includes('sys_user_export')) { ... }
```

表格行内操作按钮通过 `CellOperation` 的 `authCode` 属性联动权限（见 `adapter/vxe-table.ts`）：

```typescript
// ✅ 正确 — data.ts 中 useColumns
{
  cellRender: {
    name: 'CellOperation',
    options: [
      { code: 'view', text: $t('common.view'), authCode: PERM.USER_VIEW },
      { code: 'edit', text: $t('common.edit'), authCode: PERM.USER_EDIT },
      { code: 'delete', text: $t('common.delete'), authCode: PERM.USER_DEL, danger: true },
    ],
  },
}
```

## FE-AUTH-004 敏感字段禁止持久化

**等级**: 🔴 严重

| 禁止项 | 说明 |
|--------|------|
| password 写入 localStorage/sessionStorage | 密码仅在表单提交时经 adapter 加密后发送 |
| token 写入 console | 调试时不得 `console.log(token)` |
| password 出现在 URL | 登录参数走 POST body |

```typescript
// ❌ 错误
localStorage.setItem('password', form.password);
console.log('token:', accessStore.accessToken);

// ✅ 正确 — token 仅存 accessStore（内存 + 可选 secure storage）
accessStore.setAccessToken(accessToken);
```

OAuth 密码加密在 `adapter/backend/crypto.ts` 完成，views 不直接接触加密逻辑。

## FE-I18N-001 用户可见文案使用 $t()

**等级**: 🟡 警告

所有面向用户的文案（按钮、标签、表格列标题、提示信息）**必须**通过 `$t()` 引用语言包，禁止硬编码中文/英文。

**机器检查**：ESLint `edms/no-hardcoded-locale`（warn 级别，不阻塞 CI）

```typescript
// ✅ 正确 — data.ts
import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('system.user.userName'),
      rules: 'required',
    },
  ];
}
```

```vue
<!-- ✅ 正确 -->
<Grid :table-title="$t('system.user.list')" />

<!-- ❌ 错误 - 硬编码中文 -->
<Grid table-title="用户列表" />
<Button>新增</Button>
```

## FE-I18N-002 语言包目录与键名

**等级**: 🟡 警告

语言文件位于 `src/locales/langs/{locale}/`，按域拆分 JSON：

```
src/locales/langs/
├── zh-CN/
│   ├── system.json    # 系统管理模块
│   ├── page.json
│   └── ...
└── en-US/
    ├── system.json
    └── ...
```

键名采用点分路径，与 `$t` 参数一致：

```json
// zh-CN/system.json
{
  "user": {
    "list": "用户列表",
    "userName": "用户名",
    "realName": "姓名"
  }
}
```

```typescript
$t('system.user.list')       // → "用户列表"
$t('ui.actionTitle.create', [$t('system.user.name')])  // 带插值
```

新增模块时**同时**维护 `zh-CN` 与 `en-US` 对应文件；`locales/**` 目录本身豁免 `no-hardcoded-locale` 规则。

## FE-SEC-001 日志脱敏

**等级**: 🔴 严重

与后端 SEC-001 对齐：日志、调试输出禁止包含 token、password、clientSecret。

```typescript
// ❌ 错误
console.log('login response', { password, accessToken });
console.debug('request headers', config.headers.Authorization);

// ✅ 正确
console.warn('Access token or refresh token is invalid or expired.');
```
