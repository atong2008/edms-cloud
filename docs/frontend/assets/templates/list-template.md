> 新模块列表页模板。参照 `apps/web-app/src/views/system/user/list.vue`（精简版）。
> 规则见 [view-patterns.md](../../references/view-patterns.md)、[access-i18n-rules.md](../../references/access-i18n-rules.md)。

# 列表页模板 — `{module}/{entity}/list.vue`

## 文件位置

```
edms-ui/apps/web-app/src/views/{module}/{entity}/
├── list.vue              # 本文件
├── data.ts               # schema 与列定义
└── modules/
    └── form.vue          # 新增/编辑/查看抽屉
```

## 替换占位符

| 占位符 | 示例 | 说明 |
|--------|------|------|
| `{module}` | `system` | 路由/目录模块 |
| `{entity}` | `user` | 实体目录 |
| `{Entity}` | `User` | 类型名 |
| `{entityId}` | `userId` | 表格 row key |
| `{entityPage}` | `getUserPage` | API 分页函数 |
| `{entityDelete}` | `deleteUser` | API 删除函数 |
| `{PERM_*}` | `PERM.USER_ADD` | 权限码常量 |

## 骨架代码

```vue
<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { {Module}{Entity}Api } from '#/api';

import { AccessControl } from '@vben/access';
import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { {entityDelete}, {entityPage} } from '#/api';
import { PERM } from '#/constants/permissions';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

// 1. 抽屉 — connectedComponent 挂载 form.vue
const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

// 2. 表格 — proxyConfig.ajax.query 加载数据，禁止 onMounted 直接请求
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
          return await {entityPage}({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: '{entityId}',
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<{Module}{Entity}Api.{Module}{Entity}>,
});

// 3. 操作列回调
function onActionClick(e: OnActionClickParams<{Module}{Entity}Api.{Module}{Entity}>) {
  switch (e.code) {
    case 'delete':
      onDelete(e.row);
      break;
    case 'edit':
      onEdit(e.row);
      break;
    case 'view':
      onView(e.row);
      break;
  }
}

function onView(row: {Module}{Entity}Api.{Module}{Entity}) {
  formDrawerApi.setData({ ...row, __mode: 'view' }).open();
}

function onEdit(row: {Module}{Entity}Api.{Module}{Entity}) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: {Module}{Entity}Api.{Module}{Entity}) {
  if (!row.{entityId}) return;
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  {entityDelete}(row.{entityId})
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>

<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('{module}.{entity}.list')">
      <template #toolbar-tools>
        <AccessControl type="code" :codes="[PERM.{PERM_ADD}]">
          <Button type="primary" @click="onCreate">
            <Plus class="size-5" />
            {{ $t('ui.actionTitle.create', [$t('{module}.{entity}.name')]) }}
          </Button>
        </AccessControl>
      </template>
    </Grid>
  </Page>
</template>
```

## 检查清单

- [ ] 业务逻辑与 schema/列定义分离到 `data.ts`
- [ ] 表格数据仅通过 `proxyConfig.ajax.query` 加载
- [ ] 新增按钮使用 `AccessControl` + `PERM.*`
- [ ] 所有用户可见文案使用 `$t()`
- [ ] 复杂布局（如左侧树筛选）可扩展，但 Grid/Drawer 模式不变

## 参考实现

完整示例（含部门树侧栏）：`edms-ui/apps/web-app/src/views/system/user/list.vue`
