---
code: app_decoration
name: APP装修
bizType: CMS
version: 1.0.0
description: v3：全表逻辑删除（deleted_at）；统一发布草稿箱 t_cms_publish_drafts（字段对齐发布快照）；草稿创建超 24h 物理清理。
---

## DDL
> NOTE: **逻辑删除**：各表统一 `deleted_at`（NULL 未删，非 NULL 为删除时间）。业务查询默认带 `deleted_at IS NULL`；唯一键仍含已删行，若需软删后复用同编码需业务改名或物理清理。

### 渠道组表 t_cms_channels
> NOTE: 品牌/渠道隔离层，含 IP 白名单与签名密钥。
```sql
CREATE TABLE t_cms_channels (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '自增主键',
  group_code VARCHAR(50) NOT NULL COMMENT '渠道组唯一编码，如 xian_fu_group',
  group_name VARCHAR(100) NOT NULL COMMENT '渠道组名称',
  ip_whitelist TEXT NULL COMMENT '服务器IP白名单，多个逗号分隔，可通配',
  auth_secret_key_enc VARCHAR(255) NULL COMMENT '接口签名密钥（密文或KMS引用）',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1启用 0禁用',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  UNIQUE KEY uk_group_code (group_code),
  KEY idx_status (status),
  KEY idx_deleted_at (deleted_at)
) ENGINE=InnoDB COMMENT='渠道组安全与基础配置';
```

### 金刚区配置快照表 t_cms_grid_configs
> NOTE: 存金刚区静态配置（背景、布局、版本）；一个渠道组下可有多业务 app_key。
```sql
CREATE TABLE t_cms_grid_configs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '快照ID',
  channel_id BIGINT UNSIGNED NOT NULL COMMENT '所属渠道组ID',
  app_name VARCHAR(100) NOT NULL COMMENT '金刚区业务名称',
  app_key VARCHAR(100) NOT NULL COMMENT '金刚区业务唯一标识',
  version_num VARCHAR(50) NOT NULL COMMENT '配置版本号',
  bg_image_url VARCHAR(500) NULL COMMENT '金刚区背景图URL',
  sticky_type ENUM('NORMAL', 'TOP_STICKY', 'BOTTOM_FIXED') NOT NULL DEFAULT 'NORMAL' COMMENT '布局固定方式',
  grid_layout VARCHAR(50) NOT NULL DEFAULT '2*4' COMMENT '布局结构，如 2*4',
  created_by BIGINT UNSIGNED NULL COMMENT '创建人ID',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '快照创建时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  KEY idx_app_key (app_key),
  KEY idx_channel (channel_id),
  UNIQUE KEY uk_app_version (app_key, version_num),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_grid_channel FOREIGN KEY (channel_id) REFERENCES t_cms_channels (id)
) ENGINE=InnoDB COMMENT='金刚区配置快照';
```

### 金刚区按钮明细表 t_cms_grid_items
> NOTE: 每个按钮在同一快照内与目标页面保持唯一映射（避免全局唯一导致版本复用冲突）。
```sql
CREATE TABLE t_cms_grid_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  grid_config_id BIGINT UNSIGNED NOT NULL COMMENT '所属金刚区配置快照ID',
  target_page_id BIGINT UNSIGNED NULL COMMENT '目标页面ID（1:1）',
  title VARCHAR(50) NOT NULL COMMENT '按钮标题',
  is_title_visible TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否显示标题：1显示 0隐藏',
  icon_url VARCHAR(500) NOT NULL COMMENT '按钮图标',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序，越小越靠前',
  is_default_open TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认打开：1默认打开 0普通展示',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1启用 0隐藏',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  UNIQUE KEY uk_grid_target_page (grid_config_id, target_page_id),
  KEY idx_grid (grid_config_id),
  KEY idx_active_sort (is_active, sort_order),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_item_grid FOREIGN KEY (grid_config_id) REFERENCES t_cms_grid_configs (id)
) ENGINE=InnoDB COMMENT='金刚区按钮明细';
```

