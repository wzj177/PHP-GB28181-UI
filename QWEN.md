# Vue3+TS+Vite 安防 UI 模板项目文档

## 项目概述

这是一个针对 PHP ExoSip 扩展实现的 GB28181 网关开发的安全 UI 模板。该项目基于 Vue3、TypeScript 和 Vite 构建，包含一套完整的监控系统组件，并提供实时演示。可作为构建集成视频管理功能的安防应用程序的模板。

### 核心功能
- **云台控制**: 设备树及通道列表，多屏回放（1、4、6、9 屏布局），集成云台控制面板，支持方向控制、缩放、预置位管理和语音对讲
- **视频回放**: 基于时间从 NVR/IPC 检索录像，可视化时间轴，支持录像下载
- **报警管理**: 报警列表显示，状态处理（激活、确认、清除），分页和筛选
- **电子地图**: 集成 AMap（高德地图），显示设备位置，点击播放视频模态窗口

### 技术栈
- Vue 3（组件 API）
- TypeScript
- Vite（构建工具）
- Vue Router
- Pinia（状态管理）
- Element Plus（UI 组件库）
- Axios（HTTP 客户端）
- Mock.js（数据模拟）
- Vue3-Amap（地图集成）

### 项目结构
```
src/
├── api/                 # API 接口
├── assets/             # 静态资源
├── components/         # 共享组件
│   ├── layout/         # 布局组件
│   └── ptz/           # 云台控制组件
├── mock/              # 模拟数据
├── router/            # 路由配置
├── stores/            # Pinia 状态管理
├── styles/            # 全局 SCSS 变量和 mixin
├── utils/             # 实用函数
└── views/             # 页面组件
    ├── alarms/        # 报警管理页面
    ├── map/           # 电子地图页面
    ├── ptz/           # 云台控制页面
    └── video/         # 视频播放页面
```

## 构建和运行

### 依赖安装
```bash
pnpm install
```

### 环境配置
```bash
cp .env.example .env
```

配置环境变量：
```
VITE_APP_TITLE=PHP-GB28181
VITE_AMAP_KEY=xxxx  # 获取高德地图密钥
```

### 开发模式
```bash
pnpm dev
```
开发服务器将在 `http://localhost:3230` 上运行，默认用户名/密码: admin/123456

### 生产构建
```bash
pnpm build
```

### 预览生产构建
```bash
pnpm preview
```

### 类型检查
```bash
pnpm type-check
```

## 开发约定

### 代码风格
- 使用 TypeScript 进行类型安全编程
- 遵循 ESLint 和 Prettier 代码规范（虽然未明确配置文件显示，但通常在 Vue3+TS 项目中会使用）
- 使用 Vue 3 Composition API 和 `<script setup>` 语法糖

### 组件结构
- 页面组件按功能模块组织在 `src/views` 目录中
- 通用组件放在 `src/components` 目录
- 路由配置位于 `src/router/index.ts`
- 状态管理使用 Pinia，存储在 `src/stores` 目录

### API 管理
- 所有 API 请求封装在 `src/utils/request.ts` 文件中
- 使用 Axios 作为 HTTP 客户端
- 项目使用 Mock.js 模拟后端 API 数据

### 样式规范
- 使用 SCSS 预处理器
- 全局样式和主题变量位于 `src/styles/` 目录
- 使用 Element Plus UI 组件库

### 路由守卫
- 应用路由守卫检查认证状态 (token 存储在 cookie 中)
- 未认证用户将被重定向到登录页面

## 重要文件配置

### Vite 配置 (vite.config.ts)
- 端口设置为 3230
- 支持环境变量注入到 HTML 中
- 别名配置: `@` 映射到 `src` 目录

### TypeScript 配置 (tsconfig.json)
- 目标 ES2020
- 严格模式开启
- 支持 Vue 文件编译

### 项目依赖
主要依赖包括:
- Vue 3 (v3.5.12)
- Vue Router (v4.4.5)
- Pinia (状态管理)
- Element Plus (UI 框架)
- Axios (HTTP 客户端)
- Vue3-Amap (高德地图集成)

## 测试和验证

### Mock 数据设置
- 在 `src/mock/setup.ts` 中配置 Mock.js
- 模拟以下数据: 设备树、通道信息、云台控制命令、预设管理、录像检索、报警管理、地图设备数据等

### 开发注意事项
- 所有 API 请求都经过统一的请求拦截器处理
- 使用 VueUse 工具库提供常用的 Composition API 工具函数
- 组件间通信优先使用 Props 和 Emits

## 部署说明

构建后的静态文件可以部署到任何支持静态文件服务的服务器上。应用使用 History 模式路由，需要服务器配置以支持客户端路由。

## 许可证
MIT