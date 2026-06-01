# 前端 API 配置文档

本文档描述前端项目的 API 配置和路由映射关系。

---

## 1. 环境配置

### .env 文件配置
```bash
VITE_MOCK_ENABLED=false
VITE_APP_TITLE=PHP-GB28181
VITE_AMAP_KEY=YOUR_AMAP_KEY_HERE
VITE_API_BASE_URL=/api
```

### Vite Proxy 配置

**文件**: `vite.config.ts`

```typescript
server: {
  port: 3230,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8886',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

**请求流程**:
1. 前端请求: `/api/admin/auth/login`
2. Vite Proxy 重写为: `/admin/auth/login`
3. 转发到后端: `http://127.0.0.1:8886/admin/auth/login`

---

## 2. API 模块映射

### 2.1 认证模块 (authApi)

**文件**: `src/api/authApi.ts`

| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 登录 | `POST /admin/auth/login` | `/api/admin/auth/login` |
| 退出 | `POST /admin/auth/logout` | `/api/admin/auth/logout` |
| 验证码 | `GET /admin/auth/captcha` | `/api/admin/auth/captcha` |

### 2.2 GB28181 设备管理 (gb28181Api)

**文件**: `src/api/gb28181Api.ts`

| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 设备列表 | `GET /admin/gb28181/devices` | `/api/admin/gb28181/devices` |
| 设备详情 | `GET /admin/gb28181/devices/{id}` | `/api/admin/gb28181/devices/{id}` |
| 删除设备 | `DELETE /admin/gb28181/devices/{id}` | `/api/admin/gb28181/devices/{id}` |
| 查询目录 | `POST /admin/gb28181/devices/{id}/catalog` | `/api/admin/gb28181/devices/{id}/catalog` |
| 通道列表 | `GET /admin/gb28181/channels/{deviceId}` | `/api/admin/gb28181/channels/{deviceId}` |
| PTZ 控制 | `POST /admin/gb28181/ptz` | `/api/admin/gb28181/ptz` |
| 开始直播 | `POST /admin/gb28181/streams/start-live` | `/api/admin/gb28181/streams/start-live` |
| 停止直播 | `POST /admin/gb28181/streams/stop-live` | `/api/admin/gb28181/streams/stop-live` |
| 播放地址 | `GET /admin/gb28181/streams/play-urls` | `/api/admin/gb28181/streams/play-urls` |
| 录像列表 | `GET /admin/gb28181/recordings` | `/api/admin/gb28181/recordings` |
| 开始录像 | `POST /admin/gb28181/recordings/start-record` | `/api/admin/gb28181/recordings/start-record` |
| 停止录像 | `POST /admin/gb28181/recordings/stop-record` | `/api/admin/gb28181/recordings/stop-record` |
| 抓拍快照 | `POST /admin/gb28181/recordings/snapshot` | `/api/admin/gb28181/recordings/snapshot` |

### 2.3 告警管理 (alarmApi)

**文件**: `src/api/alarmApi.ts`

| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 告警列表 | `GET /admin/gb28181/alarms` | `/api/admin/gb28181/alarms` |
| 告警详情 | `GET /admin/gb28181/alarms/{id}` | `/api/admin/gb28181/alarms/{id}` |
| 更新告警 | `PUT /admin/gb28181/alarms/{id}` | `/api/admin/gb28181/alarms/{id}` |

### 2.4 系统管理 (systemApi)

**文件**: `src/api/systemApi.ts`

#### 系统设置
| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 获取配置 | `GET /admin/setting/view/{key}` | `/api/admin/setting/view/{key}` |
| 保存基础配置 | `POST /admin/setting/basic` | `/api/admin/setting/basic` |
| 保存附件配置 | `POST /admin/setting/attachment` | `/api/admin/setting/attachment` |
| 保存安全配置 | `POST /admin/setting/auth` | `/api/admin/setting/auth` |
| 保存存储配置 | `POST /admin/setting/storage` | `/api/admin/setting/storage` |
| 保存CDN配置 | `POST /admin/setting/cdn` | `/api/admin/setting/cdn` |
| 保存邮件配置 | `POST /admin/setting/mail` | `/api/admin/setting/mail` |
| 保存VIP配置 | `POST /admin/setting/vip` | `/api/admin/setting/vip` |
| 保存IP名单 | `POST /admin/setting/ip-check-list` | `/api/admin/setting/ip-check-list` |
| 附件选项 | `GET /admin/setting/attachment/options` | `/api/admin/setting/attachment/options` |

