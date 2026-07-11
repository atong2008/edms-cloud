# EDMS Cloud 单仓目录重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 EDMS Cloud 项目从平铺目录结构重构为 `backend/` + `frontend/` 分层结构，统一配置文件，清理 git 历史并重新推送。

**Architecture:** 纯文件系统操作 — 目录移动/重命名、配置文件合并、路径更新。不涉及代码逻辑变更。关键约束：Dockerfile 保持原位不移动（避免 COPY 路径断裂），Maven 模块路径随 pom.xml 同步移动故不需修改。

**Tech Stack:** Git, Bash (mv/rm/mkdir/cp), Docker Compose, Maven, pnpm

## Global Constraints

- 单人开发，无多人协作冲突风险
- Dockerfile 不可集中化（内部 COPY 路径依赖模块目录上下文）
- pom.xml 与后端模块同步移入 `backend/`，Maven `<module>` 声明无需修改
- `.editorconfig` 仅保留根目录一份（`root = true`）
- `.gitignore` 仅保留根目录一份，按技术栈分区
- 需特别保护：`frontend/.git/` 和 `frontend/.github/` 必须在 `.gitignore` 中排除
- 最终验证：三端构建均通过（backend Maven compile、frontend pnpm dev、docker compose config）

---

### Task 1: 备份项目

**Files:**
- 无文件变更（纯文件系统操作）

- [ ] **Step 1: 创建备份**

```bash
cd d:/wwwroot
cp -r edms-cloud edms-cloud-backup
```

- [ ] **Step 2: 验证备份完整性**

```bash
diff -r edms-cloud edms-cloud-backup 2>&1 | head -5
```

Expected: 无输出（两个目录完全一致）

- [ ] **Step 3: 记录当前 git HEAD**

```bash
cd d:/wwwroot/edms-cloud
git log --oneline -1
```

Expected: 显示当前最新 commit（如 `e4a3da5 feat(edms-ui): migrate Vue Vben Admin 5.7 monorepo`）
将此 commit hash 记录到 `docs/superpowers/plans/2026-07-11-monorepo-restructure.md` 下方备注区。

---

### Task 2: 清理上游 Vben Admin 携带文件

**Files:**
- Delete: `edms-ui/node_modules/`
- Delete: `edms-ui/.git/`
- Delete: `edms-ui/.github/`

- [ ] **Step 1: 删除 node_modules（体积最大，先清理）**

```bash
cd d:/wwwroot/edms-cloud
rm -rf edms-ui/node_modules
```

- [ ] **Step 2: 删除上游 git 仓库**

```bash
rm -rf edms-ui/.git
```

- [ ] **Step 3: 删除上游 CI 配置**

```bash
rm -rf edms-ui/.github
```

- [ ] **Step 4: 验证删除结果**

```bash
test -d edms-ui/node_modules && echo "FAIL: node_modules still exists" || echo "OK: node_modules removed"
test -d edms-ui/.git && echo "FAIL: .git still exists" || echo "OK: .git removed"
test -d edms-ui/.github && echo "FAIL: .github still exists" || echo "OK: .github removed"
```

Expected: 全部输出 `OK`

---

### Task 3: 删除旧 git 历史并重新初始化

**Files:**
- Delete: `.git/`

- [ ] **Step 1: 删除 .git 目录**

```bash
cd d:/wwwroot/edms-cloud
rm -rf .git
```

- [ ] **Step 2: 重新初始化 git 仓库**

```bash
git init
```

Expected: `Initialized empty Git repository in d:/wwwroot/edms-cloud/.git/`

- [ ] **Step 3: 确认干净的初始状态**

```bash
git status
```

Expected: 显示所有文件均为 untracked，分支为 `master`（或你设定的默认分支名）

---

### Task 4: 创建 backend/ 目录并移入所有后端模块

**Files:**
- Move: `pom.xml` → `backend/pom.xml`
- Move: `lombok.config` → `backend/lombok.config`
- Move: `edms-register/` → `backend/edms-register/`
- Move: `edms-gateway/` → `backend/edms-gateway/`
- Move: `edms-auth/` → `backend/edms-auth/`
- Move: `edms-upms/` → `backend/edms-upms/`
- Move: `edms-boot/` → `backend/edms-boot/`
- Move: `edms-common/` → `backend/edms-common/`
- Move: `edms-visual/` → `backend/edms-visual/`

