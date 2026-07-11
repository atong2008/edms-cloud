# 本地开发指南

本文档描述 EDMS Cloud 从零启动开发环境的完整流程。

## 1. 环境要求

| 工具 | 版本 | 用途 |
|------|------|------|
| JDK | 17+ | 后端编译运行 |
| Maven | 3.9+ | 后端构建 |
| Docker | 最新稳定版 | MySQL、Redis、后端服务 |
| Docker Compose | 最新稳定版 | 服务编排 |
| Node.js | 20+（推荐） | 前端开发（Phase 2 后） |
| pnpm | 11+ | 前端包管理（Phase 2 后） |

## 2. 规范文档指引

| 场景 | 入口 |
|------|------|
| 文档总索引 | [README.md](README.md) |
| 写后端 Java | [backend/SKILL.md](backend/SKILL.md) |
| 写前端 Vue/TS | [frontend/SKILL.md](frontend/SKILL.md) |
| 前后端联调 | [shared/api-contract.md](shared/api-contract.md) |
| 新建数据库表 | [database/mysql-table-standard.md](database/mysql-table-standard.md) |
| 业务需求 | [requirements/README.md](requirements/README.md) |

## 3. 首次 setup

### 3.1 克隆与编译

```bash
git clone <repo-url> edms-cloud
cd edms-cloud
cd backend && mvn clean install -T 4 -Pcloud
```

### 3.2 数据库初始化

详见 [database/README.md](../database/README.md)。概要步骤：

```powershell
mysql -h 127.0.0.1 -P 3306 -u root -p --default-character-set=utf8mb4 < database\edms_config.sql
mysql -h 127.0.0.1 -P 3306 -u root -p --default-character-set=utf8mb4 < database\edms.sql
```

### 3.3 本地环境变量（IDE 调试）

```powershell
Copy-Item deploy\.env.example deploy\.env
Copy-Item .vscode\launch.json.example .vscode\launch.json
```

## 4. 启动后端

### 4.1 Docker Compose（推荐）

```bash
docker compose -f deploy/docker-compose.yml build
docker compose -f deploy/docker-compose.yml up
```

### 4.2 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| edms-mysql | 3306 | 数据库 |
| edms-redis | 6379 | 缓存 |
| edms-register (Nacos) | 8848 | 注册/配置中心 |
| edms-gateway | 9999 | API 网关 |
| edms-auth | 3000 | 认证服务 |
| edms-upms | 4000 | 用户权限 |
| edms-monitor | 5001 | 监控 |
| edms-codegen | 5002 | 代码生成 |
| edms-quartz | 5007 | 定时任务 |

验证：访问 `http://localhost:8848/nacos`（默认账号 nacos/nacos）。

### 4.3 IDE 本地调试

使用 VS Code / Cursor 的 Java Debug，加载 `config/local.env`。启动顺序：

1. edms-register
2. edms-gateway
3. edms-auth
4. edms-upms

## 5. 启动前端（Phase 2 迁入后）

```bash
cd frontend
pnpm install
pnpm dev
```

浏览器访问 `http://localhost:5666`。

Phase 3 联调时在 `apps/web-app/vite.config.ts` 配置代理：

```typescript
server: {
  port: 5666,
  proxy: {
    '/auth':  { target: 'http://localhost:9999', changeOrigin: true },
    '/admin': { target: 'http://localhost:9999', changeOrigin: true },
  },
}
```

### Monorepo `.gitignore`

- 根目录 `.gitignore`：Java/全仓规则 + `frontend/.git/`、`frontend/.github/` + env 规则
- 前端 `node_modules`/构建产物由根 `.gitignore` 统一排除；`pnpm-lock.yaml` 需提交
- 复制 Vben 上游代码后务必删除 `frontend/.git/`、`frontend/.github/`

## 6. 常见问题

### Nacos 配置不生效

重新导入 `edms_config.sql` 后，清理本地 Nacos 缓存：

```powershell
Remove-Item -Recurse -Force "$env:USERPROFILE\nacos\data\tenant-config-data" -ErrorAction SilentlyContinue
```

然后重启 edms-register。

### 端口冲突

```powershell
netstat -ano | findstr "8848 9999 3306 5666"
```

### Maven 编译失败

```bash
java -version   # 应为 17+
mvn verify -Pcloud -B
```

### OAuth 登录失败（Phase 3）

核对前端 OAuth 配置与 Nacos 中 `edms-auth-dev.yml` 的客户端配置一致。参见 [shared/auth-contract.md](shared/auth-contract.md)。

## 8. Cursor 规范自动触发

| 触发方式 | 配置 | 何时生效 |
|----------|------|----------|
| 始终 | `.cursor/rules/edms-governance-index.mdc` | 每次对话注入规范索引 |
| 编辑 Java | `.cursor/rules/edms-backend-java.mdc` | 打开/编辑 `backend/edms-*/**/*.java` |
| 编辑前端 | `.cursor/rules/edms-frontend.mdc` | 打开/编辑 `frontend/**/*.{vue,ts,tsx}` |
| 编辑 SQL | `.cursor/rules/edms-database.mdc` | 打开/编辑 `database/**/*.sql` |
| Skill 手动 | `.cursor/skills/edms-be-governance/`、`edms-fe-governance/` | 对话中 @ 或描述匹配时 |

完整 Guard 细则仍在 `docs/backend/`、`docs/frontend/`；Rules 注入 Layer 0 摘要，Agent 应按需读取 references。

## 7. 数据库变更

- 增量脚本：`database/migrations/YYYYMMDD_描述.sql`
- 同步更新全量脚本 `database/edms.sql`
- 新表遵循 [database/mysql-table-standard.md](database/mysql-table-standard.md)