#### 系统日志
| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 日志列表 | `GET /admin/system/log` | `/api/admin/system/log` |
| 日志详情 | `GET /admin/system/log/{id}` | `/api/admin/system/log/{id}` |
| 批量删除 | `POST /admin/system/log/btch-dlt` | `/api/admin/system/log/btch-dlt` |
| 模块选项 | `GET /admin/system/log/modules` | `/api/admin/system/log/modules` |
| 操作选项 | `GET /admin/system/log/actions/{module}` | `/api/admin/system/log/actions/{module}` |
| 导出日志 | `GET /admin/system/logs/export` | `/api/admin/system/logs/export` |

#### 系统监控
| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 系统统计 | `GET /admin/system/stats` | `/api/admin/system/stats` |
| 设备统计 | `GET /admin/system/device-stats` | `/api/admin/system/device-stats` |
| ZLM统计 | `GET /admin/system/zlm-stats` | `/api/admin/system/zlm-stats` |
| CPU使用 | `GET /admin/system/cpu-usage` | `/api/admin/system/cpu-usage` |
| 内存使用 | `GET /admin/system/memory-usage` | `/api/admin/system/memory-usage` |
| 网络统计 | `GET /admin/system/network-stats` | `/api/admin/system/network-stats` |
| 磁盘统计 | `GET /admin/system/disk-stats` | `/api/admin/system/disk-stats` |
| 测试邮件 | `POST /admin/system/test-mail` | `/api/admin/system/test-mail` |

#### ZLM 配置
| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 获取配置 | `GET /admin/setting/zlm/get` | `/api/admin/setting/zlm/get` |
| 保存配置 | `POST /admin/setting/zlm/set` | `/api/admin/setting/zlm/set` |
| 重置配置 | `POST /admin/setting/zlm/reset` | `/api/admin/setting/zlm/reset` |
| 重启服务 | `POST /admin/setting/zlm/restart` | `/api/admin/setting/zlm/restart` |

**ZLM 配置数据结构**:
```typescript
{
  api: { apiDebug, defaultSnap, downloadRoot, secret, snapRoot },
  cluster: { origin_url, retry_count, timeout_sec },
  ffmpeg: { bin, cmd, log, restart_sec, snap },
  general: { mediaServerId, listen_ip, maxStreamWaitMS, ... },
  hls: { segNum, segDur, segRetain, ... },
  hook: { enable, alive_interval, on_flow_report, on_publish, ... },
  http: { port, sslport, rootPath, allow_cross_domains, ... },
  multicast: { addrMin, addrMax, udpTTL },
  onvif: { port },
  protocol: { enable_rtsp, enable_rtmp, enable_hls, ... },
  record: { appName, enableFmp4, sampleMS, ... },
  rtc: { port, tcpPort, signalingPort, icePort, ... },
  rtmp: { port, sslport, handshakeSecond, ... },
  rtp: { audioMtuSize, videoMtuSize, rtpMaxSize },
  rtp_proxy: { port, port_range, timeoutSec, gop_cache, ... },
  rtsp: { port, sslport, handshakeSecond, ... },
  shell: { maxReqSize, port },
  srt: { port, timeoutSec, latencyMul, ... }
}
```

### 2.5 系统监控 (monitorApi)

**文件**: `src/api/monitorApi.ts`

| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 系统统计 | `GET /admin/system/stats` | `/api/admin/system/stats` |
| 设备统计 | `GET /admin/system/device-stats` | `/api/admin/system/device-stats` |
| ZLM统计 | `GET /admin/system/zlm-stats` | `/api/admin/system/zlm-stats` |
| CPU使用 | `GET /admin/system/cpu-usage` | `/api/admin/system/cpu-usage` |
| 内存使用 | `GET /admin/system/memory-usage` | `/api/admin/system/memory-usage` |
| 网络统计 | `GET /admin/system/network-stats` | `/api/admin/system/network-stats` |
| 磁盘统计 | `GET /admin/system/disk-stats` | `/api/admin/system/disk-stats` |

### 2.6 电子地图 (mapApi)

**文件**: `src/api/mapApi.ts`

| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 设备位置 | `GET /admin/gb28181/map/devices` | `/api/admin/gb28181/map/devices` |
| 更新位置 | `PUT /admin/gb28181/map/devices/{id}/position` | `/api/admin/gb28181/map/devices/{id}/position` |

### 2.7 权限管理 (permissionApi)

**文件**: `src/api/permissionApi.ts`

