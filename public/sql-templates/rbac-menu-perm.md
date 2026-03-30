---
code: rbac_menu_perm
name: 用户权限模板
bizType: 权限
version: 1.0.0
description: 用户、角色、菜单树（含按钮/功能点）、用户角色、角色菜单授权维护。
---

## DDL
### 角色表 t_auth_role
> NOTE: 业务角色定义；与用户通过用户角色关联表衔接。
```sql
CREATE TABLE t_auth_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_code VARCHAR(64) NOT NULL COMMENT '角色编码(唯一)',
  role_name VARCHAR(128) NOT NULL COMMENT '角色名称',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_code (role_code),
  KEY idx_status (status)
) ENGINE=InnoDB;
```

### 菜单与功能权限表 t_auth_menu
> NOTE: 树形结构；目录/菜单/按钮统一存放，按钮节点可带 perm_code 供后端鉴权。
```sql
CREATE TABLE t_auth_menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  parent_id BIGINT NOT NULL DEFAULT 0 COMMENT '0为根节点',
  menu_name VARCHAR(128) NOT NULL COMMENT '名称',
  menu_path VARCHAR(255) NULL COMMENT '前端路由或 path',
  menu_type TINYINT NOT NULL DEFAULT 2 COMMENT '1目录 2菜单 3按钮/功能',
  perm_code VARCHAR(128) NULL COMMENT '权限标识，如 system:user:add',
  sort_no INT NOT NULL DEFAULT 0,
  icon VARCHAR(64) NULL,
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_parent (parent_id),
  KEY idx_perm (perm_code),
  KEY idx_status (status)
) ENGINE=InnoDB;
```

### 用户表 t_auth_user
> NOTE: 登录账号与基础资料；密码等敏感字段由业务加密存储。
```sql
CREATE TABLE t_auth_user (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL COMMENT '登录账号(唯一)',
  display_name VARCHAR(128) NOT NULL COMMENT '显示名称',
  mobile VARCHAR(32) NULL COMMENT '手机号',
  email VARCHAR(128) NULL COMMENT '邮箱',
  password_hash VARCHAR(255) NULL COMMENT '密码摘要',
  status TINYINT NOT NULL DEFAULT 1 COMMENT '1正常 0停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username),
  KEY idx_mobile (mobile),
  KEY idx_email (email),
  KEY idx_status (status)
) ENGINE=InnoDB;
```

### 用户角色关联表 t_auth_user_role
> NOTE: user_id 关联 t_auth_user.id，同一用户可多角色。
```sql
CREATE TABLE t_auth_user_role (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL COMMENT '用户ID',
  role_id BIGINT NOT NULL COMMENT '角色ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_role (user_id, role_id),
  KEY idx_role (role_id)
) ENGINE=InnoDB;
```

### 角色菜单授权表 t_auth_role_menu
> NOTE: 角色可访问的菜单节点（含目录/菜单/按钮）；细粒度由菜单树叶子按钮控制。
```sql
CREATE TABLE t_auth_role_menu (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  role_id BIGINT NOT NULL,
  menu_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_role_menu (role_id, menu_id),
  KEY idx_menu (menu_id)
) ENGINE=InnoDB;
```

## SEED
### 初始化角色与菜单示例
> NOTE: 演示数据，可按业务替换。
```sql
INSERT INTO t_auth_role (role_code, role_name, status, remark) VALUES
('admin', '系统管理员', 1, '全量菜单'),
('operator', '运营人员', 1, '部分菜单');

INSERT INTO t_auth_menu (parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status) VALUES
(0, '系统管理', NULL, 1, NULL, 1, 1);

SET @dir_id = LAST_INSERT_ID();

INSERT INTO t_auth_menu (parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status) VALUES
(@dir_id, '用户管理', '/system/user', 2, 'system:user:view', 1, 1);

SET @menu_user = LAST_INSERT_ID();

INSERT INTO t_auth_menu (parent_id, menu_name, menu_path, menu_type, perm_code, sort_no, status) VALUES
(@menu_user, '新增用户', NULL, 3, 'system:user:add', 1, 1),
(@menu_user, '编辑用户', NULL, 3, 'system:user:edit', 2, 1);

INSERT INTO t_auth_user (username, display_name, status) VALUES
('admin', '超级管理员', 1);

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
SELECT menu_id
FROM t_auth_role_menu
WHERE role_id = ${role_id};
```

### 校验用户是否具备某权限标识
> NOTE: 后端接口鉴权：用户任一角色拥有该菜单节点即可；用户须为启用状态。
```sql
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
UPDATE t_auth_role
SET status = 0
WHERE id = ${role_id};
```

### 用户绑定角色（先删后插可改为 MERGE 策略）
> NOTE: 单角色绑定示例；多角色可批量插入。
```sql
INSERT INTO t_auth_user_role (user_id, role_id)
VALUES (${user_id}, ${role_id})
ON DUPLICATE KEY UPDATE user_id = user_id;
```

### 停用用户
> NOTE: 停用后应使会话失效（业务侧）。
```sql
UPDATE t_auth_user
SET status = 0
WHERE id = ${user_id};
```

## REPORT
### 各角色下用户数量
> NOTE: 运营统计。
```sql
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
SELECT r.role_code, u.id AS user_id, u.username, u.display_name, u.status AS user_status
FROM t_auth_role r
INNER JOIN t_auth_user_role ur ON ur.role_id = r.id
INNER JOIN t_auth_user u ON u.id = ur.user_id
WHERE r.id = ${role_id}
ORDER BY u.id;
```

## DEV
### 开发说明
> NOTE: 权限模型落地注意点。
```sql
/*
1) 用户主表:
   - t_auth_user 为登录用户主数据；t_auth_user_role.user_id 外键语义指向 t_auth_user.id（是否建库级外键由业务决定）

2) 授权边界:
   - 角色菜单表只存「允许的菜单节点」；按钮作为 menu_type=3 的子节点一并授权
   - 若仅需接口级权限，可只维护 perm_code 在叶子节点，前端菜单树单独配置

3) 缓存:
   - 登录后缓存「用户 -> perm_code 集合」或「用户 -> menu_id 集合」，角色/菜单变更需失效

4) 数据一致性:
   - 删除菜单前需检查 t_auth_role_menu 引用；或使用软删除 status=0
*/
```
