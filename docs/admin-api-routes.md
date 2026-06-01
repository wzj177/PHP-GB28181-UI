# 管理后台 API 路由文档

> 本文档列出管理后台（Admin）所有 API 接口，供前端开发参考。

**基础 URL**: `http://127.0.0.1:8886`

**认证**: 大部分接口需要在请求头中携带 Token
```
Authorization: Bearer {token}
```

---

## 1. 认证模块

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/auth/config` | GET | `admin.login_config` | 获取登录配置（验证码开关等） |
| `/api/admin/auth/login` | POST | `admin.login` | 管理员登录 |
| `/api/admin/auth/captcha` | GET | `admin.captcha` | 获取验证码图片 |
| `/api/admin/auth/logout` | POST | `admin.logout` | 退出登录 |

---

## 2. 系统监控模块 (System Monitoring)

### 2.1 系统资源统计

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/api/system/stats` | GET | `admin.api.system.stats` | 获取系统资源统计（CPU、内存、磁盘、网络） |
| `/api/admin/api/system/device-stats` | GET | `admin.api.system.device-stats` | 获取设备统计信息 |
| `/api/admin/api/system/zlm-stats` | GET | `admin.api.system.zlm-stats` | 获取 ZLMediaKit 流媒体网关统计 |

### 2.2 详细监控指标

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/api/system/cpu-usage` | GET | `admin.api.system.cpu-usage` | 获取 CPU 使用详情 |
| `/api/admin/api/system/memory-usage` | GET | `admin.api.system.memory-usage` | 获取内存使用详情 |
| `/api/admin/api/system/network-stats` | GET | `admin.api.system.network-stats` | 获取网络统计 |
| `/api/admin/api/system/disk-stats` | GET | `admin.api.system.disk-stats` | 获取磁盘使用情况 |

### 2.3 另一组监控接口（同上，不同路径）

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/system/stats` | GET | `system.stats` | 系统资源统计（同上） |
| `/api/admin/system/device-stats` | GET | `system.device-stats` | 设备统计（同上） |
| `/api/admin/system/zlm-stats` | GET | `system.zlm-stats` | ZLMediaKit 统计（同上） |
| `/api/admin/system/cpu-usage` | GET | `system.cpu-usage` | CPU 使用详情（同上） |
| `/api/admin/system/memory-usage` | GET | `system.memory-usage` | 内存使用详情（同上） |
| `/api/admin/system/network-stats` | GET | `system.network-stats` | 网络统计（同上） |
| `/api/admin/system/disk-stats` | GET | `system.disk-stats` | 磁盘使用情况（同上） |

---

## 3. 系统管理模块 (System Management)

### 3.1 系统日志

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/system/log` | GET | `system.logs` | 获取系统日志列表 |
| `/api/admin/system/log/{id}` | GET | `system.log` | 获取单条日志详情 |
| `/api/admin/system/log/btch-dlt` | POST | `system.log.batch-delete` | 批量删除日志 |
| `/api/admin/system/log/modules` | GET | `system.log.module-options` | 获取日志模块选项 |
| `/api/admin/system/log/actions/{module}` | GET | `system.log.action-options` | 获取指定模块的操作类型选项 |

### 3.2 系统操作

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/system/cache-clear` | POST | `system.cache-clear` | 清除系统缓存 |
| `/api/admin/system/test-mail` | POST | `system.test-mail` | 测试邮件发送 |

---

## 4. 用户菜单模块

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/user/menus` | GET | `user.menus` | 获取当前用户的菜单权限 |

---

## 5. 作品/产品模块 (Product)

### 5.1 产品分类 (Product Catalog)

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/product/catalog/tree` | GET | `product.catalog-tree` | 获取分类树形结构 |
| `/api/admin/product/catalog` | GET | `product-catalog.index` | 获取分类列表 |
| `/api/admin/product/catalog` | POST | `product-catalog.store` | 创建分类 |
| `/api/admin/product/catalog/{id}` | GET | `product-catalog.show` | 获取分类详情 |
| `/api/admin/product/catalog/{id}` | PUT | `product-catalog.update` | 更新分类 |
| `/api/admin/product/catalog/{id}` | DELETE | `product-catalog.destroy` | 删除分类 |
| `/api/admin/product/catalog/upd-sort/{id}` | POST | `product-catalog.upd-sort` | 更新分类排序 |
| `/api/admin/product/catalog/upd-status/{id}` | POST | `product-catalog.upd-status` | 更新分类状态 |

