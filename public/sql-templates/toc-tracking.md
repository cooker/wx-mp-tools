---
code: toc_tracking
name: APP埋点
bizType: 埋点
version: 1.0.0
description: 埋点元数据、行为日志、用户设备绑定；含接口约定与统计口径（详见 DEV）。
---

## DDL
### 埋点元数据表 t_toc_event_meta
> NOTE: 管理事件定义与参数规范，供采集端进行校验。
```sql
CREATE TABLE t_toc_event_meta (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  event_code VARCHAR(64) NOT NULL COMMENT '事件编码(唯一)',
  event_name VARCHAR(128) NOT NULL COMMENT '事件名称',
  event_desc VARCHAR(255) NULL COMMENT '事件说明',
  page_scope VARCHAR(128) NULL COMMENT '适用页面/模块',
  param_schema_json JSON NULL COMMENT '参数定义(JSON Schema/约定)',
  is_active TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0' COMMENT '埋点定义版本',
  owner VARCHAR(64) NULL COMMENT '负责人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_event_code (event_code),
  KEY idx_active (is_active),
  CONSTRAINT chk_json CHECK (JSON_VALID(param_schema_json))
) ENGINE=InnoDB COMMENT='埋点事件元数据';
```

### 用户行为埋点日志表 t_toc_user_event_log
> NOTE: 高频写入表，建议按事件时间与事件编码建立索引。
```sql
CREATE TABLE t_toc_user_event_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  event_code VARCHAR(64) NOT NULL COMMENT '事件编码(关联元数据)',
  user_id BIGINT NULL COMMENT '用户ID(匿名可为空)',
  device_id VARCHAR(128) NOT NULL COMMENT '设备ID',
  session_id VARCHAR(128) NULL COMMENT '会话ID',
  page_path VARCHAR(255) NULL COMMENT '页面路径',
  event_time DATETIME NOT NULL COMMENT '事件发生时间',
  event_params_json JSON NULL COMMENT '事件参数',
  channel VARCHAR(64) NULL COMMENT '来源渠道',
  os VARCHAR(32) NULL COMMENT '系统',
  app_version VARCHAR(32) NULL COMMENT '应用版本',
  ip VARCHAR(64) NULL COMMENT '客户端IP',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '入库时间',
  KEY idx_event_time (event_time),
  KEY idx_event_code_time (event_code, event_time),
  KEY idx_user_time (user_id, event_time),
  KEY idx_device_time (device_id, event_time)
) ENGINE=InnoDB COMMENT='用户行为埋点明细日志';
```

### 用户与设备关联表 t_toc_user_device_rel
> NOTE: 记录用户与设备绑定关系，支持设备反查用户与活跃追踪。
```sql
CREATE TABLE t_toc_user_device_rel (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  device_id VARCHAR(128) NOT NULL COMMENT '设备ID',
  bind_status TINYINT NOT NULL DEFAULT 1 COMMENT '1绑定 0解绑',
  last_seen_at DATETIME NULL COMMENT '最近活跃时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '首次绑定时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最近更新时间',
  UNIQUE KEY uk_user_device (user_id, device_id),
  KEY idx_device (device_id),
  KEY idx_user (user_id),
  KEY idx_last_seen (last_seen_at)
) ENGINE=InnoDB COMMENT='用户与设备绑定关系';
```

## SEED
### param_schema_json 字段说明与推荐结构
> NOTE: 该说明放在 SEED，不放在 DDL。用于运营和开发协同维护参数定义。
```sql
-- param_schema_json 推荐包含以下叶子字段说明：
-- - version：规则版本，便于灰度与回滚
-- - required：必填参数列表
-- - properties.<key>.type：参数类型 (string/number/integer/boolean/object/array)
-- - properties.<key>.label：参数中文名（给运营看）
-- - properties.<key>.desc：参数说明
-- - properties.<key>.example：示例值
-- - properties.<key>.enum：可选枚举值（可选）
```

