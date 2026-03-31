---
code: rbac_menu_perm
name: 用户权限
bizType: 权限
version: 1.0.0
description: 用户、角色、菜单树（含按钮/功能点）、用户角色、角色菜单授权；含接口约定（详见 DEV）。
---

## DDL
### 角色表 t_auth_role
> NOTE: 业务角色定义；与用户通过用户角色关联表衔接。
```sql
CREATE TABLE t_auth_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  role_code VARCHAR(64) NOT NULL COMMENT '角色编码(唯一)',
  role_name VARCHAR(128) NOT NULL COMMENT '角色名称',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_role_code (role_code),
  KEY idx_status (status)
) ENGINE=InnoDB COMMENT='业务角色表';
```

### 菜单与功能权限表 t_auth_menu
> NOTE: 树形结构；目录/菜单/按钮统一存放，按钮节点可带 perm_code 供后端鉴权。
```sql
CREATE TABLE t_auth_menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  parent_id BIGINT NOT NULL DEFAULT 0 COMMENT '0为根节点',
  menu_name VARCHAR(128) NOT NULL COMMENT '名称',
  menu_path VARCHAR(255) NULL COMMENT '前端路由或 path',
  menu_type TINYINT NOT NULL DEFAULT 2 COMMENT '1目录 2菜单 3按钮/功能',
  perm_code VARCHAR(128) NULL COMMENT '权限标识，如 system:user:add',
  sort_no INT NOT NULL DEFAULT 0 COMMENT '同级排序号，升序',
  icon VARCHAR(64) NULL COMMENT '菜单/目录图标',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  KEY idx_parent (parent_id),
  KEY idx_perm (perm_code),
  KEY idx_status (status)
) ENGINE=InnoDB COMMENT='菜单与功能权限树';
```

### 用户表 t_auth_user
> NOTE: 登录账号与基础资料；密码等敏感字段由业务加密存储。
```sql
CREATE TABLE t_auth_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  username VARCHAR(64) NOT NULL COMMENT '登录账号(唯一)',
  display_name VARCHAR(128) NOT NULL COMMENT '显示名称',
  mobile VARCHAR(32) NULL COMMENT '手机号',
  email VARCHAR(128) NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NULL COMMENT '密码摘要',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1正常 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_username (username),
  KEY idx_mobile (mobile),
  KEY idx_email (email),
  KEY idx_status (status)
) ENGINE=InnoDB COMMENT='登录用户主表';
```

### 用户角色关联表 t_auth_user_role
> NOTE: user_id 关联 t_auth_user.id，同一用户可多角色。
```sql
CREATE TABLE t_auth_user_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role_id BIGINT NOT NULL COMMENT '角色ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  UNIQUE KEY uk_user_role (user_id, role_id),
  KEY idx_role (role_id)
) ENGINE=InnoDB COMMENT='用户与角色多对多关联';
```

### 角色菜单授权表 t_auth_role_menu
> NOTE: 角色可访问的菜单节点（含目录/菜单/按钮）；细粒度由菜单树叶子按钮控制。
```sql
CREATE TABLE t_auth_role_menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '主键',
  role_id BIGINT NOT NULL COMMENT '角色ID',
  menu_id BIGINT NOT NULL COMMENT '菜单ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
  UNIQUE KEY uk_role_menu (role_id, menu_id),
  KEY idx_menu (menu_id)
) ENGINE=InnoDB COMMENT='角色可访问菜单授权';
```

