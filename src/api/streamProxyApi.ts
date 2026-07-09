import request from '@/utils/request'

/**
 * 推拉流代理 API
 * 对应后端路由：/admin/stream-proxies
 */
export const streamProxyApi = {
  /**
   * 获取列表
   * GET /admin/stream-proxies
   */
  getList: (params?: {
    status?: string
    type?: string
    protocol?: string
    media_server_id?: string
    record_plan_id?: number
    keyword?: string
    sort?: string
    start?: number
    page_size?: number
  }) => {
    return request.get('/admin/stream-proxies', { params })
  },

  /**
   * 获取统计摘要
   * GET /admin/stream-proxies/summary
   */
  getSummary: () => {
    return request.get('/admin/stream-proxies/summary')
  },

  /**
   * 获取详情
   * GET /admin/stream-proxies/{id}
   */
  getDetail: (id: number) => {
    return request.get(`/admin/stream-proxies/${id}`)
  },

  /**
   * 创建流代理
   * POST /admin/stream-proxies
   */
  create: (data: {
    name: string
    type: 'pull' | 'push'
    protocol: 'rtsp' | 'rtmp' | 'http-flv'
    source_url?: string
    media_server_id: string
    stream?: string
    description?: string
    tags?: string[]
    enable_auto_reconnect?: number
    max_retry_count?: number
    timeout_sec?: number
    rtp_type?: number
    enable_hls?: number
    enable_mp4?: number
  }) => {
    return request.post('/admin/stream-proxies', data)
  },

  /**
   * 更新流代理
   * PUT /admin/stream-proxies/{id}
   */
  update: (id: number, data: {
    name?: string
    source_url?: string
    description?: string
    tags?: string[]
    enable_auto_reconnect?: number
    max_retry_count?: number
    timeout_sec?: number
    rtp_type?: number
    enable_hls?: number
    enable_mp4?: number
  }) => {
    return request.put(`/admin/stream-proxies/${id}`, data)
  },

  /**
   * 删除流代理
   * DELETE /admin/stream-proxies/{id}
   */
  delete: (id: number) => {
    return request.delete(`/admin/stream-proxies/${id}`)
  },

  /**
   * 启动流代理
   * POST /admin/stream-proxies/{id}/start
   */
  start: (id: number) => {
    return request.post(`/admin/stream-proxies/${id}/start`)
  },

  /**
   * 停止流代理
   * POST /admin/stream-proxies/{id}/stop
   */
  stop: (id: number) => {
    return request.post(`/admin/stream-proxies/${id}/stop`)
  },

  /**
   * 重启流代理
   * POST /admin/stream-proxies/{id}/restart
   */
  restart: (id: number) => {
    return request.post(`/admin/stream-proxies/${id}/restart`)
  },

  /**
   * 获取播放地址
   * GET /admin/stream-proxies/{id}/play-urls
   */
  getPlayUrls: (id: number) => {
    return request.get(`/admin/stream-proxies/${id}/play-urls`)
  },

  /**
   * 获取推流地址（推流代理，用于配置 OBS / FFmpeg）
   * GET /admin/stream-proxies/{id}/push-url
   */
  getPushUrl: (id: number) => {
    return request.get(`/admin/stream-proxies/${id}/push-url`)
  },

  /**
   * 绑定录像计划
   * POST /admin/stream-proxies/{id}/bind-plan
   */
  bindPlan: (id: number, recordPlanId: number) => {
    return request.post(`/admin/stream-proxies/${id}/bind-plan`, { record_plan_id: recordPlanId })
  },

  /**
   * 解绑录像计划
   * POST /admin/stream-proxies/{id}/unbind-plan
   */
  unbindPlan: (id: number) => {
    return request.post(`/admin/stream-proxies/${id}/unbind-plan`)
  },

  /**
   * 清理旧日志
   * POST /admin/stream-proxy-logs/cleanup
   */
  cleanupLogs: (data?: { days?: number }) => {
    return request.post('/admin/stream-proxy-logs/cleanup', data)
  },

  /**
   * 获取同一代理的日志
   * GET /admin/stream-proxies/{id}/logs
   */
  getProxyLogs: (id: number, params?: {
    level?: string
    event?: string
    keyword?: string
    start_time?: string
    end_time?: string
    start?: number
    page_size?: number
  }) => {
    return request.get(`/admin/stream-proxies/${id}/logs`, { params })
  },

  /**
   * 获取所有日志
   * GET /admin/stream-proxy-logs
   */
  getLogs: (params?: {
    proxy_id?: number | string
    level?: string
    event?: string
    keyword?: string
    start_time?: string
    end_time?: string
    start?: number
    page_size?: number
  }) => {
    return request.get('/admin/stream-proxy-logs', { params })
  },

  /**
   * 手动健康检查
   * POST /admin/stream-proxies/health-check
   */
  healthCheck: () => {
    return request.post('/admin/stream-proxies/health-check')
  }
}
