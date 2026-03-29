import request from '@/utils/request';

/**
 * 系统日志模块/操作选项
 */
export interface LogModuleOption {
  name: string
  value: string
}

/**
 * 系统设置接口类型定义
 */
export interface BasicSetting {
  site_name: string
  site_url: string
  site_logo: string
  site_logo_full?: string
  icp: string
  favicon?: string
}

export interface AttachmentSetting {
  allow_image_exts: string[]
  allow_image_upload_size: number
  allow_image_clip: number
  image_clip_size_type: string[]
  allow_audio_exts: string[]
  allow_audio_upload_size: number
  allow_video_exts: string[]
  allow_video_upload_size: number
  allow_file_exts: string
  allow_file_upload_size: number
  allow_snippet_upload: number
  allow_transcode_video: number
}

export interface AttachmentOptions {
  imageTypeOptions: Array<{ value: string; name: string }>
  audioTypeOptions: Array<{ value: string; name: string }>
  videoTypeOptions: Array<{ value: string; name: string }>
  clipTypeOptions: Array<{ value: string; name: string }>
}

export interface VIPSetting {
  enable_guest_view: number
  enable_vip_diy: number
}

export interface IPCheckSetting {
  blackListIps: string
  whiteListIps: string
}

/**
 * 系统管理 API
 */
export const systemApi = {
  // ================= 系统设置 (来自 Vue2 项目) =================

  /**
   * 获取系统配置项
   * GET /admin/setting/view/{key}
   */
  getSetting: (key: string) => {
    return request.get<any, any>(`/admin/setting/view/${key}`)
  },

  /**
   * 保存基础配置
   * POST /admin/setting/basic
   */
  setBasic: (params: BasicSetting) => {
    return request.post<any, any>('/admin/setting/basic', params)
  },

  /**
   * 保存附件配置
   * POST /admin/setting/attachment
   */
  setAttachment: (params: AttachmentSetting) => {
    return request.post<any, any>('/admin/setting/attachment', params)
  },

  /**
   * 保存安全配置
   * POST /admin/setting/auth
   */
  setAuth: (params: any) => {
    return request.post<any, any>('/admin/setting/auth', params)
  },

  /**
   * 保存存储配置
   * POST /admin/setting/storage
   */
  setStorage: (params: any) => {
    return request.post<any, any>('/admin/setting/storage', params)
  },

  /**
   * 保存CDN配置
   * POST /admin/setting/cdn
   */
  setCDN: (params: any) => {
    return request.post<any, any>('/admin/setting/cdn', params)
  },

  /**
   * 保存邮件配置
   * POST /admin/setting/mail
   */
  setMail: (params: any) => {
    return request.post<any, any>('/admin/setting/mail', params)
  },

  /**
   * 保存VIP配置
   * POST /admin/setting/vip
   */
  setVIP: (params: VIPSetting) => {
    return request.post<any, any>('/admin/setting/vip', params)
  },

  /**
   * 保存IP黑白名单配置
   * POST /admin/setting/ip-check-list
   */
  setIpCheckList: (params: IPCheckSetting) => {
    return request.post<any, any>('/admin/setting/ip-check-list', params)
  },

  /**
   * 获取附件类型选项
   * GET /admin/setting/attachment/options
   */
  getAttachmentOptions: () => {
    return request.get<any, AttachmentOptions>('/admin/setting/attachment/options')
  },

  /**
   * 测试邮件配置
   * POST /admin/system/test-mail
   */
  checkMail: (to: string) => {
    return request.post<any, any>('/admin/system/test-mail', { to })
  },

  /**
   * 获取系统操作日志列表
   * GET /admin/system/log
   */
  logList: (params: any) => {
    return request.get<any, any>('/admin/system/log', { params })
  },

  /**
   * 获取系统操作日志详情
   * GET /admin/system/log/{id}
   */
  logView: (id: string | number) => {
    return request.get<any, any>(`/admin/system/log/${id}`)
  },

  /**
   * 批量删除系统操作日志
   * POST /admin/system/log/btch-dlt
   */
  logBatchDelete: (ids: string[]) => {
    return request.post<any, any>('/admin/system/log/btch-dlt', { ids })
  },

  /**
   * 获取系统操作日志模块列表
   * GET /admin/system/log/modules
   */
  logModuleOptions: () => {
    return request.get<any, LogModuleOption[]>('/admin/system/log/modules')
  },

  /**
   * 获取系统操作日志模块对应操作列表
   * GET /admin/system/log/actions/{module}
   */
  logModuleActionOptions: (module: string) => {
    return request.get<any, LogModuleOption[]>(`/admin/system/log/actions/${module}`)
  },

  // ================= 系统日志 (原 GB28181 项目) =================

  /**
   * 获取系统日志
   * GET /admin/system/logs
   */
  getLogs: (params?: {
    level?: string;
    module?: string;
    keyword?: string;
    start_time?: string;
    end_time?: string;
    page?: number;
    page_size?: number;
  }) => {
    return request.get('/admin/system/logs', { params });
  },

  /**
   * 导出系统日志
   * GET /admin/system/logs/export
   */
  exportLogs: (params?: any) => {
    return request.get('/admin/system/logs/export', { params, responseType: 'blob' });
  },

  // ================= ZLM 配置 =================

  /**
   * 获取 ZLM 配置
   * GET /admin/setting/zlm/get
   */
  getZLMConfig: () => {
    return request.get('/admin/setting/zlm/get');
  },

  /**
   * 保存 ZLM 配置
   * POST /admin/setting/zlm/set
   */
  saveZLMConfig: (data: any) => {
    return request.post('/admin/setting/zlm/set', data);
  },

  /**
   * 重置 ZLM 配置
   * POST /admin/setting/zlm/reset
   */
  resetZLMConfig: () => {
    return request.post('/admin/setting/zlm/reset');
  },

  /**
   * 重启 ZLM 服务
   * POST /admin/setting/zlm/restart
   */
  restartZLM: () => {
    return request.post('/admin/zlm/restart');
  }
};

export default systemApi;
