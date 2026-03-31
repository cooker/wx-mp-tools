---
code: product_service
name: 商品服务
bizType: 贸易
version: 1.0.0
description: SPU/SKU、规则配额、时段库存实例与库存日志；接口与时序、锁定事务约定详见仓库根目录 SQL.md。
---

## DDL
### 商品分类表 t_product_category
> NOTE: 树形分类；与 SPU 通过 category_id 关联。
```sql
CREATE TABLE t_product_category (
  id INT NOT NULL AUTO_INCREMENT COMMENT '主键',
  parent_id INT NOT NULL DEFAULT 0 COMMENT '父级ID，0 为根',
  name VARCHAR(50) NOT NULL COMMENT '分类名称',
  level TINYINT NOT NULL DEFAULT 1 COMMENT '层级深度',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '同级排序，升序',
  is_enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_parent (parent_id),
  KEY idx_enabled (is_enabled)
) ENGINE=InnoDB COMMENT='商品分类';
```

### 商品 SPU 表 t_product_spu
> NOTE: 标准产品单元；售卖期由 valid_start/valid_end 约束。
```sql
CREATE TABLE t_product_spu (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  category_id INT NOT NULL COMMENT '分类ID',
  spu_name VARCHAR(255) NOT NULL COMMENT '商品标题',
  main_image VARCHAR(255) NULL COMMENT '主图 URL',
  detail_html TEXT NULL COMMENT '富文本详情',
  valid_start DATE NOT NULL COMMENT '售卖/展示有效期起',
  valid_end DATE NOT NULL COMMENT '售卖/展示有效期止',
  status TINYINT NOT NULL DEFAULT 0 COMMENT '0下架 1上架',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_category (category_id),
  KEY idx_cat_status (category_id, status),
  KEY idx_valid_date (valid_start, valid_end),
  KEY idx_status (status)
) ENGINE=InnoDB COMMENT='商品 SPU';
```

### 商品 SKU 表 t_product_sku
> NOTE: 库存与价格的最小售卖单元；spec_data 为规格快照 JSON。
```sql
CREATE TABLE t_product_sku (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  spu_id BIGINT NOT NULL COMMENT '所属 SPU',
  sku_name VARCHAR(255) NOT NULL COMMENT 'SKU 展示名',
  base_price DECIMAL(12, 2) NOT NULL COMMENT '基础售价',
  spec_data JSON NOT NULL COMMENT '规格快照，如 {"颜色":"红","尺寸":"XL"}',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_spu (spu_id)
) ENGINE=InnoDB COMMENT='商品 SKU';
```

### 库存规则与配额表 t_stock_rule_config
> NOTE: 配置与实例分离；总配额 total_quota 与已生成 generated_stock 控制可下发库存上限。
```sql
CREATE TABLE t_stock_rule_config (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  sku_id BIGINT NOT NULL COMMENT 'SKU ID',
  rule_type TINYINT NOT NULL COMMENT '1按周重复 2按月重复 3指定日期',
  rule_value JSON NOT NULL COMMENT '周:[1,3,5] 月:[1,15] 或日期:["2026-05-01"]',
  slot_name VARCHAR(50) NOT NULL COMMENT '时段名称，如 09:00-12:00',
  total_quota INT NOT NULL DEFAULT 0 COMMENT '规则允许生成的总库存上限',
  generated_stock INT NOT NULL DEFAULT 0 COMMENT '该规则已生成/下发的库存累计',
  daily_stock_num INT NOT NULL COMMENT '单次生成的单日库存量',
  price_adjustment DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '相对 base_price 的调整',
  version INT NOT NULL DEFAULT 1 COMMENT '规则版本，变更追踪',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_sku (sku_id)
) ENGINE=InnoDB COMMENT='库存生成规则与总配额';
```

