# MySQL 建表规范

> version: 1.2.0 | 最后更新：2026-07-01

本文档定义 EDMS Cloud 生产环境 MySQL 表结构设计标准，供后端开发、DBA 评审及 AI 辅助建表时使用。

Cursor 规则：`.cursor/rules/edms-database.mdc`（编辑 SQL / 数据库文档时自动触发）。

---

## 一、命名规范（强制）

### 1. 库名 / 表名

- 全小写，下划线分隔，见名知意，**≤64 字符**（尽量简短）
- 表名用**单数**（如：`user` 而非 `users`）
- 禁止数字开头；避免两个下划线中间夹数字（如：`level_3_name`）
- 禁用 MySQL 保留字（如：`desc`、`range`、`match`）
- 前缀规范：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `user_` | 用户域 | `user_profile` |
| `sys_` | 系统域 | `sys_config` |
| `log_` | 日志 | `log_operation` |
| `tmp_` | 临时表 | `tmp_import_20260701` |
| `bak_` | 备份表 | `bak_user_20260701` |

### 2. 字段名

- 全小写 + 下划线，≤64 字符
- 布尔 / 逻辑位：`is_xxx`，`unsigned tinyint NOT NULL DEFAULT 0`
- 时间：`created_at`、`updated_at`；软删除可选 `deleted_at`（NULL 表示未删除）
- 关联字段：`{表名}_id`（如 `user_id`）
- **表与字段必须写 COMMENT**

### 3. 索引命名

| 类型 | 格式 | 示例 |
|------|------|------|
| 主键约束 | `pk_{表名}` | `pk_user` |
| 唯一索引 | `uk_{表名}_{字段}` | `uk_user_phone` |
| 普通索引 | `idx_{表名}_{字段}` | `idx_user_name` |

---

## 二、引擎与字符集（强制）

| 项 | 要求 |
|----|------|
| 存储引擎 | InnoDB |
| 字符集 | utf8mb4 |
| 排序规则 | utf8mb4_unicode_ci（MySQL 8.0+ 新项目可评估 utf8mb4_0900_ai_ci） |
| 行格式 | DYNAMIC |

禁止 `utf8`（不支持完整 emoji）。

---

## 三、字段类型选择

### 数值型

- 非负数：`unsigned`
- 状态/开关：`unsigned tinyint`
- 主键/大表 ID：**`bigint unsigned`**
- 金额/精度：`decimal(M,D)`，禁止 `float`/`double`

### 字符串

- 变长：`varchar(n)`，n 按业务设定
- 长文本：`text`，大内容放对象存储
- `char`：默认不用，仅固定长度且等值查询场景

### 时间

- **默认**：`datetime(3)`（毫秒，无时区歧义）
- `timestamp`：非默认，需要自动 `ON UPDATE` 时可选（MySQL 8+ 已解决 2038 问题）
- 禁止字符串存时间

### NULL 与默认值

| 场景 | 规则 |
|------|------|
| 业务必填 | `NOT NULL` + 显式 DEFAULT |
| 可选字段 | 允许 NULL，COMMENT 说明语义 |
| 字符串默认 | `DEFAULT ''` |
| 数值默认 | `DEFAULT 0` |
| 创建时间 | `DEFAULT CURRENT_TIMESTAMP(3)` |

### 逻辑删除

```sql
is_deleted unsigned tinyint NOT NULL DEFAULT 0 COMMENT '是否删除：0否 1是'
```

- 生产默认逻辑删除，禁止无审计物理删除
- 需配套归档/冷热分离，避免单表膨胀

---

## 四、主键与索引

### 主键（强制）

```sql
id bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
CONSTRAINT pk_user PRIMARY KEY (id)
```

- 禁止字符串主键、禁止业务字段作主键
- 关联表仍用 surrogate `id`；业务唯一性用联合 `uk_`

### 索引

**必建：** 主键、唯一业务字段、高频查询字段。

**软删除表（强建议）：**

```sql
KEY idx_user_deleted_created (is_deleted, created_at)
```

**慎建：** 单独低基数列、频繁 UPDATE 列、过长字段（前缀索引需评估区分度）。

**联合索引：** 最左匹配，高选择性列放左。

---

## 五、约束（强制）

- 显式 DEFAULT
- 禁止数据库外键与级联操作（应用层保证一致性）
- 禁止 SQL 中硬编码加密密钥

---

## 六、字段分类与存储

| 分类 | 方式 |
|------|------|
| 普通业务 | VARCHAR + NOT NULL + DEFAULT |
| 非敏感扩展 | JSON（非高频过滤字段） |
| 敏感隐私 | 应用层 AES → VARBINARY；查重用 hash 列 |
| 密码 | bcrypt/Argon2 哈希 |

**JSON：** 高频查询路径应冗余列或 MySQL 8 生成列 + 函数索引。

**敏感字段：** 加密在应用层；密钥走 KMS；VARBINARY 长度按密文预留。

---

## 七、安全设计

- 可逆加密（手机、身份证）vs 不可逆哈希（密码）严格区分
- 限制敏感字段 DB 账号权限
- 建议：`created_by`、`updated_by` 审计字段

---

## 八、常见错误

1. 用 AES 存密码
2. JSON 高频过滤却无索引
3. 使用 utf8 而非 utf8mb4
4. 字段/表无 COMMENT
5. 软删除表缺少 `(is_deleted, ...)` 索引
6. 大表主键仍用 int
7. 逻辑删除无归档策略

---

## 九、标准 DDL 示例

```sql
CREATE TABLE `user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(64) NOT NULL DEFAULT '' COMMENT '用户名',
  `phone` varbinary(128) NOT NULL DEFAULT '' COMMENT '手机号密文',
  `phone_hash` char(64) NOT NULL DEFAULT '' COMMENT '手机号 SHA256，用于查重',
  `status` unsigned tinyint NOT NULL DEFAULT 1 COMMENT '状态：0禁用 1启用',
  `is_deleted` unsigned tinyint NOT NULL DEFAULT 0 COMMENT '是否删除：0否 1是',
  `created_by` bigint unsigned NULL DEFAULT NULL COMMENT '创建人 ID',
  `updated_by` bigint unsigned NULL DEFAULT NULL COMMENT '更新人 ID',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '创建时间',
  `updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3) COMMENT '更新时间',
  CONSTRAINT `pk_user` PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_username` (`username`),
  KEY `idx_user_deleted_created` (`is_deleted`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci ROW_FORMAT=DYNAMIC COMMENT='用户表';
```

---

## 十、DDL 交付物格式

生成或评审表结构时，输出：

1. 合规 DDL
2. 字段说明（类型 / 默认 / NULL / COMMENT）
3. 索引说明（名称 / 列 / 用途）
4. 风险提示（如有）

---

## 变更记录

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.1.2 | — | 初始版本（团队基线） |
| 1.2.0 | 2026-07-01 | 注释强制化；软化 NULL/timestamp/char；补充软删除索引、敏感字段检索、归档策略；标识符长度改为 64 |
