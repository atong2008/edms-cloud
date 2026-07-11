# EDMS UI Monorepo `.gitignore` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按 spec 配置 monorepo 分层 `.gitignore`，删除 `edms-ui` 嵌套 Git 与上游 `.github/`，确保敏感 env 与构建产物不被提交。

**Architecture:** 根 `.gitignore` 负责 Java/全仓/monorepo 专属规则；`edms-ui/.gitignore` 保留 Vben 前端规则并在末尾追加 EDMS env 补全。嵌套目录物理删除，ignore 作兜底。

**Tech Stack:** Git、PowerShell（Windows 验收命令）

**Spec:** `docs/superpowers/specs/2026-07-08-edms-ui-gitignore-design.md`

## Global Constraints

- 组织方式：分层维护 — 不合并 `edms-ui/.gitignore` 到根目录
- 提交 `edms-ui/.vscode/`；不提交 `edms-ui/.github/`、`edms-ui/.git/`
- env 双层防护：根目录显式路径 + `edms-ui/.gitignore` 补全
- 必须提交 `edms-ui/pnpm-lock.yaml`
- 不在本 plan 范围：前端源码 bulk `git add`、启用 CI frontend job、`code-workspace` 文件

---

## File Map

| 文件 | 操作 | 职责 |
|------|------|------|
| `.gitignore` | 修改 | 新增 monorepo 区块；扩展 edms-ui env 路径 |
| `edms-ui/.gitignore` | 修改 | 末尾追加 EDMS env 补全 |
| `edms-ui/.git/` | 删除 | 嵌套 Git 仓库 |
| `edms-ui/.github/` | 删除 | Vben 上游 CI/Issue 配置 |
| `docs/development.md` | 修改（可选） | 一句 monorepo gitignore 说明 |
| `docs/superpowers/specs/2026-07-08-edms-ui-gitignore-design.md` | 修改 | 状态改为「已确认」 |

---

### Task 1: 更新根目录 `.gitignore`

**Files:**
- Modify: `.gitignore:71-82`

**Interfaces:**
- Consumes: 无
- Produces: 根 `.gitignore` 含 `edms-ui/.git/`、`edms-ui/.github/` 及完整 env 路径

- [ ] **Step 1: 在 `### node ###` 与 `### edms-ui env ###` 之间插入 monorepo 区块**

将 `.gitignore` 第 71–82 行区域替换为：

```gitignore
### node ###
node_modules

### edms-ui monorepo ###
# 复制 Vben 时带入的嵌套仓库 / 上游 CI，不得提交
edms-ui/.git/
edms-ui/.github/

### edms-ui env ###
edms-ui/.env
edms-ui/.env.local
edms-ui/apps/web-app/.env
edms-ui/apps/web-app/.env.local
edms-ui/apps/web-app/.env.development
edms-ui/apps/web-app/.env.production
edms-ui/apps/web-app/.env.analyze
edms-ui/apps/backend-mock/.env
!edms-ui/apps/web-app/.env.development.example
!edms-ui/apps/web-app/.env.production.example
```

- [ ] **Step 2: 验证 monorepo 规则生效**

Run:

```powershell
git check-ignore -v edms-ui/.git
git check-ignore -v edms-ui/.github/workflows/ci.yml
git check-ignore -v edms-ui/apps/web-app/.env
```

Expected: 三行均有输出，分别匹配 `.gitignore` 中 monorepo 或 env 规则。

- [ ] **Step 3: Commit**

```powershell
git add .gitignore
git commit -m "chore(gitignore): add edms-ui monorepo and env rules at repo root"
```

---

### Task 2: 更新 `edms-ui/.gitignore`

**Files:**
- Modify: `edms-ui/.gitignore`（文件末尾）

**Interfaces:**
- Consumes: Task 1 根 env 规则（双层防护）
- Produces: `edms-ui/.gitignore` 末尾 EDMS 追加块

- [ ] **Step 1: 在 `edms-ui/.gitignore` 末尾追加**

```gitignore

# --- EDMS monorepo additions (keep when merging Vben upstream) ---
# env files without .local suffix (root .gitignore also covers these)
.env
.env.development
.env.production
.env.analyze
!.env*.example
```

- [ ] **Step 2: 确认 Vben 规则未改动**

Run:

```powershell
Select-String -Path edms-ui/.gitignore -Pattern "^# \.vscode$"
Select-String -Path edms-ui/.gitignore -Pattern "^\.cursor$"
```

Expected: 两行均匹配（`.vscode` 仍为注释；`.cursor` 仍被忽略）。