## SEED
### 初始化角色与菜单示例
> NOTE: 演示数据，可按业务替换。
```sql
-- 预置角色
INSERT INTO t_auth_role (role_code, role_name, status, remark) VALUES
('admin', '系统管理员', 1, '全量菜单'),
('operator', '运营人员', 1, '部分菜单');

-- 根目录「系统管理」
INSERT INTO t_auth_menu (parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status) VALUES
(0, '系统管理', NULL, 1, NULL, 1, 1);

SET @dir_id = LAST_INSERT_ID();

-- 二级菜单「用户管理」
INSERT INTO t_auth_menu (parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status) VALUES
(@dir_id, '用户管理', '/system/user', 2, 'system:user:view', 1, 1);

SET @menu_user = LAST_INSERT_ID();

-- 用户管理下按钮权限
INSERT INTO t_auth_menu (parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status) VALUES
(@menu_user, '新增用户', NULL, 3, 'system:user:add', 1, 1),
(@menu_user, '编辑用户', NULL, 3, 'system:user:edit', 2, 1);

-- 默认管理员账号（无密码，业务侧初始化）
INSERT INTO t_auth_user (username, display_name, status) VALUES
('admin', '超级管理员', 1);

-- admin 绑定 admin 角色
INSERT INTO t_auth_user_role (user_id, role_id)
SELECT u.id, r.id
FROM t_auth_user u
CROSS JOIN t_auth_role r
WHERE u.username = 'admin'
  AND r.role_code = 'admin';
```

## QUERY
### 分页查询用户列表
> NOTE: 管理端用户列表，可按账号/状态筛选。
```sql
-- 管理端用户分页列表
SELECT id, username, display_name, mobile, email, status, created_at
FROM t_auth_user
WHERE (${username} IS NULL OR username LIKE CONCAT('%', ${username}, '%'))
  AND (${status} IS NULL OR status = ${status})
ORDER BY id DESC
LIMIT ${offset}, ${page_size};
```

### 查询用户拥有的角色列表
> NOTE: 登录后拉取角色。
```sql
-- 指定用户已启用角色
SELECT r.id, r.role_code, r.role_name, r.status
FROM t_auth_role r
INNER JOIN t_auth_user_role ur ON ur.role_id = r.id
INNER JOIN t_auth_user u ON u.id = ur.user_id
WHERE ur.user_id = ${user_id}
  AND u.status = 1
  AND r.status = 1;
```

### 查询角色已授权菜单 ID
> NOTE: 用于前端勾选回显或缓存。
```sql
-- 角色已勾选菜单 ID 列表
SELECT menu_id
FROM t_auth_role_menu
WHERE role_id = ${role_id};
```

### 校验用户是否具备某权限标识
> NOTE: 后端接口鉴权：用户任一角色拥有该菜单节点即可；用户须为启用状态。
```sql
-- 存在即表示用户具备该 perm_code（任一启用角色授权即可）
SELECT 1
FROM t_auth_user u
INNER JOIN t_auth_user_role ur ON ur.user_id = u.id
INNER JOIN t_auth_role_menu rm ON rm.role_id = ur.role_id
INNER JOIN t_auth_menu m ON m.id = rm.menu_id
WHERE u.id = ${user_id}
  AND u.status = 1
  AND m.perm_code = ${perm_code}
  AND m.status = 1
LIMIT 1;
```

### 查询菜单树（一级子节点）
> NOTE: 管理端树形表格懒加载示例。
```sql
-- 懒加载子节点（树表格）
SELECT id, parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status
FROM t_auth_menu
WHERE parent_id = ${parent_id}
  AND status = 1
ORDER BY sort_no, id;
```

## UPDATE
### 停用角色
> NOTE: 停用后需同步清理缓存与在线会话策略（业务侧）。
```sql
-- 停用角色（业务侧需失效缓存/会话）
UPDATE t_auth_role
SET status = 0
WHERE id = ${role_id};
```

### 用户绑定角色（先删后插可改为 MERGE 策略）
> NOTE: 单角色绑定示例；多角色可批量插入。
```sql
-- 幂等绑定单角色（多角色可改为批量 INSERT）
INSERT INTO t_auth_user_role (user_id, role_id)
VALUES (${user_id}, ${role_id})
ON DUPLICATE KEY UPDATE user_id = user_id;
```

### 停用用户
> NOTE: 停用后应使会话失效（业务侧）。
```sql
-- 停用用户
UPDATE t_auth_user
SET status = 0
WHERE id = ${user_id};
```

## REPORT
### 各角色下用户数量
> NOTE: 运营统计。
```sql
-- 每角色下启用用户人数
SELECT r.role_code, r.role_name, COUNT(DISTINCT ur.user_id) AS user_cnt
FROM t_auth_role r
LEFT JOIN t_auth_user_role ur ON ur.role_id = r.id
LEFT JOIN t_auth_user u ON u.id = ur.user_id AND u.status = 1
GROUP BY r.id, r.role_code, r.role_name
ORDER BY user_cnt DESC;
```