### 时段库存实例表 t_stock_time_slot_instance
> NOTE: 交易层行；高并发下对单行更新 + 唯一键防超卖。
```sql
CREATE TABLE t_stock_time_slot_instance (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  sku_id BIGINT NOT NULL COMMENT 'SKU ID',
  rule_config_id BIGINT NOT NULL COMMENT '来源规则配置ID',
  work_date DATE NOT NULL COMMENT '营业日期',
  slot_name VARCHAR(50) NOT NULL COMMENT '时段名',
  current_price DECIMAL(12, 2) NOT NULL COMMENT '当日该时段最终售价',
  max_stock INT NOT NULL COMMENT '生成时的初始库存',
  used_stock INT NOT NULL DEFAULT 0 COMMENT '已消耗(支付完成)',
  locked_stock INT NOT NULL DEFAULT 0 COMMENT '下单未支付锁定',
  available_stock INT GENERATED ALWAYS AS (max_stock - used_stock - locked_stock) VIRTUAL COMMENT '可用库存(计算列)',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0禁用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_sku_date_slot (sku_id, work_date, slot_name),
  KEY idx_rule_config (rule_config_id),
  KEY idx_work_date (work_date)
) ENGINE=InnoDB COMMENT='物理隔离时段库存实例';
```

### 库存变更日志表 t_stock_inventory_log
> NOTE: 全口径审计；biz_type 区分锁定、扣减、释放、规则调整等。
```sql
CREATE TABLE t_stock_inventory_log (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  sku_id BIGINT NOT NULL COMMENT 'SKU ID',
  instance_id BIGINT NULL COMMENT '时段库存实例ID',
  rule_config_id BIGINT NULL COMMENT '规则配置ID',
  order_sn VARCHAR(64) NULL COMMENT '关联订单号',
  biz_type TINYINT NOT NULL COMMENT '1锁定 2支付扣减 3取消释放 4规则调整 5初始化 6人工调账',
  change_num INT NOT NULL COMMENT '变动数量，可正可负',
  before_stock INT NOT NULL COMMENT '变动前实例可用库存',
  after_stock INT NOT NULL COMMENT '变动后实例可用库存',
  before_quota INT NULL COMMENT '变动前规则剩余配额(可选)',
  after_quota INT NULL COMMENT '变动后规则剩余配额(可选)',
  operator_id BIGINT NULL DEFAULT 0 COMMENT '操作人，0为系统',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_sku (sku_id),
  KEY idx_order_sn (order_sn),
  KEY idx_instance (instance_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB COMMENT='库存变更日志';
```

## SEED
### 示例分类、SPU、SKU 与库存规则
> NOTE: 演示数据；生产环境请替换 ID 与业务字段。
```sql
-- 分类
INSERT INTO t_product_category (parent_id, name, level, sort_order, is_enabled) VALUES
(0, '体验课', 1, 1, 1);

SET @cat_id = LAST_INSERT_ID();

-- SPU
INSERT INTO t_product_spu (category_id, spu_name, main_image, detail_html, valid_start, valid_end, status) VALUES
(@cat_id, '春季体验套餐', NULL, NULL, '2026-01-01', '2026-12-31', 1);

SET @spu_id = LAST_INSERT_ID();

-- SKU
INSERT INTO t_product_sku (spu_id, sku_name, base_price, spec_data) VALUES
(@spu_id, '单人上午场', 99.00, JSON_OBJECT('场次', '上午', '人数', '1'));

SET @sku_id = LAST_INSERT_ID();

-- 按周重复的时段规则（示例：周一三五放号）
INSERT INTO t_stock_rule_config (
  sku_id, rule_type, rule_value, slot_name,
  total_quota, generated_stock, daily_stock_num, price_adjustment, version
) VALUES (
  @sku_id,
  1,
  JSON_ARRAY(1, 3, 5),
  '09:00-12:00',
  1000,
  0,
  20,
  0.00,
  1
);
```

