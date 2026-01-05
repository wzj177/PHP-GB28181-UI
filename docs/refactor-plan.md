# GB28181 前端重构计划

## 概述

本次重构旨在优化流媒体网关管理和设备管理模块，使系统支持多种流媒体服务器（ZLM、SRS等），并改进设备和通道的管理功能。

## 重构目标

### 1. 新增流媒体管理模块
- 支持用户自行添加多种类型的流媒体服务器
- 设备注册后可批量绑定通道到流媒体
- 统一管理流媒体服务器的配置和状态

### 2. 重构设备管理模块
- 增强设备列表的批量操作能力
- 完善设备的编辑功能
- 优化通道列表的流媒体绑定功能

## 一、流媒体管理模块设计

### 1.1 数据结构设计

#### 流媒体服务器表 (gv_media_servers)
```sql
CREATE TABLE `gv_media_servers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) NOT NULL COMMENT '服务器名称',
  `type` enum('zlm','srs','other') NOT NULL DEFAULT 'zlm' COMMENT '流媒体类型',
  `host` varchar(255) NOT NULL COMMENT '服务器IP或域名',
  `port` int(11) NOT NULL COMMENT 'HTTP端口',
  `secret` varchar(255) NOT NULL DEFAULT '' COMMENT 'API密钥',
  `server_id` varchar(32) NOT NULL DEFAULT '' COMMENT '网关编号/UUID',
  `status` enum('stopped','running','unknown') NOT NULL DEFAULT 'unknown' COMMENT '运行状态',
  `hook_url` varchar(500) DEFAULT '' COMMENT 'Hook回调地址',
  `http_port` int(11) DEFAULT NULL COMMENT 'HTTP端口',
  `rtsp_port` int(11) DEFAULT NULL COMMENT 'RTSP端口',
  `rtmp_port` int(11) DEFAULT NULL COMMENT 'RTMP端口',
  `rtc_port` int(11) DEFAULT NULL COMMENT 'RTC端口',
  `rtp_port_range` varchar(50) DEFAULT '' COMMENT 'RTP端口范围',
  `default_config` text COMMENT '默认配置JSON',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_server_id` (`server_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流媒体服务器表';
```

### 1.2 TypeScript 类型定义

```typescript
// src/types/media-server.ts

export enum MediaServerType {
  ZLM = 'zlm',
  SRS = 'srs',
  OTHER = 'other'
}

export enum MediaServerStatus {
  STOPPED = 'stopped',     // 未运行
  RUNNING = 'running',     // 运行中
  UNKNOWN = 'unknown'      // 关闭/未知
}

export interface MediaServer {
  id: number
  name: string                      // 服务器名称
  type: MediaServerType             // 类型（zlm、srs）
  host: string                      // IP地址
  port: number                      // 端口
  secret: string                    // API密钥
  server_id: string                 // 网关编号（uuid）
  status: MediaServerStatus         // 运行状态
  hook_url?: string                 // Hook回调地址
  http_port?: number
  rtsp_port?: number
  rtmp_port?: number
  rtc_port?: number
  rtp_port_range?: string
  default_config?: string           // 默认配置JSON
  created_at: string
  updated_at: string
}

export interface MediaServerFormData {
  name: string
  type: MediaServerType
  host: string
  port: number
  secret: string
  hook_url?: string
  http_port?: number
  rtsp_port?: number
  rtmp_port?: number
  rtc_port?: number
  rtp_port_range?: string
}

export interface MediaServerStats {
  server_id: string
  status: MediaServerStatus
  cpu_usage?: number
  memory_usage?: number
  stream_count?: number
  player_count?: number
}
```

### 1.3 API 接口设计

```typescript
// src/api/mediaServerApi.ts

