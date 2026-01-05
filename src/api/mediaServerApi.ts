/**
 * 流媒体管理 API 服务
 * 对应后端路由：
 * GET /admin/media-server - 获取流媒体服务器列表
 * GET /admin/media-server/:id - 获取流媒体服务器详情
 * POST /admin/media-server/add - 创建流媒体服务器
 * PUT /admin/media-server/:id - 更新流媒体服务器
 * DELETE /admin/media-server/:id - 删除流媒体服务器
 * GET /admin/media-server/stats - 查询流媒体服务器状态
 * GET /admin/media-server/:id/config - 获取流媒体服务器配置
 * POST /admin/media-server/:id/config - 保存流媒体服务器配置
 */
import request from '@/utils/request';
import type {
  MediaServer,
  MediaServerFormData,
  MediaServerStats,
  MediaServerType,
  MediaServerStatus,
  ZLMConfig
} from '@/types/media-server';

/**
 * 分页列表响应
 */
interface ListResponse<T> {
  list: T[];
  paginator: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
}

/**
 * API响应格式
 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export const mediaServerApi = {
  /**
   * 获取流媒体服务器列表
   * GET /admin/media-server
   */
  getList: (params?: {
    type?: MediaServerType;
    status?: MediaServerStatus;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ListResponse<MediaServer>>> => {
    return request.get('/admin/media-server', { params });
  },

  /**
   * 获取流媒体服务器详情
   * GET /admin/media-server/:id
   */
  getDetail: (id: number): Promise<ApiResponse<MediaServer>> => {
    return request.get(`/admin/media-server/${id}`);
  },

  /**
   * 创建流媒体服务器
   * POST /admin/media-server/add
   */
  create: (data: MediaServerFormData): Promise<ApiResponse<MediaServer>> => {
    return request.post('/admin/media-server/add', data);
  },

  /**
   * 更新流媒体服务器
   * PUT /admin/media-server/:id
   */
  update: (id: number, data: MediaServerFormData): Promise<ApiResponse<MediaServer>> => {
    return request.put(`/admin/media-server/${id}`, data);
  },

  /**
   * 删除流媒体服务器
   * DELETE /admin/media-server/:id
   */
  delete: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/admin/media-server/${id}`);
  },

  /**
   * 查询流媒体服务器状态
   * GET /admin/api/media-servers/:id/stats
   */
  getStats: (id: number): Promise<ApiResponse<MediaServerStats>> => {
    return request.get(`/admin/media-server/${id}/stats`);
  },

  /**
   * 获取流媒体服务器配置（ZLM config）
   * GET /admin/media-server/:id/config
   */
  getConfig: (id: number): Promise<ApiResponse<ZLMConfig>> => {
    return request.get(`/admin/media-server/${id}/config`);
  },

  /**
   * 保存流媒体服务器配置（ZLM config）
   * POST /admin/media-server/:id/config
   */
  saveConfig: (id: number, config: ZLMConfig): Promise<ApiResponse<void>> => {
    return request.post(`/admin/media-server/${id}/config`, config);
  },

  /**
   * 获取可用的流媒体服务器列表（简单格式，用于下拉选择）
   * GET /admin/media-server
   */
  getAvailableServers: (): Promise<ApiResponse<Array<{ id: number; name: string; server_id: string; type: string; status: string }>>> => {
    return request.get('/admin/media-server', { params: { simple: 1 } });
  },
  restart: (id: number): Promise<ApiResponse<void>> => {
    return request.post(`/admin/media-server/${id}/restart`);
  }
};

export default mediaServerApi;
