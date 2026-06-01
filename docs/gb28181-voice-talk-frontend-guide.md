# GB28181 语音对讲前端对接文档

## 概述

本文档描述了前端如何对接 GB28181 语音对讲功能。前端通过 WebRTC 将麦克风音频推送到 ZLMediaKit，ZLM 转发到 GB28181 设备。

## 技术架构

```
┌─────────┐     API      ┌─────────┐     WebRTC      ┌──────┐
│ 前端    │ ──────────>  │ Webman  │ ─────────────>  │ ZLM  │
│ Browser │             │ API     │                  │      │
└─────────┘             └─────────┘                  └──┬───┘
                                                           │
                                                           │ RTP
                                                           ▼
                                                     ┌──────────┐
                                                     │ GB28181  │
                                                     │ 设备     │
                                                     └──────────┘
```

## 完整流程

### 1. 获取推流地址

前端首先调用 API 获取推流地址：

```http
GET /api/v2/gb28181/broadcast/{deviceId}/{channelId}?mode=talk
```

**请求参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| deviceId | string | 是 | 设备国标ID (20位) |
| channelId | string | 是 | 通道国标ID (20位) |
| mode | string | 否 | 模式: talk(对讲, 默认) / broadcast(广播) |

**响应示例：**

```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "session_id": "a1b2c3d4e5f6...",
    "streamInfo": {
      "app": "talk",
      "stream": "34020000001320000001_34020000001320000001",
      "rtc": "webrtc://192.168.1.100:8443/talk/34020000001320000001_34020000001320000001",
      "rtcs": "webrtcs://192.168.1.100:8443/talk/34020000001320000001_34020000001320000001",
      "rtsp": "rtsp://192.168.1.100:554/talk/34020000001320000001_34020000001320000001",
      "rtmp": "rtmp://192.168.1.100:1935/talk/34020000001320000001_34020000001320000001"
    },
    "codec": "PCMA",
    "app": "talk",
    "stream": "34020000001320000001_34020000001320000001",
    "status": "waiting_stream"
  }
}
```

### 2. 获取用户签名

ZLM 推流需要签名验证，前端需要先获取用户的 pushKey：

```http
GET /api/user/info
```

响应中包含 `pushKey` 字段。

### 3. 计算签名并拼接完整 URL

```javascript
const pushKey = userData.data.pushKey;
const sign = MD5(pushKey); // 使用 MD5 算法
const finalUrl = rtcUrl + '?sign=' + sign;
// 示例: webrtc://192.168.1.100:8443/talk/...?sign=abc123...
```

### 4. 初始化 WebRTC 推流

使用 WebRTC 将麦克风音频推送到 ZLM：

```javascript
// 前端代码示例
async function startVoiceTalk(deviceId, channelId) {
  try {
    // 1. 获取推流地址
    const response = await fetch(`/api/v2/gb28181/broadcast/${deviceId}/${channelId}?mode=talk`);
    const result = await response.json();

    if (result.code !== 0) {
      throw new Error(result.msg || '获取推流地址失败');
    }

    const { session_id, streamInfo } = result.data;

    // 2. 获取用户签名
    const userResponse = await fetch('/api/user/info');
    const userData = await userResponse.json();
    const pushKey = userData.data.pushKey;
    const sign = MD5(pushKey);

    // 3. 拼接完整 URL
    const rtcUrl = streamInfo.rtc + '?sign=' + sign;

    // 4. 初始化 WebRTC 推流
    const rtc = new ZLMRTCClient.Endpoint({
      zlmsdpUrl: rtcUrl,
      audioEnable: true,
      videoEnable: false,
      recvOnly: false,
    });

    // 监听连接状态
    rtc.on(ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state) => {
      console.log('WebRTC 状态:', state);
      if (state === 'connected') {
        console.log('语音对讲已连接');
        // 更新 UI：显示"正在对讲"状态
      } else if (state === 'disconnected' || state === 'failed') {
        console.log('语音对讲已断开');
        // 更新 UI：显示"对讲结束"状态
      }
    });

    // 保存 rtc 实例用于后续停止推流
    window.voiceTalkRtc = rtc;
    window.voiceTalkSessionId = session_id;

    return { success: true, sessionId: session_id };

  } catch (error) {
    console.error('启动语音对讲失败:', error);
    throw error;
  }
}
```

### 5. 停止语音对讲

```javascript
async function stopVoiceTalk() {
  // 1. 关闭 WebRTC 连接
  if (window.voiceTalkRtc) {
    window.voiceTalkRtc.close();
    window.voiceTalkRtc = null;
  }

  // 2. 通知服务器停止会话
  if (window.voiceTalkSessionId) {
    await fetch('/api/v2/gb28181/broadcast/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: window.voiceTalkSessionId })
    });
    window.voiceTalkSessionId = null;
  }

  console.log('语音对讲已停止');
}
```

### 6. 查询会话状态

```javascript
async function getVoiceTalkStatus(sessionId) {
  const response = await fetch(`/api/v2/gb28181/broadcast/session/${sessionId}`);
  const result = await response.json();

  if (result.code === 0) {
    console.log('会话状态:', result.data.status);
    // status: waiting_stream | stream_arrived | inviting | established | ended | failed
  }

  return result.data;
}
```

