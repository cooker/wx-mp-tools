---
code: user_center
name: 用户中心模板
bizType: 用户
version: 1.0.0
description: 含用户建表、登录查询与用户资料更新 SQL。
---

## DDL
### 用户表 t_user
> NOTE: 邮箱唯一，手机号支持快速检索。
```sql
CREATE TABLE t_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(128) NOT NULL,
  phone VARCHAR(32) NULL,
  nickname VARCHAR(64) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  status TINYINT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_email (email),
  KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## QUERY
### 用户登录查询
> NOTE: 登录时仅返回必要字段。
```sql
SELECT id, email, nickname, password_hash, status
FROM t_user
WHERE email = ${email}
LIMIT 1;
```

## UPDATE
### 更新用户昵称
> NOTE: 只更新指定用户。
```sql
UPDATE t_user
SET nickname = ${nickname}
WHERE id = ${user_id};
```

## REPORT
### 最近 7 天新增用户
> NOTE: 用于看板展示趋势。
```sql
SELECT DATE(created_at) AS dt, COUNT(*) AS user_cnt
FROM t_user
WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
GROUP BY DATE(created_at)
ORDER BY dt;
```