export const mediaServerApi = {
  /**
   * 获取流媒体服务器列表
   * GET /admin/media-servers
   */
  getList: (params?: {
    type?: MediaServerType
    status?: MediaServerStatus
    page?: number
    limit?: number
  }) => request.get('/admin/media-servers', { params }),

  /**
   * 获取流媒体服务器详情
   * GET /admin/media-servers/:id
   */
  getDetail: (id: number) => request.get(`/admin/media-servers/${id}`),

  /**
   * 创建流媒体服务器
   * POST /admin/media-servers
   */
  create: (data: MediaServerFormData) => request.post('/admin/media-servers', data),

  /**
   * 更新流媒体服务器
   * PUT /admin/media-servers/:id
   */
  update: (id: number, data: MediaServerFormData) => request.put(`/admin/media-servers/${id}`, data),

  /**
   * 删除流媒体服务器
   * DELETE /admin/media-servers/:id
   */
  delete: (id: number) => request.delete(`/admin/media-servers/${id}`),

  /**
   * 查询流媒体服务器状态
   * GET /admin/media-servers/:id/status
   */
  getStatus: (id: number) => request.get(`/admin/media-servers/${id}/status`),

  /**
   * 获取流媒体服务器配置（ZLM config）
   * GET /admin/media-servers/:id/config
   */
  getConfig: (id: number) => request.get(`/admin/media-servers/${id}/config`),

  /**
   * 保存流媒体服务器配置（ZLM config）
   * POST /admin/media-servers/:id/config
   */
  saveConfig: (id: number, config: any) => request.post(`/admin/media-servers/${id}/config`, config),

  /**
   * 重置流媒体服务器配置
   * POST /admin/media-servers/:id/config/reset
   */
  resetConfig: (id: number) => request.post(`/admin/media-servers/${id}/config/reset`),

  /**
   * 重启流媒体服务器
   * POST /admin/media-servers/:id/restart
   */
  restart: (id: number) => request.post(`/admin/media-servers/${id}/restart`),

  /**
   * 批量绑定通道到流媒体服务器
   * POST /admin/media-servers/:id/bind-channels
   */
  bindChannels: (id: number, channelIds: string[]) => request.post(`/admin/media-servers/${id}/bind-channels`, { channel_ids: channelIds }),

  /**
   * 解绑通道
   * POST /admin/media-servers/:id/unbind-channels
   */
  unbindChannels: (id: number, channelIds: string[]) => request.post(`/admin/media-servers/${id}/unbind-channels`, { channel_ids: channelIds })
}
```

### 1.4 页面组件设计

#### 1.4.1 流媒体管理列表页
**文件**: `src/views/media/MediaServerList.vue`

**功能**:
- 列表展示：名称、类型、IP、端口、网关编号、运行状态
- 添加服务器按钮
- 搜索和筛选（按类型、状态）
- 操作列：编辑、删除、状态查询、网关配置

#### 1.4.2 流媒体服务器表单对话框
**文件**: `src/views/media/MediaServerFormDialog.vue`

**功能**:
- 添加/编辑表单
- 字段：名称、类型（下拉选择）、IP、端口、API密钥、Hook地址、协议端口配置

#### 1.4.3 流媒体配置页面（复用现有ZLMConfig组件）
**文件**: `src/views/media/MediaServerConfig.vue`

**功能**:
- 复用现有ZLMConfig组件的逻辑
- 根据服务器类型动态加载配置模板
- 配置保存、重置、重启

#### 1.4.4 流媒体状态查询页面
**文件**: `src/views/media/MediaServerStats.vue`

**功能**:
- 复用现有ZLMStats组件的逻辑
- 显示服务器运行状态、资源使用情况
- 流和播放器统计

## 二、设备管理模块重构

### 2.1 设备列表重构

#### 2.1.1 批量操作
- **批量删除**: 选择多个设备进行删除
- **批量禁用/启用**: 批量设置设备启用状态
- **行政区域更新**: 批量更新设备的行政区域信息

#### 2.1.2 编辑功能
**设备编辑对话框** (`src/views/device/DeviceEditDialog.vue`)

编辑字段：
- 设备自定义名称 (`show_name`)
- 流传输类型 (`rtp_trans_mode`):
  - 0: UDP模式（延迟最低，局域网推荐）
  - 1: TCP被动模式（公网推荐，设备主动连接）
  - 2: TCP主动模式（服务器连接设备，需设备端口映射）
- 行政区域 (`province_id`, `city_id`, `county_id`)

### 2.2 通道列表重构

#### 2.2.1 核心操作
- **播放**: 调用现有播放接口
- **录像**: 调用现有录像接口

#### 2.2.2 批量绑定流媒体
**批量绑定对话框** (`src/views/device/ChannelBindDialog.vue`)

功能：
- 选择多个通道
- 从流媒体服务器列表中选择目标服务器
- 批量绑定
- 显示绑定结果

### 2.3 API 接口扩展

```typescript
// src/api/gb28181Api.ts 扩展

