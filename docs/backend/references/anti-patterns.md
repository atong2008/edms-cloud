> 权威定义，由 edms-be-governance skill 管理。

# ANTI - 反模式清单

| ID | 反模式 | 正确做法 | 规则 |
|----|--------|----------|------|
| ANTI-001 | 跨服务注入 Mapper/Service | Feign API | MSV-001 |
| ANTI-002 | God Service（>600 行） | 拆分 Service | COMPLEX-001 |
| ANTI-003 | 新接口 Controller 返回 Entity | 返回 R\<Vo\> | ARCH-005 |
| ANTI-004 | 事务内文件/HTTP/MQ | 事务外或事件驱动 | ARCH-004 |
| ANTI-005 | catch-all 返回堆栈 | 统一异常处理 | OBS |
| ANTI-006 | 硬编码密钥/URL | Nacos 配置 | SEC-004 |
| ANTI-007 | common 模块放 SysUser | 放 {module}-api | MSV-003 |
| ANTI-008 | 引入商业版模块 | 遵守开源版边界 | EDMS-SCOPE-001 |
| ANTI-009 | 无 @Valid 的 RequestBody | @Valid + Bean Validation | VAL-001 |
| ANTI-010 | 使用 JPA 作为主 ORM | MyBatis-Plus | TECH-001 |
| ANTI-011 | Controller 注入 Mapper | 仅注入 Service | ARCH-003 |
| ANTI-012 | api 模块依赖 biz | biz → api | MSV-007 |