| 功能 | 前端请求 | 后端路由 |
|------|----------|----------|
| 用户列表 | `GET /admin/permission/users` | `/api/admin/permission/users` |
| 创建用户 | `POST /admin/permission/users` | `/api/admin/permission/users` |
| 角色列表 | `GET /admin/permission/roles` | `/api/admin/permission/roles` |
| 菜单列表 | `GET /admin/permission/menus` | `/api/admin/permission/menus` |

---

## 3. HTTP 客户端配置

**文件**: `src/utils/request.ts`

### 请求拦截器
- 自动添加 JWT Token
- 请求取消队列管理
- 支持公开请求 (X-Public header)

### 响应拦截器
- **自动数据提取**: 当后端返回 `code: 0` 时，自动提取 `response.data` 并返回
- **JWT 自动续签**: 从响应头获取新 Token 并更新
- **统一错误处理**: 非 `code: 0` 的响应自动抛出异常
- **401 自动跳转登录**: Token 失效时自动清除并跳转登录页

**核心逻辑** (`src/utils/request.ts:106-108`):
```typescript
if (res?.code === 0) {
  renewJwtToken(response)
  return res.data  // 自动提取并返回 data 字段
}
```

---

## 4. API 响应处理最佳实践

### 4.1 响应数据结构

后端统一返回格式:
```json
{
  "code": 0,
  "data": { /* 实际数据 */ },
  "message": "success"
}
```

### 4.2 组件中的标准处理模式

由于响应拦截器已自动提取 `data` 字段，组件中应直接使用返回数据，**不要**再次访问 `.data` 属性。

#### ❌ 错误写法
```typescript
const response = await systemApi.getZLMConfig()
if (response?.data) {  // ❌ 多此一举，response 已经是 data
  const config = response.data
}
```

#### ✅ 正确写法
```typescript
// API 响应拦截器已自动提取 response.data (src/utils/request.ts:106-108)
const data = await systemApi.getZLMConfig()
if (data) {
  apiForm.value = { ...apiForm.value, ...data.api }
}
```

### 4.3 完整示例：ZLMConfig 组件

**文件**: `src/views/system/ZLMConfig.vue`

```typescript
// 加载配置
const loadConfig = async () => {
  loading.value = true
  try {
    // API 响应拦截器已自动提取 response.data
    // 当 code === 0 时，直接返回 res.data
    const data = await systemApi.getZLMConfig()

    if (data) {
      apiForm.value = { ...apiForm.value, ...data.api }
      ffmpegForm.value = { ...ffmpegForm.value, ...data.ffmpeg }
      hookForm.value = { ...hookForm.value, ...data.hook }
    }
  } catch (error: any) {
    console.error('Failed to load ZLM config:', error)
    ElMessage.error(error.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  saving.value = true
  try {
    const payload = {
      api: apiForm.value,
      ffmpeg: ffmpegForm.value,
      hook: hookForm.value
    }

    // API 响应拦截器已自动提取 response.data
    // 保存成功时返回数据，失败时抛出异常
    await systemApi.saveZLMConfig(payload)
    ElMessage.success('保存成功')
  } catch (error: any) {
    console.error('Failed to save ZLM config:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}
```

### 4.4 错误处理模式

```typescript
try {
  const data = await someApi.getData()
  // 成功：data 已经是实际数据
  processData(data)
} catch (error) {
  // 失败：error.code 和 error.message 可用
  ElMessage.error(error.message || '操作失败')
}
```

### 4.5 文档注释规范

在组件中调用 API 时，建议添加以下注释说明响应处理方式:

```typescript
/**
 * 加载配置数据
 * API 响应拦截器已自动提取 response.data (src/utils/request.ts:106-108)
 * 当 code === 0 时，直接返回 res.data
 */
const loadData = async () => {
  const data = await api.getConfig()
  // ...
}
```

---

## 5. 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2025-12-30 | 更新 ZLMConfig.vue 组件，完整对接后端 ZLM 配置接口 (18个配置模块) |
| 2025-12-30 | 更新 ZLM API 接口路径: `/admin/setting/zlm/*` |
| 2025-12-29 | 添加 API 响应处理最佳实践文档 (第 4 节) |
| 2025-12-29 | 更新 ZLMConfig.vue 组件使用正确的响应处理模式 |
| 2024-12-29 | 更新所有 API 路由为 `/api/admin/...` 前缀 |
| 2024-12-29 | 创建系统设置页面 (Vue3 + TypeScript) |
