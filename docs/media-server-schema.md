# 流媒体网关数据结构设计文档

## 概述

本文档描述了GB28181系统中流媒体网关管理的数据结构设计，包括流媒体服务器表、设备表和通道表的字段定义和关系。

## 一、流媒体服务器表 (gv_media_servers)

### 表结构

```sql
CREATE TABLE `gv_media_servers` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(100) NOT NULL COMMENT '服务器名称',
  `type` enum('zlm','srs','other') NOT NULL DEFAULT 'zlm' COMMENT '流媒体类型',
  `host` varchar(255) NOT NULL COMMENT '服务器IP或域名',
  `port` int(11) NOT NULL COMMENT 'HTTP API端口',
  `secret` varchar(255) NOT NULL DEFAULT '' COMMENT 'API密钥',
  `server_id` varchar(32) NOT NULL DEFAULT '' COMMENT '网关编号/UUID',
  `status` enum('stopped','running','unknown') NOT NULL DEFAULT 'unknown' COMMENT '运行状态',
  `hook_url` varchar(500) DEFAULT '' COMMENT 'Hook回调地址',
  `http_port` int(11) DEFAULT NULL COMMENT 'HTTP端口（可选，不同于API端口）',
  `rtsp_port` int(11) DEFAULT NULL COMMENT 'RTSP端口',
  `rtmp_port` int(11) DEFAULT NULL COMMENT 'RTMP端口',
  `rtc_port` int(11) DEFAULT NULL COMMENT 'RTC端口',
  `rtp_port_range` varchar(50) DEFAULT '' COMMENT 'RTP端口范围，如30000-35000',
  `default_config` text COMMENT '默认配置JSON',
  `created_at` datetime NOT NULL COMMENT '创建时间',
  `updated_at` datetime NOT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_server_id` (`server_id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='流媒体服务器表';
```

### 字段说明

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| id | bigint(20) | 是 | 自增 | 主键ID |
| name | varchar(100) | 是 | - | 服务器名称，用于标识和展示 |
| type | enum('zlm','srs','other') | 是 | 'zlm' | 流媒体类型 |
| host | varchar(255) | 是 | - | 服务器IP地址或域名 |
| port | int(11) | 是 | - | HTTP API端口，用于配置管理 |
| secret | varchar(255) | 是 | '' | API调用密钥，用于鉴权 |
| server_id | varchar(32) | 是 | '' | 网关唯一编号，通常是UUID |
| status | enum('stopped','running','unknown') | 是 | 'unknown' | 当前运行状态 |
| hook_url | varchar(500) | 否 | '' | 事件回调地址 |
| http_port | int(11) | 否 | - | HTTP流端口，用于HTTP-FLV等 |
| rtsp_port | int(11) | 否 | - | RTSP服务端口 |
| rtmp_port | int(11) | 否 | - | RTMP推流/播放端口 |
| rtc_port | int(11) | 否 | - | WebRTC服务端口 |
| rtp_port_range | varchar(50) | 否 | '' | RTP端口范围，格式：起始端口-结束端口 |
| default_config | text | 否 | - | 默认配置，JSON格式存储 |
| created_at | datetime | 是 | - | 记录创建时间 |
| updated_at | datetime | 是 | - | 记录更新时间 |

### 索引说明

| 索引名 | 类型 | 字段 | 说明 |
|--------|------|------|------|
| PRIMARY | 主键 | id | 主键索引 |
| uk_server_id | 唯一 | server_id | 网关编号唯一约束 |
| idx_type | 普通 | type | 按类型查询索引 |
| idx_status | 普通 | status | 按状态查询索引 |

## 二、设备表 (gv_devices)

### 核心字段（与流媒体相关）

| 字段 | 类型 | 说明 |
|------|------|------|
| rtp_trans_mode | int(1) | RTP传输模式：0=UDP，1=TCP被动，2=TCP主动 |
| show_name | varchar(255) | 设备自定义名称 |
| province_id | varchar(16) | 所在省份代码（6位行政区划码） |
| city_id | varchar(16) | 所在城市代码 |
| county_id | varchar(16) | 所在区县代码 |

### RTP传输模式说明

| 模式值 | 名称 | 说明 |
|--------|------|------|
| 0 | UDP模式 | 延迟最低，局域网推荐 |
| 1 | TCP被动模式 | 公网推荐，设备主动连接服务器 |
| 2 | TCP主动模式 | 服务器主动连接设备，需要设备端口映射 |

## 三、通道表 (gv_device_channels)

### 核心字段（与流媒体相关）

| 字段 | 类型 | 说明 |
|------|------|------|
| media_server_id | varchar(32) | 绑定的流媒体服务器ID，对应gv_media_servers.server_id |
| stream_id | varchar(64) | ZLM流ID，格式：device_id_channel_id |
| main_id | varchar(32) | 兼容akstream，效果和stream_id一样 |
| ssrc | varchar(10) | SSRC（10位数字），用于RTP流标识 |
| status | enum('online','offline','expired','unregistered') | 通道状态 |
| stream_status | enum('idle','pushing','failed') | 流状态 |
| record_status | tinyint(1) | 录像状态：0=未录像，1=录像中 |

### 流状态说明

| 状态值 | 名称 | 说明 |
|--------|------|------|
| idle | 空闲 | 无人观看，流未推流 |
| pushing | 推流中 | 正在推流 |
| failed | 失败 | 推流失败 |

## 四、数据关系图

```
gv_media_servers (流媒体服务器表)
    |
    | server_id (1:N)
    |
    v
gv_device_channels (通道表)
    |
    | device_id (N:1)
    |
    v
gv_devices (设备表)
```

## 五、业务流程

### 5.1 添加流媒体服务器流程

1. 用户填写服务器信息（名称、类型、IP、端口、密钥等）
2. 前端调用 `POST /admin/media-servers` 创建记录
3. 后端生成UUID作为server_id
4. 返回创建的服务器信息

### 5.2 设备注册流程

1. GB28181设备通过SIP协议注册到信令网关
2. 信令网关将设备信息存储到 `gv_devices` 表
3. 默认情况下，设备的 `rtp_trans_mode` 为0（UDP模式）

### 5.3 通道发现流程

1. 信令网关向设备发送目录查询命令
2. 设备返回通道列表
3. 将通道信息存储到 `gv_device_channels` 表
4. 此时通道的 `media_server_id` 为 'default' 或空

### 5.4 批量绑定流媒体流程

1. 用户在通道列表中选择要绑定的通道
2. 选择目标流媒体服务器
3. 前端调用 `PUT /admin/gb28181/channels/batch/bind-media`
4. 后端更新通道的 `media_server_id` 字段

### 5.5 播放流程

1. 用户选择通道进行播放
2. 后端根据通道的 `media_server_id` 找到对应的流媒体服务器
3. 向该流媒体服务器发送播放指令
4. 流媒体服务器通过GB28181协议向设备请求流
5. 返回播放地址给前端

## 六、配置数据结构

### ZLM配置结构（示例）

```json
{
  "api": {
    "apiDebug": 0,
    "defaultSnap": "./www/logo.png",
    "downloadRoot": "./www",
    "secret": "035c73f7-bb6b-4889-a715-d9eb2d1925cc",
    "snapRoot": "./www/snap/"
  },
  "http": {
    "port": 8086,
    "sslport": 8443,
    "rootPath": "./www",
    "virtualPath": "",
    "allow_cross_domains": 1
  },
  "rtsp": {
    "port": 554,
    "sslport": 0,
    "lowLatency": 0
  },
  "rtmp": {
    "port": 1935,
    "sslport": 0
  },
  "rtc": {
    "port": 8000,
    "tcpPort": 8000
  },
  "general": {
    "mediaServerId": "default",
    "listen_ip": "::"
  }
}
```

## 七、前端类型定义

```typescript
// src/types/media-server.ts

export enum MediaServerType {
  ZLM = 'zlm',
  SRS = 'srs',
  OTHER = 'other'
}

export enum MediaServerStatus {
  STOPPED = 'stopped',
  RUNNING = 'running',
  UNKNOWN = 'unknown'
}

export interface MediaServer {
  id: number
  name: string
  type: MediaServerType
  host: string
  port: number
  secret: string
  server_id: string
  status: MediaServerStatus
  hook_url?: string
  http_port?: number
  rtsp_port?: number
  rtmp_port?: number
  rtc_port?: number
  rtp_port_range?: string
  default_config?: string
  created_at: string
  updated_at: string
}

export enum RtpTransMode {
  UDP = 0,
  TCP_PASSIVE = 1,
  TCP_ACTIVE = 2
}
```

## 八、注意事项

1. **server_id 唯一性**: 每个流媒体服务器的 server_id 必须唯一，建议使用UUID

2. **默认服务器**: 系统应该有一个默认的流媒体服务器（server_id='default'），用于新注册的通道自动绑定

3. **状态同步**: 流媒体服务器的 status 字段需要定期通过心跳检测更新

4. **级联删除**: 删除流媒体服务器时，需要检查是否有绑定的通道，如果有则需要提示用户或自动解绑

5. **配置备份**: 修改流媒体服务器配置前建议备份原配置

6. **端口冲突**: 添加新的流媒体服务器时需要检查端口是否冲突
