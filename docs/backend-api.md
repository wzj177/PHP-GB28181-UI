# 后端 API 接口文档

本文档描述了 GB28181 视频监控系统所需的后端 API 接口规范。

---

## 1. 系统管理 API

### 1.1 系统日志

#### 获取系统日志列表
```
GET /admin/system/logs
```

**Query 参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level | string | 否 | 日志级别: DEBUG, INFO, WARN, ERROR, FATAL |
| module | string | 否 | 模块: system, auth, device, media, record, api |
| keyword | string | 否 | 搜索关键词 |
| start_time | string | 否 | 开始时间 (ISO 8601) |
| end_time | string | 否 | 结束时间 (ISO 8601) |
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 50 |

**响应:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "1",
        "level": "INFO",
        "message": "用户登录成功",
        "module": "auth",
        "user_id": 1,
        "username": "admin",
        "ip": "192.168.1.100",
        "created_at": "2024-01-01T12:00:00Z"
      }
    ],
    "paginator": {
      "firstPage": 1,
      "currentPage": 1,
      "perPage": 50,
      "total": 100,
      "pages": [1, 2],
      "lastPage": 2
    }
  }
}
```

#### 导出系统日志
```
GET /admin/system/logs/export
```

**Query 参数:** 同获取列表

**响应:** CSV 文件下载

---

### 1.2 系统设置

#### 获取系统设置
```
GET /admin/system/settings
```

**响应:**
```json
{
  "code": 0,
  "data": {
    "site": {
      "site_name": "GB28181监控系统",
      "site_url": "https://example.com",
      "logo_url": "/assets/logo.png",
      "favicon_url": "/favicon.ico",
      "copyright": "© 2024",
      "language": "zh-CN",
      "timezone": "Asia/Shanghai"
    },
    "security": {
      "enable_https": false,
      "session_timeout": 30,
      "max_login_attempts": 5,
      "lockout_duration": 15,
      "enable_captcha": false,
      "password_min_length": 8,
      "password_require_uppercase": true,
      "password_require_lowercase": true,
      "password_require_numbers": true,
      "password_require_specialchars": true,
      "enable_two_factor": false,
      "allowed_ip_ranges": "",
      "blocked_ip_ranges": ""
    },
    "upload": {
      "max_file_size": 100,
      "allowed_file_types": ".jpg,.jpeg,.png,.gif,.mp4,.avi,.mkv",
      "upload_path": "/uploads",
      "enable_auto_cleanup": false,
      "cleanup_days": 30,
      "max_concurrent_uploads": 5,
      "enable_thumbnail": true,
      "thumbnail_quality": 80
    },
    "storage": {
      "storage_type": "local",
      "local_path": "/data/storage",
      "enable_s3": false,
      "s3_bucket": "",
      "s3_region": "",
      "s3_access_key": "",
      "s3_secret_key": "",
      "s3_endpoint": "",
      "enable_oss": false,
      "oss_bucket": "",
      "oss_region": "",
      "oss_access_key": "",
      "oss_secret_key": "",
      "oss_endpoint": "",
      "disk_warning_threshold": 80,
      "disk_critical_threshold": 90
    }
  }
}
```

#### 保存系统设置
```
POST /admin/system/settings
```

**请求体:** 同获取系统设置的响应结构，可部分更新

**响应:**
```json
{
  "code": 0,
  "message": "保存成功"
}
```

#### 重置系统设置
```
POST /admin/system/settings/reset
```

**请求体:**
```json
{
  "type": "site" // site | security | upload | storage
}
```

---

### 1.3 ZLM 配置

#### 获取 ZLM 配置
```
GET /admin/system/zlm/config
```

**响应:**
```json
{
  "code": 0,
  "data": {
    "api": {
      "secret": "035c73f7-bb6b-4889-a715-d9eb2d1925cc",
      "timeout": 10
    },
    "ffmpeg": {
      "bin": "/usr/bin/ffmpeg",
      "cmd": "%s:%s -i %s -c:v copy -c:a copy -f flv rtmp://%s/%s/%s",
      "snap": "%s -i %s -frames:v 1 -f image2pipe -"
    },
    "hook": {
      "alive_interval": 10.0,
      "enable": false,
      "on_flow_report": "",
      "on_http_access": "",
      "on_play": "",
      "on_publish": "",
      "on_record_mp4": "",
      "on_record_ts": "",
      "on_rtp_server_timeout": "",
      "on_rtsp_auth": "",
      "on_rtsp_realm": "",
      "on_send_rtp_stopped": "",
      "on_server_exited": "",
      "on_server_keepalive": "",
      "on_server_started": "",
      "on_shell_login": "",
      "on_stream_changed": "",
      "on_stream_none_reader": "",
      "on_stream_not_found": ""
    }
  }
}
```

#### 保存 ZLM 配置
```
POST /admin/system/zlm/config
```

**请求体:** 同获取 ZLM 配置的响应结构

#### 重置 ZLM 配置
```
POST /admin/system/zlm/config/reset
```

#### 重启 ZLM 服务
```
POST /admin/system/zlm/restart
```

**响应:**
```json
{
  "code": 0,
  "message": "ZLM服务正在重启"
}
```

---

## 2. 权限管理 API

### 2.1 用户管理

#### 获取用户列表
```
GET /admin/permission/users
```

**Query 参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| keyword | string | 否 | 搜索关键词 (用户名/邮箱/手机号) |
| status | string | 否 | 状态: active, disabled |
| role_id | integer | 否 | 角色ID |
| page | integer | 否 | 页码，默认 1 |
| limit | integer | 否 | 每页数量，默认 20 |

**响应:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "username": "admin",
        "email": "admin@example.com",
        "phone": "13800138000",
        "real_name": "管理员",
        "role_id": 1,
        "role_name": "超级管理员",
        "status": "active",
        "last_login_at": "2024-01-01T12:00:00Z",
        "last_login_ip": "192.168.1.100",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "paginator": {
      "firstPage": 1,
      "currentPage": 1,
      "perPage": 20,
      "total": 10,
      "pages": [1],
      "lastPage": 1
    }
  }
}
```