### 各角色下用户明细（含账号）
> NOTE: 审计或导出。
```sql
-- 某角色下用户明细（含账号状态）
SELECT r.role_code, u.id AS user_id, u.username, u.display_name, u.status AS user_status
FROM t_auth_role r
INNER JOIN t_auth_user_role ur ON ur.role_id = r.id
INNER JOIN t_auth_user u ON u.id = ur.user_id
WHERE r.id = ${role_id}
ORDER BY u.id;
```

## DEV
### 开发说明（接口概览与调用时序）
> NOTE: 与表 `t_auth_user` / `t_auth_role` / `t_auth_menu` / `t_auth_user_role` / `t_auth_role_menu` 对应；Base Path 示例 `/api/v1/auth`（可按网关统一前缀调整）。
```sql
-- ## 接口一览
-- Base Path：`/api/v1/auth`
--
-- | 序号 | 方法 | 路径（简写） | 场景 | 核心逻辑 |
-- | 1 | GET | /menus/tree | 管理端菜单配置 | 懒加载菜单树（`parent_id`） |
-- | 2 | GET | /users | 用户管理 | 分页用户列表（对应 QUERY 分页） |
-- | 3 | GET | /users/{id}/roles | 用户详情/授权 | 用户已绑定角色 |
-- | 4 | GET | /roles/{id}/menu-ids | 角色授权页 | 回显已勾选 `menu_id` |
-- | 5 | PUT | /roles/{id}/menus | 保存角色权限 | 覆盖写入 `t_auth_role_menu` |
-- | 6 | POST | /users/{id}/roles | 用户绑角色 | 写入 `t_auth_user_role` |
-- | 7 | POST | /perm/check | 业务/网关鉴权 | 校验 `perm_code`（对应 QUERY 校验 SQL） |
--
-- ## 推荐调用时序（管理端配置流）
--
-- 1. 管理员登录 → 拉取根菜单 `GET /menus/tree?parent_id=0`
-- 2. 递归/懒加载子节点 → 维护目录、菜单、按钮节点及 `perm_code`
-- 3. 进入「角色授权」→ `GET /roles/{id}/menu-ids` → 勾选保存 `PUT /roles/{id}/menus`
-- 4. 进入「用户管理」→ `GET /users` → 为用户 `POST /users/{id}/roles` 绑定角色
-- 5. 业务接口执行前 → `POST /perm/check` 或读取登录态缓存的 `perm_code` 集合
--
-- ## 泳道说明
--
-- - **管理端** 配置菜单/角色/用户 → **权限服务** 写库 → **缓存失效**（或版本号 bump）
-- - **业务网关** 或 **Controller 切面** 调用鉴权；**禁止**仅前端隐藏按钮而不校验后端
```

### 开发说明（接口① 菜单树懒加载）
> NOTE: 对应 QUERY「查询菜单树（一级子节点）」。
```sql
-- Endpoint: `GET /api/v1/auth/menus/tree`
-- Query：`parent_id`（默认 0 表示根下子节点）, `status`（可选，默认仅启用）
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "items": [
--       {
--         "id": 1,
--         "parent_id": 0,
--         "menu_name": "系统管理",
--         "menu_path": null,
--         "menu_type": 1,
--         "perm_code": null,
--         "sort_no": 1,
--         "has_children": true
--       }
--     ]
--   }
-- }
-- ```
```

### 开发说明（接口② 用户分页列表）
> NOTE: 对应 QUERY「分页查询用户列表」。
```sql
-- Endpoint: `GET /api/v1/auth/users`
-- Query：`username`（可选，模糊）, `status`（可选）, `page`, `page_size`
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "items": [
--       {
--         "id": 1,
--         "username": "admin",
--         "display_name": "超级管理员",
--         "mobile": null,
--         "email": null,
--         "status": 1,
--         "created_at": "2026-01-01T10:00:00Z"
--       }
--     ],
--     "pagination": { "total": 1, "current_page": 1, "has_more": false }
--   }
-- }
-- ```
```

