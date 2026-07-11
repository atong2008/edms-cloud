> 权威定义，由 edms-fe-governance skill 管理。共享契约见 [../../shared/api-contract.md](../../shared/api-contract.md)。

# API - 前端 HTTP 与契约规则

## FE-API-001 统一使用 requestClient

**等级**: 🔴 严重

业务 API 模块（`src/api/system/**` 等）**必须**通过 `requestClient` 发起请求，禁止直接使用 `axios`、`fetch` 或 `baseRequestClient`。

**白名单**（可例外使用底层客户端）：

- `apps/web-app/src/api/request.ts` — 创建与导出 `requestClient`
- `apps/web-app/src/api/core/**` — OAuth 登录等需 `responseReturn: 'body'` 的场景
- `apps/web-app/src/adapter/backend/**` — OAuth token 交换（`baseRequestClient`）

**机器检查**：ESLint `edms/use-request-client`

```typescript
// ✅ 正确 — 参照 api/system/user.ts
import { requestClient } from '#/api/request';

async function getUserPage(params: Recordable<any>) {
  const page = await requestClient.get<BackendPageResult<SystemUserApi.SystemUser>>(
    '/admin/user/page',
    { params: toBackendPageParams(params) },
  );
  return toFrontendPageResult(page);
}

// ❌ 错误 - 裸 axios
import axios from 'axios';
export async function getUserPage(params: Recordable<any>) {
  return axios.get('/admin/user/page', { params });
}

// ❌ 错误 - 裸 fetch
export async function getUserPage(params: Recordable<any>) {
  return fetch('/admin/user/page').then((r) => r.json());
}

// ❌ 错误 - 业务层使用 baseRequestClient
import { baseRequestClient } from '#/api/request';
export async function getUserPage(params: Recordable<any>) {
  return baseRequestClient.get('/admin/user/page', { params });
}
```

## FE-API-002 路径前缀

**等级**: 🔴 严重

`requestClient` 的首参路径须匹配 `^/(admin|auth)/`，与网关路由及后端服务前缀对齐：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `/admin/**` | UPMS 等业务 API | `/admin/user/page`、`/admin/role` |
| `/auth/**` | OAuth2 认证 | `/auth/oauth2/token` |

**禁止** pig-ui 遗留的 `/api/**` 前缀（见 anti-patterns.md）。

**机器检查**：ESLint `edms/api-path-prefix`（首期仅检查字符串字面量首参）

```typescript
// ✅ 正确
requestClient.get('/admin/user/page', { params });
requestClient.post('/admin/user', data);
requestClient.put('/admin/user/personal/password', data);

// ❌ 错误 - pig 遗留路径
requestClient.get('/api/system/user/page');
requestClient.get('/api/admin/user/list');

// ❌ 错误 - 无版本段但仍错误的统一前缀
requestClient.get('/api/user/page');
```

## FE-API-003 响应契约 code/data/msg

**等级**: 🔴 严重

后端统一返回 `R<T>`（`code` / `data` / `msg`）。`request.ts` 已通过 `defaultResponseInterceptor` 配置：

| 配置项 | 值 |
|--------|-----|
| `codeField` | `code` |
| `dataField` | `data` |
| `successCode` | `0` |

`requestClient` 导出时设置 `responseReturn: 'data'`，业务 API **直接获得 `data` 字段内容**，无需手动解包。

```typescript
// request.ts 已配置 — 业务 API 勿重复解包
client.addResponseInterceptor(
  defaultResponseInterceptor({
    codeField: 'code',
    dataField: 'data',
    successCode: 0,
  }),
);

// ✅ 正确 — getUserById 直接得到 SystemUser
async function getUserById(userId: number) {
  return requestClient.get<SystemUserApi.SystemUser>(
    `/admin/user/details/${userId}`,
  );
}

// ❌ 错误 - 假设裸 axios 响应结构
async function getUserById(userId: number) {
  const resp = await requestClient.get(`/admin/user/details/${userId}`);
  return resp.data.data; // requestClient 已解包，此处多余且可能出错
}
```

OAuth token 端点返回原始 OAuth2 body，须在 `adapter/backend/auth.ts` 使用 `baseRequestClient` 并设置 `responseReturn: 'body'`。

## FE-API-004 分页适配

**等级**: 🔴 严重

后端分页使用 MyBatis-Plus `Page<T>`（字段 `records` / `total` / `current` / `size`）。Vben 表格期望 `{ items, total }`。

**必须**使用 `#/adapter/backend` 提供的适配函数：

```typescript
import {
  toBackendPageParams,
  toFrontendPageResult,
  type BackendPageResult,
} from '#/adapter/backend';
import { requestClient } from '#/api/request';

// ✅ 正确 — 完整分页链路（user.ts 模式）
async function getUserPage(params: Recordable<any>) {
  const page = await requestClient.get<
    BackendPageResult<SystemUserApi.SystemUser>
  >('/admin/user/page', {
    params: toBackendPageParams(params),
  });
  return toFrontendPageResult(page);
}

// PageResult 供 VxeGrid proxyConfig 使用
export namespace SystemUserApi {
  export interface PageResult {
    items: SystemUser[];
    total: number;
  }
}

// ❌ 错误 - 直接使用 list/rows 字段名
async function getUserPage(params: Recordable<any>) {
  const page = await requestClient.get('/admin/user/page', { params });
  return { items: page.list, total: page.count }; // 字段名错误
}

// ❌ 错误 - 未转换 Vben 的 page/pageSize
async function getUserPage(params: Recordable<any>) {
  return requestClient.get('/admin/user/page', { params }); // 缺少 toBackendPageParams
}
```

| 函数 | 方向 | 说明 |
|------|------|------|
| `toBackendPageParams` | 前端 → 后端 | `page`/`pageSize` → `current`/`size` |
| `toFrontendPageResult` | 后端 → 前端 | `records` → `items` |
| `BackendPageResult<T>` | 类型 | 后端分页响应泛型 |

## FE-API-005 API 模块组织与命名

**等级**: 🟡 警告

按业务域拆分文件，使用 **`SystemXxxApi` namespace** 导出类型，函数具名 export：

```typescript
// ✅ 正确 — api/system/user.ts
export namespace SystemUserApi {
  export interface SystemUser {
    userId?: number;
    username?: string;
    // ...
  }
  export interface PageResult {
    items: SystemUser[];
    total: number;
  }
}

export { createUser, deleteUser, getUserById, getUserPage, updateUser };

// ❌ 错误 - 无 namespace、默认 export 大对象
export default {
  getUserPage,
  createUser,
};
```

| 路径 | 职责 |
|------|------|
| `api/system/*.ts` | UPMS 业务 CRUD |
| `api/core/auth.ts` | 登录、登出、用户信息、权限码 |
| `api/index.ts` | 统一 re-export，供 views 使用 `#/api` |

Views **禁止** import `requestClient`；应调用 `#/api` 或 `#/api/system/xxx` 中的封装函数（见 view-patterns.md）。

## FE-API-006 禁止 pig-ui 路径

**等级**: 🔴 严重

从 pig-ui 迁移时，以下路径模式**必须清除**：

| 遗留路径 | 正确路径 |
|----------|----------|
| `/api/system/user/**` | `/admin/user/**` |
| `/api/system/role/**` | `/admin/role/**` |
| `/api/system/menu/**` | `/admin/menu/**` |
| `/api/admin/token/**` | `/auth/oauth2/token` |
