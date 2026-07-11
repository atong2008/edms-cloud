> 新模块 API 层模板。参照 `apps/web-app/src/api/system/user.ts`。
> 规则见 [api-rules.md](../../references/api-rules.md)。

# API 模板 — `{module}/{entity}.ts`

## 文件位置

```
edms-ui/apps/web-app/src/api/{module}/{entity}.ts
```

## 替换占位符

| 占位符 | 示例（用户模块） | 说明 |
|--------|------------------|------|
| `{Module}` | `SystemUser` | namespace 前缀 |
| `{module}` | `system` | 目录名 |
| `{entity}` | `user` | 文件名 |
| `{Entity}` | `User` | 类型/函数名 |
| `{entityId}` | `userId` | 主键字段 |
| `{adminPath}` | `/admin/user` | 网关业务路径 |

## 骨架代码

```typescript
import type { Recordable } from '@vben/types';

import {
  toBackendPageParams,
  toFrontendPageResult,
  type BackendPageResult,
} from '#/adapter/backend';
import { requestClient } from '#/api/request';

// 1. 使用 export namespace 集中定义类型（对齐后端 DTO）
export namespace {Module}{Entity}Api {
  export interface {Module}{Entity} {
    {entityId}?: number;
    // TODO: 按后端 DTO 补充字段，password 等敏感字段仅用于提交
  }

  export interface PageResult {
    items: {Module}{Entity}[];
    total: number;
  }
}

// 2. 可选：提交前剔除只读/关联展示字段
function to{Entity}Payload(
  data: Partial<{Module}{Entity}Api.{Module}{Entity}>,
): {Module}{Entity}Api.{Module}{Entity} {
  // TODO: 解构并丢弃 roleList、deptList 等展示字段
  return data as {Module}{Entity}Api.{Module}{Entity};
}

// 3. 分页列表 — 必须使用 toBackendPageParams / toFrontendPageResult
async function get{Entity}Page(params: Recordable<any>) {
  const page = await requestClient.get<
    BackendPageResult<{Module}{Entity}Api.{Module}{Entity}>
  >('{adminPath}/page', {
    params: toBackendPageParams(params),
  });
  return toFrontendPageResult(page);
}

// 4. 详情
async function get{Entity}ById({entityId}: number) {
  return requestClient.get<{Module}{Entity}Api.{Module}{Entity}>(
    `{adminPath}/details/${entityId}`,
  );
}

// 5. CRUD
async function create{Entity}(data: {Module}{Entity}Api.{Module}{Entity}) {
  return requestClient.post('{adminPath}', to{Entity}Payload(data));
}

async function update{Entity}(data: {Module}{Entity}Api.{Module}{Entity}) {
  return requestClient.put('{adminPath}', to{Entity}Payload(data));
}

async function delete{Entity}({entityId}: number) {
  return requestClient.delete('{adminPath}', { data: [{entityId}] });
}

export {
  create{Entity},
  delete{Entity},
  get{Entity}ById,
  get{Entity}Page,
  update{Entity},
};
```

## 检查清单

- [ ] 路径以 `/admin/**` 或 `/auth/**` 开头（禁止 `/api/**`）
- [ ] 仅 import `requestClient`，禁止 `axios`/`fetch`/`baseRequestClient`
- [ ] 分页函数返回 `{ items, total }`（经 `toFrontendPageResult` 转换）
- [ ] 在 `src/api/index.ts` 或 barrel 中 re-export（若项目有统一出口）
- [ ] 类型字段与 `docs/governance/shared/api-contract.md` 一致

## 参考实现

完整示例：`edms-ui/apps/web-app/src/api/system/user.ts`
