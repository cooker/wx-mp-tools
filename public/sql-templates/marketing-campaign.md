---
code: marketing_campaign
name: 营销活动
bizType: 营销
version: 1.0.0
description: 活动/任务/多类型奖励/用户进度与发奖流水；周期限额 DAY·WEEK·MONTH；退款逆向与扣回·冻结·补偿队列；全表 deleted_at。需求见仓库根目录 SQL.md。
---

## DDL
> NOTE: 表前缀 `t_mkt_`；全表 `deleted_at`（NULL 未删）。`t_mkt_user_task_progress` 因「用户+任务」需多版本历史时，唯一约束见表内 NOTE。

### 活动主表 t_mkt_campaign
```sql
CREATE TABLE t_mkt_campaign (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '活动ID',
  campaign_code VARCHAR(64) NOT NULL COMMENT '活动编码，全局唯一',
  campaign_name VARCHAR(128) NOT NULL COMMENT '活动名称',
  description VARCHAR(512) NULL COMMENT '活动说明',
  status ENUM('DRAFT', 'PUBLISHED', 'ENDED', 'OFFLINE') NOT NULL DEFAULT 'DRAFT' COMMENT '草稿/已发布/已结束/下线',
  start_time DATETIME NOT NULL COMMENT '活动开始时间',
  end_time DATETIME NOT NULL COMMENT '活动结束时间',
  extra_config JSON NULL COMMENT '扩展配置（渠道、人群标签等）',
  operator_id BIGINT UNSIGNED NULL COMMENT '创建/最后操作人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_campaign_code (campaign_code),
  KEY idx_status_time (status, start_time, end_time),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB COMMENT='营销活动主表';
```

### 活动任务表 t_mkt_campaign_task
```sql
CREATE TABLE t_mkt_campaign_task (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  campaign_id BIGINT UNSIGNED NOT NULL COMMENT '所属活动ID',
  task_code VARCHAR(64) NOT NULL COMMENT '任务编码，活动内唯一',
  task_name VARCHAR(128) NOT NULL COMMENT '任务名称',
  task_type VARCHAR(32) NOT NULL COMMENT '任务类型：ORDER_PAY/INVITE/VIEW/自定义',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '展示排序',
  valid_start DATETIME NOT NULL COMMENT '任务生效开始',
  valid_end DATETIME NOT NULL COMMENT '任务生效结束',
  total_limit INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '单用户总可完成次数上限，0表示不限制',
  period_type ENUM('DAY', 'WEEK', 'MONTH') NOT NULL DEFAULT 'DAY' COMMENT '周期类型：自然日/自然周/自然月',
  period_limit INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '单用户每周期可完成次数上限，0表示不限制',
  rule_json JSON NULL COMMENT '任务规则（金额门槛、SKU等）',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_camp_task (campaign_id, task_code),
  KEY idx_campaign (campaign_id),
  KEY idx_valid (valid_start, valid_end),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_task_campaign FOREIGN KEY (campaign_id) REFERENCES t_mkt_campaign (id)
) ENGINE=InnoDB COMMENT='活动任务';
```

### 任务奖励规则表 t_mkt_task_reward_rule
```sql
CREATE TABLE t_mkt_task_reward_rule (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '奖励规则ID',
  task_id BIGINT UNSIGNED NOT NULL COMMENT '所属任务ID',
  reward_type ENUM('DRAW_CHANCE', 'VOUCHER', 'POINT', 'COUPON') NOT NULL COMMENT '奖励类型：抽奖次数/虚拟券/积分/优惠券',
  reward_value INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '单次发放数量（次数/积分等）',
  reward_meta_json JSON NULL COMMENT '扩展：券模板ID、券批次、外部券ID等',
  grant_limit_per_user INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '该奖励项单用户累计发放上限，0不限制',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  KEY idx_task (task_id),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_reward_task FOREIGN KEY (task_id) REFERENCES t_mkt_campaign_task (id)
) ENGINE=InnoDB COMMENT='任务奖励规则（一任务多奖励）';
```