### 初始化埋点元数据
> NOTE: 示例初始化，可按业务扩展。
```sql
-- 示例事件：页面浏览 / 按钮点击 / 下单（可按业务增删）
INSERT INTO t_toc_event_meta (
  event_code, event_name, event_desc, page_scope, param_schema_json, is_active, version, owner
) VALUES
(
  'page_view',
  '页面浏览',
  '用户浏览页面',
  'all',
  JSON_OBJECT(
    'version', '1.0.0',
    'required', JSON_ARRAY('page_path'),
    'properties', JSON_OBJECT(
      'page_path', JSON_OBJECT('type', 'string', 'label', '页面路径', 'desc', '当前页面路由', 'example', '/home'),
      'referrer', JSON_OBJECT('type', 'string', 'label', '来源页面', 'desc', '进入当前页的来源', 'example', '/feed')
    )
  ),
  1,
  '1.0.0',
  'product'
),
(
  'button_click',
  '按钮点击',
  '用户点击关键按钮',
  'all',
  JSON_OBJECT(
    'version', '1.0.0',
    'required', JSON_ARRAY('button_id', 'page_path'),
    'properties', JSON_OBJECT(
      'button_id', JSON_OBJECT('type', 'string', 'label', '按钮ID', 'desc', '前端按钮唯一标识', 'example', 'pay_btn'),
      'page_path', JSON_OBJECT('type', 'string', 'label', '页面路径', 'desc', '按钮所在页面', 'example', '/checkout')
    )
  ),
  1,
  '1.0.0',
  'product'
),
(
  'purchase_submit',
  '提交下单',
  '用户提交下单事件',
  'checkout',
  JSON_OBJECT(
    'version', '1.0.0',
    'required', JSON_ARRAY('order_no', 'amount'),
    'properties', JSON_OBJECT(
      'order_no', JSON_OBJECT('type', 'string', 'label', '订单号', 'desc', '业务订单唯一号', 'example', 'O202603270001'),
      'amount', JSON_OBJECT('type', 'number', 'label', '订单金额', 'desc', '单位元', 'example', 99.5)
    )
  ),
  1,
  '1.0.0',
  'product'
);
```

## QUERY
### 查询启用的埋点事件定义
> NOTE: 给采集 SDK 或网关做参数校验。
```sql
-- 拉取全部启用中的事件定义（SDK/网关校验）
SELECT id, event_code, event_name, page_scope, param_schema_json, version
FROM t_toc_event_meta
WHERE is_active = 1
ORDER BY updated_at DESC;
```

### 按用户查询最近行为日志
> NOTE: 用于用户行为路径排查。
```sql
-- 单用户行为时间倒序分页
SELECT id, event_code, page_path, event_time, app_version, channel
FROM t_toc_user_event_log
WHERE user_id = ${user_id}
ORDER BY event_time DESC
LIMIT ${offset}, ${page_size};
```

### 根据设备反查用户
> NOTE: 用于设备归因与风控排查。
```sql
-- 设备维度反查绑定用户
SELECT user_id, device_id, bind_status, last_seen_at
FROM t_toc_user_device_rel
WHERE device_id = ${device_id}
ORDER BY updated_at DESC;
```

### 查询用户关联设备列表
> NOTE: 用于账号多设备分析。
```sql
-- 用户下挂设备列表（按最近活跃）
SELECT device_id, bind_status, last_seen_at
FROM t_toc_user_device_rel
WHERE user_id = ${user_id}
ORDER BY last_seen_at DESC;
```

## REPORT
### 按天统计事件量
> NOTE: 用于看板趋势图。
```sql
-- 近 30 日按天、按事件编码计数
SELECT DATE(event_time) AS dt, event_code, COUNT(*) AS event_cnt
FROM t_toc_user_event_log
WHERE event_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(event_time), event_code
ORDER BY dt, event_code;
```

### 按天统计 DAU
> NOTE: 匿名流量不计入 DAU。
```sql
-- 近 30 日 DAU（仅已登录 user_id 非空）
SELECT DATE(event_time) AS dt, COUNT(DISTINCT user_id) AS dau
FROM t_toc_user_event_log
WHERE user_id IS NOT NULL
  AND event_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(event_time)
ORDER BY dt;
```