- [ ] **Step 1: 创建 backend 目录**

```bash
cd d:/wwwroot/edms-cloud
mkdir -p backend
```

- [ ] **Step 2: 移动 pom.xml 和 lombok.config**

```bash
mv pom.xml backend/pom.xml
mv lombok.config backend/lombok.config
```

- [ ] **Step 3: 批量移动 7 个后端模块**

```bash
for module in edms-register edms-gateway edms-auth edms-upms edms-boot edms-common edms-visual; do
  mv "$module" "backend/$module"
done
```

- [ ] **Step 4: 验证移动结果**

```bash
echo "=== 后端模块应全部在 backend/ 下 ===" && ls -d backend/*/ && echo "=== 根目录不应残留 edms-* ===" && ls -d edms-* 2>&1
```

Expected: `backend/` 下有 7 个模块目录 + pom.xml + lombok.config；根目录 `ls -d edms-*` 报错 "No such file or directory"

- [ ] **Step 5: 验证 Maven 模块路径无需修改**

```bash
grep '<module>' backend/pom.xml
```

Expected: 输出 `<module>edms-register</module>` 等（相对路径不变，因为 pom.xml 与模块同级）

---

### Task 5: 重命名前端和数据库目录

**Files:**
- Rename: `edms-ui/` → `frontend/`
- Rename: `db/` → `database/`

- [ ] **Step 1: 重命名前端目录**

```bash
cd d:/wwwroot/edms-cloud
mv edms-ui frontend
```

- [ ] **Step 2: 重命名数据库目录**

```bash
mv db database
```

- [ ] **Step 3: 验证重命名结果**

```bash
test -d frontend && echo "OK: frontend exists" || echo "FAIL: frontend missing"
test -d database && echo "OK: database exists" || echo "FAIL: database missing"
test -d edms-ui && echo "FAIL: edms-ui still exists" || echo "OK: edms-ui removed"
test -d db && echo "FAIL: db still exists" || echo "OK: db removed"
```

Expected: 全部 `OK`

---

### Task 6: 创建 deploy/ 目录并集中部署编排文件

**Files:**
- Move: `docker-compose.yml` → `deploy/docker-compose.yml`
- Move: `docker-compose-boot.yml` → `deploy/docker-compose-boot.yml`
- Move: `config/local.env.example` → `deploy/.env.example`

- [ ] **Step 1: 创建 deploy 目录**

```bash
cd d:/wwwroot/edms-cloud
mkdir -p deploy
```

- [ ] **Step 2: 移动 docker-compose 文件**

```bash
mv docker-compose.yml deploy/docker-compose.yml
mv docker-compose-boot.yml deploy/docker-compose-boot.yml
```

- [ ] **Step 3: 移动环境变量模板**

```bash
mv config/local.env.example deploy/.env.example
```

- [ ] **Step 4: 验证移动结果**

```bash
ls -la deploy/
```

Expected: 显示 `docker-compose.yml`、`docker-compose-boot.yml`、`.env.example` 三个文件

---

### Task 7: 删除废弃文件和空目录

**Files:**
- Delete: `edms-ui/.gitignore`（已随目录重命名变为 `frontend/.gitignore`，需显式删除）
- Delete: `frontend/.editorconfig`
- Delete: `frontend/.gitattributes`
- Delete: `frontend/.gitconfig`
- Delete: `frontend/.gitpod.yml`
- Delete: `frontend/.dockerignore`
- Delete: `config/local.env`
- Delete: `config/`
- Delete: `.gogs/`

- [ ] **Step 1: 删除 frontend/ 内重复的配置文件**

```bash
cd d:/wwwroot/edms-cloud
rm -f frontend/.gitignore \
      frontend/.editorconfig \
      frontend/.gitattributes \
      frontend/.gitconfig \
      frontend/.gitpod.yml \
      frontend/.dockerignore
```