#### 获取用户详情
```
GET /admin/permission/users/:id
```

#### 创建用户
```
POST /admin/permission/users
```

**请求体:**
```json
{
  "username": "testuser",
  "password": "123456",
  "email": "test@example.com",
  "phone": "13900139000",
  "real_name": "测试用户",
  "role_id": 2,
  "status": "active"
}
```

**响应:**
```json
{
  "code": 0,
  "message": "创建成功",
  "data": {
    "id": 2,
    "username": "testuser"
  }
}
```

#### 更新用户
```
PUT /admin/permission/users/:id
```

**请求体:** 同创建用户，password 字段可选（不填则不修改）

#### 删除用户
```
DELETE /admin/permission/users/:id
```

---

### 2.2 角色管理

#### 获取角色列表
```
GET /admin/permission/roles
```

**Query 参数:**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | integer | 否 | 页码 |
| limit | integer | 否 | 每页数量 |

**响应:**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "超级管理员",
        "code": "ROLE_ADMIN",
        "description": "拥有所有权限",
        "status": "active",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "paginator": { ... }
  }
}
```

#### 创建角色
```
POST /admin/permission/roles
```

**请求体:**
```json
{
  "name": "操作员",
  "code": "ROLE_OPERATOR",
  "description": "可查看和操作设备",
  "status": "active",
  "menu_ids": [1, 2, 3]
}
```

#### 更新角色
```
PUT /admin/permission/roles/:id
```

#### 删除角色
```
DELETE /admin/permission/roles/:id
```

#### 获取角色菜单权限
```
GET /admin/permission/roles/:id/menus
```

**响应:**
```json
{
  "code": 0,
  "data": [1, 2, 3, 5, 8]
}
```

#### 更新角色菜单权限
```
PUT /admin/permission/roles/:id/menus
```

**请求体:**
```json
{
  "menu_ids": [1, 2, 3, 5, 8, 10]
}
```

---

### 2.3 菜单管理

#### 获取菜单列表
```
GET /admin/permission/menus
```

**响应:**
```json
{
  "code": 0,
  "data": [
    {
      "id": "1",
      "name": "dashboard",
      "icon": "House",
      "path": "/dashboard",
      "component": "Dashboard",
      "title": "仪表盘",
      "parent_id": 0,
      "sort": 1,
      "type": "menu",
      "children": []
    }
  ]
}
```

#### 创建菜单
```
POST /admin/permission/menus
```

**请求体:**
```json
{
  "name": "test",
  "icon": "Monitor",
  "path": "/test",
  "component": "TestComponent",
  "title": "测试",
  "parent_id": 0,
  "sort": 10,
  "type": "menu"
}
```

#### 更新菜单
```
PUT /admin/permission/menus/:id
```

#### 删除菜单
```
DELETE /admin/permission/menus/:id
```

---

## 3. 数据库表结构建议

### 3.1 系统日志表 (system_logs)
```sql
CREATE TABLE system_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  level ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL') NOT NULL,
  message VARCHAR(500) NOT NULL,
  module VARCHAR(50) NOT NULL,
  user_id BIGINT UNSIGNED NULL,
  username VARCHAR(100) NULL,
  ip VARCHAR(45) NULL,
  context JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_level (level),
  INDEX idx_module (module),
  INDEX idx_created_at (created_at)
);
```

### 3.2 系统设置表 (system_settings)
```sql
CREATE TABLE system_settings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('site', 'security', 'upload', 'storage') NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value TEXT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_type_key (type, `key`)
);
```

### 3.3 ZLM配置表 (zlm_config)
```sql
CREATE TABLE zlm_config (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category ENUM('api', 'ffmpeg', 'hook') NOT NULL,
  `key` VARCHAR(100) NOT NULL,
  value TEXT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_category_key (category, `key`)
);
```

### 3.4 用户表 (users)
```sql
CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) NULL,
  phone VARCHAR(20) NULL,
  real_name VARCHAR(100) NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  status ENUM('active', 'disabled') DEFAULT 'active',
  last_login_at TIMESTAMP NULL,
  last_login_ip VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