## DEV
### 开发说明（接口概览与调用时序）
> NOTE: 与表 `t_toc_event_meta` / `t_toc_user_event_log` / `t_toc_user_device_rel` 对应；Base Path 示例 `/api/v1/toc`（可按网关统一前缀调整）。
```sql
-- ## 接口一览
-- Base Path：`/api/v1/toc`
--
-- | 序号 | 方法 | 路径（简写） | 场景 | 核心逻辑 |
-- | 1 | GET | /event-meta | App/SDK 启动 | 拉取启用中的事件定义与 `param_schema_json` |
-- | 2 | POST | /events/batch | 客户端批量上报 | 校验 `event_code` 与参数，写入 `t_toc_user_event_log` |
-- | 3 | POST | /device/bind | 用户登录后 | 维护 `t_toc_user_device_rel`，更新 `last_seen_at` |
-- | 4 | GET | /logs/user | 管理端/客服 | 按用户分页查行为日志（需鉴权） |
--
-- ## 推荐调用时序（典型 App 链路）
--
-- 1. **冷启动**：`GET /event-meta` → 本地缓存 `event_code` → `param_schema_json`（用于本地校验与采样策略）
-- 2. **浏览过程**：客户端攒批 → `POST /events/batch`（含 `device_id`、可选 `user_id`、`session_id`）
-- 3. **登录成功**：`POST /device/bind` 绑定 `user_id` + `device_id`，便于后续日志关联账号
-- 4. **运营/客诉**：`GET /logs/user` 按用户拉时间倒序日志
--
-- ## 泳道说明
--
-- - **客户端** 生成 `device_id`（持久化）、`session_id`（会话级）→ **网关** 鉴权/限流 → **埋点服务** 写库/消息队列
-- - **event_time** 建议客户端上报；服务端可校正时钟漂移（业务规则）
```

### 开发说明（接口① 拉取事件元数据）
> NOTE: 对应 QUERY「查询启用的埋点事件定义」；供 SDK 做参数校验。
```sql
-- Endpoint: `GET /api/v1/toc/event-meta`
-- Query（可选）：`since_version`（字符串，仅拉取 `version` 变更后的定义，减少流量）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "server_time": "2026-03-30T12:00:00Z",
--     "items": [
--       {
--         "event_code": "page_view",
--         "event_name": "页面浏览",
--         "page_scope": "all",
--         "param_schema_json": {
--           "version": "1.0.0",
--           "required": ["page_path"],
--           "properties": {
--             "page_path": { "type": "string", "label": "页面路径", "example": "/home" }
--           }
--         },
--         "version": "1.0.0"
--       }
--     ]
--   }
-- }
-- ```
```

### 开发说明（接口② 批量上报埋点）
> NOTE: 高频写入；建议异步落库 + 批量 INSERT；`event_time` 为客户端事件发生时间。
```sql
-- Endpoint: `POST /api/v1/toc/events/batch`
-- Header：设备指纹、`Authorization`（可选，匿名可仅 `device_id`）
-- Body 示例：
--
-- ```json
-- {
--   "device_id": "dev_abc123",
--   "session_id": "sess_20260330120000",
--   "user_id": 10086,
--   "app_version": "2.1.0",
--   "os": "iOS",
--   "channel": "AppStore",
--   "events": [
--     {
--       "event_code": "page_view",
--       "event_time": "2026-03-30T11:59:58.123Z",
--       "page_path": "/home",
--       "event_params": { "referrer": "/feed" }
--     },
--     {
--       "event_code": "button_click",
--       "event_time": "2026-03-30T11:59:59.456Z",
--       "page_path": "/checkout",
--       "event_params": { "button_id": "pay_btn" }
--     }
--   ]
-- }
-- ```
--
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "accepted": 2,
--     "rejected": 0,
--     "errors": []
--   }
-- }
-- ```
```

