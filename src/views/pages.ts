/**
 * 视图组件映射表
 * 集中管理所有页面组件的动态导入
 * 参考 Vue2 的 pages.js 设计模式
 */

// 错误页面
const NotFoundPage = () => import('@/views/error/NotFound.vue')

/**
 * 组件映射表
 * key: 组件名称（从菜单配置中引用）
 * value: 组件的动态导入函数
 */
export const pages: Record<string, () => Promise<any>> = {
  // 仪表盘
  'Dashboard': () => import('@/views/Dashboard.vue'),

  // 系统监控相关
  'SystemMonitor': () => import('@/views/monitor/SystemMonitor.vue'),
  'SystemStats': () => import('@/views/monitor/SystemStats.vue'),
  'ZLMStats': () => import('@/views/monitor/ZLMStats.vue'),
  'DeviceStats': () => import('@/views/monitor/DeviceStats.vue'),

  // 流媒体管理
  'MediaServerList': () => import('@/views/media/MediaServerList.vue'),
  'MediaServerConfig': () => import('@/views/media/MediaServerConfig.vue'),

  // 设备管理
  'DeviceList': () => import('@/views/device/DeviceList.vue'),
  'ChannelList': () => import('@/views/device/ChannelList.vue'),

  // 云台控制
  'PTZControl': () => import('@/views/ptz/PTZControl.vue'),

  // 视频管理
  'VideoManagement': () => import('@/views/video/VideoManagement.vue'),
  'VideoPlayback': () => import('@/views/video/VideoPlayback.vue'),
  'VideoTimeline': () => import('@/views/video/VideoTimeline.vue'),
  'RecordingsList': () => import('@/views/video/RecordingsList.vue'),
  'VideoPlayer': () => import('@/views/video/VideoPlayer.vue'),
  'VideoPlaza': () => import('@/views/video/VideoPlaza.vue'),
  'RecordPlanList': () => import('@/views/video/RecordPlanList.vue'),

  // 报警管理
  'AlarmManagement': () => import('@/views/alarms/AlarmManagement.vue'),

  // 电子地图
  'ElectronicMap': () => import('@/views/map/ElectronicMap.vue'),

  // 系统管理
  'SystemLogs': () => import('@/views/system/SystemLogs.vue'),
  'SystemSettings': () => import('@/views/system/setting/index.vue'),
  'ZLMConfig': () => import('@/views/system/ZLMConfig.vue'),
  'AttachmentList': () => import('@/views/system/AttachmentList.vue'),

  // 权限管理
  'UserManagement': () => import('@/views/permission/UserManagement.vue'),
  'MenuManagement': () => import('@/views/permission/MenuManagement.vue'),
  'RoleManagement': () => import('@/views/permission/RoleManagement.vue'),

  // 404 降级页面
  '404-page': NotFoundPage
}

/**
 * 获取组件导入函数
 * @param componentName 组件名称
 * @returns 组件导入函数，如果未找到则返回 404 页面
 */
export function getComponent(componentName: string): () => Promise<any> {
  return pages[componentName] || pages['404-page']
}

export default pages
