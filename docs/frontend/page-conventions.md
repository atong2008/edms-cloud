# 页面文件约定

## 标准目录结构

```
views/{domain}/{feature}/
├── list.vue              # 列表页（路由 component 指向此文件）
├── data.ts               # 表格列 + 表单 schema
└── modules/
    ├── form.vue          # 新增/编辑
    └── detail.vue        # 详情（可选）
```

### 示例

```
views/system/user/
├── list.vue
├── data.ts
└── modules/
    ├── form.vue
    └── detail.vue
```

## 文件职责

| 文件 | 职责 |
|------|------|
| `list.vue` | 页面主逻辑：Grid、Drawer、CRUD 事件 |
| `data.ts` | 导出 `useColumns()`、`useFormSchema()`、`useGridFormSchema()` |
| `modules/form.vue` | 新增/编辑表单，通过 Drawer/Modal 连接 |
| `modules/detail.vue` | 详情展示（按需） |

## 关联文件

每个页面对应以下配套文件：

| 类型 | 路径 | 示例 |
|------|------|------|
| API | `api/{domain}/{resource}.ts` | `api/system/user.ts` |
| 路由 | `router/routes/modules/{domain}.ts` | `router/routes/modules/system.ts` |
| i18n | `locales/langs/{lang}/{domain}.json` | `locales/langs/zh-CN/system.json` |

## 命名规则

| 项 | 规则 |
|----|------|
| 列表页入口 | 固定 `list.vue`，禁止 `index.vue` |
| 配置文件 | 固定 `data.ts` |
| 子组件目录 | 固定 `modules/` |
| 表单组件 | 固定 `form.vue` |
| 路由 path | `/domain/feature`，如 `/system/user` |
| 路由 name | PascalCase，如 `SystemUser` |

## 禁止事项

- 不在 `views/` 下用 `index.vue` 作为页面入口
- 不在 `list.vue` 内硬编码 columns / form schema
- 不在页面组件内直接调用 axios
- 不在 `data.ts` 中编写 UI 逻辑（仅配置数据）

## 新增页面 Checklist

- [ ] 创建 `views/{domain}/{feature}/list.vue`
- [ ] 创建 `views/{domain}/{feature}/data.ts`
- [ ] 创建 `views/{domain}/{feature}/modules/form.vue`
- [ ] 创建 `api/{domain}/{feature}.ts` 并注册到 `index.ts`
- [ ] 在 `router/routes/modules/{domain}.ts` 添加路由
- [ ] 在 `locales/langs/*/​{domain}.json` 添加文案
