# 权限管理模块 API 对接文档

## 概述

本文档描述了 GBVR-IoT 管理后台权限管理模块的 API 接口，供前端开发人员对接使用。

**API 基础路径**: `/api/admin`

**认证方式**: 所有接口需要在请求头中携带认证 Token
```
Authorization: Bearer {token}
```

**统一响应格式**:
```json
{
  "code": 0,        // 0 表示成功，非 0 表示失败
  "msg": "success", // 响应消息
  "data": {}        // 响应数据
}
```

---

## 1. 菜单管理 API

### 1.1 获取菜单列表

**接口**: `GET /api/admin/menu`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | int | 否 | 起始位置，默认 0 |
| limit | int | 否 | 每页数量，默认 10 |
| sort | string | 否 | 排序方式，默认 sort |
| type | string | 否 | 菜单类型过滤 |
| nameLike | string | 否 | 菜单名称模糊搜索 |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 50,
    "list": [
      {
        "id": 1,
        "menuId": "dashboard",
        "name": "仪表盘",
        "icon": "House",
        "path": "/dashboard",
        "component": "Dashboard",
        "title": "仪表盘",
        "parentId": 0,
        "parentMenuId": "",
        "sort": 1,
        "type": "menu",
        "httpMethod": "",
        "routeName": "",
        "status": 1,
        "createdTime": 1234567890,
        "updatedTime": 1234567890
      }
    ]
  }
}
```

---

### 1.2 获取单个菜单

**接口**: `GET /api/admin/menu/{id}`

**路径参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 是 | 菜单 ID |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "menuId": "dashboard",
    "name": "仪表盘",
    ...
  }
}
```

---

### 1.3 创建菜单

**接口**: `POST /api/admin/menu`

**请求体**:
```json
{
  "menuId": "new-menu",
  "name": "新菜单",
  "icon": "Icon",
  "path": "/new-menu",
  "component": "NewMenu",
  "title": "新菜单",
  "parentId": 0,
  "parentMenuId": "",
  "sort": 10,
  "type": "menu",
  "httpMethod": "",
  "routeName": "",
  "status": 1
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| menuId | string | 是 | 菜单唯一标识，英文 |
| name | string | 是 | 菜单名称 |
| type | string | 是 | 类型：directory=目录, menu=菜单页, path=路径页, api=API |
| icon | string | 否 | 图标名称 |
| path | string | 否 | 前端路径或 API 路径 |
| component | string | 否 | 前端组件名 |
| title | string | 否 | 标题 |
| parentId | int | 否 | 父级菜单 ID，0 表示顶级 |
| parentMenuId | string | 否 | 父级菜单标识 |
| sort | int | 否 | 排序，默认 0 |
| httpMethod | string | 否 | HTTP 方法（API 类型使用） |
| routeName | string | 否 | 路由名称 |
| status | int | 否 | 状态：0=禁用，1=启用，默认 1 |

---

### 1.4 更新菜单

**接口**: `PUT /api/admin/menu/{id}`

**路径参数**: 同 1.2

**请求体**: 同 1.3（menuId 不可修改）

---

### 1.5 删除菜单

**接口**: `DELETE /api/admin/menu/{id}`

**路径参数**: 同 1.2

**注意**: 有子菜单的菜单不能删除

---

### 1.6 获取菜单树

**接口**: `GET /api/admin/menu/tree`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "menuId": "monitoring",
      "name": "系统监控",
      "type": "directory",
      "children": [
        {
          "id": 2,
          "menuId": "system-stats",
          "name": "系统统计",
          "type": "menu",
          "parentId": 1
        }
      ]
    }
  ]
}
```

---

### 1.7 同步菜单（从 menu.json）

**接口**: `POST /api/admin/menu/sync`

**说明**: 从 `docs/menu.json` 同步菜单数据到数据库

---

### 1.8 获取当前用户的菜单树

**接口**: `GET /api/admin/menu/user/menu`

**说明**: 返回当前登录用户有权限访问的菜单树

---

### 1.9 批量删除菜单

**接口**: `POST /api/admin/menu/batch-delete`

**请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

---

