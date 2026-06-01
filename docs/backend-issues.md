# 后端问题清单

## 问题：系统监控 API 返回 404

### 问题描述

前端调用系统监控相关接口时，后端返回 404 错误。

### 错误信息

```
GET http://127.0.0.1:8886/api/admin/system/device-stats 404 (Not Found)
GET http://127.0.0.1:8886/api/admin/system/stats 404 (Not Found)
GET http://127.0.0.1:8886/api/admin/system/zlm-stats 404 (Not Found)
```

### 前端配置

**环境变量** (`.env`)
```
VITE_API_BASE_URL=http://127.0.0.1:8886/admin
```

**API 调用** (`src/api/monitorApi.ts`)
```typescript
getSystemStats: () => {
  return request.get('/system/stats');
},
getDeviceStats: () => {
  return request.get('/system/device-stats');
},
getZLMediaKitStats: () => {
  return request.get('/system/zlm-stats');
}
```

**最终请求路径**
- `http://127.0.0.1:8886/api/admin/system/stats`
- `http://127.0.0.1:8886/api/admin/system/device-stats`
- `http://127.0.0.1:8886/api/admin/system/zlm-stats`

### 后端配置检查

#### 1. 路由列表确认

运行 `php webman route:list` 显示以下路由存在：

```
| /api/admin/system/stats           | GET  | SystemMonitoringController::getSystemStats
| /api/admin/system/device-stats    | GET  | SystemMonitoringController::getDeviceStats
| /api/admin/system/zlm-stats       | GET  | SystemMonitoringController::getZLMediaKitStats
```

#### 2. 路由配置文件

**文件**: `app/api/admin/config/routes/index.php`

```php
Route::group('/admin', function () {
    Route::group('/system', function () {
        Route::get('/stats', [SystemMonitoringController::class, 'getSystemStats'])->name('admin.api.system.stats');
        Route::get('/device-stats', [SystemMonitoringController::class, 'getDeviceStats'])->name('admin.api.system.device-stats');
        Route::get('/zlm-stats', [SystemMonitoringController::class, 'getZLMediaKitStats'])->name('admin.api.system.zlm-stats');
        // ...
    })->middleware([AuthIdentityMiddleware::class]);
});
```

#### 3. 控制器文件

**文件**: `app/api/admin/controller/SystemMonitoringController.php`

控制器已实现以下方法：
- `getSystemStats()` - 系统统计
- `getDeviceStats()` - 设备统计
- `getZLMediaKitStats()` - ZLMediaKit 统计

### 可能的原因

1. **Webman 服务未重启** - 路由配置可能未生效
2. **AuthIdentityMiddleware 拦截** - 认证中间件可能拒绝了请求
3. **控制器依赖问题** - `SystemService` 或 `ZLMClient` 可能未正确注入
4. **服务容器问题** - `getSystemService()` 或 `getZlmClient()` 方法可能失败

### 排查建议

1. **重启 Webman 服务**
   ```bash
   php /Users/jiechengyang/src/www/gbvr-iot/webman stop
   php /Users/jiechengyang/src/www/gbvr-iot/webman start
   ```

2. **检查认证中间件**
   - 确认请求携带正确的 Token
   - 检查 `AuthIdentityMiddleware` 是否正常工作

3. **查看错误日志**
   ```bash
   tail -f /Users/jiechengyang/src/www/gbvr-iot/runtime/logs/workerman.log
   ```

4. **测试接口**
   ```bash
   # 使用 curl 测试（需要携带认证 token）
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://127.0.0.1:8886/api/admin/system/stats
   ```

5. **检查依赖服务**
   - 确认 `SystemService` 是否正确配置
   - 确认 `ZLMediaKit` SDK 是否正确连接

---

## 前端状态总结

### 已完成

1. ✅ 修复 SCSS `lighten()` 废弃警告
2. ✅ 实现 `SystemStats.vue` 系统统计页面
3. ✅ 实现 `ZLMStats.vue` 流媒体网关统计页面
4. ✅ 实现 `DeviceStats.vue` 设备统计页面
5. ✅ 修复路由配置，子菜单正确加载
6. ✅ 404 页面移到 Layout 内部显示
7. ✅ 删除重复的 Mock 导出
8. ✅ 创建后端 API 接口文档 (`docs/api-stats.md`)

### 待后端处理

1. ⏳ 系统监控接口 404 问题排查
2. ⏳ 确认后端接口正常工作

---

## 接口文档

详细的接口规范请参考：`docs/api-stats.md`

主要接口：
- `GET /api/admin/system/stats` - 系统资源统计
- `GET /api/admin/system/device-stats` - 设备统计
- `GET /api/admin/system/zlm-stats` - ZLMediaKit 统计
