# EDMS Cloud 单仓目录结构设计

## 背景

当前 EDMS Cloud 项目为前后端混合的单仓（monorepo），远程仓库已推送到 GitHub，但存在以下问题：

1. 后端 7 个模块与前端 `edms-ui/` 在根目录平铺，层级不清晰
2. Docker 相关文件（Dockerfile × 9、docker-compose × 2）散落在各处
3. Git/编辑器配置文件重复（`.editorconfig`、`.gitignore` 各两份）
4. 缺少统一的开发命令入口

**决策**：删除现有 GitHub 远程仓库，清理 git 历史，按新结构重新初始化并上传。

## 约束

| 维度 | 约束 |
|------|------|
| 开发人数 | 1 人（单人开发） |
| 开发模式 | AI 辅助，每个需求前后端同时修改 |
| 部署方式 | 前后端分开部署 |
| 后端技术栈 | Java 17 + Spring Cloud + Maven（多模块） |
| 前端技术栈 | Vue 3 + TypeScript + pnpm workspace（Vben Admin 5.7） |

## 目标结构

```
edms-cloud/
│
├── backend/                          ← Java Spring Cloud 所有模块
│   ├── pom.xml                       ← 从根目录移入
│   ├── lombok.config                 ← 从根目录移入
│   ├── edms-register/                ← Nacos 注册中心
│   ├── edms-gateway/                 ← API 网关
│   ├── edms-auth/                    ← 认证服务
│   ├── edms-upms/                    ← 用户权限管理
│   ├── edms-boot/                    ← 单服务启动器
│   ├── edms-common/                  ← 共享库 / DTO
│   └── edms-visual/                  ← 监控 / 代码生成 / 定时任务
│
├── frontend/                         ← 从 edms-ui 重命名
│   ├── apps/
│   │   ├── web-app/                  ← 业务应用入口
│   │   └── backend-mock/             ← Mock 后端
│   ├── packages/                     ← 共享包（@core、effects、stores 等）
│   ├── scripts/                      ← 前端构建 / 部署脚本
│   ├── package.json
│   ├── pnpm-workspace.yaml
│   └── turbo.json
│
├── deploy/                           ← 【新】集中部署编排文件
│   ├── docker-compose.yml            ← 从根目录移入，更新 context 路径
│   ├── docker-compose-boot.yml       ← 从根目录移入，更新 context 路径
│   └── .env.example                  ← 合并自 config/local.env.example
│
├── database/                         ← 从 db 重命名
│
├── docs/                             ← 文档（不变）
│
├── .github/                          ← CI/CD（更新路径引用）
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml                     ← 统一 CI，更新 backend/frontend 路径
│       └── mirror-gitee.yml           ← 更新或移除（当前指向上游 pig4cloud）
│
├── .vscode/                          ← IDE 配置（不变）
├── .cursor/                          ← IDE 配置（不变）
│
├── .editorconfig                     ← 合并，root=true 仅此处
├── .gitignore                        ← 合并，按 backend/、frontend/ 分区
├── .gitattributes                    ← 统一行尾规则
├── Makefile                          ← 【新】统一开发命令入口
├── README.md
├── LICENSE
└── AGENTS.md
```

## 变更清单

### 目录移动

| 操作 | 源路径 | 目标路径 |
|------|--------|----------|
| 移动 | `pom.xml` | `backend/pom.xml` |
| 移动 | `lombok.config` | `backend/lombok.config` |
| 移动 | `edms-register/` | `backend/edms-register/` |
| 移动 | `edms-gateway/` | `backend/edms-gateway/` |
| 移动 | `edms-auth/` | `backend/edms-auth/` |
| 移动 | `edms-upms/` | `backend/edms-upms/` |
| 移动 | `edms-boot/` | `backend/edms-boot/` |
| 移动 | `edms-common/` | `backend/edms-common/` |
| 移动 | `edms-visual/` | `backend/edms-visual/` |
| 重命名 | `edms-ui/` | `frontend/` |
| 重命名 | `db/` | `database/` |
| 移动 | `docker-compose.yml` | `deploy/docker-compose.yml` |
| 移动 | `docker-compose-boot.yml` | `deploy/docker-compose-boot.yml` |
| 移动 | `config/local.env.example` | `deploy/.env.example` |

### Dockerfile 处理

