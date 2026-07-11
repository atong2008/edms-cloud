> 新模块 data 层模板。参照 `apps/web-app/src/views/system/user/data.ts`。
> 规则见 [view-patterns.md](../../references/view-patterns.md)、[access-i18n-rules.md](../../references/access-i18n-rules.md)。

# data 模板 — `{module}/{entity}/data.ts`

## 文件位置

```
edms-ui/apps/web-app/src/views/{module}/{entity}/data.ts
```

与 `list.vue`、`modules/form.vue` 同目录。

## 替换占位符

| 占位符 | 示例 | 说明 |
|--------|------|------|
| `{Module}` | `SystemUser` | API namespace 前缀 |
| `{Entity}` | `User` | 实体名 |
| `{module}` | `system` | locale key 前缀 |
| `{entity}` | `user` | locale key 实体 |
| `{PERM_*}` | `PERM.USER_VIEW` | 操作列权限码 |

## 骨架代码

```typescript
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { {Module}{Entity}Api } from '#/api';

import { PERM } from '#/constants/permissions';
import { $t } from '#/locales';

// 1. 抽屉/详情表单 schema — 供 modules/form.vue 使用
export function useFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('{module}.{entity}.name'),
      rules: 'required',
    },
    // TODO: 新增字段；password 等敏感字段加 dependencies.show 控制仅新增时显示
  ];
}

// 2. 表格顶部搜索 schema — 供 list.vue useVbenVxeGrid.formOptions 使用
export function useGridFormSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('{module}.{entity}.name'),
    },
    // TODO: 与后端分页查询参数对齐
  ];
}

// 3. 表格列定义 — 操作列使用 CellOperation + authCode
export function useColumns<T = {Module}{Entity}Api.{Module}{Entity}>(
  onActionClick: OnActionClickFn<T>,
): VxeTableGridColumns {
  return [
    {
      field: 'name',
      title: $t('{module}.{entity}.name'),
      minWidth: 120,
    },
    {
      field: 'createTime',
      title: $t('{module}.{entity}.createTime'),
      width: 180,
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: $t('{module}.{entity}.name'),
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: [
          { code: 'view', text: $t('common.view'), authCode: PERM.{PERM_VIEW} },
          { code: 'edit', text: $t('common.edit'), authCode: PERM.{PERM_EDIT} },
          {
            code: 'delete',
            text: $t('common.delete'),
            authCode: PERM.{PERM_DEL},
            danger: true,
          },
        ],
      },
      field: 'operation',
      fixed: 'right',
      title: $t('{module}.{entity}.operation'),
      width: 160,
    },
  ];
}

// 4. 可选 — 表单初始值映射（API 响应 → 表单字段）
export function map{Entity}FormValues(
  row?: {Module}{Entity}Api.{Module}{Entity},
): {Module}{Entity}Api.{Module}{Entity} {
  if (!row) {
    return {};
  }
  return { ...row };
}
```

## 扩展模式

### 枚举/字典选项

```typescript
const STATUS_OPTIONS = () => [
  { label: $t('common.enabled'), value: '0' },
  { label: $t('common.disabled'), value: '9' },
];

// 在 useFormSchema 中使用
{
  component: 'RadioGroup',
  componentProps: {
    buttonStyle: 'solid',
    options: STATUS_OPTIONS(),
    optionType: 'button',
  },
  fieldName: 'status',
  label: $t('{module}.{entity}.status'),
}
```

### 关联字段 formatter

```typescript
function formatRelatedList(row: {Module}{Entity}Api.{Module}{Entity}) {
  return row.relatedList?.map((item) => item.name).filter(Boolean).join('、') ?? '';
}

// 在 useColumns 中使用
{
  field: 'relatedList',
  formatter: ({ row }) => formatRelatedList(row as {Module}{Entity}Api.{Module}{Entity}),
  title: $t('{module}.{entity}.related'),
}
```

## 检查清单

- [ ] `useFormSchema`、`useGridFormSchema`、`useColumns` 三个导出函数齐全
- [ ] label/title 全部 `$t()`，key 写入 `locales/**`
- [ ] `CellOperation.options` 每项含 `authCode`，与 `PERM` 及后端 `@HasPermission` 一致
- [ ] 枚举选项用函数返回（支持 locale 切换）
- [ ] 复杂映射逻辑放 `map{Entity}FormValues`，不在 form.vue 内联

## 参考实现

完整示例：`edms-ui/apps/web-app/src/views/system/user/data.ts`
