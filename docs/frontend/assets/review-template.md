> edms-fe Review 模板。`/edms-fe-review` 命令输出格式。

# EDMS 前端多维度 Review 报告

日期: YYYY-MM-DD

审查范围: `frontend/apps/web-app/src/**`（或指定路径）

## 契约视角
### P0
- 业务 API 未使用 `requestClient`（裸 `axios`/`fetch`/`baseRequestClient`）
- 路径前缀非 `/admin/**` 或 `/auth/**`（pig 遗留 `/api/**`）
- 分页未使用 `toBackendPageParams` / `toFrontendPageResult`
- 手动解包 `resp.data.data`，绕过拦截器

### P1
- 分页字段名错误（`list`/`rows`/`count` 而非 `records`/`total`）
- API namespace 未导出或类型与后端 DTO 不一致
- 删除/批量接口 payload 格式与后端不对齐

## Vben 结构视角
### P0
- 列表页未拆分 `list.vue` + `data.ts` + `modules/form.vue`
- 表格数据在 `onMounted` 中直接 `requestClient.get`，未走 `useVbenVxeGrid` + `proxyConfig.ajax.query`
- 表单/列定义数百行内联在 `list.vue`

### P1
- 未使用 `useVbenDrawer` + `connectedComponent` 模式
- `rowConfig.keyField` 与主键字段不一致
- 缺少 `toolbarConfig`（refresh/search）或 `CellOperation` 操作列

## 权限视角
### P0
- 硬编码权限字符串（未引用 `PERM.*`）
- 新增/编辑/删除按钮未包 `AccessControl`
- `CellOperation` 操作列缺少 `authCode`，与后端 `@HasPermission` 不对齐

### P1
- `constants/permissions.ts` 未同步新增权限码
- 敏感操作（重置密码等）无权限控制

## i18n 视角
### P0
- 用户可见中文/英文硬编码，未使用 `$t()`
- 新增模块未在 `locales/**` 添加对应 key

### P1
- locale key 命名不规范（未按 `模块.实体.字段` 分层）
- 表单 label、表格 title、message 文案遗漏国际化

## pig 遗留视角
- [ ] `/api/system/**` 或 `/api/admin/**` 路径
- [ ] 旧 token 端点 `/api/admin/token/login`
- [ ] pig 分页字段 `list`/`count`
- [ ] views 内直接 import `axios`
- [ ] 旧权限码命名或菜单结构假设

## 安全视角
- password/token 写入 localStorage 或 console 输出
- 表单回显 password 字段
- 日志输出完整请求体含敏感字段

## 综合评分
契约一致性: X/10
Vben 结构规范: X/10
权限对齐: X/10
i18n 覆盖: X/10
遗留清理: X/10

## 结论
- [ ] 可合并
- [ ] 需修复 P0 后合并
- [ ] 需讨论
