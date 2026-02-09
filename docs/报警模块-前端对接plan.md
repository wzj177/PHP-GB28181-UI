# GB28181 前端对接计划

> 本文档描述 GB28181 设备管理、语音对讲、报警订阅等模块的前端对接 API 规范。

---

## 一、API 基础信息

### 1.1 Base URL

| 环境 | Base URL |
|------|----------|
| 开发环境 | `http://localhost:8886` |
| 生产环境 | `{部署服务器地址}:8886` |

### 1.2 认证方式

所有 `/api/admin/` 下的接口需要登录认证，请求头需携带：

```http
Authorization: Bearer {token}
```

### 1.3 通用响应格式

```json
{
  "code": 0,           // 0=成功, 非0=失败
  "msg": "success",    // 消息
  "data": {}           // 数据
}
```

---

## 二、语音对讲模块

### 2.1 准备语音对讲

```http
POST /api/v2/gb28181/devices/{deviceId}/channels/{channelId}/voice/prepare
```

**请求参数：**
```json
{
  "mode": "talk"  // talk=对讲, broadcast=广播
}
```

**响应示例：**
```json
{
  "code": 0,
  "msg": "语音对讲准备成功",
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "stream_id": "talk_34020000001320000109_34020000001310000001",
    "mode": "talk",
    "status": "waiting_stream",
    "streams": {
      "rtmp": "rtmp://192.168.1.100/live/stream",
      "rtsp": "rtsp://192.168.1.100:554/stream",
      "flv": "http://192.168.1.100:8000/live.flv",
      "ws_flv": "ws://192.168.1.100:8000/live.flv",
      "hls": "http://192.168.1.100:8000/live/hls.m3u8",
      "rtc": "webrtc://192.168.1.100:8000/live"
    },
    "ssrc": "0000001234",
    "rtp_port": 30000,
    "expires_at": "2026-02-08 12:15:30"
  }
}
```

**前端实现要点：**
1. 获取推流地址后，使用 WebRTC/FLV.js 等推流到 `streams.rtmp` 或 `streams.ws_flv`
2. 记录 `session_id`，用于后续状态查询和停止
3. 监控 `expires_at`，超时前可重新准备

### 2.2 查询会话状态

```http
GET /api/v2/gb28181/voice/{sessionId}
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "session_id": "550e8400-e29b-41d4-a716-446655440000",
    "device_id": "34020000001320000109",
    "channel_id": "34020000001310000001",
    "mode": "talk",
    "status": "connected",  // waiting_stream/stream_arrived/inviting/connected/failed/ended
    "started_at": "2026-02-08 12:00:00",
    "ended_at": null,
    "ended_reason": null,
    "created_at": "2026-02-08 12:00:00",
    "updated_at": "2026-02-08 12:00:15"
  }
}
```

**状态说明：**

| 状态 | 说明 | 前端处理 |
|------|------|----------|
| `waiting_stream` | 等待前端推流 | 开始推流 |
| `stream_arrived` | 流已到达，等待 SIP 连接 | 等待中 |
| `inviting` | SIP INVITE 已发送 | 等待中 |
| `connected` | 对讲已建立 | 可正常通话 |
| `failed` | 失败 | 显示错误信息 |
| `ended` | 已结束 | 清理资源 |

**前端实现要点：**
- 建议每 2-3 秒轮询一次状态
- `connected` 状态显示对讲中界面
- `failed`/`ended` 状态显示结束原因并停止推流

### 2.3 停止语音对讲

```http
POST /api/v2/gb28181/voice/{sessionId}/stop
```

**响应示例：**
```json
{
  "code": 0,
  "msg": "语音对讲已停止",
  "data": {
    "success": true,
    "message": "语音对讲已停止"
  }
}
```

### 2.4 前端流程图

```
用户点击对讲
    ↓
调用 prepareVoiceTalk()
    ↓
获取推流地址 streams
    ↓
前端开始推流 (WebRTC/FLV)
    ↓
轮询 getVoiceSession() 状态
    ↓
status == connected ? 显示通话界面
    ↓
用户点击结束 / 超时
    ↓
调用 stopVoiceTalk()
    ↓
前端停止推流，清理资源
```