### 页面主表 t_cms_pages
> NOTE: 合并终端与页面定义：应用终端信息 + 页面编码，共用 t_cms_pages。
```sql
CREATE TABLE t_cms_pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '页面ID',
  channel_id BIGINT UNSIGNED NOT NULL COMMENT '所属渠道组ID',
  app_name VARCHAR(100) NOT NULL COMMENT '终端名称',
  app_key VARCHAR(100) NOT NULL COMMENT '终端唯一标识',
  platform ENUM('IOS', 'ANDROID', 'H5', 'MINI_APP') NOT NULL COMMENT '运行平台',
  bg_image_url VARCHAR(500) NULL COMMENT '终端级背景图',
  bg_gradient VARCHAR(500) NULL COMMENT '终端级渐变色（CSS）',
  aspect_ratio DECIMAL(5,2) NULL COMMENT '背景图宽高比',
  page_code VARCHAR(100) NOT NULL COMMENT '页面编码',
  page_name VARCHAR(100) NOT NULL COMMENT '页面显示名称',
  current_revision_id BIGINT UNSIGNED NULL COMMENT '当前线上快照ID',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  UNIQUE KEY uk_app_page (app_key, page_code),
  KEY idx_channel (channel_id),
  KEY idx_app_key (app_key),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_page_channel FOREIGN KEY (channel_id) REFERENCES t_cms_channels (id)
) ENGINE=InnoDB COMMENT='页面主体定义';
```

### 统一发布快照表 t_cms_publish_revisions
> NOTE: 合并金刚区发布策略与页面快照；一次发布同时生效金刚区与页面，回滚也统一按 revision 执行。`page_code` 仅存于 `t_cms_pages`，本表通过 `page_id` 关联；金刚区以 `grid_snapshot_json` 为唯一落库来源，不再冗余 `grid_config_id`。
```sql
CREATE TABLE t_cms_publish_revisions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '统一发布快照ID',
  page_id BIGINT UNSIGNED NOT NULL COMMENT '所属页面ID（关联 t_cms_pages）',
  grid_snapshot_json JSON NOT NULL COMMENT '金刚区快照JSON（布局+按钮明细）',
  layout_data JSON NOT NULL COMMENT '页面快照JSON（组件+素材）',
  start_time TIMESTAMP NOT NULL COMMENT '生效时间',
  end_time TIMESTAMP NULL COMMENT '失效时间，可空',
  gray_strategy ENUM('NONE', 'PERCENTAGE', 'WHITELIST') NOT NULL DEFAULT 'NONE' COMMENT '灰度策略',
  gray_value TEXT NULL COMMENT '灰度值',
  min_app_version VARCHAR(20) NOT NULL DEFAULT '0.0.0' COMMENT '最小APP版本（展示）',
  min_app_version_code INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最小APP版本码（比较）',
  priority INT NOT NULL DEFAULT 0 COMMENT '优先级，重叠时取大',
  status TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1发布中 0撤回',
  operator_id BIGINT UNSIGNED NULL COMMENT '操作人ID',
  publish_remark VARCHAR(255) NOT NULL COMMENT '发布备注（必填）',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  KEY idx_resolve (page_id, start_time, status),
  KEY idx_version_code (page_id, min_app_version_code),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_publish_page FOREIGN KEY (page_id) REFERENCES t_cms_pages (id)
) ENGINE=InnoDB COMMENT='统一发布快照（同发同回滚）';
```

### 统一发布草稿箱 t_cms_publish_drafts
> NOTE: 字段与 `t_cms_publish_revisions` 对齐（`page_id` + `grid_snapshot_json` + `layout_data`），用于未正式发布前的保存；**创建超过 24 小时**由定时任务**物理删除**（见 UPDATE「清理超 24h 草稿」）。本表也可使用 `deleted_at` 做运营手动软删。
```sql
CREATE TABLE t_cms_publish_drafts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '草稿ID',
  page_id BIGINT UNSIGNED NOT NULL COMMENT '所属页面ID（关联 t_cms_pages）',
  grid_snapshot_json JSON NOT NULL COMMENT '金刚区草稿JSON（布局+按钮明细）',
  layout_data JSON NOT NULL COMMENT '页面草稿JSON（组件+素材）',
  operator_id BIGINT UNSIGNED NULL COMMENT '编辑人ID',
  draft_remark VARCHAR(255) NULL COMMENT '草稿备注',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  KEY idx_page_created (page_id, created_at),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_draft_page FOREIGN KEY (page_id) REFERENCES t_cms_pages (id)
) ENGINE=InnoDB COMMENT='统一发布草稿箱（对齐发布快照结构）';
```

