# PHP-GB28181 安防监控管理平台

基于 Vue 3 + TypeScript + Vite 构建的 GB28181 视频监控系统前端，配合 PHP ExoSip 扩展后端，提供完整的安防监控管理界面。

## 功能模块

- **实时监控**：设备树及通道管理，多屏直播（1/4/6/9 分屏），云台控制（方向、缩放、预置位、巡航、语音对讲）
- **录像管理**：云端录像计划、录像文件管理、录像回放与下载、录像合并
- **设备管理**：国标设备管理、通道管理、设备统计、流媒体服务器管理
- **推拉流代理**：推拉流设备管理、流代理日志
- **报警管理**：报警计划配置、报警事件处理
- **电子地图**：高德地图集成，设备位置标注与视频联动
- **SIP 网关**：SIP 网关管理、设备绑定
- **系统管理**：系统日志、附件管理、系统设置
- **权限管理**：用户管理、角色管理、菜单管理（RBAC）

## 技术栈

- Vue 3.5 + Composition API + `<script setup>`
- TypeScript 5.6
- Vite 5.4
- Element Plus 2.8
- Pinia + Vue Router
- Axios
- Vue3-Amap（高德地图）
- Mock.js（开发环境数据模拟）

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 生产构建
pnpm build
```

开发服务器地址：`http://localhost:3230`
默认登录账号：`admin` / `qwe123456@vr`

## 环境变量

```bash
VITE_APP_TITLE=PHP-GB28181
VITE_AMAP_KEY=xxxx        # 高德地图 API Key
VITE_API_BASE_URL=/api    # API 基础路径
VITE_MOCK_ENABLED=true    # 启用 Mock 数据（开发环境）
```

## 许可证

MIT