---

## 三、订阅配置模块

### 3.1 更新设备订阅配置

```http
PUT /api/admin/gb28181/devices/{id}
```

**请求参数（仅订阅部分）：**
```json
{
  "subscribe_catalog": 1,      // 0=关闭, 1=开启
  "subscribe_alarm": 1,        // 0=关闭, 1=开启
  "subscribe_position": 1,     // 0=关闭, 1=开启
  "subscribe_ptz": 0,          // 0=关闭, 1=开启
  "subscribe_expires": 3600,   // 订阅有效期（秒），默认3600
  "position_interval": 5       // 位置上报间隔（秒），默认5
}
```

**响应示例：**
```json
{
  "code": 0,
  "msg": "更新成功"
}
```

### 3.2 查询设备订阅状态

```http
GET /api/admin/gb28181/devices/{id}
```

**响应示例（subscription_status 部分）：**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "device_id": "34020000001320000109",
    "device_name": "摄像头01",
    "subscription_status": {
      "catalog": {
        "enabled": true,
        "dialog_id": 123456,
        "expires_at": 1704729600
      },
      "alarm": {
        "enabled": true,
        "dialog_id": 123457,
        "priority_min": 1,
        "priority_max": 4,
        "expires_at": 1704729600
      },
      "mobile_position": {
        "enabled": true,
        "dialog_id": 123458,
        "interval": 5,
        "expires_at": 1704729600
      }
    }
  }
}
```

### 3.3 前端订阅配置界面建议

```
┌─────────────────────────────────────────────┐
│  设备订阅配置                                │
├─────────────────────────────────────────────┤
│  ☐ 目录订阅        [自动续订]                │
│  ☐ 报警订阅        [优先级: 1-4 ▼]          │
│  ☐ 位置订阅        [上报间隔: 5秒 ▼]         │
│  ☐ PTZ 订阅                                   │
│                                             │
│  订阅有效期: [3600] 秒                       │
│                                             │
│  [保存配置]  [立即下发]                       │
└─────────────────────────────────────────────┘
```

---

## 四、报警计划模块

### 4.1 报警计划列表

```http
GET /api/admin/alarm-plan
```

**查询参数：**
```
?status=1           // 状态筛选（可选）
&name=夜间模式      // 名称搜索（可选）
&start=0            // 分页起始
&limit=20           // 每页数量
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "name": "夜间报警",
        "status": 1,
        "snapshot_interval_sec": 10,
        "record_duration_sec": 60,
        "alarm_level": {"all": true, "in": []},
        "alarm_method": {"all": false, "in": [2, 5]},
        "alarm_type": {"all": false, "in": [1, 2, 3]},
        "created_at": "2026-02-08 10:00:00",
        "bound_channels_count": 5
      }
    ],
    "paginator": {
      "total": 10,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

### 4.2 创建报警计划

```http
POST /api/admin/alarm-plan
```

**请求参数：**
```json
{
  "name": "夜间报警",
  "status": 1,
  "snapshot_interval_sec": 10,
  "record_duration_sec": 60,
  "alarm_level": {"all": true, "in": []},
  "alarm_method": {"all": false, "in": [2, 5]},
  "alarm_type": {"all": false, "in": [1, 2, 3]},
  "alarm_eventtype": {"all": false, "in": [1, 2]},
  "remark": "夜间模式自动报警"
}
```

**报警字段说明：**

| 字段 | 说明 | 取值范围 |
|------|------|----------|
| `alarm_level` | 报警级别 | `{"all": true}` 或 `{"in": [1,2,3,4]}` |
| `alarm_method` | 报警方式 | `{"all": true}` 或 `{"in": [1,2,3,4,5,6,7]}` |
| `alarm_type` | 报警类型 | 依 `alarm_method` 而定 |
| `alarm_eventtype` | 事件类型 | 1=进入区域, 2=离开区域 |

**响应示例：**
```json
{
  "code": 0,
  "msg": "创建成功",
  "data": {
    "id": 1,
    "name": "夜间报警",
    ...
  }
}
```

### 4.3 绑定通道到报警计划

```http
POST /api/admin/alarm-plan/{id}/channels
```

**请求参数：**
```json
{
  "channel_ids": [
    "34020000001310000001",
    "34020000001310000002"
  ]
}
```

### 4.4 查询报警计划绑定的通道

```http
GET /api/admin/alarm-plan/{id}/channels
```

**响应示例：**
```json
{
  "code": 0,
  "data": [
    {
      "device_id": "34020000001320000109",
      "channel_id": "34020000001310000001",
      "channel_name": "通道1",
      "enabled": 1
    }
  ]
}
```

### 4.5 前端报警计划界面建议

```
┌─────────────────────────────────────────────┐
│  报警计划管理                                │
├─────────────────────────────────────────────┤
│  [+ 新建计划]                                │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 夜间报警               [编辑] [删除]  │   │
│  │ 状态: ●启用 | 已绑定 5 个通道          │   │
│  │ 快照: 10秒/次 | 录像: 60秒            │   │
│  │ 报警级别: 全部 | 方式: 设备+视频     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 周界报警               [编辑] [删除]  │   │
│  │ 状态: ○未启用 | 已绑定 3 个通道        │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 五、报警事件模块

### 5.1 报警事件列表

```http
GET /api/admin/gb28181/alarms
```

**查询参数：**
```
?device_id=xxx          // 设备ID
&start_time=2026-02-01  // 开始时间
&end_time=2026-02-08    // 结束时间
&level=2                // 报警级别
&method=5               // 报警方式
&start=0                // 分页
&limit=20
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": 1,
        "device_id": "34020000001320000109",
        "channel_id": "34020000001310000001",
        "level": 2,
        "method": 5,
        "type": 6,
        "eventtype": 1,
        "description": "入侵检测报警",
        "longitude": 116.404,
        "latitude": 39.915,
        "alarm_time": "2026-02-08 12:00:00",
        "alarm_plan_id": 1
      }
    ],
    "total": 100
  }
}
```

### 5.2 报警事件详情

```http
GET /api/admin/gb28181/alarms/{id}
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "id": 1,
    "device_id": "34020000001320000109",
    "channel_id": "34020000001310000001",
    "level": 2,
    "method": 5,
    "type": 6,
    "eventtype": 1,
    "description": "入侵检测报警",
    "longitude": 116.404,
    "latitude": 39.915,
    "alarm_time": "2026-02-08 12:00:00",
    "recv_time": "2026-02-08 12:00:01",
    "alarm_plan_id": 1,
    "assets": {
      "snapshots": [
        {
          "id": 1,
          "file_url": "http://xxx/snapshot.jpg",
          "shot_time": "2026-02-08 12:00:02"
        }
      ],
      "records": [
        {
          "id": 1,
          "file_url": "http://xxx/record.mp4",
          "start_time": "2026-02-08 12:00:00",
          "duration": 60
        }
      ]
    }
  }
}
```

### 5.3 前端报警事件界面建议

```
┌─────────────────────────────────────────────┐
│  报警事件                                    │
├─────────────────────────────────────────────┤
│  筛选: [设备▼] [级别▼] [时间范围] [查询]     │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📸 2026-02-08 12:00:00  [二级警情]   │   │
│  │ 设备: 摄像头01  |  入侵检测          │   │
│  │ [查看快照] [查看录像] [定位]          │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │ 📸 2026-02-08 11:30:00  [一级警情]   │   │
│  │ 设备: 摄像头02  | 设备故障          │   │
│  │ [查看快照] [查看录像] [定位]          │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 六、实时视频预览模块