### 页面组件表 t_cms_page_components
> NOTE: 楼层组件（BANNER/NEWS/LIST），支持样式 JSON 与接口拼参。
```sql
CREATE TABLE t_cms_page_components (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '组件ID',
  page_id BIGINT UNSIGNED NOT NULL COMMENT '所属页面ID',
  component_type VARCHAR(50) NOT NULL COMMENT '组件类型',
  bg_image_url VARCHAR(500) NULL COMMENT '组件背景图',
  bg_gradient VARCHAR(500) NULL COMMENT '组件渐变色',
  aspect_ratio DECIMAL(5,2) NULL COMMENT '组件宽高比',
  api_url VARCHAR(500) NULL COMMENT '后端接口地址',
  api_params JSON NULL COMMENT '接口动态拼参',
  styles JSON NULL COMMENT '前端样式JSON',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '楼层排序',
  is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  KEY idx_page_sort (page_id, sort_order),
  KEY idx_active (is_active),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_comp_page FOREIGN KEY (page_id) REFERENCES t_cms_pages (id)
) ENGINE=InnoDB COMMENT='页面楼层组件配置';
```

### 组件素材明细表 t_cms_component_items
> NOTE: 轮播图/卡片列表的子项内容。
```sql
CREATE TABLE t_cms_component_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '子项ID',
  component_id BIGINT UNSIGNED NOT NULL COMMENT '所属组件ID',
  title VARCHAR(255) NULL COMMENT '主标题',
  sub_title VARCHAR(255) NULL COMMENT '副标题',
  img_url VARCHAR(500) NULL COMMENT '图片地址',
  link_type ENUM('H5', 'NATIVE', 'MINI_PROGRAM', 'NONE') NOT NULL DEFAULT 'NONE' COMMENT '跳转协议类型',
  link_value VARCHAR(500) NULL COMMENT '跳转目标',
  ext_data JSON NULL COMMENT '扩展字段JSON',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT '逻辑删除时间，NULL为未删除',
  PRIMARY KEY (id),
  KEY idx_comp_sort (component_id, sort_order),
  KEY idx_deleted_at (deleted_at),
  CONSTRAINT fk_item_comp FOREIGN KEY (component_id) REFERENCES t_cms_page_components (id)
) ENGINE=InnoDB COMMENT='组件素材明细';
```

## SEED
### 最小可用初始化示例
> NOTE: 示例数据仅用于联调演示。
```sql
-- 1) 渠道组
INSERT INTO t_cms_channels (group_code, group_name, ip_whitelist, auth_secret_key_enc, status)
VALUES ('xian_fu_group', '闲付系列', '10.0.0.1,10.0.0.*', 'kms://cms/channel/xian_fu_group', 1);

SET @channel_id = LAST_INSERT_ID();

-- 2) 页面（合并终端字段）
INSERT INTO t_cms_pages (
  channel_id, app_name, app_key, platform, bg_image_url, bg_gradient, aspect_ratio,
  page_code, page_name, current_revision_id
) VALUES (
  @channel_id, '闲付iOS端', 'xian_fu_ios', 'IOS', NULL, 'linear-gradient(#fff,#f5f5f5)', 1.78,
  'home', '首页', NULL
);

SET @page_id = LAST_INSERT_ID();

-- 3) 金刚区配置快照
INSERT INTO t_cms_grid_configs (channel_id, app_name, app_key, version_num, bg_image_url, sticky_type, grid_layout)
VALUES (@channel_id, '闲付首页金刚区', 'xian_fu_home_grid', 'v1.0.0', NULL, 'NORMAL', '2*4');

SET @grid_id = LAST_INSERT_ID();

-- 4) 金刚区按钮（默认打开）
INSERT INTO t_cms_grid_items (grid_config_id, target_page_id, title, is_title_visible, icon_url, sort_order, is_default_open, is_active)
VALUES (@grid_id, @page_id, '极速贷', 1, 'https://cdn.example.com/icon-fast-loan.png', 1, 1, 1);

-- 5) 统一发布快照（同发金刚区与页面）
INSERT INTO t_cms_publish_revisions (
  page_id, grid_snapshot_json, layout_data,
  start_time, end_time, gray_strategy, gray_value,
  min_app_version, min_app_version_code, priority, status,
  operator_id, publish_remark
) VALUES (
  @page_id,
  JSON_OBJECT(
    'grid_layout', '2*4',
    'sticky_type', 'NORMAL',
    'items', JSON_ARRAY(
      JSON_OBJECT('title', '极速贷', 'is_title_visible', 1, 'icon_url', 'https://cdn.example.com/icon-fast-loan.png', 'target_page_id', @page_id, 'is_default_open', 1, 'sort_order', 1)
    )
  ),
  JSON_OBJECT('components', JSON_ARRAY()),
  NOW(), NULL, 'NONE', NULL,
  '0.0.0', 0, 10, 1,
  10001, '首版发布：金刚区与首页同步上线'
);

-- 6) 草稿箱（与发布快照字段对齐，未发布前可多次覆盖保存）
INSERT INTO t_cms_publish_drafts (page_id, grid_snapshot_json, layout_data, operator_id, draft_remark)
VALUES (
  @page_id,
  JSON_OBJECT('grid_layout', '2*4', 'sticky_type', 'NORMAL', 'items', JSON_ARRAY()),
  JSON_OBJECT('components', JSON_ARRAY()),
  10001,
  '联调草稿'
);
```