### 1.10 获取菜单类型选项

**接口**: `GET /api/admin/menu/type-options`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {"value": "directory", "label": "目录"},
    {"value": "menu", "label": "菜单页"},
    {"value": "path", "label": "路径页"},
    {"value": "api", "label": "API"}
  ]
}
```

---

## 2. 角色管理 API

### 2.1 获取角色列表

**接口**: `GET /api/admin/role`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | int | 否 | 起始位置，默认 0 |
| limit | int | 否 | 每页数量，默认 10 |
| sort | string | 否 | 排序方式，默认 created |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 10,
    "list": [
      {
        "id": 1,
        "name": "超级管理员",
        "code": "ROLE_SUPER_ADMIN",
        "data": [],
        "data_v2": [],
        "createdTime": 1234567890,
        "updatedTime": 1234567890
      }
    ]
  }
}
```

---

### 2.2 获取单个角色

**接口**: `GET /api/admin/role/{id}`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "id": 1,
    "name": "超级管理员",
    "code": "ROLE_SUPER_ADMIN",
    "menuIds": [1, 2, 3, 4, 5]
  }
}
```

---

### 2.3 创建角色

**接口**: `POST /api/admin/role`

**请求体**:
```json
{
  "name": "编辑员",
  "code": "ROLE_EDITOR",
  "menuIds": [1, 2, 3]
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 角色名称 |
| code | string | 是 | 角色代码，唯一 |
| menuIds | array | 否 | 关联的菜单 ID 列表 |

---

### 2.4 更新角色

**接口**: `PUT /api/admin/role/{id}`

**请求体**: 同 2.3

**注意**: 内置角色（ROLE_SUPER_ADMIN、ROLE_PARTER_ADMIN）的 code 不可修改

---

### 2.5 删除角色

**接口**: `DELETE /api/admin/role/{id}`

**注意**: 内置角色不可删除

---

### 2.6 获取角色的菜单权限

**接口**: `GET /api/admin/role/{id}/menus`

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {
      "id": 1,
      "menuId": "dashboard",
      "name": "仪表盘",
      ...
    }
  ]
}
```

---

### 2.7 分配菜单权限给角色

**接口**: `POST /api/admin/role/{id}/menus`

**请求体**:
```json
{
  "menuIds": [1, 2, 3, 4, 5]
}
```

**说明**: 会替换角色原有的所有菜单权限

---

### 2.8 批量删除角色

**接口**: `POST /api/admin/role/batch-delete`

**请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

---

### 2.9 获取角色选项

**接口**: `GET /api/admin/role/options`

**说明**: 用于下拉框选择

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {"value": 1, "label": "超级管理员", "code": "ROLE_SUPER_ADMIN"},
    {"value": 2, "label": "编辑员", "code": "ROLE_EDITOR"}
  ]
}
```

---

## 3. 用户管理 API

### 3.1 获取用户列表

