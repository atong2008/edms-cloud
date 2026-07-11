> 权威定义，由 edms-fe-governance skill 管理。

# ANTI - 前端反模式清单

审查与 `/edms-fe-review` 时重点扫描以下模式。每条关联对应规则 ID。

## 路径与 API 反模式

| ID | 反模式 | 正确做法 | 规则 |
|----|--------|----------|------|
| FE-ANTI-001 | `/api/system/**` pig 遗留路径 | `/admin/**` 网关前缀 | FE-API-002 |
| FE-ANTI-002 | `/api/admin/token/login` 等旧 token 端点 | `/auth/oauth2/token` + `adapter/backend/auth.ts` | FE-API-002 |
| FE-ANTI-003 | 分页字段 `list`/`rows`/`count` | `records`/`total` + `toFrontendPageResult` | FE-API-004 |
| FE-ANTI-004 | views 内 `import axios` 或 `fetch()` | `#/api` 封装函数 | FE-API-001 |
| FE-ANTI-005 | 业务代码使用 `baseRequestClient` | 仅 `request.ts`、`adapter/backend/**` | FE-API-001 |
| FE-ANTI-006 | 手动解包 `resp.data.data` | 依赖 `requestClient` 拦截器 | FE-API-003 |

### FE-ANTI-001 示例：pig 路径

```typescript
// ❌ 反模式 — pig-ui 迁移遗留
requestClient.get('/api/system/user/page');
requestClient.post('/api/system/role', data);

// ✅ 正确
requestClient.get('/admin/user/page');
requestClient.post('/admin/role', data);
```

### FE-ANTI-002 示例：旧 OAuth 端点

```typescript
// ❌ 反模式
await requestClient.post('/api/admin/oauth/token', { username, password });

// ✅ 正确 — adapter/backend/auth.ts
await baseRequestClient.post('/auth/oauth2/token', body, {
  headers: { Authorization: basicAuthHeader(clientId, clientSecret) },
  responseReturn: 'body',
});
```

### FE-ANTI-003 示例：错误分页字段

```typescript
// ❌ 反模式 — pig PageResult 字段名
return { items: page.list, total: page.count };

// ❌ 反模式 — 直接把 BackendPageResult 交给 VxeGrid
return requestClient.get('/admin/user/page', { params });

// ✅ 正确
const page = await requestClient.get<BackendPageResult<SystemUser>>('/admin/user/page', {
  params: toBackendPageParams(params),
});
return toFrontendPageResult(page);
```

## 视图层反模式

| ID | 反模式 | 正确做法 | 规则 |
|----|--------|----------|------|
| FE-ANTI-010 | `list.vue` 内联 200+ 行 schema/列 | 拆至 `data.ts` | FE-VIEW-001 |
| FE-ANTI-011 | `onMounted` + `requestClient` 拉表格数据 | `useVbenVxeGrid` + `proxyConfig.ajax.query` | FE-VIEW-002 |
| FE-ANTI-012 | view 直接 `import { requestClient }` | `import { getXxxPage } from '#/api'` | FE-VIEW-005 |
| FE-ANTI-013 | 单文件承载 list + form + api | `list.vue` + `data.ts` + `modules/form.vue` | FE-VIEW-001 |

```vue
<!-- ❌ 反模式 — 巨型单文件 -->
<script setup>
// 300 lines: columns, schema, HTTP calls, drawer logic...
</script>
```

## 权限与 i18n 反模式

| ID | 反模式 | 正确做法 | 规则 |
|----|--------|----------|------|
| FE-ANTI-020 | 硬编码 `'sys_user_add'` | `PERM.USER_ADD` | FE-AUTH-001 |
| FE-ANTI-021 | 模板中文「新增用户」 | `$t('ui.actionTitle.create', [...])` | FE-I18N-001 |
| FE-ANTI-022 | 无 `AccessControl` 的删除/导出按钮 | 包裹 `AccessControl` + `PERM` | FE-AUTH-002 |
| FE-ANTI-023 | `localStorage.setItem('password', ...)` | 密码仅表单提交，不落盘 | FE-AUTH-004 |
| FE-ANTI-024 | `console.log(accessToken)` | 日志脱敏 | FE-SEC-001 |

```vue
<!-- ❌ 反模式 -->
<Button @click="onDelete">删除</Button>
<Button>新增用户</Button>

<!-- ✅ 正确 -->
<AccessControl type="code" :codes="[PERM.USER_DEL]">
  <Button danger @click="onDelete">{{ $t('common.delete') }}</Button>
</AccessControl>
```

## 组件与架构反模式

| ID | 反模式 | 正确做法 | 规则 |
|----|--------|----------|------|
| FE-ANTI-030 | 单页面 form 放入 `src/components/` | `views/**/modules/form.vue` | FE-COMP-001 |
| FE-ANTI-031 | 引入 Element Plus / Naive UI | Ant Design Vue + Vben | FE-COMP-002 |
| FE-ANTI-032 | 复制商业版工作流/多租户 UI | 遵守开源版边界 | FE-SCOPE-001 |
| FE-ANTI-033 | 在 `packages/` 改 EDMS 业务逻辑 | 业务代码仅在 `apps/web-app/` | FE-TECH-004 |

## 审查检查清单

`/edms-fe-review` 对 `edms-ui/**` diff 执行：

1. [ ] 无 `/api/system`、`/api/admin/token` 路径
2. [ ] 无 `axios`/`fetch`/`baseRequestClient`（白名单外）
3. [ ] 分页 API 使用 `toBackendPageParams` / `toFrontendPageResult`
4. [ ] views 无 `requestClient` import
5. [ ] 新按钮/操作有 `PERM` + `AccessControl` 或 `authCode`
6. [ ] 新用户可见文案使用 `$t()`
7. [ ] 无 token/password console 输出或 localStorage 持久化
