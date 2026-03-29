# StreamProxy API 文档

## 数据结构

### StreamProxy 对象

```json
{
  "id": 1,
  "proxy_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "海康摄像头-01",
  "type": "pull",                    // pull(拉流) | push(推流)
  "protocol": "rtsp",                // rtsp | rtmp | http-flv
  "source_url": "rtsp://admin:12345@192.168.1.100:554/Streaming/Channels/101",
  "app": "proxy",
  "stream": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "vhost": "__defaultVhost__",
  "media_server_id": "1",
  "status": "online",                // online | offline | stopped | error
  "last_heartbeat_at": "2026-03-06 15:30:00",
  "error_message": null,
  "record_plan_id": 0,
  "record_status": 0,                // 0=未录像, 1=录像中
  "enable_auto_reconnect": 1,
  "max_retry_count": 10,
  "current_retry_count": 0,
  "timeout_sec": 10,
  "rtp_type": 0,                     // 0=TCP, 1=UDP
  "enable_hls": 1,
  "enable_mp4": 0,
  "viewer_count": 5,
  "total_start_count": 3,
  "total_reconnect_count": 1,
  "description": "门口监控",
  "tags": ["重点区域", "24小时"],
  "zlm_key": "stream_proxy_a1b2c3d4",
  "started_at": "2026-03-06 14:00:00",
  "stopped_at": null,
  "created_at": "2026-03-06 13:00:00",
  "updated_at": "2026-03-06 15:30:00"
}
```

---

## API接口

### 1. 获取列表

`GET /stream-proxies`

**请求参数**:
```
status          状态筛选: online|offline|stopped|error
type            类型筛选: pull|push
protocol        协议筛选: rtsp|rtmp|http-flv
media_server_id 流媒体服务器ID
record_plan_id  录像计划ID
keyword         搜索关键词
sort            排序: created_at|started_at|last_heartbeat_at
start           分页起始 (默认0)
limit           每页数量 (默认20)
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "list": [/* StreamProxy对象数组 */],
    "paginator": {
      "total": 50,
      "start": 0,
      "limit": 20,
      "current_page": 1,
      "total_pages": 3
    }
  }
}
```

---

### 2. 创建流代理

`POST /stream-proxies`

**请求Body**:
```json
{
  "name": "海康摄像头-01",
  "type": "pull",
  "protocol": "rtsp",
  "source_url": "rtsp://admin:12345@192.168.1.100:554/Streaming/Channels/101",
  "media_server_id": "1",
  "description": "门口监控",
  "tags": ["重点区域"],
  "enable_auto_reconnect": 1,
  "max_retry_count": 10,
  "timeout_sec": 10,
  "rtp_type": 0,
  "enable_hls": 1,
  "enable_mp4": 0
}
```

**必填字段**:
- `name` - 名称
- `type` - 类型 (pull/push)
- `protocol` - 协议 (rtsp/rtmp/http-flv)
- `source_url` - 源地址 (type=pull时必填)
- `media_server_id` - 流媒体服务器ID

**响应**:
```json
{
  "code": 0,
  "msg": "流代理创建成功",
  "data": {/* StreamProxy对象 */}
}
```

---

### 3. 获取详情

`GET /stream-proxies/{id}`

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {/* StreamProxy对象 */}
}
```

---

### 4. 更新流代理

`PUT /stream-proxies/{id}`

**请求Body**:
```json
{
  "name": "海康摄像头-01（已更新）",
  "description": "门口监控摄像头",
  "enable_auto_reconnect": 1,
  "max_retry_count": 15,
  "tags": ["重点区域"]
}
```

**可更新字段**:
- `name`, `description`, `tags`
- `enable_auto_reconnect`, `max_retry_count`, `timeout_sec`
- `rtp_type`, `enable_hls`, `enable_mp4`

**注意**: 流代理在线时，无法修改 `type`, `protocol`, `source_url`, `app`, `stream`, `media_server_id`

**响应**:
```json
{
  "code": 0,
  "msg": "更新成功",
  "data": {/* StreamProxy对象 */}
}
```

---

### 5. 删除流代理

`DELETE /stream-proxies/{id}`

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message": "流代理已删除"
  }
}
```

---

### 6. 启动流代理

`POST /stream-proxies/{id}/start`

**功能**: 调用ZLM API拉取源流，更新状态为online

**响应**:
```json
{
  "code": 0,
  "msg": "流代理已启动",
  "data": {/* StreamProxy对象 */}
}
```

**错误码**:
- `4093008` - 流代理已启动
- `5003012` - 启动失败

---

### 7. 停止流代理

`POST /stream-proxies/{id}/stop`

**功能**: 调用ZLM API删除流代理，更新状态为stopped

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message": "流代理已停止"
  }
}
```

---

### 8. 重启流代理

`POST /stream-proxies/{id}/restart`

**功能**: 先停止再启动

**响应**:
```json
{
  "code": 0,
  "msg": "流代理已重启",
  "data": {/* StreamProxy对象 */}
}
```

---

### 9. 获取播放地址

`GET /stream-proxies/{id}/play-urls`

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "rtsp": "rtsp://192.168.1.10:554/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "rtmp": "rtmp://192.168.1.10:1935/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901",
    "http_flv": "http://192.168.1.10:8080/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901.live.flv",
    "ws_flv": "ws://192.168.1.10:8080/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901.live.flv",
    "hls": "http://192.168.1.10:8080/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901/hls.m3u8",
    "https_flv": "https://192.168.1.10:4443/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901.live.flv",
    "wss_flv": "wss://192.168.1.10:4443/proxy/b2c3d4e5-f6a7-8901-bcde-f12345678901.live.flv"
  }
}
```