- [ ] **Step 2: 删除敏感环境变量**

```bash
rm -f config/local.env
```

- [ ] **Step 3: 删除空的 config/ 和 .gogs/**

```bash
rm -rf config
rm -rf .gogs
```

- [ ] **Step 4: 验证删除结果**

```bash
for f in frontend/.gitignore frontend/.editorconfig frontend/.gitattributes frontend/.gitconfig frontend/.gitpod.yml frontend/.dockerignore config .gogs; do
  test -e "$f" && echo "FAIL: $f still exists" || echo "OK: $f removed"
done
```

Expected: 全部 `OK`

---

### Task 8: 创建合并后的 .editorconfig

**Files:**
- Create: `.editorconfig`

- [ ] **Step 1: 写入合并后的 .editorconfig**

```bash
cd d:/wwwroot/edms-cloud
cat > .editorconfig << 'EDITORCONFIG_EOF'
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
EDITORCONFIG_EOF
```

- [ ] **Step 2: 验证文件内容**

```bash
cat .editorconfig
```

Expected: 内容与上文一致

---

### Task 9: 创建合并后的 .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: 写入合并后的 .gitignore**

```bash
cd d:/wwwroot/edms-cloud
cat > .gitignore << 'GITIGNORE_EOF'
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
GITIGNORE_EOF
```

- [ ] **Step 2: 验证文件内容**

```bash
wc -l .gitignore && grep 'frontend/.git/' .gitignore
```

Expected: 约 100 行；`grep` 输出 `frontend/.git/`

---

### Task 10: 创建 .gitattributes

**Files:**
- Create: `.gitattributes`

- [ ] **Step 1: 写入 .gitattributes**

```bash
cd d:/wwwroot/edms-cloud
cat > .gitattributes << 'GITATTR_EOF'
* text=auto eol=lf

*.{cmd,[cC][mM][dD]} text eol=crlf
*.{bat,[bB][aA][tT]} text eol=crlf

*.{ico,png,jpg,jpeg,gif,webp,svg,woff,woff2} binary
GITATTR_EOF
```

- [ ] **Step 2: 验证文件内容**

```bash
cat .gitattributes
```

Expected: 内容与上文一致

---

### Task 11: 创建 Makefile

**Files:**
- Create: `Makefile`

- [ ] **Step 1: 写入 Makefile**

```bash
cd d:/wwwroot/edms-cloud
cat > Makefile << 'MAKEFILE_EOF'
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
MAKEFILE_EOF
```

- [ ] **Step 2: 验证 Makefile 语法**

```bash
make -n dev 2>&1 | head -5
```

Expected: 显示 dry-run 输出，无语法错误

---

### Task 12: 更新 deploy/docker-compose.yml 路径

**Files:**
- Modify: `deploy/docker-compose.yml`

- [ ] **Step 1: 更新所有 context 路径**

使用以下命令批量替换：

```bash
cd d:/wwwroot/edms-cloud
sed -i 's|context: ./db|context: ../database|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-register|context: ../backend/edms-register|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-gateway|context: ../backend/edms-gateway|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-auth|context: ../backend/edms-auth|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-upms/edms-upms-biz|context: ../backend/edms-upms/edms-upms-biz|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-visual/edms-monitor|context: ../backend/edms-visual/edms-monitor|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-visual/edms-quartz|context: ../backend/edms-visual/edms-quartz|g' deploy/docker-compose.yml
sed -i 's|context: ./edms-visual/edms-codegen|context: ../backend/edms-visual/edms-codegen|g' deploy/docker-compose.yml
```

- [ ] **Step 2: 验证所有旧路径已替换**

```bash
grep 'context: \./' deploy/docker-compose.yml
```

Expected: 无输出（所有 `context: ./` 都已替换为 `context: ../`）

- [ ] **Step 3: 验证新路径正确**

```bash
grep 'context:' deploy/docker-compose.yml
```

Expected: 显示 8 行，全部为 `context: ../database` 或 `context: ../backend/edms-*`

---

### Task 13: 更新 deploy/docker-compose-boot.yml 路径

**Files:**
- Modify: `deploy/docker-compose-boot.yml`

- [ ] **Step 1: 更新 context 路径**

```bash
cd d:/wwwroot/edms-cloud
sed -i 's|context: ./db|context: ../database|g' deploy/docker-compose-boot.yml
sed -i 's|context: ./edms-boot|context: ../backend/edms-boot|g' deploy/docker-compose-boot.yml
```

- [ ] **Step 2: 验证**

```bash
grep 'context:' deploy/docker-compose-boot.yml
```

Expected: 输出 `context: ../database` 和 `context: ../backend/edms-boot`

---

### Task 14: 更新 .github/workflows/ci.yml 路径

**Files:**
- Modify: `.github/workflows/ci.yml`

- [ ] **Step 1: 更新后端 job — 添加 working-directory**

读取当前 ci.yml 的 backend job 部分：

```bash
cd d:/wwwroot/edms-cloud
cat .github/workflows/ci.yml
```

找到 `- name: Build and test` 步骤，将：

```yaml
      - name: Build and test
        run: mvn verify -Pcloud -B
```

改为：

```yaml
      - name: Build and test
        working-directory: backend
        run: mvn verify -Pcloud -B
```

具体修改命令：

```bash
# 在 run: mvn verify 之前插入 working-directory
sed -i '/run: mvn verify -Pcloud -B/i\        working-directory: backend' .github/workflows/ci.yml
```

- [ ] **Step 2: 更新前端 job — 修改 edms-ui 为 frontend**

```bash
sed -i 's|edms-ui/pnpm-lock.yaml|frontend/pnpm-lock.yaml|g' .github/workflows/ci.yml
sed -i 's|working-directory: edms-ui|working-directory: frontend|g' .github/workflows/ci.yml
```

- [ ] **Step 3: 验证所有 edms-ui 引用已替换**

```bash
grep 'edms-ui' .github/workflows/ci.yml
```

Expected: 无输出

- [ ] **Step 4: 验证新路径**

```bash
grep -E 'working-directory|cache-dependency-path' .github/workflows/ci.yml
```

Expected: 显示 `working-directory: backend`、`working-directory: frontend`、`cache-dependency-path: frontend/pnpm-lock.yaml`

---

### Task 15: 处理 mirror-gitee.yml

**Files:**
- Modify or Delete: `.github/workflows/mirror-gitee.yml`

**两种方案，按需执行：**

- [ ] **Step A（你拥有 Gitee 仓库时）: 更新 remote URL**

```bash
cd d:/wwwroot/edms-cloud
# 将 git@gitee.com:log4j/pig.git 替换为你的 Gitee 仓库地址
# 例如：sed -i 's|git@gitee.com:log4j/pig.git|git@gitee.com:你的用户名/edms-cloud.git|' .github/workflows/mirror-gitee.yml
```

- [ ] **Step B（不需要 Gitee 镜像时）: 删除文件**

```bash
rm .github/workflows/mirror-gitee.yml
```

---

### Task 16: 首次 git add 并验证 .gitignore 生效

**Files:**
- 无文件变更（git 操作）

- [ ] **Step 1: 确认目录结构符合预期**

```bash
cd d:/wwwroot/edms-cloud
ls -1
```

Expected: 根目录显示 `AGENTS.md  LICENSE  Makefile  README.md  backend  database  deploy  docs  frontend`（不再有 `edms-*` 平铺）

- [ ] **Step 2: git add 所有文件**

```bash
git add .
```

- [ ] **Step 3: 检查暂存区是否有不应提交的文件**

```bash
git status
```

重点检查：
- ❌ 不应出现 `frontend/node_modules/`
- ❌ 不应出现 `frontend/.git/`
- ❌ 不应出现 `frontend/.github/`
- ❌ 不应出现 `deploy/.env`（只有 `.env.example`）
- ✅ 应包含 `backend/pom.xml`、`backend/lombok.config`
- ✅ 应包含 `deploy/docker-compose.yml`、`deploy/docker-compose-boot.yml`
- ✅ 应包含 `.editorconfig`、`.gitignore`、`.gitattributes`、`Makefile`

如果出现不应提交的文件，按以下步骤处理：

```bash
# 如发现 frontend/node_modules/ 被跟踪：
git rm -r --cached frontend/node_modules/ 2>/dev/null
# 确认 .gitignore 中 node_modules 行存在
grep 'node_modules' .gitignore
```

- [ ] **Step 4: 确认无误后取消暂存（验证阶段不提交）**

```bash
git reset HEAD -- .
```

---

### Task 17: 验证本地构建 — 后端 Maven compile

**Files:**
- 无文件变更（验证步骤）

- [ ] **Step 1: 编译后端**

```bash
cd d:/wwwroot/edms-cloud/backend
mvn clean compile -T 4 -Pcloud -DskipTests
```

Expected: `BUILD SUCCESS`

- [ ] **Step 2: 如失败，检查 pom.xml module 路径**

```bash
grep '<module>' backend/pom.xml
```

Expected: 模块名无路径前缀（如 `<module>edms-register</module>`，不是 `<module>backend/edms-register</module>`）

---

### Task 18: 验证本地构建 — 前端 pnpm install

**Files:**
- 无文件变更（验证步骤）

- [ ] **Step 1: 安装前端依赖**

```bash
cd d:/wwwroot/edms-cloud/frontend
pnpm install
```

Expected: 无错误，依赖安装成功

- [ ] **Step 2: 测试前端 dev server 启动**

```bash
pnpm dev &
sleep 10
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 2>/dev/null || echo "Check manually if port differs"
kill %1 2>/dev/null
```

Expected: HTTP 200 或端口可达（如端口不同，手动确认 dev server 正常启动）

---

### Task 19: 验证 Docker Compose 配置

**Files:**
- 无文件变更（验证步骤）

- [ ] **Step 1: 验证微服务 compose 配置**

```bash
cd d:/wwwroot/edms-cloud
docker compose -f deploy/docker-compose.yml config --quiet 2>&1
```

Expected: 无错误输出（`--quiet` 模式下仅输出错误）

- [ ] **Step 2: 验证单体 compose 配置**

```bash
docker compose -f deploy/docker-compose-boot.yml config --quiet 2>&1
```

Expected: 无错误输出

---

### Task 20: 创建 GitHub 远程仓库并推送

**Files:**
- 无文件变更（git remote 操作）

- [ ] **Step 1: 首次提交**

```bash
cd d:/wwwroot/edms-cloud
git add .
git commit -m "chore: restructure monorepo to backend/ + frontend/ layout

- Move all Java modules under backend/
- Rename edms-ui/ to frontend/
- Rename db/ to database/
- Centralize docker-compose files under deploy/
- Merge duplicate .editorconfig and .gitignore
- Add Makefile for unified dev commands
- Clean up upstream Vben Admin carryover files
- Delete old git history, fresh start"
```

- [ ] **Step 2: 在 GitHub 上创建新仓库**

通过浏览器访问 https://github.com/new 创建空仓库 `edms-cloud`（不要勾选 "Add a README file"、"Add .gitignore"、"Choose a license"）

- [ ] **Step 3: 添加远程并推送**

```bash
git remote add origin https://github.com/atong2008/edms-cloud.git
git branch -M main
git push -u origin main
```

Expected: 推送成功，在 GitHub 页面可见完整的新目录结构

- [ ] **Step 4: 验证 GitHub 上的目录结构**

通过浏览器访问仓库，确认：
- 根目录有 `backend/`、`frontend/`、`deploy/`、`database/`、`docs/`
- `frontend/node_modules/` 和 `frontend/.github/` 不在仓库中
- `.editorconfig`、`.gitignore`、`.gitattributes`、`Makefile` 在根目录

---

## 回滚方案

如果重构过程中出现问题，恢复到备份：

```bash
cd d:/wwwroot
rm -rf edms-cloud
cp -r edms-cloud-backup edms-cloud
cd edms-cloud
git init  # 如果备份时 .git 已被删除
```

---

## 前置 commit hash 记录

> 执行 Task 1 Step 3 时填入：

旧仓库最终 commit: `____________________`
