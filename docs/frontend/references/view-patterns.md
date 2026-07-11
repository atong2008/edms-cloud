> 权威定义，由 edms-fe-governance skill 管理。API 规则见 [api-rules.md](./api-rules.md)。

# VIEW - 页面结构与 Vben 模式

## FE-VIEW-001 列表页三文件拆分

**等级**: 🟡 警告

标准 CRUD 列表页按以下结构组织（以 `views/system/user/` 为参考实现）：

```
views/system/user/
├── list.vue           # 页面入口：布局、Grid、Drawer 挂载
├── data.ts            # 表单 schema、表格列、搜索 schema
├── modules/
│   └── form.vue       # 新增/编辑/查看抽屉表单
└── utils.ts           # 页面私有工具（可选）
```

| 文件 | 职责 |
|------|------|
| `list.vue` | `Page` 布局、`useVbenVxeGrid`、`useVbenDrawer`、事件处理 |
| `data.ts` | `useFormSchema`、`useColumns`、`useGridFormSchema`、数据映射 |
| `modules/form.vue` | `useVbenForm`、提交/校验、调用 `#/api` |

**禁止**在单文件 `list.vue` 中内联数百行 schema 与列定义。

## FE-VIEW-002 表格 useVbenVxeGrid + proxyConfig

**等级**: 🟡 警告

列表数据通过 VxeGrid 代理模式加载，**不在** `onMounted` 中手动 `requestClient.get`：

```vue
<!-- ✅ 正确 — list.vue -->
<script lang="ts" setup>
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserPage } from '#/api';
import { useColumns, useGridFormSchema } from './data';

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserPage({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
            deptId: selectedDeptId.value,
          });
        },
      },
    },
    rowConfig: { keyField: 'userId' },
    toolbarConfig: {
      custom: true,
      refresh: true,
      search: true,
    },
  },
});
</script>

<template>
  <Grid :table-title="$t('system.user.list')">
    <template #toolbar-tools>...</template>
  </Grid>
</template>
```

```typescript
// ❌ 错误 - list.vue 中直接请求
import { requestClient } from '#/api/request';

onMounted(async () => {
  const data = await requestClient.get('/admin/user/page');
  tableData.value = data.records;
});
```

刷新表格：`gridApi.query()` 或 `gridApi.reload()`。

## FE-VIEW-003 抽屉 useVbenDrawer + connectedComponent

**等级**: 🟡 警告

表单弹层使用 `useVbenDrawer`，通过 `connectedComponent` 连接 `modules/form.vue`：

```vue
<!-- ✅ 正确 — list.vue -->
<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: SystemUserApi.SystemUser) {
  formDrawerApi.setData(row).open();
}
</script>

<template>
  <FormDrawer @success="gridApi.query()" />
</template>
```

```vue
<!-- ✅ 正确 — modules/form.vue 内嵌第二个 Drawer 控制确认 -->
<script lang="ts" setup>
import { useVbenDrawer } from '@vben/common-ui';
import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api/system/user';

const [Drawer, drawerApi] = useVbenDrawer({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const values = await formApi.getValues();
    drawerApi.lock();
    try {
      userId.value ? await updateUser({ ...values, userId: userId.value }) : await createUser(values);
      emits('success');
      drawerApi.close();
    } finally {
      drawerApi.unlock();
    }
  },
});
</script>
```

## FE-VIEW-004 data.ts 导出函数约定

**等级**: 🟡 警告

`data.ts` 导出以下命名函数，供 list/form 复用：

| 函数 | 用途 |
|------|------|
| `useFormSchema()` | 抽屉/表单字段定义 |
| `useGridFormSchema()` | 表格顶部搜索表单 |
| `useColumns(onActionClick)` | 表格列 + 行操作按钮 |
| `mapXxxFormValues(row?)` | 行数据 → 表单初始值（可选） |

```typescript
// ✅ 正确 — data.ts
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import { PERM } from '#/constants/permissions';
import { $t } from '#/locales';

export function useFormSchema(): VbenFormSchema[] { /* ... */ }
export function useGridFormSchema(): VbenFormSchema[] { /* ... */ }
export function useColumns<T>(onActionClick: OnActionClickFn<T>): VxeTableGridColumns { /* ... */ }
```

## FE-VIEW-005 Views 禁止直接使用 requestClient

**等级**: 🔴 严重

页面与模块组件**仅**通过 `#/api` 层函数访问后端：

```typescript
// ✅ 正确 — modules/form.vue
import { createUser, updateUser } from '#/api/system/user';

// ✅ 正确 — list.vue
import { deleteUser, getUserPage } from '#/api';

// ❌ 错误 — view 层裸调 HTTP
import { requestClient } from '#/api/request';
await requestClient.delete('/admin/user', { data: [id] });
```

## FE-VIEW-006 页面布局与权限

**等级**: 🟡 警告

- 列表页根节点使用 `@vben/common-ui` 的 `<Page>`
- 工具栏敏感按钮包裹 `<AccessControl type="code" :codes="[PERM.XXX]">`
- 文案使用 `$t()`（见 access-i18n-rules.md）

```vue
<Page auto-content-height>
  <Grid :table-title="$t('system.user.list')">
    <template #toolbar-tools>
      <AccessControl type="code" :codes="[PERM.USER_ADD]">
        <Button type="primary" @click="onCreate">...</Button>
      </AccessControl>
    </template>
  </Grid>
</Page>
```

## FE-VIEW-007 非列表页

**等级**: 🟢 提示

树形菜单（如 `views/system/menu/`）、纯表单页可省略 `proxyConfig`，但仍应：

- 拆分 `data.ts` 存放 schema
- API 调用走 `#/api`
- 遵循 i18n 与权限规则