**前端播放示例**:
 使用国标集成的播放器
---

### 10. 绑定录像计划

`POST /stream-proxies/{id}/bind-plan`

**请求Body**:
```json
{
  "record_plan_id": 1
}
```

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message": "录像计划已绑定"
  }
}
```

---

### 11. 解绑录像计划

`POST /stream-proxies/{id}/unbind-plan`

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message": "录像计划已解绑"
  }
}
```

---

### 12. 统计摘要

`GET /stream-proxies/summary`

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 50,
    "by_status": {
      "online": 35,
      "offline": 5,
      "stopped": 8,
      "error": 2
    },
    "by_type": {
      "pull": 45,
      "push": 5
    },
    "recording": {
      "with_plan": 20,
      "recording": 15
    }
  }
}
```

---

### 13. 手动健康检查

`POST /stream-proxies/health-check`

**响应**:
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "total": 35,
    "online": 33,
    "offline": 2
  }
}
```

---

## 错误码

### 通用错误
| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 5000305 | 参数缺失 |
| 5000306 | 参数错误 |

### 流代理专用错误
| 错误码 | 说明 |
|--------|------|
| 4043001 | 流代理不存在 |
| 4043002 | 流媒体服务器不存在 |
| 4003003 | 无效的代理类型 |
| 4003004 | 不支持的协议类型 |
| 4003005 | 无效的源地址 |
| 4003006 | 拉流代理必须提供源地址 |
| 4093008 | 流代理已启动 |
| 4093009 | 流代理已停止 |
| 4093011 | 流ID已存在 |
| 5003012 | 启动流代理失败 |
| 5003013 | 停止流代理失败 |

---

## 使用场景
>>> 代码没有参考性，只理解业务

### 场景1：海康摄像头接入

```javascript
// 1. 创建
const res1 = await fetch('/api/admin/stream-proxies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    name: '门口监控',
    type: 'pull',
    protocol: 'rtsp',
    source_url: 'rtsp://admin:Admin123@192.168.1.100:554/Streaming/Channels/101',
    media_server_id: '1'
  })
});
const proxy = await res1.json();

// 2. 启动
await fetch(`/api/admin/stream-proxies/${proxy.data.id}/start`, {
  method: 'POST',
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});

// 3. 获取播放地址
const res2 = await fetch(`/api/admin/stream-proxies/${proxy.data.id}/play-urls`, {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
});
const urls = await res2.json();

// 4. 播放
const flvPlayer = flvjs.createPlayer({ type: 'flv', url: urls.data.http_flv });
flvPlayer.attachMediaElement(videoElement);
flvPlayer.load();
flvPlayer.play();
```

### 场景2：大华摄像头接入

```javascript
// 大华RTSP地址格式不同
await fetch('/api/admin/stream-proxies', {
  method: 'POST',
  body: JSON.stringify({
    name: '停车场监控',
    type: 'pull',
    protocol: 'rtsp',
    source_url: 'rtsp://admin:Admin123@192.168.1.101:554/cam/realmonitor?channel=1&subtype=0',
    media_server_id: '1'
  })
});
```

### 场景3：OBS推流

```javascript
// 1. 创建推流代理
const res = await fetch('/api/admin/stream-proxies', {
  method: 'POST',
  body: JSON.stringify({
    name: 'OBS直播流',
    type: 'push',
    protocol: 'rtmp',
    media_server_id: '1'
  })
});
const proxy = await res.json();

// 2. OBS推流地址
const pushUrl = `rtmp://192.168.1.10:1935/push/${proxy.data.stream}`;
console.log('请在OBS中配置推流地址:', pushUrl);

// 3. 获取观看地址
const res2 = await fetch(`/api/admin/stream-proxies/${proxy.data.id}/play-urls`);
const urls = await res2.json();
console.log('观看地址(HLS):', urls.data.hls);
```

---

## 常用RTSP地址格式

### 海康威视
```
主码流: rtsp://admin:密码@IP:554/Streaming/Channels/101
子码流: rtsp://admin:密码@IP:554/Streaming/Channels/102
```

### 大华
```
主码流: rtsp://admin:密码@IP:554/cam/realmonitor?channel=1&subtype=0
子码流: rtsp://admin:密码@IP:554/cam/realmonitor?channel=1&subtype=1
```

### 宇视
```
rtsp://admin:密码@IP:554/video1
```

---

## 注意事项

1. **认证**: 所有接口需要携带管理员Token
2. **端口访问**: 确保ZLM的端口可被前端访问
3. **播放器**: 推荐使用flv.js播放HTTP-FLV（延迟低）
4. **自动重连**: 启用后离线流会每60秒尝试重连
5. **健康检查**: 后台每30秒自动检查，也可手动触发
6. **录像**: 绑定录像计划后会根据时间段自动录像

---

**版本**: v1.0.0
**更新日期**: 2026-03-06