**Dockerfile 不集中化，保持在各自模块目录内**。原因：每个 Dockerfile 内部使用 `COPY ./target/*.jar` 等相对路径，Dockerfile 所在目录即为构建上下文。集中化会导致所有 COPY 路径断裂，得不偿失。

仅移动 docker-compose 编排文件到 `deploy/`，更新其中的 `context` 路径指向新模块位置即可。

### 删除

| 路径 | 原因 |
|------|------|
| `edms-ui/.gitignore` | 合并到根 `.gitignore` |
| `edms-ui/.editorconfig` | 合并到根 `.editorconfig` |
| `edms-ui/.gitattributes` | 提升到根 `.gitattributes` |
| `edms-ui/.gitconfig` | 个人偏好，不应提交 |
| `edms-ui/.gitpod.yml` | 未使用 Gitpod |
| `config/local.env` | 敏感信息（含密钥），不应提交 |
| `config/` | 该目录清空后删除 |
| `.gogs/` | 已迁移至 GitHub，不再使用 |
| `edms-ui/node_modules/` | 重命名前清理，减小操作体积 |
| `edms-ui/.git/` | 上游 Vben Admin 携带的独立 git 仓库，不应提交 |
| `edms-ui/.github/` | 上游 Vben Admin 携带的独立 CI 配置，不应提交 |
| `edms-ui/.dockerignore` | 合并到根 `.gitignore`（前端构建产物模式已覆盖） |

注：`.gitignore` 中仍需保留 `frontend/.git/` 和 `frontend/.github/` 规则，防止后续从上游合并时重新带入。

## 配置文件合并策略

### .editorconfig

合并两份 `.editorconfig`，以 `root = true` 仅在根目录声明，通过 glob 模式区分前后端规则：

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

# --- 后端 Java ---
[*.{java,kt,kts,groovy,xml,xsd}]
indent_style = tab
indent_size = 4
continuation_indent_size = 8

# --- 前端 TypeScript/Vue ---
[*.{ts,tsx,vue,js,jsx,json,yml,yaml,css,scss,html,md}]
indent_style = space
indent_size = 2
max_line_length = 100
quote_type = single

[*.md]
trim_trailing_whitespace = false

[*.{cmd,bat}]
end_of_line = crlf
```

### .gitignore

合并策略：按目录分区，每个区域加注释标识来源。

```gitignore
# === Java / Maven ===
.gradle
/build/
target/
*.war
*.ear
*.zip
*.tar
*.tar.gz

# === IDE ===
.idea/
*.iws
*.iml
*.ipr
*.lock
rebel.xml
.settings/
.apt_generated
.classpath
.factorypath
.project
.springBeans
bin/
nbproject/

# === VS Code ===
.vscode/*
!.vscode/settings.json.example
!.vscode/launch.json.example

# === Logs ===
/logs/
*.log

# === OS ===
.DS_Store
Thumbs.db

# === Temp ===
*.cache
*.diff
*.patch
*.tmp
*.java~
*.properties~
*.xml~
sessionStore
upload
gen_code

# === Frontend: 上游 Vben Admin 携带的独立仓库（不得提交） ===
frontend/.git/
frontend/.github/

# === Frontend / Node ===
node_modules
dist
dist-ssr
dist.zip
dist.tar
dist.war
.nitro
.output
coverage
*.local
**/.vitepress/cache
.cache
.turbo
.temp
dev-dist
.stylelintcache
yarn.lock
package-lock.json
.VSCodeCounter
**/backend-mock/data
.omx
.pnpm-store

# === Frontend Env ===
.env
.env.local
.env.*.local
.env.development
.env.production
.env.analyze
.eslintcache
!.env*.example

# === AI / Claude ===
.claude
.agent
.agents
.codex
skills-lock.json
.atomcode
datalog

# === Local Dev ===
deploy/.env
application-preview.yml
```

### .gitattributes

统一行尾处理：

```gitattributes
* text=auto eol=lf

*.{cmd,[cC][mM][dD]} text eol=crlf
*.{bat,[bB][aA][tT]} text eol=crlf

