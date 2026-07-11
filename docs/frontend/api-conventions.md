# API 目录约定

> **权威 API 规则**：[references/api-rules.md](references/api-rules.md) · [../shared/api-contract.md](../shared/api-contract.md)
>
> API 请求路径必须使用 `/admin/**` 或 `/auth/**`。pig 遗留的 `/system/**`、`/api/**` 路径已废弃。

## 目录结构

```
apps/web-app/src/api/
├── core/                 # 框架级：认证、当前用户、菜单
│   ├── auth.ts
│   ├── user.ts
│   ├── menu.ts
│   └── index.ts
├── system/               # 系统管理域
│   ├── user.ts
│   ├── role.ts
│   ├── menu.ts
│   ├── dept.ts
│   └── index.ts
├── {domain}/             # EDMS 业务域（如 document/）
│   └── ...
├── request.ts            # 请求客户端（不导出业务 API）
└── index.ts              # 统一 re-export
```

## 分层规则

| 目录 | 用途 | 示例 |
|------|------|------|
| `core/` | 全局共用、与框架集成 | auth、user、menu |
| `system/` | 系统管理 | user、role、menu、dept |
| `{domain}/` | EDMS 业务域 | `document/` |

## 文件规则

- 一个 REST 资源 = 一个文件：`api/system/user.ts`
- 禁止在 `api/` 根目录直接放业务 API
- `request.ts` 仅配置 RequestClient，不导出业务函数
- 每个域目录必须有 `index.ts` barrel export

## 代码模板

```typescript
import type { Recordable } from '@vben/types';

import {
  toBackendPageParams,
  toFrontendPageResult,
} from '#/adapter/backend';
import type { BackendPageResult } from '#/adapter/backend';
import { requestClient } from '#/api/request';

export namespace SystemUserApi {
  export interface SystemUser {
    id: string;
    name: string;
    status: 0 | 1;
    remark?: string;
  }
}

async function getUserPage(params: Recordable<any>) {
  const page = await requestClient.get<BackendPageResult<SystemUserApi.SystemUser>>(
    '/admin/user/page',
    { params: toBackendPageParams(params) },
  );
  return toFrontendPageResult(page);
}

async function createUser(data: Omit<SystemUserApi.SystemUser, 'id'>) {
  return requestClient.post('/admin/user', data);
}

async function updateUser(data: SystemUserApi.SystemUser) {
  return requestClient.put('/admin/user', data);
}

async function deleteUser(ids: string[]) {
  return requestClient.delete('/admin/user', { data: ids });
}

export { createUser, deleteUser, getUserPage, updateUser };
```

## 命名约定

| 元素 | 规则 | 示例 |
|------|------|------|
| 类型 namespace | `{Domain}{Resource}Api` | `SystemUserApi` |
| 分页查询 | `get{Resource}Page` | `getUserPage` |
| 创建 | `create{Resource}` | `createUser` |
| 更新 | `update{Resource}` | `updateUser` |
| 删除 | `delete{Resource}` | `deleteUser` |
| 详情 | `get{Resource}Detail` | `getUserDetail` |

## REST 路径（当前标准）

- 系统管理 API：`/admin/{resource}/...`（如 `/admin/user/page`）
- 认证：`/auth/oauth2/token`
- 前端 Vue Router path 仍为 `/system/user`（UI 路由，非 API）

## index.ts 聚合

```typescript
// api/system/index.ts
export * from './dept';
export * from './menu';
export * from './role';
export * from './user';

// api/index.ts
export * from './core';
export * from './system';
```

## 禁止事项

- 禁止 default export API 函数
- 禁止在组件中硬编码 API 路径
- 禁止 `/api/**` 或 `/system/**` 作为 requestClient 路径
- 禁止 API 文件间循环依赖