## QUERY
### 根据 app_key + page_code + 时间 + 版本命中统一发布快照
> NOTE: 先取命中发布快照；金刚区渲染数据以 `grid_snapshot_json` 为准，如需对齐 `t_cms_grid_configs` 可另查；`layout_data` 同条记录返回。
```sql
SELECT r.id AS publish_revision_id,
       r.grid_snapshot_json,
       p.app_key,
       p.page_code,
       r.layout_data,
       r.gray_strategy,
       r.gray_value,
       r.min_app_version,
       r.min_app_version_code,
       r.priority
FROM t_cms_publish_revisions r
INNER JOIN t_cms_pages p ON p.id = r.page_id
WHERE p.app_key = ${app_key}
  AND p.page_code = ${page_code}
  AND p.deleted_at IS NULL
  AND r.deleted_at IS NULL
  AND r.status = 1
  AND r.start_time <= NOW()
  AND (r.end_time IS NULL OR r.end_time > NOW())
  AND ${client_version_code} >= r.min_app_version_code
ORDER BY r.priority DESC, r.id DESC
LIMIT 1;
```

### 命中灰度策略（含 UID + 版本 + 时间）
> NOTE: 以灰度策略过滤候选策略，再按优先级取最优；`PERCENTAGE` 使用 CRC32(uid) 做稳定分桶（示例为 0-99）。
```sql
-- 参数约定：
-- ${app_key}：业务标识
-- ${client_version_code}：客户端版本码（例如 3.2.15 -> 30215）
-- ${uid}：用户标识（灰度桶使用）
--
-- gray_strategy:
-- - NONE：全量命中
-- - PERCENTAGE：gray_value=0..100，命中条件 = (CRC32(uid) % 100) < gray_value
-- - WHITELIST：gray_value 约定为逗号分隔 UID 列表（如 "10086,10010"），命中条件 = FIND_IN_SET(uid, gray_value) > 0
SELECT r.id, p.app_key, p.page_code, r.gray_strategy, r.gray_value, r.min_app_version, r.min_app_version_code, r.priority
FROM t_cms_publish_revisions r
INNER JOIN t_cms_pages p ON p.id = r.page_id
WHERE p.app_key = ${app_key}
  AND p.page_code = ${page_code}
  AND p.deleted_at IS NULL
  AND r.deleted_at IS NULL
  AND r.status = 1
  AND r.start_time <= NOW()
  AND (r.end_time IS NULL OR r.end_time > NOW())
  AND ${client_version_code} >= r.min_app_version_code
  AND (
    r.gray_strategy = 'NONE'
    OR (r.gray_strategy = 'PERCENTAGE' AND CAST(r.gray_value AS UNSIGNED) > 0
        AND (CRC32(CAST(${uid} AS CHAR)) % 100) < CAST(r.gray_value AS UNSIGNED))
    OR (r.gray_strategy = 'WHITELIST' AND FIND_IN_SET(CAST(${uid} AS CHAR), r.gray_value) > 0)
  )
ORDER BY r.priority DESC, r.id DESC
LIMIT 1;
```

