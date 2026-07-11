# 前端编码规范

## 组件编写

- 统一使用 `<script lang="ts" setup>`
- 单文件组件顺序：`<script>` → `<template>` → `<style>`
- 样式优先 Tailwind 工具类，复杂场景用 `<style scoped>`

## TypeScript

- 业务实体类型定义在 API 文件的 namespace 中，不在组件内重复定义
- 组件 Props 使用 `defineProps<T>()` 或 `withDefaults(defineProps<T>(), {...})`
- 避免 `any`，不得不用时使用 `Recordable<any>` 并注明原因

## 导入顺序

```typescript
// 1. type imports
import type { Recordable } from '@vben/types';

// 2. vue
import { ref, computed } from 'vue';

// 3. @vben/*
import { Page } from '@vben/common-ui';

// 4. 第三方 UI
import { Button, message } from 'ant-design-vue';

// 5. 应用内 #/*
import { getUserList } from '#/api';
import { $t } from '#/locales';

// 6. 相对路径
import { useColumns } from './data';
import Form from './modules/form.vue';
```

## UI 组件库

- **必须**使用 `ant-design-vue`
- **禁止**使用 `antdv-next`（playground 历史遗留，web-app 不使用）

## 状态管理

| 场景 | 方案 |
|------|------|
| 用户信息、权限、Token | `@vben/stores`（access、user） |
| 应用级业务状态 | `apps/web-app/src/store/` |
| 页面局部状态 | `ref` / `computed` / `reactive` |

## 国际化

- 所有用户可见文案通过 `$t()` 获取
- 键名格式：`{domain}.{feature}.{key}`，如 `system.user.title`
- 翻译文件：`locales/langs/{lang}/{domain}.json`

## API 调用

- 页面组件 **禁止** 直接使用 axios
- 统一通过 `#/api` 导入业务函数
- 请求客户端配置仅在 `api/request.ts` 维护

## 命名约定

| 类型 | 风格 | 示例 |
|------|------|------|
| 组件文件 | kebab-case 目录 + 固定文件名 | `list.vue`, `form.vue` |
| 组合式函数 | camelCase，`use` 前缀 | `useColumns()` |
| API 函数 | camelCase，动词开头 | `getUserList`, `createUser` |
| 类型 namespace | PascalCase | `SystemUserApi` |
| 路由 name | PascalCase | `SystemUser` |
| 路由 path | kebab-case | `/system/user` |

## Git 提交规范

遵循 Conventional Commits：

```
feat(system): add user management page
fix(api): correct token refresh logic
docs(frontend): update api conventions
chore(frontend): remove unused web-ele app
```

使用 `pnpm commit` 交互式提交。
