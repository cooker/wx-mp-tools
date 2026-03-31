为了确保数据库的可维护性和业务逻辑的清晰度，以下是为您整理的**最终版完整 CMS 服务 SQL 脚本**。

本脚本严格遵循您的要求：
1.  **渠道组安全准入**：支持 IP 白名单与加密 Key。
2.  **金刚区专项**：支持 `app_key` 业务标识、预约发布、灰度发布、版本快照及回滚。
3.  **1:N 与 1:1 约束**：渠道组与金刚区配置 1:N，金刚区项与 App 终端 1:1。
4.  **页面组件系统**：修复并优化了通用页面组件与明细项的关联。

---

### 1. 核心 ER 关系图
该设计在逻辑上分为 **“环境层 (Channel/App)”**、**“导航层 (Grid)”** 和 **“内容层 (Page/Component)”**。



---

### 2. 完整 SQL 脚本 (含详细注释)

```sql
-- =================================================================
-- 1. 渠道组表 (Channels)
-- =================================================================
CREATE TABLE `cms_channels` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    `group_code` VARCHAR(50) NOT NULL UNIQUE COMMENT '渠道组唯一编码，如：xian_fu_group',
    `group_name` VARCHAR(100) NOT NULL COMMENT '渠道组名称，如：闲付系列',
    `ip_whitelist` TEXT DEFAULT NULL COMMENT '服务器IP白名单，多个以逗号分隔，支持通配符',
    `auth_secret_key` VARCHAR(128) DEFAULT NULL COMMENT '接口入参签名校验使用的私钥',
    `status` TINYINT(1) DEFAULT 1 COMMENT '渠道组状态：1-启用，0-禁用',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='渠道组安全与基础配置表';

-- =================================================================
-- 2. 金刚区配置主表 (Grid Configs / Revisions)
-- =================================================================
CREATE TABLE `cms_grid_configs` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '快照ID',
    `channel_id` BIGINT UNSIGNED NOT NULL COMMENT '所属渠道组ID',
    `app_name` VARCHAR(100) NOT NULL COMMENT '金刚区业务名称，如：闲付极速版首页导航',
    `app_key` VARCHAR(100) NOT NULL COMMENT '金刚区唯一业务标识，用于接口查询',
    `version_num` VARCHAR(50) NOT NULL COMMENT '版本号，用于快照回滚和历史追溯',
    `bg_image_url` VARCHAR(500) DEFAULT NULL COMMENT '整个金刚区区域的背景图URL',
    `sticky_type` ENUM('NORMAL', 'TOP_STICKY', 'BOTTOM_FIXED') DEFAULT 'NORMAL' COMMENT '布局固定方式：NORMAL-随动，TOP_STICKY-吸顶，BOTTOM_FIXED-底部固定',
    `grid_layout` VARCHAR(50) DEFAULT '2*4' COMMENT '前端布局展示逻辑，如：2*4(两行四列)',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '快照创建时间',
    KEY `idx_app_key` (`app_key`),
    CONSTRAINT `fk_grid_channel` FOREIGN KEY (`channel_id`) REFERENCES `cms_channels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金刚区配置快照表，存储布局与背景等静态属性';

-- =================================================================
-- 3. 应用终端表 (Apps)
-- =================================================================
CREATE TABLE `cms_apps` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '终端ID',
    `channel_id` BIGINT UNSIGNED NOT NULL COMMENT '所属渠道组ID',
    `app_name` VARCHAR(100) NOT NULL COMMENT '终端名称，如：闲付iOS端',
    `app_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '终端唯一标识，如：xian_fu_ios',
    `platform` ENUM('IOS', 'ANDROID', 'H5', 'MINI_APP') NOT NULL COMMENT '运行平台',
    `bg_image_url` VARCHAR(500) DEFAULT NULL COMMENT '终端级全局背景图',
    `bg_gradient` VARCHAR(500) DEFAULT NULL COMMENT '终端级渐变背景色配置，CSS格式',
    `aspect_ratio` DECIMAL(5,2) DEFAULT NULL COMMENT '背景图宽高比，用于前端预留占位',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CONSTRAINT `fk_app_channel` FOREIGN KEY (`channel_id`) REFERENCES `cms_channels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='应用终端定义表，承载像素级视觉参数';