## QUERY
### 分页查询上架中的 SPU
> NOTE: 管理端列表；可按分类、名称筛选。
```sql
-- 上架 SPU 分页
SELECT p.id, p.spu_name, p.category_id, p.valid_start, p.valid_end, p.status, p.updated_at
FROM t_product_spu p
WHERE p.status = 1
  AND (${category_id} IS NULL OR p.category_id = ${category_id})
  AND (${spu_name} IS NULL OR p.spu_name LIKE CONCAT('%', ${spu_name}, '%'))
ORDER BY p.id DESC
LIMIT ${offset}, ${page_size};
```

### 查询某 SKU 在指定日期的时段库存实例
> NOTE: 下单前校验可用库存。
```sql
-- 某日某 SKU 各时段库存
SELECT id, work_date, slot_name, current_price, max_stock, used_stock, locked_stock, available_stock, status
FROM t_stock_time_slot_instance
WHERE sku_id = ${sku_id}
  AND work_date = ${work_date}
  AND status = 1
ORDER BY slot_name;
```

### 日历月内某 SKU 的时段实例（对接日历接口）
> NOTE: 与仓库 SQL.md 中 `GET /api/v1/product/calendar`（按 sku_id + month）一致；服务端按 `days` 聚合即可。
```sql
-- 自然月内实例列表（month_start / month_end 为当月首尾日期）
SELECT id,
       work_date,
       slot_name,
       current_price,
       available_stock,
       max_stock,
       used_stock,
       locked_stock,
       status
FROM t_stock_time_slot_instance
WHERE sku_id = ${sku_id}
  AND work_date >= ${month_start}
  AND work_date <= ${month_end}
  AND status = 1
ORDER BY work_date, slot_name;
```

### 查询某订单关联的库存日志
> NOTE: 售后与对账。
```sql
-- 按订单号追溯库存流水
SELECT id, biz_type, change_num, before_stock, after_stock, remark, created_at
FROM t_stock_inventory_log
WHERE order_sn = ${order_sn}
ORDER BY id ASC;
```

## UPDATE
### SPU 上/下架
> NOTE: 下架后应阻止新单；在途订单策略由业务定义。
```sql
-- status: 0下架 1上架
UPDATE t_product_spu
SET status = ${target_status}
WHERE id = ${spu_id};
```

### 释放某实例上的锁定库存（支付超时场景）
> NOTE: 与业务单状态机配合；此处仅示例扣减 locked、写日志在业务层事务中完成。
```sql
-- 示例：将锁定转为 0（真实场景需校验订单状态并记日志表）
UPDATE t_stock_time_slot_instance
SET locked_stock = GREATEST(locked_stock - ${release_num}, 0),
    updated_at = CURRENT_TIMESTAMP
WHERE id = ${instance_id}
  AND locked_stock >= ${release_num};
```

## REPORT
### 按 SKU 统计近 N 日库存变动笔数
> NOTE: 运营监控异常调账频率。
```sql
-- 近 30 日各 biz_type 笔数
SELECT biz_type, COUNT(*) AS cnt
FROM t_stock_inventory_log
WHERE sku_id = ${sku_id}
  AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY biz_type
ORDER BY biz_type;
```

### 按日期汇总时段实例生成量与销量
> NOTE: used_stock 近似视为已售（视业务是否含退款回冲）。
```sql
-- 按营业日汇总
SELECT work_date,
       SUM(max_stock) AS sum_max,
       SUM(used_stock) AS sum_used,
       SUM(locked_stock) AS sum_locked
FROM t_stock_time_slot_instance
WHERE sku_id = ${sku_id}
  AND work_date >= ${start_date}
  AND work_date <= ${end_date}
GROUP BY work_date
ORDER BY work_date;
```