## API 端点汇总

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/v2/gb28181/broadcast/{deviceId}/{channelId} | 获取推流地址 |
| POST | /api/v2/gb28181/broadcast/stop | 停止语音对讲 |
| GET | /api/v2/gb28181/broadcast/session/{id} | 查询会话详情 |
| GET | /api/user/info | 获取用户信息（含 pushKey） |

## 会话状态说明

| 状态 | 说明 |
|------|------|
| waiting_stream | 等待前端推流到达 |
| stream_arrived | 前端推流已到达，正在发送 INVITE 到设备 |
| inviting | 已发送 INVITE 到设备，等待设备响应 |
| established | 会话已建立，音频正在传输 |
| ended | 会话已正常结束 |
| failed | 会话失败 |

## 完整的前端示例

```html
<!DOCTYPE html>
<html>
<head>
  <title>GB28181 语音对讲</title>
  <script src="https://cdn.jsdelivr.net/npm/zlm-webrtc@1.0.0/dist/ZLMRTCClient.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/md5@2.3.0/md5.min.js"></script>
</head>
<body>
  <div>
    <h3>GB28181 语音对讲</h3>
    <div>
      <label>设备ID:</label>
      <input type="text" id="deviceId" value="34020000001320000001" />
    </div>
    <div>
      <label>通道ID:</label>
      <input type="text" id="channelId" value="34020000001320000001" />
    </div>
    <div>
      <button onclick="startTalk()">开始对讲</button>
      <button onclick="stopTalk()">停止对讲</button>
    </div>
    <div id="status">状态: 未连接</div>
  </div>

  <script>
    let rtc = null;
    let sessionId = null;

    async function startTalk() {
      const deviceId = document.getElementById('deviceId').value;
      const channelId = document.getElementById('channelId').value;

      try {
        updateStatus('正在获取推流地址...');

        // 1. 获取推流地址
        const response = await fetch(`/api/v2/gb28181/broadcast/${deviceId}/${channelId}?mode=talk`);
        const result = await response.json();

        if (result.code !== 0) {
          throw new Error(result.msg || '获取推流地址失败');
        }

        sessionId = result.data.session_id;
        updateStatus('获取推流地址成功，正在连接...');

        // 2. 获取用户签名
        const userResponse = await fetch('/api/user/info');
        const userData = await userResponse.json();
        const pushKey = userData.data.pushKey;
        const sign = md5(pushKey);

        // 3. 拼接完整 URL
        const rtcUrl = result.data.streamInfo.rtc + '?sign=' + sign;

        // 4. 初始化 WebRTC 推流
        rtc = new ZLMRTCClient.Endpoint({
          zlmsdpUrl: rtcUrl,
          audioEnable: true,
          videoEnable: false,
          recvOnly: false,
        });

        rtc.on(ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state) => {
          console.log('WebRTC 状态:', state);
          if (state === 'connected') {
            updateStatus('正在对讲...');
          } else if (state === 'disconnected') {
            updateStatus('已断开');
          } else if (state === 'failed') {
            updateStatus('连接失败');
          }
        });

        updateStatus('正在建立连接...');

      } catch (error) {
        console.error('启动语音对讲失败:', error);
        updateStatus('错误: ' + error.message);
      }
    }

    async function stopTalk() {
      // 1. 关闭 WebRTC
      if (rtc) {
        rtc.close();
        rtc = null;
      }

      // 2. 通知服务器停止会话
      if (sessionId) {
        await fetch('/api/v2/gb28181/broadcast/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        sessionId = null;
      }

      updateStatus('已停止');
    }

    function updateStatus(text) {
      document.getElementById('status').textContent = '状态: ' + text;
    }
  </script>
</body>
</html>
```

## 注意事项

1. **推流鉴权**：必须使用 `MD5(pushKey)` 计算签名，否则 ZLM 会拒绝推流
2. **音频编码**：ZLM 会自动将 WebRTC 音频转码为 PCMA/8000 (G.711 A-law)
3. **仅音频**：语音对讲不需要视频，设置 `videoEnable: false`
4. **主动断开**：用户离开页面时务必调用 `stopTalk()` 停止推流
5. **会话复用**：同一设备/通道的重复请求会返回现有会话，前端需要处理

## 测试流程

1. 确保 GB28181 设备在线
2. 点击"开始对讲"按钮
3. 浏览器会请求麦克风权限，允许后开始推流
4. 观察控制台日志，确认连接建立
5. 对着麦克风说话，设备端应该能听到声音
6. 点击"停止对讲"结束会话

## 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 推流被拒绝 | 签名错误 | 检查 pushKey 是否正确获取，MD5 计算是否正确 |
| 连接超时 | ZLM 不可达 | 检查 ZLM 服务是否运行，防火墙是否开放 |
| 设备无声音 | 设备未响应 | 检查设备是否在线，是否支持语音对讲 |
| 权限被拒绝 | 麦克风权限 | 检查浏览器麦克风权限设置 |
