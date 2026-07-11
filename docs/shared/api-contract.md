# API 共享契约

前后端联调与 Code Review 的统一参考。细则见：

- 后端：[../backend/references/api-rules.md](../backend/references/api-rules.md)
- 前端：[../frontend/references/api-rules.md](../frontend/references/api-rules.md)

## 响应格式 R\<T\>

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 0=成功，1=失败 |
| `msg` | string | 提示信息 |
| `data` | T | 业务数据 |

- 后端：`com.edmscloud.edms.common.core.util.R<T>`
- 前端：`requestClient` 拦截器 successCode=0，responseReturn='data'

## 路径前缀

| 前缀 | 服务 | 示例 |
|------|------|------|
| `/admin/**` | UPMS 等业务 | `/admin/user/page` |
| `/auth/**` | OAuth2 | `/auth/oauth2/token` |

**禁止** `/api/**` 统一前缀（pig 遗留）。

## 分页

后端 MyBatis-Plus `Page<T>`：

| 字段 | 说明 |
|------|------|
| `records` | 当前页数据 |
| `total` | 总条数 |
| `current` | 当前页码 |
| `size` | 每页条数 |

前端适配：`toBackendPageParams()` / `toFrontendPageResult()`（`#/adapter/backend`）

## REST 约定（UPMS 示例）

| 操作 | 方法 | 服务内路径 | 网关完整路径 |
|------|------|-----------|-------------|
| 分页列表 | GET | `/user/page` | `/admin/user/page` |
| 详情 | GET | `/user/details/{id}` | `/admin/user/details/{id}` |
| 新增 | POST | `/user` | `/admin/user` |
| 修改 | PUT | `/user` | `/admin/user` |
| 删除 | DELETE | `/user` | `/admin/user` |

## 前端路由 vs API 路径

| 类型 | 示例 | 说明 |
|------|------|------|
| Vue Router path | `/system/user` | 浏览器 URL，非 API |
| API path | `/admin/user/page` | requestClient 请求 |