### 命中灰度策略（同 app_key 多策略冲突排查）
> NOTE: 返回所有满足时间/版本/灰度条件的候选策略，便于排查优先级冲突。
```sql
SELECT r.id, p.app_key, p.page_code, r.gray_strategy, r.gray_value, r.min_app_version, r.min_app_version_code, r.priority,
       r.start_time, r.end_time
FROM t_cms_publish_revisions r
INNER JOIN t_cms_pages p ON p.id = r.page_id
WHERE p.app_key = ${app_key}
  AND p.page_code = ${page_code}
  AND p.deleted_at IS NULL
  AND r.deleted_at IS NULL
  AND r.status = 1
  AND r.start_time <= NOW()
  AND (r.end_time IS NULL OR r.end_time > NOW())
  AND ${client_version_code} >= r.min_app_version_code
  AND (
    r.gray_strategy = 'NONE'
    OR (r.gray_strategy = 'PERCENTAGE' AND (CRC32(CAST(${uid} AS CHAR)) % 100) < CAST(r.gray_value AS UNSIGNED))
    OR (r.gray_strategy = 'WHITELIST' AND FIND_IN_SET(CAST(${uid} AS CHAR), r.gray_value) > 0)
  )
ORDER BY r.priority DESC, r.id DESC;
```

### 查询金刚区快照及按钮列表
> NOTE: 管理端预览或发布后拉取静态配置。
```sql
SELECT g.id AS grid_config_id,
       g.app_name,
       g.app_key,
       g.version_num,
       g.bg_image_url,
       g.sticky_type,
       g.grid_layout,
       i.id AS item_id,
       i.title,
       i.is_title_visible,
       i.icon_url,
       i.target_page_id,
       i.is_default_open,
       i.sort_order
FROM t_cms_grid_configs g
LEFT JOIN t_cms_grid_items i ON i.grid_config_id = g.id AND i.is_active = 1 AND i.deleted_at IS NULL
WHERE g.id = ${grid_config_id}
  AND g.deleted_at IS NULL
ORDER BY i.sort_order, i.id;
```

### 查询页面下启用组件与素材
> NOTE: 页面渲染聚合查询。
```sql
SELECT c.id AS component_id,
       c.component_type,
       c.api_url,
       c.api_params,
       c.styles,
       c.sort_order AS component_sort,
       i.id AS item_id,
       i.title,
       i.sub_title,
       i.img_url,
       i.link_type,
       i.link_value,
       i.ext_data,
       i.sort_order AS item_sort
FROM t_cms_page_components c
LEFT JOIN t_cms_component_items i ON i.component_id = c.id AND i.deleted_at IS NULL
WHERE c.page_id = ${page_id}
  AND c.is_active = 1
  AND c.deleted_at IS NULL
ORDER BY c.sort_order, i.sort_order, i.id;
```

### 草稿箱列表（按页面，未删）
> NOTE: 运营端拉取当前页草稿；正式发版走 `POST /publish/revisions`。
```sql
SELECT d.id AS draft_id,
       d.page_id,
       d.grid_snapshot_json,
       d.layout_data,
       d.draft_remark,
       d.operator_id,
       d.created_at,
       d.updated_at
FROM t_cms_publish_drafts d
INNER JOIN t_cms_pages p ON p.id = d.page_id AND p.deleted_at IS NULL
WHERE d.page_id = ${page_id}
  AND d.deleted_at IS NULL
ORDER BY d.updated_at DESC, d.id DESC;
```

## UPDATE
### 新增统一发布快照（同发金刚区+页面）
> NOTE: 一次发布同时绑定 `page_id`、`grid_snapshot_json` 与 `layout_data`；`publish_remark` 必填。
```sql
INSERT INTO t_cms_publish_revisions (
  page_id, grid_snapshot_json, layout_data,
  start_time, end_time, gray_strategy, gray_value,
  min_app_version, min_app_version_code, priority, status,
  operator_id, publish_remark
) VALUES (
  ${page_id}, ${grid_snapshot_json}, ${layout_data},
  ${start_time}, ${end_time}, ${gray_strategy}, ${gray_value},
  ${min_app_version}, ${min_app_version_code}, ${priority}, 1,
  ${operator_id}, ${publish_remark}
);
```

### 撤回统一发布快照
> NOTE: 撤回后不影响历史记录，仅停止命中。
```sql
UPDATE t_cms_publish_revisions
SET status = 0
WHERE id = ${publish_revision_id}
  AND deleted_at IS NULL;
```

### 新增草稿
> NOTE: 与 `t_cms_publish_revisions` 同结构字段；发布前在草稿箱迭代。
```sql
INSERT INTO t_cms_publish_drafts (page_id, grid_snapshot_json, layout_data, operator_id, draft_remark)
VALUES (${page_id}, ${grid_snapshot_json}, ${layout_data}, ${operator_id}, ${draft_remark});
```