export const gb28181Api = {
  // ... 现有接口 ...

  /**
   * 批量删除设备
   * DELETE /admin/gb28181/devices/batch
   */
  batchDeleteDevices: (deviceIds: string[]) => request.delete('/admin/gb28181/devices/batch', { data: { device_ids: deviceIds } }),

  /**
   * 批量更新设备状态
   * PUT /admin/gb28181/devices/batch/status
   */
  batchUpdateDeviceStatus: (deviceIds: string[], enabled: boolean) =>
    request.put('/admin/gb28181/devices/batch/status', { device_ids: deviceIds, enabled }),

  /**
   * 批量更新设备行政区域
   * PUT /admin/gb28181/devices/batch/area
   */
  batchUpdateDeviceArea: (deviceIds: string[], area: { province_id: string; city_id: string; county_id: string }) =>
    request.put('/admin/gb28181/devices/batch/area', { device_ids: deviceIds, ...area }),

  /**
   * 更新设备信息
   * PUT /admin/gb28181/devices/:deviceId
   */
  updateDevice: (deviceId: string, data: {
    show_name?: string
    rtp_trans_mode?: number
    province_id?: string
    city_id?: string
    county_id?: string
  }) => request.put(`/admin/gb28181/devices/${deviceId}`, data),

  /**
   * 批量绑定通道到流媒体服务器
   * PUT /admin/gb28181/channels/batch/bind-media
   */
  batchBindChannelsToMedia: (params: {
    device_id?: string
    channel_ids?: string[]
    media_server_id: string
  }) => request.put('/admin/gb28181/channels/batch/bind-media', params),

  /**
   * 获取可用的流媒体服务器列表
   * GET /admin/media-servers/simple
   */
  getAvailableMediaServers: () => request.get('/admin/media-servers/simple')
}
```

## 三、菜单结构调整

### 3.1 删除的菜单项
- 系统管理 > ZLM配置 (id: zlm-config)
- 系统监控 > 流媒体网关 (id: zlm-stats) - 移至流媒体管理下

### 3.2 新增菜单项

```json
{
  "id": "media-management",
  "name": "流媒体管理",
  "icon": "VideoCamera",
  "path": "/media-management",
  "component": "",
  "title": "流媒体管理",
  "parentId": 0,
  "sort": 4,
  "type": "directory",
  "children": [
    {
      "id": "media-server-list",
      "name": "流媒体服务器",
      "icon": "Connection",
      "path": "/media-servers",
      "component": "MediaServerList",
      "title": "流媒体服务器",
      "parentId": "media-management",
      "sort": 1,
      "type": "menu"
    },
    {
      "id": "media-server-config",
      "name": "网关配置",
      "icon": "Setting",
      "path": "/media-server-config/:id",
      "component": "MediaServerConfig",
      "title": "网关配置",
      "parentId": "media-management",
      "sort": 2,
      "type": "path"
    },
    {
      "id": "media-server-stats",
      "name": "状态查询",
      "icon": "DataAnalysis",
      "path": "/media-server-stats/:id",
      "component": "MediaServerStats",
      "title": "状态查询",
      "parentId": "media-management",
      "sort": 3,
      "type": "path"
    }
  ]
},
{
  "id": "device-management",
  "name": "设备管理",
  "icon": "Monitor",
  "path": "/device-management",
  "component": "",
  "title": "设备管理",
  "parentId": 0,
  "sort": 5,
  "type": "directory",
  "children": [
    {
      "id": "device-list",
      "name": "设备列表",
      "icon": "List",
      "path": "/devices",
      "component": "DeviceList",
      "title": "设备列表",
      "parentId": "device-management",
      "sort": 1,
      "type": "menu"
    },
    {
      "id": "channel-list",
      "name": "通道列表",
      "icon": "Files",
      "path": "/channels",
      "component": "ChannelList",
      "title": "通道列表",
      "parentId": "device-management",
      "sort": 2,
      "type": "menu"
    }
  ]
}
```

## 四、文件结构规划

```
src/
├── types/
│   └── media-server.ts           # 流媒体服务器类型定义
├── api/
│   ├── mediaServerApi.ts         # 流媒体管理API（新增）
│   ├── gb28181Api.ts             # GB28181 API（扩展）
│   └── adapter.ts                # Mock数据添加（扩展）
├── views/
│   ├── media/                    # 流媒体管理模块（新增）
│   │   ├── MediaServerList.vue   # 流媒体服务器列表
│   │   ├── MediaServerFormDialog.vue  # 添加/编辑对话框
│   │   ├── MediaServerConfig.vue      # 网关配置（复用ZLMConfig逻辑）
│   │   └── MediaServerStats.vue       # 状态查询（复用ZLMStats逻辑）
│   └── device/                   # 设备管理模块（重构）
│       ├── DeviceList.vue        # 设备列表（重构）
│       ├── ChannelList.vue       # 通道列表（重构）
│       ├── DeviceEditDialog.vue  # 设备编辑对话框（新增）
│       └── ChannelBindDialog.vue # 通道批量绑定对话框（新增）
└── config/
    └── menu.json                 # 菜单配置（更新）
