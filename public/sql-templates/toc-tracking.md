---
code: toc_tracking
name: TOC 应用埋点模板
bizType: 埋点
version: 1.0.0
description: 包含埋点元数据管理与用户行为埋点日志记录。
---

## DDL
### 埋点元数据表 t_toc_event_meta
> NOTE: 管理事件定义与参数规范，供采集端进行校验。
```sql
CREATE TABLE t_toc_event_meta (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event_code VARCHAR(64) NOT NULL COMMENT '事件编码(唯一)',
  event_name VARCHAR(128) NOT NULL COMMENT '事件名称',
  event_desc VARCHAR(255) NULL COMMENT '事件说明',
  page_scope VARCHAR(128) NULL COMMENT '适用页面/模块',
  param_schema_json JSON NULL COMMENT '参数定义(JSON Schema/约定)',
  is_active TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  version VARCHAR(32) NOT NULL DEFAULT '1.0.0' COMMENT '埋点定义版本',
  owner VARCHAR(64) NULL COMMENT '负责人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_event_code (event_code),
  KEY idx_active (is_active),
  CONSTRAINT chk_json CHECK (JSON_VALID(param_schema_json))
) ENGINE=InnoDB;
```

### 用户行为埋点日志表 t_toc_user_event_log
> NOTE: 高频写入表，建议按事件时间与事件编码建立索引。
```sql
CREATE TABLE t_toc_user_event_log (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
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
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_event_time (event_time),
  KEY idx_event_code_time (event_code, event_time),
  KEY idx_user_time (user_id, event_time),
  KEY idx_device_time (device_id, event_time)
) ENGINE=InnoDB;
```

### 用户与设备关联表 t_toc_user_device_rel
> NOTE: 记录用户与设备绑定关系，支持设备反查用户与活跃追踪。
```sql
CREATE TABLE t_toc_user_device_rel (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  device_id VARCHAR(128) NOT NULL COMMENT '设备ID',
  bind_status TINYINT NOT NULL DEFAULT 1 COMMENT '1绑定 0解绑',
  last_seen_at DATETIME NULL COMMENT '最近活跃时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_device (user_id, device_id),
  KEY idx_device (device_id),
  KEY idx_user (user_id),
  KEY idx_last_seen (last_seen_at)
) ENGINE=InnoDB;
```

## SEED
### param_schema_json 字段说明与推荐结构
> NOTE: 该说明放在 SEED，不放在 DDL。用于运营和开发协同维护参数定义。
```sql
/*
param_schema_json 推荐包含以下叶子字段说明:
- version: 规则版本，便于灰度与回滚
- required: 必填参数列表
- properties.<key>.type: 参数类型(string/number/integer/boolean/object/array)
- properties.<key>.label: 参数中文名(给运营看)
- properties.<key>.desc: 参数说明
- properties.<key>.example: 示例值
- properties.<key>.enum: 可选枚举值(可选)
*/
```

### 初始化埋点元数据
> NOTE: 示例初始化，可按业务扩展。
```sql
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
SELECT id, event_code, event_name, page_scope, param_schema_json, version
FROM t_toc_event_meta
WHERE is_active = 1
ORDER BY updated_at DESC;
```

### 按用户查询最近行为日志
> NOTE: 用于用户行为路径排查。
```sql
SELECT id, event_code, page_path, event_time, app_version, channel
FROM t_toc_user_event_log
WHERE user_id = ${user_id}
ORDER BY event_time DESC
LIMIT ${offset}, ${page_size};
```

### 根据设备反查用户
> NOTE: 用于设备归因与风控排查。
```sql
SELECT user_id, device_id, bind_status, last_seen_at
FROM t_toc_user_device_rel
WHERE device_id = ${device_id}
ORDER BY updated_at DESC;
```

### 查询用户关联设备列表
> NOTE: 用于账号多设备分析。
```sql
SELECT device_id, bind_status, last_seen_at
FROM t_toc_user_device_rel
WHERE user_id = ${user_id}
ORDER BY last_seen_at DESC;
```

## REPORT
### 按天统计事件量
> NOTE: 用于看板趋势图。
```sql
SELECT DATE(event_time) AS dt, event_code, COUNT(*) AS event_cnt
FROM t_toc_user_event_log
WHERE event_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(event_time), event_code
ORDER BY dt, event_code;
```

### 按天统计 DAU
> NOTE: 匿名流量不计入 DAU。
```sql
SELECT DATE(event_time) AS dt, COUNT(DISTINCT user_id) AS dau
FROM t_toc_user_event_log
WHERE user_id IS NOT NULL
  AND event_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY DATE(event_time)
ORDER BY dt;
```

## DEV
### 开发说明
> NOTE: 统计 SQL 的开发与联调注意事项。
```sql
1) 时间口径:
   - 统一使用 event_time 作为统计时间字段
   - 默认统计窗口为近 30 天，可按业务改为参数化时间区间

2) DAU 口径:
   - 仅统计 user_id 非空数据
   - 匿名设备可单独统计为 device_dau，避免混入口径

3) 索引建议:
   - 报表高频查询优先使用 idx_event_time、idx_event_code_time
   - 若后续维度增多，可考虑增加组合索引或按月分区

4) 数据质量:
   - 采集端需校验 param_schema_json，减少脏数据
   - 建议增加每日校验任务，检查 event_code 空值与非法值
```
### 开发说明
> NOTE: 统计 SQL 的开发与联调注意事项。
```sql
param_schema_json 说明:
   - version: schema 版本号，参数结构变更时递增
   - required: 必填参数路径数组，例如 ["order_no", "amount"]
   - properties: 参数定义对象，key 为参数名，value 为字段描述
   - properties.<key>.type: 参数类型(string/number/integer/boolean/object/array)
   - properties.<key>.label: 参数中文名，供运营侧展示
   - properties.<key>.desc: 参数含义说明，供开发联调
   - properties.<key>.example: 参数示例值，便于自测与排查
   - properties.<key>.enum: 可选值集合(如状态码、来源渠道)

param_schema_json 样例:
   {
     "version": "1.0.1",
     "required": ["order_no", "amount"],
     "properties": {
       "order_no": { "type": "string", "label": "订单号", "desc": "业务订单唯一号", "example": "O202603270001" },
       "amount": { "type": "number", "label": "订单金额", "desc": "单位元", "example": 99.5 },
       "coupon_type": { "type": "string", "label": "券类型", "enum": ["full_reduction", "discount"], "example": "discount" }
     }
   }

开发提示词:
   - "请基于 event_code=xxx 生成 param_schema_json，输出 required 与 properties，并补齐 label/desc/example。"
   - "请检查该 param_schema_json 是否与埋点上报参数一致，列出缺失字段、类型不匹配字段、可优化字段。"
   - "请将该 param_schema_json 升级到新版本，遵循向后兼容原则，仅新增可选字段并保留旧字段语义。"
```