### 用户任务进度表 t_mkt_user_task_progress
> NOTE: 同一用户同一任务仅一条「进行中」进度行；软删后若需再次参与，业务上应插入新行或物理清理旧行（MySQL 唯一键无法表达「仅未删唯一」）。
```sql
CREATE TABLE t_mkt_user_task_progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  campaign_id BIGINT UNSIGNED NOT NULL COMMENT '活动ID',
  task_id BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
  total_completed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计完成次数',
  period_completed INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '当前周期内完成次数',
  period_bucket VARCHAR(32) NOT NULL DEFAULT '' COMMENT '周期桶键：如2026-03-31(日)/2026-W13(周)/2026-03(月)',
  last_complete_at DATETIME NULL COMMENT '最近一次完成时间',
  frozen_until DATETIME NULL COMMENT '冻结资格截止时间（惩罚冻结）',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_task (user_id, task_id),
  KEY idx_campaign_user (campaign_id, user_id),
  KEY idx_frozen (frozen_until),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_prog_campaign FOREIGN KEY (campaign_id) REFERENCES t_mkt_campaign (id),
  CONSTRAINT fk_prog_task FOREIGN KEY (task_id) REFERENCES t_mkt_campaign_task (id)
) ENGINE=InnoDB COMMENT='用户任务进度与周期计数';
```

### 任务完成幂等表 t_mkt_task_complete_log
> NOTE: 同一业务单号只计一次完成（防重复发奖）。
```sql
CREATE TABLE t_mkt_task_complete_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  task_id BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
  biz_type VARCHAR(32) NOT NULL COMMENT '业务类型：ORDER/行为埋点等',
  biz_id VARCHAR(64) NOT NULL COMMENT '业务幂等键：订单号等',
  complete_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '完成时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_task_biz (user_id, task_id, biz_type, biz_id),
  KEY idx_task (task_id),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_complete_task FOREIGN KEY (task_id) REFERENCES t_mkt_campaign_task (id)
) ENGINE=InnoDB COMMENT='任务完成幂等流水';
```

### 用户奖励发放流水表 t_mkt_user_reward_log
```sql
CREATE TABLE t_mkt_user_reward_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  campaign_id BIGINT UNSIGNED NOT NULL COMMENT '活动ID',
  task_id BIGINT UNSIGNED NOT NULL COMMENT '任务ID',
  reward_rule_id BIGINT UNSIGNED NOT NULL COMMENT '奖励规则ID',
  complete_log_id BIGINT UNSIGNED NULL COMMENT '关联完成流水',
  grant_qty INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '本次发放数量',
  grant_status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REVOKED') NOT NULL DEFAULT 'PENDING' COMMENT '发放状态',
  idempotency_key VARCHAR(128) NOT NULL COMMENT '发奖幂等键',
  external_ref VARCHAR(128) NULL COMMENT '外部系统流水号/券码',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_idempotency (idempotency_key),
  KEY idx_user_campaign (user_id, campaign_id),
  KEY idx_task_rule (task_id, reward_rule_id),
  KEY idx_status (grant_status),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_grant_campaign FOREIGN KEY (campaign_id) REFERENCES t_mkt_campaign (id),
  CONSTRAINT fk_grant_task FOREIGN KEY (task_id) REFERENCES t_mkt_campaign_task (id),
  CONSTRAINT fk_grant_rule FOREIGN KEY (reward_rule_id) REFERENCES t_mkt_task_reward_rule (id),
  CONSTRAINT fk_grant_complete FOREIGN KEY (complete_log_id) REFERENCES t_mkt_task_complete_log (id)
) ENGINE=InnoDB COMMENT='用户奖励发放流水';
```

### 逆向事件表 t_mkt_reverse_event
```sql
CREATE TABLE t_mkt_reverse_event (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  event_type ENUM('REFUND', 'CHARGEBACK', 'ORDER_CANCEL') NOT NULL DEFAULT 'REFUND' COMMENT '逆向类型',
  biz_type VARCHAR(32) NOT NULL COMMENT '业务类型',
  biz_order_id VARCHAR(64) NOT NULL COMMENT '业务订单号',
  refund_amount DECIMAL(14, 2) NULL COMMENT '退款金额',
  payload_json JSON NULL COMMENT '扩展载荷',
  process_status ENUM('PENDING', 'PROCESSING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PENDING' COMMENT '处理状态',
  idempotency_key VARCHAR(128) NOT NULL COMMENT '逆向幂等键',
  retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '重试次数',
  next_retry_at DATETIME NULL COMMENT '下次重试时间',
  error_msg VARCHAR(512) NULL COMMENT '失败原因',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_reverse_idem (idempotency_key),
  UNIQUE KEY uk_biz (biz_type, biz_order_id, user_id),
  KEY idx_user_status (user_id, process_status),
  KEY idx_retry (next_retry_at, process_status),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB COMMENT='退款等逆向事件';
```

