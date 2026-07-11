# 业务需求文档

按**业务域 / 功能模块**组织，一份需求覆盖端到端验收标准。**不按前后端拆分**。

## 目录约定

```
docs/requirements/
└── {domain}/
    └── YYYY-MM-DD-{简述}.md
```

## 示例

```
docs/requirements/system-management/
└── 2026-07-08-用户部门菜单字典改造.md
```

## 模板

```markdown
# {功能名称}

## 背景

## 功能需求

1. ...

## 验收标准

- [ ] ...

## 影响范围（实现参考）

- 后端：edms-upms-biz / ...
- 前端：edms-ui/apps/web-app/src/views/system/...
- 数据：db/migrations/...
```

## 与 spec / plan 的关系

| 类型 | 目录 | 用途 |
|------|------|------|
| 业务需求 | `docs/requirements/` | 要做什么 |
| 设计 spec | `docs/superpowers/specs/` | 架构方案 |
| 实施计划 | `docs/superpowers/plans/` | 具体 Task |
| 开发规范 | `docs/backend/`、`docs/frontend/` | 怎么做 |

## 第一个需求建议

系统管理改造（用户、部门、菜单、字典）：

```
docs/requirements/system-management/2026-07-08-系统管理功能改造.md
```
