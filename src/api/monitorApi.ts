import request from '@/utils/request';

/**
 * 系统监控 API 服务
 * 对应后端路由：
 * GET /api/admin/system/stats - 系统资源统计
 * GET /api/admin/system/device-stats - 设备统计
 * GET /api/admin/system/zlm-stats - ZLMediaKit 统计
 * GET /api/admin/system/cpu-usage - CPU 使用详情
 * GET /api/admin/system/memory-usage - 内存使用详情
 * GET /api/admin/system/network-stats - 网络统计
 * GET /api/admin/system/disk-stats - 磁盘使用情况
 */
export const monitorApi = {
  /**
   * 获取系统资源使用情况（CPU、内存、磁盘、网络）
   * GET /api/admin/system/stats
   */
  getSystemStats: () => {
    return request.get('/admin/system/stats');
  },

  /**
   * 获取设备统计信息
   * GET /api/admin/system/device-stats
   */
  getDeviceStats: () => {
    return request.get('/admin/gb28181/device-stats');
  },

  /**
   * 获取 ZLMediaKit 流媒体网关统计
   * GET /api/admin/system/zlm-stats
   */
  getZLMediaKitStats: () => {
    return request.get('/admin/zlm/stats');
  },

  /**
   * 获取 CPU 使用详情
   * GET /api/admin/system/cpu-usage
   */
  getCpuUsage: () => {
    return request.get('/admin/system/cpu-usage');
  },

  /**
   * 获取内存使用详情
   * GET /api/admin/system/memory-usage
   */
  getMemoryUsage: () => {
    return request.get('/admin/system/memory-usage');
  },

  /**
   * 获取网络统计
   * GET /api/admin/system/network-stats
   */
  getNetworkStats: () => {
    return request.get('/admin/system/network-stats');
  },

  /**
   * 获取磁盘使用情况
   * GET /api/admin/system/disk-stats
   */
  getDiskStats: () => {
    return request.get('/admin/system/disk-stats');
  }
};

export default monitorApi;