### 惩罚执行表 t_mkt_penalty_log
```sql
CREATE TABLE t_mkt_penalty_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  reverse_event_id BIGINT UNSIGNED NOT NULL COMMENT '逆向事件ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  campaign_id BIGINT UNSIGNED NOT NULL COMMENT '活动ID',
  task_id BIGINT UNSIGNED NULL COMMENT '关联任务',
  penalty_type ENUM('DEDUCT_REWARD', 'FREEZE_ELIGIBILITY', 'COMPENSATION_QUEUE') NOT NULL COMMENT '扣回奖励/冻结资格/入补偿队列',
  reward_log_id BIGINT UNSIGNED NULL COMMENT '待扣回的发奖流水',
  target_qty INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '目标扣回数量',
  exec_status ENUM('WAITING', 'SUCCESS', 'FAILED', 'PARTIAL') NOT NULL DEFAULT 'WAITING' COMMENT '执行状态',
  compensation_payload JSON NULL COMMENT '补偿队列载荷（异步重试）',
  retry_count INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '重试次数',
  next_retry_at DATETIME NULL COMMENT '下次重试',
  error_msg VARCHAR(512) NULL COMMENT '失败原因',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '逻辑删除时间',
  PRIMARY KEY (id),
  KEY idx_reverse (reverse_event_id),
  KEY idx_user_camp (user_id, campaign_id),
  KEY idx_exec (exec_status, next_retry_at),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_pen_reverse FOREIGN KEY (reverse_event_id) REFERENCES t_mkt_reverse_event (id),
  CONSTRAINT fk_pen_campaign FOREIGN KEY (campaign_id) REFERENCES t_mkt_campaign (id),
  CONSTRAINT fk_pen_task FOREIGN KEY (task_id) REFERENCES t_mkt_campaign_task (id),
  CONSTRAINT fk_pen_reward FOREIGN KEY (reward_log_id) REFERENCES t_mkt_user_reward_log (id)
) ENGINE=InnoDB COMMENT='逆向惩罚执行流水';
```

## SEED
### 最小示例：一活动、两任务、多奖励
```sql
INSERT INTO t_mkt_campaign (campaign_code, campaign_name, description, status, start_time, end_time, operator_id)
VALUES ('cmp_2026_spring', '2026春季拉新', '示例活动', 'PUBLISHED', '2026-03-01 00:00:00', '2026-05-31 23:59:59', 1);

SET @camp_id = LAST_INSERT_ID();

INSERT INTO t_mkt_campaign_task (
  campaign_id, task_code, task_name, task_type, sort_order,
  valid_start, valid_end, total_limit, period_type, period_limit, rule_json, status
) VALUES
(@camp_id, 'pay_99', '单笔实付满99', 'ORDER_PAY', 1,
 '2026-03-01 00:00:00', '2026-05-31 23:59:59', 10, 'MONTH', 3,
 JSON_OBJECT('min_pay_cent', 9900), 1),
(@camp_id, 'invite_1', '邀请1位新用户', 'INVITE', 2,
 '2026-03-01 00:00:00', '2026-05-31 23:59:59', 0, 'DAY', 1,
 JSON_OBJECT('need_new_user', TRUE), 1);

SET @task_pay = (SELECT id FROM t_mkt_campaign_task WHERE campaign_id = @camp_id AND task_code = 'pay_99' LIMIT 1);
SET @task_inv = (SELECT id FROM t_mkt_campaign_task WHERE campaign_id = @camp_id AND task_code = 'invite_1' LIMIT 1);

INSERT INTO t_mkt_task_reward_rule (task_id, reward_type, reward_value, reward_meta_json, grant_limit_per_user, sort_order) VALUES
(@task_pay, 'DRAW_CHANCE', 1, JSON_OBJECT('pool_id', 'pool_a'), 30, 1),
(@task_pay, 'POINT', 100, NULL, 0, 2),
(@task_inv, 'VOUCHER', 1, JSON_OBJECT('template_id', 'VTPL_001'), 5, 1),
(@task_inv, 'COUPON', 1, JSON_OBJECT('coupon_batch', 'B202603'), 5, 2);
```

