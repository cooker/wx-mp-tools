---
code: order_mgmt
name: 订单管理模板
bizType: 订单
version: 1.0.0
description: 含订单主表、分页查询、状态更新、订单统计。
---

## DDL
### 订单主表 t_order
> NOTE: 订单号唯一，联合索引覆盖常用检索字段。
```sql
CREATE TABLE t_order (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  user_id BIGINT NOT NULL,
  status TINYINT NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user_status_created (user_id, status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## QUERY
### 按用户分页查订单
> NOTE: 按创建时间倒序。
```sql
SELECT id, order_no, status, total_amount, created_at
FROM t_order
WHERE user_id = ${user_id}
ORDER BY created_at DESC
LIMIT ${offset}, ${page_size};
```

## UPDATE
### 订单状态流转
> NOTE: 使用旧状态保护并发更新。
```sql
UPDATE t_order
SET status = ${new_status}
WHERE id = ${order_id}
  AND status = ${old_status};
```

## REPORT
### 按天汇总交易金额
> NOTE: 近 30 天已支付订单。
```sql
SELECT DATE(created_at) AS dt, SUM(total_amount) AS total_amt
FROM t_order
WHERE status = 1
  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY dt;
```