### 开发说明（接口③ 用户设备绑定）
> NOTE: 对应设备与用户关系表；登录/换设备时调用。
```sql
-- Endpoint: `POST /api/v1/toc/device/bind`
-- Body 示例：
--
-- ```json
-- {
--   "user_id": 10086,
--   "device_id": "dev_abc123",
--   "bind_status": 1
-- }
-- ```
--
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "rel_id": 501,
--     "last_seen_at": "2026-03-30T12:00:05Z"
--   }
-- }
-- ```
```

### 开发说明（接口④ 管理端查询用户行为日志）
> NOTE: 对应 QUERY「按用户查询最近行为日志」；需管理端角色与审计。
```sql
-- Endpoint: `GET /api/v1/toc/logs/user`
-- Query：`user_id`（必填）, `page`（默认 1）, `page_size`（默认 20）, `event_code`（可选）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "items": [
--       {
--         "id": 90001,
--         "event_code": "page_view",
--         "page_path": "/home",
--         "event_time": "2026-03-30T11:59:58Z",
--         "app_version": "2.1.0",
--         "channel": "AppStore"
--       }
--     ],
--     "pagination": { "total": 120, "current_page": 1, "has_more": true }
--   }
-- }
-- ```
```

### 开发说明（核心设计：写入与一致性）
> NOTE: 与 DDL 字段语义对齐。
```sql
-- ## 写入路径
-- - 批量上报接口将 `events[]` 映射为 `t_toc_user_event_log` 多行；`event_params` → `event_params_json`
-- - `ip` 建议取网关真实 IP，非客户端直传
--
-- ## 时间与幂等
-- - **event_time**：业务统计口径；服务端可记录 `created_at` 作为入库时间
-- - 高并发下可对 `(device_id, client_event_id)` 做幂等（需在协议中增加可选 `client_event_id` 字段，DDL 扩展另议）
--
-- ## 性能
-- - `t_toc_user_event_log` 为高频写表：批量插入、按时间分区/归档、冷热分离（业务成熟后）
-- - 读多写少报表走从库或 OLAP
```

### 开发说明（统计与口径）
> NOTE: 统计 SQL 的开发与联调注意事项。
```sql
-- ## 统计与口径
--
-- - **时间口径**：统一使用 `event_time`；默认近 30 天可改为参数化区间
-- - **DAU**：仅 `user_id` 非空；匿名建议单独 **device_dau** 口径
-- - **索引**：报表优先 `idx_event_time`、`idx_event_code_time`；维度多可考虑组合索引或分区
-- - **质量**：采集端按 `param_schema_json` 校验；建议每日任务检查 `event_code` 空值与非法值
```

### param_schema 与提示词说明
> NOTE: 字段约定与 AI 协作示例。
```sql
-- ## param_schema_json 字段说明
--
-- | 路径 | 含义 |
-- | properties.<key>.type | string / number / integer / boolean / object / array |
-- | properties.<key>.label | 参数中文名（运营展示） |
-- | properties.<key>.desc | 参数含义（开发联调） |
-- | properties.<key>.example | 示例值（自测/排查） |
-- | properties.<key>.enum | 可选值集合 |
--
-- ### 样例 JSON
--
-- ```json
-- {
--   "version": "1.0.1",
--   "required": ["order_no", "amount"],
--   "properties": {
--     "order_no": { "type": "string", "label": "订单号", "desc": "业务订单唯一号", "example": "O202603270001" },
--     "amount": { "type": "number", "label": "订单金额", "desc": "单位元", "example": 99.5 },
--     "coupon_type": { "type": "string", "label": "券类型", "enum": ["full_reduction", "discount"], "example": "discount" }
--   }
-- }
-- ```
--
-- ### 提示词示例
--
-- - 请基于 `event_code=xxx` 生成 `param_schema_json`，输出 `required` 与 `properties`，并补齐 label/desc/example。
-- - 请检查该 `param_schema_json` 是否与埋点上报参数一致，列出缺失字段、类型不匹配字段、可优化字段。
-- - 请将该 `param_schema_json` 升级到新版本，遵循向后兼容原则，仅新增可选字段并保留旧字段语义。
```