## QUERY
### 有效活动列表（未删、已发布、时间窗内）
```sql
SELECT id, campaign_code, campaign_name, start_time, end_time, status
FROM t_mkt_campaign
WHERE deleted_at IS NULL
  AND status = 'PUBLISHED'
  AND start_time <= NOW()
  AND end_time >= NOW()
ORDER BY id DESC;
```

### 某活动下启用任务及奖励规则
```sql
SELECT t.id AS task_id,
       t.task_code,
       t.task_name,
       t.valid_start,
       t.valid_end,
       t.total_limit,
       t.period_type,
       t.period_limit,
       r.id AS reward_rule_id,
       r.reward_type,
       r.reward_value,
       r.grant_limit_per_user
FROM t_mkt_campaign_task t
LEFT JOIN t_mkt_task_reward_rule r ON r.task_id = t.id AND r.deleted_at IS NULL
WHERE t.campaign_id = ${campaign_id}
  AND t.deleted_at IS NULL
  AND t.status = 1
ORDER BY t.sort_order, t.id, r.sort_order, r.id;
```

### 用户在某任务上已发奖励次数（按奖励规则聚合）
```sql
SELECT l.reward_rule_id,
       rr.reward_type,
       COALESCE(SUM(CASE WHEN l.grant_status IN ('SUCCESS', 'PENDING') THEN l.grant_qty ELSE 0 END), 0) AS granted_qty
FROM t_mkt_user_reward_log l
INNER JOIN t_mkt_task_reward_rule rr ON rr.id = l.reward_rule_id AND rr.deleted_at IS NULL
WHERE l.user_id = ${user_id}
  AND l.task_id = ${task_id}
  AND l.deleted_at IS NULL
GROUP BY l.reward_rule_id, rr.reward_type;
```

### 待重试的逆向事件（补偿扫描）
```sql
SELECT id, user_id, event_type, biz_type, biz_order_id, process_status, retry_count, next_retry_at
FROM t_mkt_reverse_event
WHERE deleted_at IS NULL
  AND process_status IN ('PENDING', 'FAILED')
  AND (next_retry_at IS NULL OR next_retry_at <= NOW())
ORDER BY id ASC
LIMIT ${batch_size};
```

### 待重试的惩罚执行（补偿队列）
```sql
SELECT p.id, p.reverse_event_id, p.penalty_type, p.exec_status, p.retry_count, p.next_retry_at
FROM t_mkt_penalty_log p
WHERE p.deleted_at IS NULL
  AND p.penalty_type = 'COMPENSATION_QUEUE'
  AND p.exec_status IN ('WAITING', 'FAILED', 'PARTIAL')
  AND (p.next_retry_at IS NULL OR p.next_retry_at <= NOW())
ORDER BY p.id ASC
LIMIT ${batch_size};
```

## UPDATE
### 登记任务完成（幂等插入 + 占位）
```sql
INSERT INTO t_mkt_task_complete_log (user_id, task_id, biz_type, biz_id)
VALUES (${user_id}, ${task_id}, ${biz_type}, ${biz_id});
```

### 逆向事件入库（幂等）
```sql
INSERT INTO t_mkt_reverse_event (
  user_id, event_type, biz_type, biz_order_id, refund_amount, payload_json,
  process_status, idempotency_key
) VALUES (
  ${user_id}, 'REFUND', ${biz_type}, ${biz_order_id}, ${refund_amount}, ${payload_json},
  'PENDING', ${idempotency_key}
);
```

> NOTE: 若 `idempotency_key` 或 `(biz_type,biz_order_id,user_id)` 重复，INSERT 失败；业务侧捕获后视为已受理。

### 冻结用户任务资格（惩罚）
```sql
UPDATE t_mkt_user_task_progress
SET frozen_until = ${frozen_until},
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = ${user_id}
  AND task_id = ${task_id}
  AND deleted_at IS NULL;
```

### 标记发奖流水为已回退
```sql
UPDATE t_mkt_user_reward_log
SET grant_status = 'REVOKED',
    remark = CONCAT(IFNULL(remark, ''), ' | revoke:', ${revoke_reason}),
    updated_at = CURRENT_TIMESTAMP
WHERE id = ${reward_log_id}
  AND deleted_at IS NULL
  AND grant_status = 'SUCCESS';
```

### 逆向事件处理成功
```sql
UPDATE t_mkt_reverse_event
SET process_status = 'PROCESSED',
    retry_count = 0,
    next_retry_at = NULL,
    error_msg = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ${reverse_event_id}
  AND deleted_at IS NULL;
```