### 开发说明（接口③ 用户已绑定角色）
> NOTE: 对应 QUERY「查询用户拥有的角色列表」。
```sql
-- Endpoint: `GET /api/v1/auth/users/{user_id}/roles`
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "items": [
--       { "id": 1, "role_code": "admin", "role_name": "系统管理员", "status": 1 }
--     ]
--   }
-- }
-- ```
```

### 开发说明（接口④ 角色已授权菜单 ID）
> NOTE: 对应 QUERY「查询角色已授权菜单 ID」。
```sql
-- Endpoint: `GET /api/v1/auth/roles/{role_id}/menu-ids`
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "menu_ids": [1, 2, 3, 101, 102]
--   }
-- }
-- ```
```

### 开发说明（接口⑤ 保存角色菜单授权）
> NOTE: 事务内先删后插或 diff 写入 `t_auth_role_menu`；成功后失效该角色相关缓存。
```sql
-- Endpoint: `PUT /api/v1/auth/roles/{role_id}/menus`
-- Body 示例：
--
-- ```json
-- {
--   "menu_ids": [1, 2, 101, 102, 103]
-- }
-- ```
--
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "msg": "保存成功",
--   "data": { "role_id": 1, "bound_count": 5 }
-- }
-- ```
```

### 开发说明（接口⑥ 用户绑定角色）
> NOTE: 对应 UPDATE「用户绑定角色」；多角色可扩展为数组批量。
```sql
-- Endpoint: `POST /api/v1/auth/users/{user_id}/roles`
-- Body 示例：
--
-- ```json
-- {
--   "role_id": 1
-- }
-- ```
--
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": { "user_id": 1, "role_id": 1 }
-- }
-- ```
```

### 开发说明（接口⑦ 权限校验）
> NOTE: 对应 QUERY「校验用户是否具备某权限标识」；可仅内部 RPC，不对外暴露公网。
```sql
-- Endpoint: `POST /api/v1/auth/perm/check`
-- Body 示例：
--
-- ```json
-- {
--   "user_id": 1,
--   "perm_code": "system:user:add"
-- }
-- ```
--
-- 出参示例：
--
-- ```json
-- {
--   "code": 200,
--   "data": {
--     "allowed": true
--   }
-- }
-- ```
```

### 开发说明（核心设计：缓存、鉴权与会话）
> NOTE: 与权限模型一致；角色/菜单变更须失效缓存或 bump 版本。
```sql
-- ## 鉴权路径
-- - 登录成功后下发 **access_token**，载荷或旁路缓存中可带 `user_id`
-- - **推荐**：登录后拉取并缓存 `perm_codes[]` 或 `menu_ids[]`；`POST /perm/check` 作为兜底或内部服务调用
--
-- ## 会话与用户状态
-- - `t_auth_user.status=0` 时拒绝鉴权；`t_auth_role`、`t_auth_menu` 停用同理
-- - 停用用户/角色后应使已有 **Token** 失效（黑名单或强制登出）
--
-- ## 数据一致性
-- - `PUT /roles/{id}/menus` 与 `POST /users/{id}/roles` 须在事务中保证中间态不暴露（按业务选择隔离级别）
```

### 开发说明（权限模型与表关系）
> NOTE: 表结构语义与边界（以下为 Markdown 友好注释，便于 DEV 页渲染阅读）。
```sql
-- ## 权限模型落地说明
--
-- ### 1. 用户主表
-- - `t_auth_user` 为登录用户主数据；`t_auth_user_role.user_id` 语义指向 `t_auth_user.id`（是否建库级外键由业务决定）
--
-- ### 2. 授权边界
-- - 角色菜单表只存「允许的菜单节点」；按钮作为 `menu_type=3` 的子节点一并授权
-- - 若仅需接口级权限，可只维护 `perm_code` 在叶子节点，前端菜单树单独配置
--
-- ### 3. 缓存
-- - 登录后缓存「用户 → perm_code 集合」或「用户 → menu_id 集合」，角色/菜单变更需失效
--
-- ### 4. 数据一致性
-- - 删除菜单前需检查 `t_auth_role_menu` 引用；或使用软删除 `status=0`
```