### 更新草稿
> NOTE: 按 `draft_id` + `page_id` 更新；软删后不可写。
```sql
UPDATE t_cms_publish_drafts
SET grid_snapshot_json = ${grid_snapshot_json},
    layout_data = ${layout_data},
    draft_remark = ${draft_remark},
    operator_id = ${operator_id},
    updated_at = CURRENT_TIMESTAMP
WHERE id = ${draft_id}
  AND page_id = ${page_id}
  AND deleted_at IS NULL;
```

### 草稿箱软删
> NOTE: 运营手动废弃草稿；未软删且超过 24h 的由定时任务物理清理。
```sql
UPDATE t_cms_publish_drafts
SET deleted_at = NOW()
WHERE id = ${draft_id}
  AND deleted_at IS NULL;
```

### 定时清理：物理删除创建超过 24 小时的草稿
> NOTE: 按 `created_at` 判断；与软删独立，过期行直接 **DELETE**（草稿不进长期归档）。
```sql
DELETE FROM t_cms_publish_drafts
WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### 页面组件启停
> NOTE: 组件下线优先 is_active=0，避免硬删。
```sql
UPDATE t_cms_page_components
SET is_active = ${target_status}
WHERE id = ${component_id}
  AND deleted_at IS NULL;
```

### 统一回滚（同时回滚金刚区与页面）
> NOTE: 回滚通过切换页面当前引用到历史 `publish_revision_id`，并可撤回当前在线记录。
```sql
UPDATE t_cms_pages
SET current_revision_id = ${publish_revision_id}
WHERE id = ${page_id}
  AND deleted_at IS NULL;
```

### 发布快照逻辑删除（可选，审计/误删恢复）
> NOTE: 与「撤回」不同：撤回用 `status=0`；本操作为整条快照对业务不可见。
```sql
UPDATE t_cms_publish_revisions
SET deleted_at = NOW()
WHERE id = ${publish_revision_id}
  AND deleted_at IS NULL;
```

## REPORT
### 渠道组下各 app_key 当前生效策略数量
> NOTE: 排查重复发布与优先级冲突。
```sql
SELECT c.group_code,
       p.app_key,
       p.page_code,
       COUNT(*) AS active_release_cnt
FROM t_cms_publish_revisions r
INNER JOIN t_cms_pages p ON p.id = r.page_id
INNER JOIN t_cms_channels c ON c.id = p.channel_id
WHERE r.deleted_at IS NULL
  AND p.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND r.status = 1
  AND r.start_time <= NOW()
  AND (r.end_time IS NULL OR r.end_time > NOW())
GROUP BY c.group_code, p.app_key, p.page_code
ORDER BY active_release_cnt DESC, p.app_key, p.page_code;
```

### 页面组件数量与素材数量统计
> NOTE: 用于内容规模巡检。
```sql
SELECT p.page_code,
       COUNT(DISTINCT c.id) AS component_cnt,
       COUNT(i.id) AS item_cnt
FROM t_cms_pages p
LEFT JOIN t_cms_page_components c ON c.page_id = p.id AND c.is_active = 1 AND c.deleted_at IS NULL
LEFT JOIN t_cms_component_items i ON i.component_id = c.id AND i.deleted_at IS NULL
WHERE p.app_key = ${app_key}
  AND p.deleted_at IS NULL
