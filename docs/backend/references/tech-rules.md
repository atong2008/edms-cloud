> 权威定义，由 edms-be-governance skill 管理。

# TECH - 平台基线

## TECH-001 EDMS 后端技术栈

**等级**: 🔴 严重（项目级）

**强制要求**（以根 `pom.xml` 为准）：

| 组件 | 版本 |
|------|------|
| Spring Boot | 4.0.x |
| Spring Cloud | 2025.1.x |
| Spring Cloud Alibaba | 2025.1.0.0 |
| Java | 17 |
| MyBatis-Plus | 3.5.x |
| Spring Authorization Server | 7.x |
| MySQL | 8.x |

**禁止**：引入 Spring Modulith、Spring Data JPA 作为主 ORM。

## EDMS-SCOPE-001 开源版边界

**等级**: 🔴 严重（项目级）

开源版**不包含**以下商业版能力，新功能不得引入相关依赖或占位实现：

- 多租户
- 数据权限（data-scope）
- 动态网关路由管理
- 工作流（BPMN）
- 支付、公众号、报表、BI、移动端

网关路由通过 `edms-gateway` 配置文件维护，不使用动态路由管理模块。
