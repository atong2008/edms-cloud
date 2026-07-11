# 鉴权共享契约

## OAuth2

| 项 | 值 |
|----|-----|
| Token 端点 | `POST /auth/oauth2/token` |
| 前端实现 | `apps/web-app/src/adapter/backend/auth.ts` |
| 客户端 | `baseRequestClient` + `responseReturn: 'body'` |
| 业务 API | `requestClient` + `Authorization: Bearer {token}` |

## 权限码对照

前端 `src/constants/permissions.ts` 的 `PERM` 必须与后端 `@HasPermission` 值一致。

| 功能 | PERM 常量 | @HasPermission |
|------|-----------|----------------|
| 用户查看 | `USER_VIEW` → `'sys_user_view'` | `@HasPermission("sys_user_view")` |
| 用户新增 | `USER_ADD` → `'sys_user_add'` | `@HasPermission("sys_user_add")` |
| 角色查看 | `ROLE_VIEW` → `'sys_role_view'` | `@HasPermission("sys_role_view")` |

完整权限码以后端 `sys_menu.permission` 及现有 Controller 为准。

## 前端权限组件

```vue
<AccessControl :codes="[PERM.USER_ADD]" type="code">
  <Button>{{ $t('common.create') }}</Button>
</AccessControl>
```

## 禁止

- password、refresh_token 写入日志或持久化到非安全存储
- 业务 API 层使用 `/api/admin/oauth/token` 等 pig 遗留端点