## DEV
### 开发说明（数据模型与配额）
> NOTE: 与 DDL 中表结构对应；业务扩展仍以仓库 **SQL.md** 与本文档 DEV 接口节为准。
```sql
-- ## 数据模型与配额
--
-- - **物理隔离**：交易更新落在 `t_stock_time_slot_instance` 单行；`uk_sku_date_slot` 防重复行，配合行锁防超卖
-- - **总配额**：`t_stock_rule_config.total_quota` / `generated_stock` 约束可下发总量；生成任务不得突破剩余配额
-- - **规则变更**：instance 带 `rule_config_id`；调低配额时需处理未来已生成实例（作废/回收等业务策略）
-- - **追溯**：`t_stock_inventory_log` 覆盖锁定、扣减、释放、人工调账等（`biz_type` 与下文 Lock 流程一致）
-- - **计算列**：`available_stock` 为 `VIRTUAL`，仅展示；更新时只改 `max_stock` / `used_stock` / `locked_stock`
```

### 开发说明（接口概览与调用时序）
> NOTE: 与仓库根目录 **SQL.md** 第 1 节一致；以下为完整对照表与推荐调用顺序。
```sql
-- ## 接口一览（与 SQL.md 第 1 节一致）
-- Base Path：`/api/v1`
--
-- | 序号 | 接口路径（简写） | 调用场景 | 核心逻辑 |
-- | 1 | GET /category/tree | 首页/侧栏 | 多级分类树，递归展示 |
-- | 2 | GET /product/list | 分类点击/搜索 | 物理分页 SPU，可按分类、价格、销量排序 |
-- | 3 | GET /product/detail | 商品详情 | SPU 基础信息、有效期、SKU 规格 |
-- | 4 | GET /product/calendar | 选日期时段 | 某 SKU 在某月内的物理隔离实例库存 |
-- | 5 | POST /stock/lock | 立即购买/下单 | 原子预占实例库存并写流水日志 |
--
-- ## 推荐调用时序（典型下单闭环）
--
-- 1. **Step A**：`GET /api/v1/category/tree` — 拉分类，渲染导航/侧栏
-- 2. **Step B**：`GET /api/v1/product/list` — 用户点分类或搜索，分页展示 SPU
-- 3. **Step C**：`GET /api/v1/product/detail/{spu_id}` — 进详情页，展示 SKU 与规格
-- 4. **Step D**：`GET /api/v1/product/calendar` — 选 SKU + 月份，展示每日各时段 instance（含 `instance_id`）
-- 5. **Step E**：`POST /api/v1/stock/lock` — 选时段与数量，预占库存，返回 `lock_id` 与支付超时秒数
--
-- **扩展**（SQL.md 文末可选）：支付成功 → 核销（locked→used + 日志）；超时未支付 → 释放 locked + 日志
--
-- ## 泳道时序（联调排错）
--
-- - **用户** 打开首页 → **前端** `GET /api/v1/category/tree` → **后端** 读 `t_product_category`，组装 `children`
-- - **用户** 点击分类 → **前端** `GET /api/v1/product/list` → **后端** 解析子分类 ID，查 `t_product_spu`（`idx_cat_status`）
-- - **用户** 进详情 → **前端** `GET /api/v1/product/detail/{spu_id}` → **后端** 查 SPU + SKU
-- - **用户** 选 SKU 与月份 → **前端** `GET /api/v1/product/calendar` → **后端** 查 `t_stock_time_slot_instance` 聚合成 `days[].slots`
-- - **用户** 下单 → **前端** `POST /api/v1/stock/lock` → **后端** 行锁实例、`INSERT t_stock_inventory_log`（`biz_type=1`）
```

### 开发说明（接口① 分类树）
> NOTE: 完整入参/出参与 SQL.md 第 2 节①一致。
```sql
-- Endpoint: `GET /api/v1/category/tree`
-- 入参：无
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": [
--     {
--       "id": 1,
--       "name": "潜水预约",
--       "level": 1,
--       "children": [
--         { "id": 101, "name": "深海潜水", "level": 2, "product_count": 45 }
--       ]
--     }
--   ]
-- }
-- ```
```

### 开发说明（接口② 商品分页列表）
> NOTE: 与 SQL.md 第 2 节②一致；列表 SQL 见本模板 QUERY「分页查询上架中的 SPU」。
```sql
-- Endpoint: `GET /api/v1/product/list`
-- Query：`category_id`（必填）, `page`（默认 1）, `page_size`（默认 20）, `sort_field`（可选 price|sales|time）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "items": [
--       {
--         "spu_id": 1001,
--         "spu_name": "马尔代夫双人深潜",
--         "main_image": "https://img.com/p1.jpg",
--         "min_price": "599.00",
--         "sales_volume": 1200,
--         "valid_period": "2026-04-01 至 2026-10-01"
--       }
--     ],
--     "pagination": {
--       "total": 156,
--       "current_page": 1,
--       "total_pages": 8,
--       "has_more": true
--     }
--   }
-- }
-- ```
```

