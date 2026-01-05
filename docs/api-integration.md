# GB28181 流媒体管理 API 对接文档

## 概述

本文档描述了前端与后端对接的API接口规范，包括流媒体管理、设备管理和通道管理相关的接口。

## 通用说明

### 请求格式

所有API请求遵循以下格式：

```
{METHOD} {API_PATH}
Content-Type: application/json
Authorization: Bearer {token}

{request_body}
```

### 响应格式

所有API响应遵循以下格式：

```json
{
  "code": 0,           // 0表示成功，非0表示失败
  "message": "success",
  "data": { ... }      // 响应数据
}
```

### 分页响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [...],     // 数据列表
    "paginator": {
      "total": 100,    // 总记录数
      "per_page": 10,  // 每页记录数
      "current_page": 1, // 当前页码
      "last_page": 10  // 最后一页页码
    }
  }
}
```

## 一、流媒体管理 API

### 1.1 获取流媒体服务器列表

**请求**
```
GET /admin/media-servers
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 流媒体类型 (zlm/srs/other) |
| status | string | 否 | 运行状态 (running/stopped/unknown) |
| keyword | string | 否 | 搜索关键词（名称或IP） |
| page | number | 否 | 页码，默认1 |
| limit | number | 否 | 每页数量，默认10 |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "name": "主服务器",
        "type": "zlm",
        "host": "192.168.1.100",
        "port": 8086,
        "secret": "035c73f7-bb6b-4889-a715-d9eb2d1925cc",
        "server_id": "default",
        "status": "running",
        "hook_url": "http://192.168.1.100:8086/index/hook",
        "http_port": 8086,
        "rtsp_port": 554,
        "rtmp_port": 1935,
        "rtc_port": 8000,
        "rtp_port_range": "30000-35000",
        "created_at": "2024-01-01 00:00:00",
        "updated_at": "2024-01-01 00:00:00"
      }
    ],
    "paginator": {
      "total": 1,
      "per_page": 10,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

### 1.2 获取流媒体服务器详情

**请求**
```
GET /admin/media-servers/:id
```

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 1,
    "name": "主服务器",
    "type": "zlm",
    "host": "192.168.1.100",
    "port": 8086,
    "secret": "035c73f7-bb6b-4889-a715-d9eb2d1925cc",
    "server_id": "default",
    "status": "running",
    ...
  }
}
```

### 1.3 创建流媒体服务器

**请求**
```
POST /admin/media-servers
Content-Type: application/json

{
  "name": "新服务器",
  "type": "zlm",
  "host": "192.168.1.101",
  "port": 8086,
  "secret": "your-secret-key",
  "hook_url": "http://192.168.1.101:8086/index/hook",
  "http_port": 8086,
  "rtsp_port": 554,
  "rtmp_port": 1935,
  "rtc_port": 8000,
  "rtp_port_range": "30000-35000"
}
```

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": 2,
    "name": "新服务器",
    ...
  }
}
```

### 1.4 更新流媒体服务器

**请求**
```
PUT /admin/media-servers/:id
Content-Type: application/json

{
  "name": "服务器名称",
  "type": "zlm",
  "host": "192.168.1.100",
  "port": 8086,
  "secret": "new-secret",
  ...
}
```

### 1.5 删除流媒体服务器

**请求**
```
DELETE /admin/media-servers/:id
```

**响应示例**
```json
{
  "code": 0,
  "message": "success"
}
```

### 1.6 查询流媒体服务器状态

**请求**
```
GET /admin/media-servers/:id/status
```

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "server_id": "default",
    "status": "running",
    "cpu_usage": 45.5,
    "memory_usage": 62.3,
    "stream_count": 10,
    "player_count": 25,
    "disk_usage": 55.0,
    "network_in": 1024000,
    "network_out": 2048000,
    "uptime": 86400
  }
}
```

### 1.7 获取流媒体服务器配置

**请求**
```
GET /admin/media-servers/:id/config
```

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "api": {
      "secret": "035c73f7-bb6b-4889-a715-d9eb2d1925cc",
      "defaultSnap": "./www/logo.png",
      ...
    },
    "http": {
      "port": 8086,
      "sslport": 8443,
      ...
    },
    ...
  }
}
```

### 1.8 保存流媒体服务器配置

**请求**
```
POST /admin/media-servers/:id/config
Content-Type: application/json

{
  "api": { ... },
  "http": { ... },
  "rtsp": { ... },
  ...
}
```

### 1.9 重置流媒体服务器配置

**请求**
```
POST /admin/media-servers/:id/config/reset
```

### 1.10 重启流媒体服务器

**请求**
```
POST /admin/media-servers/:id/restart
```

### 1.11 获取可用的流媒体服务器列表（简单格式）

**请求**
```
GET /admin/media-servers/simple
```

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": 1,
      "name": "主服务器",
      "server_id": "default",
      "type": "zlm",
      "status": "running"
    }
  ]
}
```

### 1.12 批量绑定通道到流媒体服务器

**请求**
```
POST /admin/media-servers/:id/bind-channels
Content-Type: application/json