### 5.2 产品标签 (Product Tag)

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/product/tag/add` | POST | `product.tag-add` | 添加标签 |
| `/api/admin/product/tags` | GET | `product.tags` | 获取标签列表 |
| `/api/admin/product/tag/options` | GET | `product.tag-options` | 获取标签选项 |
| `/api/admin/product/tag/{id}` | DELETE | `product.tag-remove` | 删除标签 |
| `/api/admin/product/tag/batch-delete` | POST | `product.tag-batch-delete` | 批量删除标签 |

---

## 6. 附件管理模块 (Attachment)

### 6.1 附件分组 (Attachment Group)

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/attachment/group/trees` | GET | `attachment-group.trees` | 获取分组树形结构 |
| `/api/admin/attachment/group` | GET | `attachment-group.index` | 获取分组列表 |
| `/api/admin/attachment/group` | POST | `attachment-group.store` | 创建分组 |
| `/api/admin/attachment/group/{id}` | GET | `attachment-group.show` | 获取分组详情 |
| `/api/admin/attachment/group/{id}` | PUT | `attachment-group.update` | 更新分组 |
| `/api/admin/attachment/group/{id}` | DELETE | `attachment-group.destroy` | 删除分组 |
| `/api/admin/attachment/group/removes` | POST | `attachment-group.removes` | 批量删除分组 |

### 6.2 文件上传

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/attachment/upload` | POST | `attachment.upload` | 单文件上传 |
| `/api/admin/attachment/uploads` | POST | `attachment.uploads` | 多文件上传 |
| `/api/admin/attachment/upload/base64-img` | POST | `attachment.upload-base64-img` | Base64 图片上传 |
| `/api/admin/attachment/upload/remote-file` | POST | `attachment.upload-remote-file` | 远程文件上传 |

### 6.3 分片上传

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/attachment/snippet/check/{hash}` | GET | `attachment.snippet.check` | 检查分片是否已上传 |
| `/api/admin/attachment/snippet/upload` | POST | `attachment.snippet.upload` | 上传分片 |
| `/api/admin/attachment/snippet/merge` | POST | `attachment.snippet.merge` | 合并分片文件 |

### 6.4 附件管理

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/attachment/index` | GET | `attachment.list` | 获取附件列表 |
| `/api/admin/attachment/view/{id}` | GET | `attachment.view` | 查看附件详情 |
| `/api/admin/attachment/download/{id}` | GET | `attachment.download` | 下载附件 |
| `/api/admin/attachment/config` | GET | `attachment.config` | 获取上传配置 |
| `/api/admin/attachment/type-options` | GET | `attachment.type-options` | 获取附件类型选项 |
| `/api/admin/attachment/move-group` | POST | `attachment.map-group` | 移动附件到其他分组 |
| `/api/admin/attachment/{id}` | DELETE | `attachment.delete` | 删除附件 |
| `/api/admin/attachment/deletes` | POST | `attachment.deletes` | 批量删除附件 |

---

## 7. 系统设置模块 (Setting)

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/setting/view/{key}` | GET | `setting.get` | 获取设置项值 |
| `/api/admin/setting/basic` | POST | `setting.basic` | 保存基本设置 |
| `/api/admin/setting/auth` | POST | `setting.auth` | 保存认证设置 |
| `/api/admin/setting/attachment` | POST | `setting.attachment` | 保存附件设置 |
| `/api/admin/setting/storage` | POST | `setting.storage` | 保存存储设置 |
| `/api/admin/setting/cdn` | POST | `setting.cdn` | 保存 CDN 设置 |
| `/api/admin/setting/mail` | POST | `setting.mail` | 保存邮件设置 |
| `/api/admin/setting/ip-check-list` | POST | `setting.ip-check-list` | 保存 IP 检查列表 |
| `/api/admin/setting/vip` | POST | `setting.vip` | 保存会员设置 |
| `/api/admin/setting/attachment/options` | GET | `setting.attachment.options` | 获取附件选项 |
| `/api/admin/setting/vr` | POST | `setting.vr` | 保存 VR 设置 |