*.{ico,png,jpg,jpeg,gif,webp,svg,woff,woff2} binary
```

## docker-compose 路径更新

### docker-compose.yml（微服务架构）

| 服务 | 原 context | 新 context |
|------|-----------|------------|
| `edms-mysql` | `./db` | `../database` |
| `edms-register` | `./edms-register` | `../backend/edms-register` |
| `edms-gateway` | `./edms-gateway` | `../backend/edms-gateway` |
| `edms-auth` | `./edms-auth` | `../backend/edms-auth` |
| `edms-upms` | `./edms-upms/edms-upms-biz` | `../backend/edms-upms/edms-upms-biz` |
| `edms-monitor` | `./edms-visual/edms-monitor` | `../backend/edms-visual/edms-monitor` |
| `edms-quartz` | `./edms-visual/edms-quartz` | `../backend/edms-visual/edms-quartz` |
| `edms-codegen` | `./edms-visual/edms-codegen` | `../backend/edms-visual/edms-codegen` |

### docker-compose-boot.yml（单体架构）

| 服务 | 原 context | 新 context |
|------|-----------|------------|
| `edms-mysql` | `./db` | `../database` |
| `edms-gateway` | `./edms-boot` | `../backend/edms-boot` |

Dockerfile 本身 **不需要任何修改**，因为 `ADD ./target/*.jar` 等 COPY 路径相对于各模块目录不变。

## CI/CD 流水线

当前 `.github/workflows/ci.yml` 为单一的 CI 文件，包含 backend 和 frontend 两个 job。
目录调整后需要更新其中的硬编码路径：

```yaml
# ci.yml 需更新的字段
jobs:
  backend:
    steps:
      # 之前：run: mvn verify -Pcloud -B
      # 之后：
      - name: Build and test
        working-directory: backend
        run: mvn verify -Pcloud -B

  frontend:
    steps:
      # 之前：cache-dependency-path: edms-ui/pnpm-lock.yaml
      # 之后：
      - uses: actions/setup-node@v4
        with:
          cache-dependency-path: frontend/pnpm-lock.yaml

      # 之前：working-directory: edms-ui
      # 之后：
      - name: Install and build
        working-directory: frontend
        run: |
          pnpm install --frozen-lockfile
          pnpm build
```

`mirror-gitee.yml` 当前推送到 `git@gitee.com:log4j/pig.git`（上游 pig4cloud 仓库），不属于你的账号。
**两个选择**：
- A) 如果你有自己的 Gitee 仓库：更新 remote URL 为你的地址
- B) 如果不需要 Gitee 镜像：删除此文件

## Makefile

统一开发入口，减少记忆负担：

```makefile
.PHONY: dev dev-backend dev-frontend build build-backend build-frontend deploy clean

dev:
	@echo "Starting backend & frontend in parallel..."
	(cd backend && mvn spring-boot:run -pl edms-boot) &
	(cd frontend && pnpm dev)
	wait

dev-backend:
	cd backend && mvn spring-boot:run -pl edms-boot

dev-frontend:
	cd frontend && pnpm dev

build:
	cd backend && mvn clean install -T 4 -Pcloud
	cd frontend && pnpm build

deploy:
	docker compose -f deploy/docker-compose.yml up -d

clean:
	cd backend && mvn clean
	cd frontend && pnpm clean
```

## 实施步骤

1. 备份：`cp -r edms-cloud edms-cloud-backup`
2. 清理：删除 `edms-ui/node_modules/`、`edms-ui/.git/`、`edms-ui/.github/`（上游 Vben Admin 携带）
3. 删除根目录 `.git`，执行 `git init`
4. 按变更清单用 `mv` 移动/重命名目录和文件（新仓库无历史，直接 `mv` 即可）
5. 删除清单中标记的文件和空目录
6. 创建合并后的 `.editorconfig`、`.gitignore`、`.gitattributes`
7. 创建 `Makefile`、`deploy/.env.example`
8. 更新 `deploy/docker-compose.yml` 和 `deploy/docker-compose-boot.yml` 的 context 路径
9. 更新 `.github/workflows/ci.yml` 中的 `working-directory` 和 `cache-dependency-path`
10. 处理 `mirror-gitee.yml`（删除或更新为自己的 Gitee 仓库地址）
11. `git add` 前确认 `.gitignore` 生效，`frontend/node_modules/` 不会被跟踪
12. 验证本地构建：
    - `cd backend && mvn clean compile` 通过
    - `cd frontend && pnpm install && pnpm dev` 通过
    - `docker compose -f deploy/docker-compose.yml config` 无报错
13. 创建 GitHub 远程仓库 `edms-cloud`
14. 推送初始 commit
