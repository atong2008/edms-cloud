<p align="center">
 <img src="https://img.shields.io/badge/EDMS-4.0-success.svg" alt="EDMS">
 <img src="https://img.shields.io/badge/Spring%20Cloud-2025.1-blue.svg" alt="Spring Cloud">
 <img src="https://img.shields.io/badge/Spring%20Boot-4.0-blue.svg" alt="Spring Boot">
 <img src="https://img.shields.io/badge/Vue-3.5-blue.svg" alt="Vue">
</p>

## 系统说明

- EDMS Cloud 是基于 Spring Cloud、Spring Boot、OAuth2 的 RBAC 企业级快速开发平台，同时支持微服务架构和单体架构。
- 认证中心基于 Spring Authorization Server 落地生产级 OAuth2 实践，支持授权码、密码、刷新令牌等常见登录与授权场景。
- 当前版本保留认证、网关、用户权限、监控、代码生成和定时任务等核心能力。
- 提供 Docker Compose 本地编排，支持快速启动 MySQL、Redis、Nacos 和业务服务。

## 文档

| 文档 | 说明 |
|------|------|
| [文档总索引](docs/README.md) | 规范、需求、设计文档入口 |
| [本地开发指南](docs/development.md) | 环境 setup 与启动 |
| [后端 Guard](docs/backend/SKILL.md) | 后端开发规范（入口 [overview](docs/backend/overview.md)） |
| [前端 Guard](docs/frontend/SKILL.md) | 前端开发规范 |
| [共享契约](docs/shared/) | 前后端 API / 鉴权对齐 |
| [路线图设计](docs/superpowers/specs/2026-07-08-edms-roadmap-design.md) | Phase 1–4 规划 |

## 快速开始

### 基础环境

- JDK 17+
- Maven 3.9+
- Docker 和 Docker Compose
- Node.js 16+（运行前端时需要）

### 微服务模式

在项目根目录执行完整编译，再构建并启动本地服务栈：

```bash
mvn clean install -T 4 -Pcloud
docker compose build && docker compose up
```

服务启动后，默认通过网关端口 `9999` 访问后端接口，Nacos 控制台端口为 `8848`。

### 单体模式

单体模式通过 `boot` profile 启用 `edms-boot` 模块：

```bash
mvn clean install -T 4 -Pboot
docker compose -f docker-compose-boot.yml build && docker compose -f docker-compose-boot.yml up
```

单体服务默认监听 `9999` 端口。

## 核心依赖

| 依赖 | 版本 |
| --- | --- |
| EDMS Cloud | 4.0.0 |
| JDK | 17+ |
| Spring Boot | 4.0.6 |
| Spring Cloud | 2025.1.2 |
| Spring Cloud Alibaba | 2025.1.0.0 |
| Spring Security OAuth2 Authorization Server | 7.0.5 |
| MyBatis Plus | 3.5.16 |
| Nacos Client | 3.1.2 |
| Druid | 1.2.28 |

## 模块说明

```lua
edms
├── edms-register -- Nacos Server [8848/9848/18080]
├── edms-gateway -- Spring Cloud Gateway 网关 [9999]
├── edms-auth -- 授权服务 [3000]
├── edms-upms -- 通用用户权限管理模块
│   ├── edms-upms-api -- 通用用户权限管理公共 API
│   └── edms-upms-biz -- 通用用户权限业务服务 [4000]
├── edms-common -- 系统公共模块
│   ├── edms-common-bom -- 全局依赖版本管理
│   ├── edms-common-core -- 公共工具类核心包
│   ├── edms-common-data -- MyBatis Plus 与缓存扩展
│   ├── edms-common-datasource -- 动态数据源封装
│   ├── edms-common-log -- 日志服务
│   ├── edms-common-oss -- 文件上传工具类
│   ├── edms-common-security -- 安全工具类
│   ├── edms-common-sentinel -- Sentinel 与异常处理封装
│   ├── edms-common-swagger -- 接口文档封装
│   ├── edms-common-feign -- OpenFeign 扩展封装
│   ├── edms-common-excel -- Excel 导入导出封装
│   └── edms-common-xss -- XSS 安全封装
├── edms-visual -- 可视化支撑服务
│   ├── edms-monitor -- 服务监控 [5001]
│   ├── edms-codegen -- 图形化代码生成 [5002]
│   └── edms-quartz -- 定时任务管理台 [5007]
└── edms-boot -- 单体模式启动器 [9999]，通过 `-Pboot` 启用
```

## 配置说明

- 微服务模式使用 `cloud` profile，默认激活 `dev` 环境配置。
- 单体模式使用 `boot` profile，`edms-boot` 模块只在该 profile 下参与构建。
- 网关路由由 `edms-gateway/src/main/resources/application.yml` 和 Nacos 配置维护。
- 默认数据库脚本位于 `db/`，业务表初始化到 `edms`，Nacos 配置初始化到 `edms_config`。
- 包名统一为 `com.edmscloud.edms`。
- HTTP API 路径保持不变：`/auth/**`、`/admin/**`、`/gen/**`、`/job/**`、`/monitor/**`。

## 开源协议

本项目基于 Pig 开源框架改造，遵循 [Apache 2.0 协议](https://www.apache.org/licenses/LICENSE-2.0.html)。上游 Pig 框架版权声明保留在源码文件头中。
