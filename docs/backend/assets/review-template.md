> edms-be Review 模板。

# EDMS 后端多维度 Review 报告

日期: YYYY-MM-DD

## 架构视角
### P0
- 跨服务 Entity/Mapper 直接引用
- 新接口 Controller 返回 Entity
- 事务内外部 IO
- common 模块领域泄漏
- 引入商业版模块

### P1
- Feign 接口未使用 ServiceNameConstants
- 缺少 @Valid / @HasPermission

## 契约视角
- R<T>（code/msg/data）一致性
- Page<T> 分页格式
- 网关路径 /admin/** /auth/** 对齐

## 安全视角
- password 是否泄漏
- 日志脱敏（token/password/secret）
- 配置硬编码
- @Inner 内部接口暴露

## 性能视角
- pageSize 无上限
- N+1 查询
- 长事务

## 综合评分
架构健康度: X/10
契约一致性: X/10