### 开发说明（接口③ 商品详情与规格）
> NOTE: 与 SQL.md 第 2 节③一致。
```sql
-- Endpoint: `GET /api/v1/product/detail/{spu_id}`
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "spu_id": 1001,
--     "spu_name": "马尔代夫双人深潜",
--     "description": "专业教练陪同...",
--     "valid_start": "2026-04-01",
--     "valid_end": "2026-10-01",
--     "spec_list": [
--       { "attr_key": "等级", "values": [ {"id": 10, "name": "初级"}, {"id": 11, "name": "进阶"} ] }
--     ],
--     "sku_list": [
--       {
--         "sku_id": 5001,
--         "spec_ids": [10],
--         "price": "599.00",
--         "sku_name": "初级体验套餐"
--       }
--     ]
--   }
-- }
-- ```
```

### 开发说明（接口④ 物理库存日历）
> NOTE: 与 SQL.md 第 2 节④一致；月维度实例查询见本模板 QUERY「日历月内某 SKU」。
```sql
-- Endpoint: `GET /api/v1/product/calendar`
-- Query：`sku_id`（必填）, `month`（必填，格式 `2026-05`）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "sku_id": 5001,
--     "days": [
--       {
--         "date": "2026-05-01",
--         "is_work_day": true,
--         "slots": [
--           {
--             "instance_id": 9901,
--             "slot_name": "09:00-12:00",
--             "available_stock": 5,
--             "current_price": "599.00"
--           }
--         ]
--       }
--     ]
--   }
-- }
-- ```
```

### 开发说明（接口⑤ 预占锁定库存）
> NOTE: 与 SQL.md 第 2 节⑤一致；须与「核心设计」同一套事务与日志策略。
```sql
-- Endpoint: `POST /api/v1/stock/lock`
-- Body 示例：
--
-- ```json
-- {
--   "instance_id": 9901,
--   "sku_id": 5001,
--   "count": 1,
--   "order_sn": "SN20260330123",
--   "user_id": 10086
-- }
-- ```
--
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "msg": "库存预占成功",
--   "data": {
--     "lock_id": "L_7788",
--     "expire_seconds": 900
--   }
-- }
-- ```
```

### 开发说明（核心设计：行锁、事务与列表性能）
> NOTE: 与 SQL.md 第 3 节一致；以下为可执行语义（非字面执行一条 SQL）。
```sql
-- ## 1. 物理隔离与行锁（防超卖）
-- 更新实例须带条件保证可用库存充足，例如：
--
-- ```sql
-- UPDATE t_stock_time_slot_instance
-- SET locked_stock = locked_stock + :count
-- WHERE id = :instance_id
--   AND (max_stock - used_stock - locked_stock) >= :count;
-- ```
--
-- （等价于在 `available_stock >= count` 条件下增加 `locked_stock`。）
--
-- ## 2. 状态一致性
-- Lock 成功后，**同一事务内**写入 `t_stock_inventory_log`，`biz_type = 1`（下单锁定），并记录 `order_sn`、前后库存快照。
--
-- ## 3. 分类分页性能
-- `GET /product/list` 建议走 `category_id` + `status` 联合索引（本模板 DDL 已含 `idx_cat_status`）。
-- 若分类层级深，先在 `t_product_category` 递归算出子分类 ID 集合，再 `IN` 查询 `t_product_spu`。
```
