# 组件开发模式

本文档定义 EDMS 前端标准页面模式，新功能开发必须遵循。

## 列表页模式（标准 CRUD）

参考实现：`apps/web-app/src/views/system/user/`（迁移完成后）

### list.vue 结构

```vue
<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid, VbenTableAction } from '#/adapter/vxe-table';
import { deleteUser, getUserList } from '#/api';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onStatusChange),
    height: 'auto',
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getUserList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: { keyField: 'id' },
  } as VxeTableGridOptions,
});

function onCreate() {
  formDrawerApi.setData({}).open();
}

function onEdit(row: Recordable<any>) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: Recordable<any>) {
  Modal.confirm({
    title: $t('common.confirmDelete'),
    onOk: async () => {
      await deleteUser(row.id);
      message.success($t('common.deleteSuccess'));
      gridApi.reload();
    },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Grid :table-title="$t('system.user.title')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('common.create') }}
        </Button>
      </template>
      <template #action="{ row }">
        <VbenTableAction
          :actions="[
            { label: $t('common.edit'), onClick: () => onEdit(row) },
            { label: $t('common.delete'), onClick: () => onDelete(row) },
          ]"
        />
      </template>
    </Grid>
    <FormDrawer @success="gridApi.reload()" />
  </Page>
</template>
```

### data.ts 结构

```typescript
import type { VbenFormSchema } from '#/adapter/form';
import type { VxeTableGridColumns } from '#/adapter/vxe-table';

import { $t } from '#/locales';

export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.user.name'),
    },
  ];
}

export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('system.user.name'),
      rules: 'required',
    },
  ];
}

export function useColumns(
  onStatusChange?: (row: any) => void,
): VxeTableGridColumns {
  return [
    { field: 'name', title: $t('system.user.name') },
    { field: 'action', title: $t('common.action'), slots: { default: 'action' } },
  ];
}
```

### modules/form.vue 结构

```vue
<script lang="ts" setup>
import { useVbenForm } from '#/adapter/form';
import { createUser, updateUser } from '#/api';

import { useFormSchema } from '../data';

const emit = defineEmits<{ success: [] }>();

const [Form, formApi] = useVbenForm({
  schema: useFormSchema(),
  showDefaultActions: false,
});

async function handleSubmit() {
  const { valid, values } = await formApi.validate();
  if (!valid) return;
  // create or update based on data
  emit('success');
}
</script>
```

## 选用指南

| 场景 | 模式 |
|------|------|
| 标准 CRUD 列表 | 列表页模式（本文档） |
| 树形 + 列表 | 参考 `system/user`（左侧部门树） |
| 纯树形管理 | 参考 `system/menu`、`system/dept` |
| 纯表单页 | 使用 `Page` + `useVbenForm` |
| 详情只读 | `modules/detail.vue` + Drawer |

## 公共组件

优先使用 Vben 内置能力：

| 需求 | 组件/Hook |
|------|-----------|
| 页面容器 | `Page` from `@vben/common-ui` |
| 表格 | `useVbenVxeGrid` from `#/adapter/vxe-table` |
| 表单 | `useVbenForm` from `#/adapter/form` |
| 抽屉 | `useVbenDrawer` from `@vben/common-ui` |
| 行操作 | `VbenTableAction` |
