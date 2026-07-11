# EDMS UI Monorepo `.gitignore` 配置设计

**日期：** 2026-07-08  
**状态：** 已确认  
**策略：** 方案 A — 分层维护（根目录 + `edms-ui/.gitignore`）  
**关联：** Phase 2 前端迁入 `edms-ui/`

---

## 1. 背景与问题

用户将原独立的 Vue Vben Admin 5.7 Monorepo 复制到 `edms-ui/` 目录。当前存在：

1. **两个 `.gitignore`**：根目录（Java/Maven 为主）与 `edms-ui/.gitignore`（Vben 前端规则）
2. **嵌套 Git 仓库**：复制时带入了 `edms-ui/.git/`，与 monorepo 冲突
3. **重复 CI 配置**：`edms-ui/.github/` 含 Vben 上游开源社区 workflow，与根 `.github/workflows/ci.yml` 重复
4. **敏感 env 文件**：`apps/web-app/.env*`、`backend-mock/.env` 已在磁盘上，需确保不被提交

### 1.1 Git 多 `.gitignore` 行为

Git 从仓库根目录到文件所在目录，**沿途所有 `.gitignore` 规则均参与匹配**。子目录 `.gitignore` 中的模式相对于该子目录解析（如 `dist` → `edms-ui/dist`）。任一规则匹配即忽略。

---

## 2. 已确认决策

| 议题 | 决策 |
|------|------|
| 组织方式 | **A. 分层维护** — 根管 Java/全仓/monorepo 专属；`edms-ui/.gitignore` 保持 Vben 规则 |
| `edms-ui/.vscode/` | **提交** — 项目级 IDE 配置（Tailwind/Oxc/ESLint 路径、extensions.json） |
| `edms-ui/.github/` | **不纳入仓库** — 物理删除；CI 统一用根 `ci.yml` |
| env 防护 | **方案 2：双层** — 根目录显式列出 + `edms-ui/.gitignore` 补全无 `.local` 后缀的 env |

---

## 3. 职责划分

```
edms-cloud/                    ← Git 仓库唯一根
├── .gitignore                 ← Java / 全仓 / monorepo 专属
└── edms-ui/
    ├── .gitignore             ← Vben 前端规则（尽量保持与上游一致）
    └── .vscode/               ← 提交（项目级 IDE 配置）
```

| 层级 | 负责 | 不负责 |
|------|------|--------|
| **根 `.gitignore`** | Maven/target、Java IDE、根 `.vscode` example、`node_modules` 全仓兜底、monorepo 专属忽略、edms-ui env 显式路径 | dist、.turbo 等 Vben 构建产物 |
| **`edms-ui/.gitignore`** | dist、.turbo、coverage、pnpm store、前端日志、AI 工具目录、env 补全 | Java/Maven |

### 3.1 Monorepo 专属（仅根目录）

```gitignore
### edms-ui monorepo ###
edms-ui/.git/
edms-ui/.github/
```

### 3.2 VS Code 工作区说明

在仓库根打开时，VS Code **不会**自动应用 `edms-ui/.vscode/`。Phase 2 可选：

- 增加根目录 `edms-cloud.code-workspace` 多根工作区；或
- 文档说明前端开发时以 `edms-ui/` 为工作区根打开

这不影响 `.gitignore` 决策：`edms-ui/.vscode/` 仍应提交。

---

## 4. 根目录 `.gitignore` 变更

在 `### edms-ui env ###` 之前新增：

```gitignore
### edms-ui monorepo ###
# 复制 Vben 时带入的嵌套仓库 / 上游 CI，不得提交
edms-ui/.git/
edms-ui/.github/
```

保留并扩展 `### edms-ui env ###`：

```gitignore
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

**不动：**

- 第 72 行 `node_modules` — 全仓兜底，与 `edms-ui/.gitignore` 重复但无害
- 根 `.vscode/*` example 模式 — 只管 Java 本机路径
- 第 22 行 `*.lock` — 只匹配 `.lock` 后缀，不影响 `pnpm-lock.yaml`

---

## 5. `edms-ui/.gitignore` 变更

在文件**末尾追加**（不修改 Vben 原有规则）：

```gitignore
# --- EDMS monorepo additions (keep when merging Vben upstream) ---
# env files without .local suffix (root .gitignore also covers these)
.env
.env.development
.env.production
.env.analyze
!.env*.example
```

**刻意保留的 Vben 规则：**

| 规则 | 原因 |
|------|------|
| `# .vscode` 保持注释 | 提交 `.vscode/` |
| 忽略 `yarn.lock` / `package-lock.json` | 项目用 pnpm；`pnpm-lock.yaml` **必须提交** |
| `.cursor` 忽略 | 仅影响 `edms-ui/.cursor/`，不影响根 `.cursor/rules/` |

---

## 6. 物理删除清单

ignore 仅作防误复制兜底；以下应从磁盘**直接删除**：

| 路径 | 原因 |
|------|------|
| `edms-ui/.git/` | 嵌套 Git 仓库 |
| `edms-ui/.github/` | Vben 开源 CI/Issue/Dependabot，由根 `ci.yml` 接管 |

---

## 7. 提交 vs 忽略速查

| 路径 | 动作 |
|------|------|
| `edms-ui/pnpm-lock.yaml` | ✅ 提交 |
| `edms-ui/.vscode/` | ✅ 提交 |
| `edms-ui/node_modules/` | ❌ 忽略 |
| `edms-ui/dist/`、`.turbo/` | ❌ 忽略 |
| `edms-ui/apps/web-app/.env*`（非 example） | ❌ 忽略 |
| `edms-ui/.git/`、`.github/` | ❌ 删除且不提交 |

---

## 8. 验收清单

```powershell
# 敏感/构建产物应被忽略
git check-ignore -v edms-ui/apps/web-app/.env
git check-ignore -v edms-ui/node_modules
git check-ignore -v edms-ui/.git

# 关键文件不应被忽略（无输出 = 通过）
git check-ignore -v edms-ui/pnpm-lock.yaml
git check-ignore -v edms-ui/.vscode/settings.json

# 无嵌套仓库
Test-Path edms-ui/.git   # 期望 False

# 预览 edms-ui 纳入版本控制的文件
git status edms-ui/
```

---

## 9. 不在本 spec 范围

- Phase 2 前端源码正式 `git add` 与首次提交
- 根 `ci.yml` frontend job 启用（`if: false` → `true`）
- `edms-cloud.code-workspace` 多根工作区文件
- `edms-ui/.gitpod.yml`、`.gitconfig` 等待定文件的处理（默认保留提交，除非后续发现含本机路径）

---

## 10. 实现顺序（供 implementation plan 使用）

1. 更新根 `.gitignore`
2. 更新 `edms-ui/.gitignore`
3. 删除 `edms-ui/.git/`、`edms-ui/.github/`
4. 运行验收命令
5. （可选）在 `docs/development.md` 补充 monorepo `.gitignore` 说明一句