---

## 8. GB28181 设备管理模块

### 8.1 设备管理

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/devices` | GET | `admin.gb28181.devices.index` | 获取 GB28181 设备列表 |
| `/api/admin/gb28181/devices/{deviceId}` | GET | `admin.gb28181.devices.show` | 获取设备详情 |
| `/api/admin/gb28181/devices/{deviceId}` | DELETE | `admin.gb28181.devices.destroy` | 删除设备 |
| `/api/admin/gb28181/devices/{deviceId}/catalog` | POST | `admin.gb28181.devices.query-catalog` | 查询设备目录（通道） |

### 8.2 通道管理

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/channels/{deviceId}` | GET | `admin.gb28181.channels.index` | 获取设备通道列表 |
| `/api/admin/gb28181/channels/{deviceId}/channel/{channelId}` | GET | `admin.gb28181.channels.show` | 获取通道详情 |

### 8.3 云台控制 (PTZ)

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/ptz` | POST | `admin.gb28181.ptz.control` | PTZ 云台控制 |

### 8.4 流媒体控制

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/streams/start-live` | POST | `admin.gb28181.streams.start-live` | 开始直播（拉流） |
| `/api/admin/gb28181/streams/stop-live` | POST | `admin.gb28181.streams.stop-live` | 停止直播 |
| `/api/admin/gb28181/streams/play-urls` | GET | `admin.gb28181.streams.play-urls` | 获取播放地址 |
| `/api/admin/gb28181/streams/playback` | POST | `admin.gb28181.streams.start-playback` | 开始回放 |

### 8.5 录像管理

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/recordings` | GET | `admin.gb28181.recordings.index` | 获取录像列表 |
| `/api/admin/gb28181/recordings/start-record` | POST | `admin.gb28181.recordings.start-record` | 开始录像 |
| `/api/admin/gb28181/recordings/stop-record` | POST | `admin.gb28181.recordings.stop-record` | 停止录像 |
| `/api/admin/gb28181/recordings/snapshot` | POST | `admin.gb28181.recordings.snapshot` | 抓拍快照 |

### 8.6 告警管理

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/alarms` | GET | `admin.gb28181.alarms.index` | 获取告警列表 |
| `/api/admin/gb28181/alarms/{id}` | GET | `admin.gb28181.alarms.show` | 获取告警详情 |
| `/api/admin/gb28181/alarms/{id}` | PUT | `admin.gb28181.alarms.update` | 更新告警状态 |

### 8.7 地图管理

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/map/devices` | GET | `admin.gb28181.map.devices` | 获取地图设备列表 |
| `/api/admin/gb28181/map/devices/{id}/position` | PUT | `admin.gb28181.map.update-position` | 更新设备位置 |

### 8.8 系统监控（GB28181专用）

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/admin/gb28181/system/device-stats` | GET | `admin.gb28181.system.device-stats` | GB28181 设备统计 |
| `/api/admin/gb28181/system/stats` | GET | `admin.gb28181.system.stats` | GB28181 系统统计 |

---

## 9. 公共 API（给前端直接调用）

| 路由 | 方法 | 路由名称 | 用途 |
|------|------|----------|------|
| `/api/system/stats` | GET | `api.system.stats` | 系统资源统计 |
| `/api/system/device-stats` | GET | `api.system.device-stats` | 设备统计 |
| `/api/system/zlm-stats` | GET | `api.system.zlm-stats` | ZLMediaKit 统计 |

---

## 中间件说明

### AuthIdentityMiddleware
需要认证的接口会使用此中间件，请求时需携带 Token：

```javascript
// 示例
headers: {
  'Authorization': 'Bearer ' + token
}
```

---

## 更新日志

- 2024-12-26: 初始版本，包含所有管理后台路由