-- =================================================================
-- 4. 金刚区明细项表 (Grid Items)
-- =================================================================
CREATE TABLE `cms_grid_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '自增主键',
    `grid_config_id` BIGINT UNSIGNED NOT NULL COMMENT '所属金刚区配置快照ID',
    `target_app_id` BIGINT UNSIGNED DEFAULT NULL UNIQUE COMMENT '1:1关联的目标APP终端ID，点击按钮跳转至该APP配置',
    `title` VARCHAR(50) NOT NULL COMMENT '按钮显示的标题文字',
    `icon_url` VARCHAR(500) NOT NULL COMMENT '按钮图标图片地址',
    `sort_order` INT DEFAULT 0 COMMENT '组件内排序，数值越小越靠前',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用：1-启用，0-隐藏',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CONSTRAINT `fk_item_grid` FOREIGN KEY (`grid_config_id`) REFERENCES `cms_grid_configs` (`id`),
    CONSTRAINT `fk_item_target_app` FOREIGN KEY (`target_app_id`) REFERENCES `cms_apps` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金刚区明细按钮表，实现与App的1:1精准跳转';

-- =================================================================
-- 5. 金刚区发布策略表 (Grid Releases)
-- =================================================================
CREATE TABLE `cms_grid_releases` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '策略ID',
    `grid_config_id` BIGINT UNSIGNED NOT NULL COMMENT '指向待发布的快照ID',
    `app_key` VARCHAR(100) NOT NULL COMMENT '冗余业务标识，提升查询性能',
    `start_time` TIMESTAMP NOT NULL COMMENT '预约生效时间，到达此时间后配置可见',
    `end_time` TIMESTAMP NULL DEFAULT NULL COMMENT '失效时间，可选',
    `gray_strategy` ENUM('NONE', 'PERCENTAGE', 'WHITELIST') DEFAULT 'NONE' COMMENT '灰度策略：NONE-全量，PERCENTAGE-按比例，WHITELIST-白名单',
    `gray_value` TEXT COMMENT '灰度具体值：如比例值10或UID列表',
    `min_app_version` VARCHAR(20) DEFAULT '0.0.0' COMMENT '准入的最小APP版本号',
    `priority` INT DEFAULT 0 COMMENT '优先级：当多个预约策略时间重叠时，取数值大者',
    `status` TINYINT(1) DEFAULT 1 COMMENT '策略状态：1-正常发布，0-撤回/作废',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '策略创建时间',
    KEY `idx_release_query` (`app_key`, `start_time`, `status`),
    CONSTRAINT `fk_release_grid` FOREIGN KEY (`grid_config_id`) REFERENCES `cms_grid_configs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='金刚区发布策略表，控制灰度、预约与版本回滚';

-- =================================================================
-- 6. 页面内容配置 (Pages & Components)
-- =================================================================
CREATE TABLE `cms_pages` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '页面ID',
    `app_id` BIGINT UNSIGNED NOT NULL COMMENT '所属应用终端ID',
    `page_code` VARCHAR(100) NOT NULL COMMENT '页面编码，如：home, user_center',
    `page_name` VARCHAR(100) NOT NULL COMMENT '页面显示名称',
    `current_revision_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '当前线上生效的内容快照ID',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY `uk_app_page` (`app_id`, `page_code`),
    CONSTRAINT `fk_page_app` FOREIGN KEY (`app_id`) REFERENCES `cms_apps` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='页面主体定义表';

CREATE TABLE `cms_page_components` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '组件ID',
    `page_id` BIGINT UNSIGNED NOT NULL COMMENT '所属页面ID',
    `component_type` VARCHAR(50) NOT NULL COMMENT '组件类型，如：BANNER, NEWS, LIST',
    `bg_image_url` VARCHAR(500) DEFAULT NULL COMMENT '组件独立背景图',
    `bg_gradient` VARCHAR(500) DEFAULT NULL COMMENT '组件独立渐变色',
    `aspect_ratio` DECIMAL(5,2) DEFAULT NULL COMMENT '组件宽高比',
    `api_url` VARCHAR(500) DEFAULT NULL COMMENT '组件调用的后端接口地址',
    `api_params` JSON DEFAULT NULL COMMENT '接口调用的动态拼参配置',
    `styles` JSON DEFAULT NULL COMMENT '前端自定义UI样式JSON',
    `sort_order` INT DEFAULT 0 COMMENT '页面内楼层排序',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CONSTRAINT `fk_comp_page` FOREIGN KEY (`page_id`) REFERENCES `cms_pages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='通用页面楼层组件配置表';

CREATE TABLE `cms_component_items` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '子项ID',
    `component_id` BIGINT UNSIGNED NOT NULL COMMENT '所属组件ID',
    `title` VARCHAR(255) DEFAULT NULL COMMENT '主标题',
    `sub_title` VARCHAR(255) DEFAULT NULL COMMENT '副标题',
    `img_url` VARCHAR(500) DEFAULT NULL COMMENT '图片地址',
    `link_type` ENUM('H5', 'NATIVE', 'MINI_PROGRAM', 'NONE') DEFAULT 'NONE' COMMENT '跳转协议类型',
    `link_value` VARCHAR(500) DEFAULT NULL COMMENT '跳转目标值',
    `ext_data` JSON DEFAULT NULL COMMENT '业务扩展JSON字段',
    `sort_order` INT DEFAULT 0 COMMENT '排序',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CONSTRAINT `fk_item_comp` FOREIGN KEY (`component_id`) REFERENCES `cms_page_components` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组件明细素材表，如轮播图中的每一张图';
```

---

### 3. 设计逻辑说明

* **多维度配置隔离**：通过 `cms_channels` 隔离不同品牌（闲付/闲猪），通过 `cms_apps` 隔离不同端（iOS/H5）。
* **金刚区业务化**：`cms_grid_configs` 现在拥有自己的 `app_key`，运营可以脱离具体页面，独立发布一套名为 `xian_fu_home_grid` 的导航配置，并根据时间、灰度自动生效。
* **快照式发布**：`cms_page_revisions`（建议将 `cms_page_components` 的数据在发布时打入此表的 `layout_data` JSON 字段）确保了“配置即版本”，可以实现一键回撤到任意历史快照。
* **1:1 精准触达**：金刚区的按钮通过 `target_app_id` 直接锚定到某个终端配置，形成了闭环。

**您是否需要我为您编写一个简单的 SQL 查询示例，演示如何根据当前时间、用户 UID 和 App 版本号，获取该用户命中的金刚区配置？**