GROUP BY p.page_code
ORDER BY p.page_code;
```

## DEV
### 开发说明（接口概览与调用时序）
> NOTE: CMS 配置链路：渠道安全 → 金刚区快照/发布 → 页面组件装配。
```sql
-- ## 接口一览
-- Base Path：`/api/v1/cms`
--
-- | 序号 | 方法 | 路径（简写） | 场景 | 核心逻辑 |
-- | 1 | GET | /grid/resolve | 客户端拉金刚区 | 按 app_key+时间+版本+灰度命中策略 |
-- | 2 | POST | /grid/configs | 运营配置金刚区 | 新建快照（不可变） |
-- | 3 | GET/PUT | /pages/{page_id}/drafts | 草稿箱 | 列表/保存，与发布快照字段对齐 |
-- | 4 | POST | /publish/revisions | 运营发布 | 金刚区+页面同发，发布备注必填 |
-- | 5 | POST | /publish/revisions/{id}/revoke | 运营撤回 | 将统一发布记录 status 置 0 |
-- | 6 | POST | /pages/{page_code}/rollback | 页面回滚 | 切换 current_revision_id 到历史 publish_revision |
-- | 7 | GET | /pages/{page_code}/layout | 客户端拉页面装修 | 优先读 current_revision 快照 |
--
-- ## 推荐调用时序
-- 1. 运营创建快照：`POST /grid/configs`
-- 2. 运营在草稿箱迭代：`PUT .../drafts`（可选）
-- 3. 运营创建统一发布：`POST /publish/revisions`（同发）
-- 4. 客户端启动：`GET /grid/resolve`
-- 5. 客户端进入页面：`GET /pages/{page_code}/layout`
-- 6. 需要回退：`POST /publish/revisions/{id}/revoke` + `POST /pages/{page_code}/rollback`
-- 7. 定时任务：执行 UPDATE「定时清理」删除 `created_at` 超过 24h 的草稿
```

### 开发说明（接口① 解析当前生效金刚区）
> NOTE: 对应 QUERY「根据 app_key + 时间 + 版本命中当前金刚区配置」。
```sql
-- Endpoint: `GET /api/v1/cms/grid/resolve`
-- Query：`app_key`（必填）, `app_version`（展示）, `app_version_code`（必填）, `uid`（可选，用于灰度）, `client_ip`（可选）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "publish_revision_id": 901,
--     "grid_snapshot_json": { "grid_layout": "2*4", "items": [] },
--     "app_key": "xian_fu_home_grid",
--     "version_num": "v1.0.0",
--     "grid_layout": "2*4",
--     "sticky_type": "NORMAL",
--     "bg_image_url": null,
--     "items": [
--       {
--         "title": "极速贷",
--         "is_title_visible": 1,
--         "icon_url": "https://cdn.example.com/icon-fast-loan.png",
--         "target_page_id": 88,
--         "is_default_open": 1
--       }
--     ]
--   }
-- }
-- ```
```

### 开发说明（灰度命中与流程时序）
> NOTE: 这段是 `GET /grid/resolve` 的核心逻辑说明（与 SQL.md 的灰度/快照/回滚约定一致）。
```sql
-- ## 灰度命中规则（建议）
--
-- 1. 时间窗口：`start_time <= now < end_time`（end_time 为空表示长期有效）
-- 2. 版本准入：`client_version_code >= min_app_version_code`
-- 3. 灰度策略：
--    - NONE：直接命中
--    - PERCENTAGE：将 uid 进行稳定分桶（如 CRC32(uid)%100），小于 gray_value 即命中
--    - WHITELIST：gray_value 存逗号分隔 UID（或可扩展为 JSON 数组），uid 在列表内命中
-- 4. 选择策略：满足条件的候选按 `priority DESC, id DESC` 取第一条
--
-- ## 时序（联调排错）
--
-- - 客户端启动/进入首页：调用 `GET /grid/resolve`（带 app_key、app_version_code、uid）
-- - 服务端：
--   a) 查候选策略（时间/版本/灰度过滤，见 QUERY「命中灰度策略」）
--   b) 取最优策略 → 解析 `grid_snapshot_json`（必要时再查 `t_cms_grid_configs` / `t_cms_grid_items`）→ 返回渲染数据
-- - 若命中异常：调用 QUERY「冲突排查」列出候选策略，检查 priority、灰度值、时间窗、min_app_version_code
```

### 开发说明（接口② 新建金刚区快照）
> NOTE: 快照不可变；修改布局/按钮时创建新版本。
```sql
-- Endpoint: `POST /api/v1/cms/grid/configs`
-- Body 示例：
--
-- ```json
-- {
--   "channel_id": 1,
--   "app_name": "闲付首页金刚区",
--   "app_key": "xian_fu_home_grid",
--   "version_num": "v1.0.1",
--   "bg_image_url": null,
--   "sticky_type": "TOP_STICKY",
--   "grid_layout": "2*4",
--   "items": [
--     { "title": "极速贷", "is_title_visible": 1, "icon_url": "https://cdn.example.com/icon-fast-loan.png", "target_page_id": 88, "sort_order": 1, "is_default_open": 1 }
--   ]
-- }
-- ```
-- 出参示例：`{ "code": 200, "data": { "grid_config_id": 1002 } }`
```

