# 系统监控统计 API 接口文档

> 本文档定义了前端统计页面所需的后端 API 接口规范，后端需按此规范实现。

---

## 1. 系统统计接口

### 1.1 获取系统资源统计

**接口地址:** `GET /api/admin/system/stats`

**请求参数:** 无

**响应数据结构:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "cpu_usage": 35,          // CPU使用率 (0-100)
    "cpu_cores": 8,           // CPU核心数
    "cpu_frequency": "2.4 GHz", // CPU频率
    "cpu_load": "1.25, 1.18, 1.05", // CPU负载 (1分钟/5分钟/15分钟)

    "memory_usage": 45,       // 内存使用率 (0-100)
    "memory_total": 17179869184,  // 总内存 (字节)
    "memory_used": 6442450944,   // 已用内存 (字节)
    "memory_free": 10737418240,   // 可用内存 (字节)

    "disk_usage": 36,         // 磁盘使用率 (0-100)
    "disk_total": 536870912000,   // 总容量 (字节)
    "disk_used": 193273528320,    // 已用容量 (字节)
    "disk_free": 343597383680,    // 可用容量 (字节)

    "network_upload": 5242880,     // 上行速度 (字节/秒)
    "network_download": 26214400,  // 下行速度 (字节/秒)

    "os_name": "Linux",        // 操作系统名称
    "os_version": "Ubuntu 22.04 LTS", // 系统版本
    "uptime": 2592000,         // 运行时间 (秒，从启动开始计算)
    "server_time": "2024-01-15T14:30:00Z" // 服务器时间 (ISO 8601)
  }
}
```

---

## 2. ZLMediaKit 流媒体网关接口

### 2.1 获取 ZLMediaKit 状态统计

**接口地址:** `GET /api/admin/system/zlm-stats`

**请求参数:** 无

**响应数据结构:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 服务状态
    "running": true,                          // 是否运行中
    "version": "v2023-12-25",                // 版本号
    "build_date": "2023-12-25 10:30:00",     // 编译时间
    "git_hash": "abc123def456",              // Git提交哈希
    "uptime": 604800,                        // 运行时间 (秒)

    // 流统计
    "stream_count": 68,                      // 直播流数量
    "record_stream_count": 12,               // 录像流数量
    "other_stream_count": 8,                 // 其他流数量

    // 连接统计
    "session_count": 156,                    // 会话数
    "tcp_connection_count": 142,             // TCP连接数
    "udp_connection_count": 89,              // UDP连接数
    "total_connection_count": 231,           // 累计连接数

    // 带宽统计 (字节/秒)
    "total_bandwidth": 131072000,            // 总带宽
    "rtsp_bandwidth": 47185920,              // RTSP带宽
    "http_flv_bandwidth": 36700160,          // HTTP-FLV带宽
    "ws_flv_bandwidth": 18874368,            // WebSocket-FLV带宽
    "hls_bandwidth": 12582912,               // HLS带宽
    "rtmp_bandwidth": 8388608,               // RTMP带宽
    "websocket_bandwidth": 7340032,          // WebSocket带宽

    // 性能指标
    "cpu_usage": 25,                         // CPU使用率 (0-100)
    "memory_usage": 35,                      // 内存使用率 (0-100)
    "thread_count": 16,                      // 线程数
    "data_buffer_size": 268435456,           // 数据缓冲区大小 (字节)

    // 编解码支持
    "video_codecs": ["H264", "H265", "MJPEG"],
    "audio_codecs": ["AAC", "PCMU", "PCMA", "G711", "Opus"]
  }
}
```

---

## 3. 设备统计接口

### 3.1 获取设备统计信息

**接口地址:** `GET /api/admin/system/device-stats`

**请求参数:** 无

**响应数据结构:**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    // 设备概览
    "total_count": 68,              // 设备总数
    "online_count": 58,             // 在线设备数
    "offline_count": 10,            // 离线设备数

    // 通道统计
    "total_channels": 256,          // 总通道数
    "online_channels": 238,         // 在线通道数
    "offline_channels": 18,         // 离线通道数

    // 设备类型分布
    "type_distribution": [
      { "type": "ipc", "type_name": "IPC", "count": 45 },
      { "type": "nvr", "type_name": "NVR", "count": 12 },
      { "type": "dvr", "type_name": "DVR", "count": 8 },
      { "type": "platform", "type_name": "平台", "count": 3 }
    ],

    // 厂商分布
    "manufacturer_distribution": [
      {
        "manufacturer": "海康威视",
        "count": 28,
        "models": ["DS-2CD3xxx", "DS-2CD2xxx", "DS-2CD4xxx", "DS-2CD5xxx"]
      },
      {
        "manufacturer": "大华",
        "count": 18,
        "models": ["DH-IPCxxx", "DH-NVRxxx", "DH-SDxxx"]
      }
    ],

    // 最近活动设备
    "recent_activities": [
      {
        "device_name": "大厅摄像头01",
        "device_id": "34020000001310000001",
        "status": "online",
        "last_seen": "2024-01-15 14:30:25"
      }
    ],

    // 24小时在线趋势
    "hourly_stats": [
      {
        "hour": 0,                 // 小时 (0-23)
        "online_count": 62,        // 在线设备数
        "total_count": 68,         // 总设备数
        "online_rate": 91          // 在线率 (百分比)
      }
      // ... 共24条记录，代表过去24小时
    ]
  }
}
```

---

## 通用说明

### 响应格式

所有接口统一返回以下格式：

```json
{
  "code": 200,           // 状态码，200表示成功
  "message": "success",  // 消息描述
  "data": { }            // 实际数据
}
```

### 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 401 | 未授权/登录失效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

### 单位说明

| 字段类型 | 单位 |
|----------|------|
| 内存、磁盘、流量 | 字节 (bytes) |
| 时间 | 秒 (seconds) |
| 百分比 | 0-100 的数值 |
| 时间戳 | ISO 8601 格式字符串 |

### 认证

所有请求需要在请求头中携带 Token：

```
Authorization: Bearer {token}
```

---

## Mock 数据配置

开发环境下，前端已配置 Mock 数据（`src/api/admin/adapter.ts`），可通过设置环境变量控制：

```bash
# 使用 Mock 数据
VITE_MOCK_ENABLED=true

# 使用真实 API
VITE_MOCK_ENABLED=false
```

---

## 前端 API 调用示例

```typescript
import { monitorApi } from '@/api/admin/monitorApi'

// 获取系统统计
const systemStats = await monitorApi.getSystemStats()

// 获取设备统计
const deviceStats = await monitorApi.getDeviceStats()

// 获取 ZLMediaKit 统计
const zlmStats = await monitorApi.getZLMediaKitStats()
```