{
  "channel_ids": ["34020000001310000001", "34020000001310000002"]
}
```

### 1.13 批量解绑通道

**请求**
```
POST /admin/media-servers/:id/unbind-channels
Content-Type: application/json

{
  "channel_ids": ["34020000001310000001", "34020000001310000002"]
}
```

## 二、设备管理 API

### 2.1 更新设备信息

**请求**
```
PUT /admin/gb28181/devices/:deviceId
Content-Type: application/json

{
  "show_name": "自定义名称",
  "rtp_trans_mode": 1,
  "province_id": "340000",
  "city_id": "340100",
  "county_id": "340104"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| show_name | string | 否 | 设备自定义名称 |
| rtp_trans_mode | number | 否 | RTP传输模式：0=UDP，1=TCP被动，2=TCP主动 |
| province_id | string | 否 | 省份代码（6位行政区划码） |
| city_id | string | 否 | 城市代码 |
| county_id | string | 否 | 区县代码 |

### 2.2 批量删除设备

**请求**
```
DELETE /admin/gb28181/devices/batch
Content-Type: application/json

{
  "device_ids": ["34020000001320000001", "34020000001320000002"]
}
```

### 2.3 批量更新设备状态

**请求**
```
PUT /admin/gb28181/devices/batch/status
Content-Type: application/json

{
  "device_ids": ["34020000001320000001", "34020000001320000002"],
  "enabled": true
}
```

### 2.4 批量更新设备行政区域

**请求**
```
PUT /admin/gb28181/devices/batch/area
Content-Type: application/json

{
  "device_ids": ["34020000001320000001", "34020000001320000002"],
  "province_id": "340000",
  "city_id": "340100",
  "county_id": "340104"
}
```

## 三、通道管理 API

### 3.1 获取所有通道列表（支持跨设备查询）

**请求**
```
GET /admin/gb28181/channels
```

**查询参数**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_id | string | 否 | 设备ID，不传则查询所有设备 |
| status | string | 否 | 通道状态 (online/offline) |
| keyword | string | 否 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页数量 |

**响应示例**
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "device_id": "34020000001320000001",
        "channel_id": "34020000001310000001",
        "channel_name": "摄像头1",
        "manufacturer": "Dahua",
        "model": "DH-IPC-HFW1230S",
        "status": "online",
        "media_server_id": "default",
        "stream_id": "34020000001320000001_34020000001310000001",
        "main_video": "http://192.168.1.100/app/stream_0.flv",
        "sub_video": "http://192.168.1.100/app/stream_1.flv",
        "last_update_at": "2024-01-01 12:00:00"
      }
    ],
    "paginator": { ... }
  }
}
```

### 3.2 批量绑定通道到流媒体服务器

**请求**
```
PUT /admin/gb28181/channels/batch/bind-media
Content-Type: application/json

{
  "device_id": "34020000001320000001",
  "channel_ids": ["34020000001310000001", "34020000001310000002"],
  "media_server_id": "default"
}
```

**参数说明**
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| device_id | string | 否 | 设备ID，与channel_ids二选一 |
| channel_ids | array | 否 | 通道ID列表 |
| media_server_id | string | 是 | 流媒体服务器ID |

## 四、错误代码说明

| 错误代码 | 说明 |
|----------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 五、前端使用示例

### 获取流媒体服务器列表

```typescript
import { mediaServerApi } from '@/api/mediaServerApi'

// 获取列表
const response = await mediaServerApi.getList({
  type: 'zlm',
  status: 'running',
  page: 1,
  limit: 10
})

if (response.code === 0) {
  const servers = response.data.list
  const total = response.data.paginator.total
}
```

### 创建流媒体服务器

```typescript
import { mediaServerApi } from '@/api/mediaServerApi'

const response = await mediaServerApi.create({
  name: '新服务器',
  type: 'zlm',
  host: '192.168.1.100',
  port: 8086,
  secret: 'your-secret',
  rtsp_port: 554,
  rtmp_port: 1935
})

if (response.code === 0) {
  console.log('创建成功', response.data)
}
```

### 批量绑定通道

```typescript
import { gb28181Api } from '@/api/gb28181Api'

const response = await gb28181Api.batchBindChannelsToMedia({
  channel_ids: ['34020000001310000001', '34020000001310000002'],
  media_server_id: 'default'
})

if (response.code === 0) {
  console.log('绑定成功')
}
```

## 六、依赖说明

### 行政区域数据

本项目使用 `element-china-area-data` npm包获取中国行政区划数据，无需后端提供API。

**安装命令**
```bash
pnpm install element-china-area-data
```

**使用示例**
```typescript
import { regionData } from 'element-china-area-data'

// regionData 是一个三级联动的省市区数据结构
// 可以直接用于 Element Plus 的 Cascader 组件
```