### 开发说明（接口③ 统一发布）
> NOTE: 同时绑定金刚区与页面，发布备注必填；落库 `t_cms_publish_revisions` 使用 `page_id`（可与 `app_key`+`page_code` 二选一入参，由服务端解析为 `page_id`）；金刚区以 `grid_snapshot_json` 为准，不落库 `grid_config_id`。
```sql
-- Endpoint: `POST /api/v1/cms/publish/revisions`
-- Body 示例：
--
-- ```json
-- {
--   "page_id": 1001,
--   "grid_snapshot_json": { "grid_layout": "2*4", "items": [] },
--   "layout_data": { "components": [] },
--   "start_time": "2026-04-01T00:00:00Z",
--   "end_time": null,
--   "gray_strategy": "PERCENTAGE",
--   "gray_value": "10",
--   "min_app_version": "3.2.0",
--   "min_app_version_code": 30200,
--   "priority": 20,
--   "publish_remark": "首页改版与金刚区联动发布"
-- }
-- ```
-- 出参示例：`{ "code": 200, "data": { "publish_revision_id": 902 } }`
```

### 开发说明（接口④ 撤回统一发布）
> NOTE: 仅撤回发布记录，不删除快照数据。
```sql
-- Endpoint: `POST /api/v1/cms/publish/revisions/{publish_revision_id}/revoke`
-- Body：可空
-- 出参示例：`{ "code": 200, "msg": "撤回成功" }`
```

### 开发说明（接口⑤ 拉取页面装修）
> NOTE: 对应 QUERY「查询页面下启用组件与素材」；若页面存在 `current_revision_id`，优先返回快照内容。
```sql
-- Endpoint: `GET /api/v1/cms/pages/{page_code}/layout`
-- Query：`app_key`（必填）, `app_version`（可选）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "page_code": "home",
--     "components": [
--       {
--         "component_type": "BANNER",
--         "api_url": null,
--         "styles": { "radius": 8 },
--         "items": [
--           { "title": "首屏活动", "img_url": "https://cdn.example.com/banner-1.png", "link_type": "H5", "link_value": "/promo/1" }
--         ]
--       }
--     ]
--   }
-- }
-- ```
```

### 开发说明（接口⑤ 页面回滚）
> NOTE: 回滚目标为历史 `publish_revision_id`，实现金刚区与页面统一回滚语义。
```sql
-- Endpoint: `POST /api/v1/cms/pages/{page_code}/rollback`
-- Body 示例：`{ "publish_revision_id": 2998 }`
-- 出参示例：`{ "code": 200, "msg": "回滚成功", "data": { "current_revision_id": 2998 } }`
```

### 开发说明（核心设计：安全、灰度、回滚）
> NOTE: 与 SQL.md 的设计逻辑一致。
```sql
-- ## 安全准入
-- - 渠道组支持 `ip_whitelist` 与 `auth_secret_key_enc`；管理接口建议双重校验（IP + 签名）
--
-- ## 灰度策略
-- - `NONE`：全量；`PERCENTAGE`：按比例；`WHITELIST`：白名单
-- - 同一 app_key 多策略重叠时按 `priority` 取最大，必要时再按 `id DESC` 兜底
-- - 版本比较使用 `min_app_version_code`，避免字符串比较误判
--
-- ## 快照与回滚
-- - 配置变更通过新建 `t_cms_grid_configs` 快照，不覆盖历史
-- - 金刚区与页面分别以 `grid_snapshot_json`、`layout_data` 存入统一发布记录 `t_cms_publish_revisions`（不冗余 `grid_config_id`）
-- - 回滚 = 撤回当前记录 + 切换 `current_revision_id` 到历史 `publish_revision_id`（同发同回滚）
--
-- ## 一致性
-- - 发布/撤回/回滚事务化；完成后主动失效缓存（建议 `page_id` 或 `app_key`+`page_code` 维度）
-- - `publish_remark` 必填，便于审计“为何发布/回滚”
-- - 客户端读取建议短 TTL + 版本号校验，避免脏配置长驻
--
-- ## 逻辑删除与草稿箱
-- - 各表 `deleted_at`：业务查询默认 `deleted_at IS NULL`；唯一键仍含已删行，若需软删后复用编码需业务约定
-- - `t_cms_publish_drafts` 与 `t_cms_publish_revisions` 字段对齐；草稿 **创建超过 24 小时** 由定时任务 **物理 DELETE**（见 UPDATE「定时清理」）
-- - 撤回发布用 `status=0`；整条快照不可见可用 `t_cms_publish_revisions.deleted_at`
```