```

## 五、实现顺序

1. **阶段一：类型定义和API层**
   - 创建媒体服务器类型定义
   - 创建流媒体管理API
   - 扩展设备管理API
   - 添加Mock数据

2. **阶段二：流媒体管理模块**
   - 创建流媒体服务器列表页面
   - 创建添加/编辑表单对话框
   - 创建网关配置页面
   - 创建状态查询页面

3. **阶段三：设备管理模块重构**
   - 重构设备列表（添加批量操作）
   - 创建设备编辑对话框
   - 重构通道列表（添加批量绑定）
   - 创建批量绑定对话框

4. **阶段四：菜单和路由**
   - 更新菜单配置
   - 注册新组件到pages.ts
   - 测试路由跳转

5. **阶段五：文档整理**
   - API对接文档
   - 数据结构设计文档
   - 使用说明

## 六、待对接的后端接口清单

### 6.1 流媒体管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/media-servers | 获取流媒体服务器列表 |
| GET | /admin/media-servers/:id | 获取流媒体服务器详情 |
| POST | /admin/media-servers | 创建流媒体服务器 |
| PUT | /admin/media-servers/:id | 更新流媒体服务器 |
| DELETE | /admin/media-servers/:id | 删除流媒体服务器 |
| GET | /admin/media-servers/:id/status | 查询流媒体服务器状态 |
| GET | /admin/media-servers/:id/config | 获取流媒体服务器配置 |
| POST | /admin/media-servers/:id/config | 保存流媒体服务器配置 |
| POST | /admin/media-servers/:id/config/reset | 重置流媒体服务器配置 |
| POST | /admin/media-servers/:id/restart | 重启流媒体服务器 |
| GET | /admin/media-servers/simple | 获取可用的流媒体服务器列表（简单） |
| POST | /admin/media-servers/:id/bind-channels | 批量绑定通道 |
| POST | /admin/media-servers/:id/unbind-channels | 批量解绑通道 |

### 6.2 设备管理接口扩展

| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | /admin/gb28181/devices/:deviceId | 更新设备信息 |
| DELETE | /admin/gb28181/devices/batch | 批量删除设备 |
| PUT | /admin/gb28181/devices/batch/status | 批量更新设备状态 |
| PUT | /admin/gb28181/devices/batch/area | 批量更新设备行政区域 |
| PUT | /admin/gb28181/channels/batch/bind-media | 批量绑定通道到流媒体服务器 |

### 6.3 行政区域数据接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /admin/regions/provinces | 获取省份列表 |
| GET | /admin/regions/cities/:provinceId | 获取城市列表 |
| GET | /admin/regions/counties/:cityId | 获取区县列表 |

## 七、注意事项

1. **兼容性处理**: 保留现有的ZLM配置和统计页面，通过参数传递服务器ID实现复用
2. **Mock数据**: 在adapter.ts中添加完整的Mock数据支持开发调试
3. **错误处理**: 完善各类操作的错误提示和异常处理
4. **权限控制**: 预留权限控制接口，便于后续集成RBAC
5. **数据验证**: 前端表单验证和后端接口验证保持一致
