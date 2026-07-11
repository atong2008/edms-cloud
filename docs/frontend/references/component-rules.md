> 权威定义，由 edms-fe-governance skill 管理。

# COMPONENT - 组件分层与复用规则

## FE-COMP-001 公共组件 vs 业务模块组件

**等级**: 🟡 警告

| 位置 | 用途 | 示例 |
|------|------|------|
| `src/components/` | 跨多个 views 复用 | `dict-select/dict-select.vue` |
| `views/**/modules/` | 单页面专用（表单抽屉等） | `views/system/user/modules/form.vue` |
| `src/adapter/component/` | Vben 表单组件注册与扩展 | 自定义 `ApiTreeSelect` 等 |

**禁止**将仅用于单一页面的表单/弹窗放入 `src/components/`；**禁止**在 `components/` 中编写 CRUD 业务逻辑。

```
src/components/dict-select/     # ✅ 字典下拉，多处引用
views/system/user/modules/      # ✅ 用户表单，仅 user 列表使用
```

## FE-COMP-002 优先使用 Vben 与 Ant Design Vue

**等级**: 🟡 警告

UI 构建优先级：

1. **`@vben/common-ui`** — `Page`、`useVbenDrawer`、`useVbenModal` 等布局与容器
2. **`ant-design-vue`** — `Button`、`Card`、`Tree`、`Select`、`message` 等原子组件
3. **`@vben/icons`** — 图标（如 `Plus`）
4. **项目公共组件** — 已有封装（见下表）
5. 新建公共组件 — 仅当 1–4 无法满足且复用 ≥2 处

| 公共组件 | 路径 | 用途 |
|----------|------|------|
| DictSelect | `components/dict-select/` | 字典项下拉/树选，读 `useDictStore` |

```vue
<!-- ✅ 正确 — 组合 Vben + Ant Design -->
<script lang="ts" setup>
import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { Button, Card } from 'ant-design-vue';
</script>

<!-- ❌ 错误 - 引入 Element Plus 等并行 UI 库 -->
<script lang="ts" setup>
import { ElButton } from 'element-plus';
</script>
```

## FE-COMP-003 Adapter 层职责

**等级**: 🟡 警告

`src/adapter/` 负责框架与 EDMS 后端之间的适配，views **不应**重复实现：

| 模块 | 职责 |
|------|------|
| `adapter/backend/` | 分页转换、OAuth 登录、用户信息映射、密码加密 |
| `adapter/form.ts` | Vben Form 配置与 `useVbenForm` 封装 |
| `adapter/vxe-table.ts` | `useVbenVxeGrid`、`CellOperation`、权限列渲染 |

业务 API 类型定义留在 `api/system/*.ts`；adapter 仅处理跨切面转换逻辑。

## FE-COMP-004 公共组件编写规范

**等级**: 🟡 警告

```vue
<!-- ✅ 正确 — dict-select.vue 模式 -->
<script lang="ts" setup>
import type { SystemDictApi } from '#/api/system/dict';
import { Select, TreeSelect } from 'ant-design-vue';
import { useDictStore } from '#/store/dict';

const props = withDefaults(defineProps<{
  dictType: string;
  tree?: boolean;
}>(), { tree: false });

const emit = defineEmits<{ 'update:value': [value: string | undefined] }>();
// 通过 store 加载字典，不直接 requestClient
</script>
```

公共组件要求：

- Props/Emits 使用 TypeScript 类型声明
- 数据获取走 `#/api` 或已有 store，**禁止**组件内裸 `fetch`
- 用户可见 `placeholder`/标签支持 i18n（props 默认空，父组件传入 `$t(...)`）
- 不含页面级路由跳转逻辑

## FE-COMP-005 表单组件与 ApiXxx 字段

**等级**: 🟢 提示

`data.ts` 中远程数据字段优先使用 Vben 内置 Api 组件：

```typescript
{
  component: 'ApiTreeSelect',
  componentProps: {
    api: getDeptList,
    labelField: 'name',
    valueField: 'deptId',
    childrenField: 'children',
  },
  fieldName: 'deptId',
  label: $t('system.user.dept'),
}
```

字典类字段使用 `DictSelect` 公共组件而非重复请求字典 API。

## FE-COMP-006 禁止商业版 UI 模块

**等级**: 🔴 严重

不得从 Vben 商业版或其他项目复制以下组件/页面到 `apps/web-app`：

- 多租户切换器
- 工作流设计器、审批面板
- 支付/报表/BI 仪表盘

见 FE-SCOPE-001（tech-rules.md）。