### 惩罚执行成功
```sql
UPDATE t_mkt_penalty_log
SET exec_status = 'SUCCESS',
    next_retry_at = NULL,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ${penalty_log_id}
  AND deleted_at IS NULL;
```

## REPORT
### 活动发奖笔数与成功占比
```sql
SELECT c.campaign_code,
       COUNT(*) AS grant_cnt,
       SUM(CASE WHEN l.grant_status = 'SUCCESS' THEN 1 ELSE 0 END) AS success_cnt
FROM t_mkt_user_reward_log l
INNER JOIN t_mkt_campaign c ON c.id = l.campaign_id AND c.deleted_at IS NULL
WHERE l.deleted_at IS NULL
  AND l.created_at >= ${stat_start}
  AND l.created_at < ${stat_end}
GROUP BY c.id, c.campaign_code
ORDER BY grant_cnt DESC;
```

### 逆向与惩罚成功率
```sql
SELECT DATE(e.created_at) AS d,
       COUNT(*) AS reverse_cnt,
       SUM(CASE WHEN e.process_status = 'PROCESSED' THEN 1 ELSE 0 END) AS processed_cnt
FROM t_mkt_reverse_event e
WHERE e.deleted_at IS NULL
  AND e.created_at >= ${stat_start}
  AND e.created_at < ${stat_end}
GROUP BY DATE(e.created_at)
ORDER BY d DESC;
```

## DEV
### 开发说明（范围与决策摘要）
```sql
-- ## 已确认决策
-- | 项 | 内容 |
-- | 周期限额 | `DAY` / `WEEK` / `MONTH` |
-- | 奖励类型 | `DRAW_CHANCE`、`VOUCHER`、`POINT`、`COUPON` |
-- | 逆向惩罚 | 优先扣回奖励 → 冻结资格；失败入 `COMPENSATION_QUEUE` 异步重试 |
-- | 逻辑删除 | 全表 `deleted_at` |
-- | 表前缀 | `t_mkt_` |
--
-- ## 周期桶 `period_bucket`（建议）
-- - `DAY`：`DATE_FORMAT(NOW(), '%Y-%m-%d')`
-- - `WEEK`：年周，如 `CONCAT(YEARWEEK(NOW(), 3))` 或 ISO 周字符串
-- - `MONTH`：`DATE_FORMAT(NOW(), '%Y-%m')`
-- 进度行 `period_bucket` 与当前自然周期不一致时，重置 `period_completed` 为 0 再计。
--
-- ## 正向时序（任务达成 → 发奖）
-- 1. 校验活动/任务时间窗、`frozen_until`、总次数/周期次数、奖励 `grant_limit_per_user`
-- 2. 插入 `t_mkt_task_complete_log`（唯一键防重）
-- 3. 更新 `t_mkt_user_task_progress`（含周期切换）
-- 4. 按 `t_mkt_task_reward_rule` 写入 `t_mkt_user_reward_log`，`idempotency_key` 唯一
-- 5. 异步调用券/积分等下游，回写 `grant_status` 与 `external_ref`
```

### 开发说明（接口草案）
```sql
-- ## 接口一览（示例）
-- | 方法 | 路径 | 说明 |
-- | POST | /api/v1/mkt/campaigns/{id}/tasks/complete | 任务达成（带 biz 幂等） |
-- | GET | /api/v1/mkt/campaigns/{id}/tasks | 任务与奖励规则 |
-- | GET | /api/v1/mkt/users/me/rewards | 我的发奖流水 |
-- | POST | /api/v1/mkt/reverse/refund | 退款逆向受理 |
-- | GET | /api/v1/mkt/admin/reverse/pending | 待重试逆向/惩罚（内部） |
--
-- ## 退款逆向请求体示例
--
-- ```json
-- {
--   "user_id": 10001,
--   "biz_type": "ORDER",
--   "biz_order_id": "O202603310001",
--   "refund_amount": 99.00,
--   "idempotency_key": "refund_O202603310001_1"
-- }
-- ```
--
-- ## 惩罚顺序
-- 1. 查找该订单关联的 `t_mkt_task_complete_log` / `t_mkt_user_reward_log`
-- 2. `DEDUCT_REWARD`：尝试扣回或标记 `REVOKED`；失败则 `COMPENSATION_QUEUE`
-- 3. `FREEZE_ELIGIBILITY`：写 `t_mkt_user_task_progress.frozen_until`
```