### 6.1 获取实时播放地址

```http
POST /api/admin/gb28181/devices/{deviceId}/channels/{channelId}/start
```

**响应示例：**
```json
{
  "code": 0,
  "data": {
    "stream_id": "rtp_34020000001320000109_34020000001310000001",
    "play_urls": {
      "flv": "http://xxx/live.flv",
      "ws_flv": "ws://xxx/live.flv",
      "hls": "http://xxx/live/hls.m3u8",
      "rtc": "webrtc://xxx/live"
    }
  }
}
```

### 6.2 停止实时播放

```http
POST /api/admin/gb28181/devices/{deviceId}/channels/{channelId}/stop
```

**请求参数：**
```json
{
  "stream_id": "rtp_xxx"
}
```

---

## 七、PTZ 控制模块

### 7.1 云台控制

```http
POST /api/admin/gb28181/devices/{deviceId}/channels/{channelId}/ptz
```

**请求参数：**
```json
{
  "command": "up",      // up/down/left/right/zoom_in/zoom_out/stop
  "speed": 5,           // 速度 1-255
  "duration": 1000       // 持续时间（毫秒）
}
```

### 7.2 预置位控制

```http
POST /api/admin/gb28181/devices/{deviceId}/channels/{channelId}/preset
```

**请求参数：**
```json
{
  "action": "call",     // set=设置, call=调用, delete=删除
  "preset_id": 1        // 预置位编号 1-255
}
```