```

### 3.5 角色表 (roles)
```sql
CREATE TABLE roles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  status ENUM('active', 'disabled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.6 菜单表 (menus)
```sql
CREATE TABLE menus (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  icon VARCHAR(50) NULL,
  path VARCHAR(255) NOT NULL,
  component VARCHAR(100) NULL,
  title VARCHAR(50) NOT NULL,
  parent_id BIGINT UNSIGNED DEFAULT 0,
  sort INT DEFAULT 0,
  type ENUM('menu', 'directory', 'path', 'api') DEFAULT 'menu',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 3.7 角色菜单关联表 (role_menus)
```sql
CREATE TABLE role_menus (
  role_id BIGINT UNSIGNED NOT NULL,
  menu_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, menu_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
);
```

---

## 4. 认证与权限

所有 API 请求需要在 Header 中携带 JWT Token:

```
Authorization: Bearer <token>
```

建议实现中间件验证:
1. JWT Token 验证
2. RBAC 权限检查 (基于用户角色和菜单权限)
3. 请求日志记录
4. IP 白名单检查 (如果配置)

---

## 5. 错误码规范

| Code | Message | 说明 |
|------|---------|------|
| 0 | success | 成功 |
| 400 | bad request | 请求参数错误 |
| 401 | unauthorized | 未授权或token过期 |
| 403 | forbidden | 无权限访问 |
| 404 | not found | 资源不存在 |
| 500 | internal error | 服务器内部错误 |
| 1001 | user exists | 用户已存在 |
| 1002 | user not found | 用户不存在 |
| 1003 | role exists | 角色已存在 |
| 1004 | role not found | 角色不存在 |
| 1005 | menu exists | 菜单已存在 |
| 1006 | menu not found | 菜单不存在 |