- [ ] **Step 3: 验证子目录 env 规则（模拟单独打开 edms-ui）**

Run:

```powershell
git check-ignore -v edms-ui/apps/web-app/.env.development
```

Expected: 匹配 `edms-ui/.gitignore` 中 `.env.development` 或根 `.gitignore` env 规则。

- [ ] **Step 4: Commit**

```powershell
git add edms-ui/.gitignore
git commit -m "chore(edms-ui): extend gitignore for monorepo env files"
```

---

### Task 3: 删除嵌套目录

**Files:**
- Delete: `edms-ui/.git/`
- Delete: `edms-ui/.github/`

**Interfaces:**
- Consumes: Task 1 ignore 规则（防误复制兜底）
- Produces: 无嵌套 Git；磁盘无 `edms-ui/.github/`

- [ ] **Step 1: 删除嵌套 Git 与上游 GitHub 配置**

```powershell
Remove-Item -Recurse -Force edms-ui/.git
Remove-Item -Recurse -Force edms-ui/.github
```

- [ ] **Step 2: 确认删除成功**

Run:

```powershell
Test-Path edms-ui/.git
Test-Path edms-ui/.github
```

Expected: 两行均输出 `False`。

- [ ] **Step 3: Commit（若有 gitignore 已提交则本步无文件变更，跳过 commit）**

本 task 仅删除被 ignore 或未跟踪目录，通常不产生新 commit。若 Step 2 通过即可进入 Task 4。

---

### Task 4: 全量验收

**Files:** 无

**Interfaces:**
- Consumes: Task 1–3 全部产出
- Produces: 验收通过记录

- [ ] **Step 1: 应忽略的路径**

Run:

```powershell
git check-ignore -v edms-ui/apps/web-app/.env
git check-ignore -v edms-ui/node_modules
git check-ignore -v edms-ui/dist
git check-ignore -v edms-ui/.turbo
git check-ignore -v edms-ui/apps/backend-mock/.env
```

Expected: 每行均有输出。

- [ ] **Step 2: 应提交的路径（无输出 = 通过）**

Run:

```powershell
git check-ignore -v edms-ui/pnpm-lock.yaml
git check-ignore -v edms-ui/.vscode/settings.json
git check-ignore -v edms-ui/package.json
```

Expected: 无输出（exit code 1 表示未被 ignore，属正常）。

- [ ] **Step 3: 预览 edms-ui 跟踪状态**

Run:

```powershell
git status edms-ui/ --short | Select-Object -First 20
```

Expected:
- 不出现 `edms-ui/.git` 或 `edms-ui/.github`
- 不出现 `node_modules`、`.env`（非 example）
- 出现 `edms-ui/.gitignore`、`pnpm-lock.yaml`、`.vscode/` 等为 `??` 或已修改

---

### Task 5: 文档与 spec 状态（可选）

**Files:**
- Modify: `docs/development.md`
- Modify: `docs/superpowers/specs/2026-07-08-edms-ui-gitignore-design.md:4`

- [ ] **Step 1: 更新 spec 状态**

将 spec 第 4 行 `**状态：** 待 review` 改为 `**状态：** 已确认`。

- [ ] **Step 2: 在 `docs/development.md` 适当位置（前端开发小节附近）追加一段**

```markdown
### Monorepo `.gitignore`

- 根目录 `.gitignore`：Java/全仓规则 + `edms-ui/.git/`、`edms-ui/.github/` + env 显式路径
- `edms-ui/.gitignore`：Vben 前端构建产物与 env 补全；`pnpm-lock.yaml` 需提交
- 复制 Vben 后务必删除 `edms-ui/.git/`；前端 IDE 配置见 `edms-ui/.vscode/`（提交到仓库）
```

- [ ] **Step 3: Commit**

```powershell
git add docs/superpowers/specs/2026-07-08-edms-ui-gitignore-design.md docs/development.md
git commit -m "docs: confirm gitignore spec and note monorepo ignore layout"
```

---

## Spec Coverage Checklist

| Spec 章节 | Task |
|-----------|------|
| §3 职责划分 | Task 1, 2 |
| §4 根 `.gitignore` | Task 1 |
| §5 `edms-ui/.gitignore` | Task 2 |
| §6 物理删除 | Task 3 |
| §7 提交 vs 忽略 | Task 4 |
| §8 验收清单 | Task 4 |
| §10 实现顺序 | Task 1–5 |
| §9 不在范围 | 未包含 bulk add / CI / workspace |