---

## 八、前端开发建议

### 8.1 状态管理

```typescript
interface AppState {
  // 语音对讲
  voiceSession: {
    sessionId: string;
    status: 'waiting_stream' | 'stream_arrived' | 'inviting' | 'connected' | 'failed' | 'ended';
    streamUrl: string;
    expiresAt: number;
  } | null;

  // 订阅配置
  subscription: {
    [deviceId: string]: {
      catalog: boolean;
      alarm: boolean;
      position: boolean;
      ptz: boolean;
    };
  };

  // 报警事件
  alarms: {
    list: AlarmEvent[];
    unreadCount: number;
  };
}
```

### 8.2 WebSocket 推送建议

建议使用 WebSocket 接收实时推送：

| 事件类型 | 订阅路径 | 数据格式 |
|---------|---------|----------|
| 报警事件 | `/ws/alarm` | `{event: "alarm", data: {...}}` |
| 设备上线 | `/ws/device` | `{event: "online", device_id: "xxx"}` |
| 设备离线 | `/ws/device` | `{event: "offline", device_id: "xxx"}` |

### 8.3 视频播放器推荐

| 格式 | 推荐播放器 | 说明 |
|------|-----------|------|
| FLV | flv.js | 低延迟，适合实时监控 |
| HLS | hls.js | 兼容性好 |
| WebRTC | WebRTC 原生 | 超低延迟，适合双向通话 |

---

## 九、错误码说明

| 错误码 | 说明 |
|-------|------|
| 0 | 成功 |
| 400 | 参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
| 5000305 | 参数缺失 |
| 5000306 | 参数错误 |
| 5000310 | 数据已存在 |

---

## 十、测试数据

### 测试设备ID
```
34020000001320000109  // 设备ID
34020000001310000001  // 通道ID
```

### 测试接口流程

1. **语音对讲测试流程：**
   ```
   1. POST /voice/prepare → 获取推流地址
   2. 前端推流到 RTMP 地址
   3. GET /voice/{sessionId} → 轮询状态直到 connected
   4. POST /voice/{sessionId}/stop → 停止对讲
   ```

2. **订阅配置测试流程：**
   ```
   1. GET /devices/{id} → 查看当前订阅配置
   2. PUT /devices/{id} → 更新订阅配置
   3. GET /devices/{id} → 确认配置已更新
   ```

3. **报警计划测试流程：**
   ```
   1. POST /alarm-plan → 创建报警计划
   2. POST /alarm-plan/{id}/channels → 绑定通道
   3. 模拟设备报警 → 查询报警事件
   ```

---

## 十一、联系方式

如有问题请联系后端开发团队或查看详细 API 文档。