**接口**: `GET /api/admin/user`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start | int | 否 | 起始位置，默认 0 |
| limit | int | 否 | 每页数量，默认 10 |
| orderBy | string | 否 | 排序字段 |

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 100,
    "list": [
      {
        "id": 1,
        "email": "admin@example.com",
        "nickname": "管理员",
        "avatar": "",
        "roles": "ROLE_SUPER_ADMIN,ROLE_ADMIN",
        "locked": 0,
        "loginTime": 1234567890,
        "loginIp": "127.0.0.1",
        "createdTime": 1234567890,
        "updatedTime": 1234567890
      }
    ]
  }
}
```

---

### 3.2 获取单个用户

**接口**: `GET /api/admin/user/{id}`

---

### 3.3 创建用户

**接口**: `POST /api/admin/user`

**请求体**:
```json
{
  "email": "user@example.com",
  "nickname": "用户名",
  "password": "Password123!",
  "roles": "ROLE_USER"
}
```

**字段说明**:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱，唯一 |
| nickname | string | 是 | 昵称，唯一 |
| password | string | 是 | 密码，需满足强度要求 |
| roles | string | 否 | 角色，逗号分隔 |

---

### 3.4 更新用户

**接口**: `PUT /api/admin/user/{id}`

**请求体**:
```json
{
  "email": "newemail@example.com",
  "nickname": "新昵称",
  "roles": "ROLE_ADMIN,ROLE_USER"
}
```

**注意**: 密码、salt、id、uuid 不可通过此接口修改

---

### 3.5 删除用户

**接口**: `DELETE /api/admin/user/{id}`

**注意**: 不能删除当前登录用户

---

### 3.6 分配角色给用户

**接口**: `POST /api/admin/user/{id}/roles`

**请求体**:
```json
{
  "roles": ["ROLE_ADMIN", "ROLE_USER"]
}
```

---

### 3.7 重置用户密码

**接口**: `POST /api/admin/user/{id}/reset-password`

**请求体**:
```json
{
  "password": "NewPassword123!"
}
```

---

### 3.8 锁定/解锁用户

**接口**: `POST /api/admin/user/{id}/toggle-lock`

**请求体**:
```json
{
  "locked": true
}
```

---

### 3.9 批量删除用户

**接口**: `POST /api/admin/user/batch-delete`

**请求体**:
```json
{
  "ids": [1, 2, 3]
}
```

---

### 3.10 获取用户角色选项

**接口**: `GET /api/admin/user/role-options`

**说明**: 返回角色列表供选择

**响应示例**:
```json
{
  "code": 0,
  "msg": "success",
  "data": [
    {"value": "ROLE_SUPER_ADMIN", "label": "超级管理员"},
    {"value": "ROLE_USER", "label": "普通用户"}
  ]
}
```

---

## 4. 菜单类型说明

| 类型 | 值 | 说明 | path 字段内容 |
|------|-----|------|---------------|
| 目录 | directory | 目录容器，包含子菜单 | 前端路由路径 |
| 菜单页 | menu | 具体的菜单页面 | 前端路由路径 |
| 路径页 | path | 动态路径页面 | 前端路由路径（含参数） |
| API | api | 后端 API 权限 | 后端 API 路径 |

**API 类型示例**:
```json
{
  "menuId": "device-list-api",
  "name": "设备列表 API",
  "type": "api",
  "path": "/api/admin/gb28181/devices",
  "httpMethod": "GET",
  "routeName": "admin.gb28181.devices.index"
}
```

---

## 5. 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 无效 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如唯一性冲突） |
| 500 | 服务器内部错误 |

---

## 6. 前端集成建议

### 6.1 获取用户菜单

登录后调用 `GET /api/admin/menu/user/menu` 获取当前用户的菜单树，用于构建侧边栏导航。

### 6.2 权限控制

前端应根据用户拥有的菜单权限控制页面和按钮的显示。API 类型菜单可用于控制按钮级别的权限。

### 6.3 路由守卫

建议在前端路由守卫中检查用户是否有访问对应路由的权限。

---

## 7. 数据库表结构

### gv_menu（菜单表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| menuId | varchar(64) | 菜单唯一标识 |
| name | varchar(64) | 菜单名称 |
| icon | varchar(64) | 图标 |
| path | varchar(255) | 路径 |
| component | varchar(128) | 组件名 |
| title | varchar(64) | 标题 |
| parentId | int | 父级 ID |
| parentMenuId | varchar(64) | 父级标识 |
| sort | int | 排序 |
| type | enum | 类型：menu/directory/path/api |
| httpMethod | varchar(16) | HTTP 方法 |
| routeName | varchar(128) | 路由名称 |
| status | tinyint | 状态 |
| createdTime | int | 创建时间 |
| updatedTime | int | 更新时间 |

### gv_role_menu（角色菜单关联表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int | 主键 |
| roleId | int | 角色 ID |
| menuId | int | 菜单 ID |
| createdTime | int | 创建时间 |

---

## 8. 注意事项

1. **超级管理员**（ROLE_SUPER_ADMIN）拥有所有权限，不受菜单限制
2. 删除菜单前需确保没有子菜单
3. 内置角色不可删除，但可以修改权限
4. API 类型菜单用于控制后端接口访问权限
5. 所有时间戳均为 Unix 时间戳（秒）
