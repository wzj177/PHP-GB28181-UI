/**
 * 录像计划 API 服务
 */
import request from '@/utils/request';
import type {
  RecordPlan,
  RecordPlanFormData,
  OnlineStream,
  VideoCard
} from '@/types/record-plan';

/**
 * API响应格式
 */
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

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

export const recordPlanApi = {
  // ================= 录像计划管理 =================

  /**
   * 获取录像计划列表
   * GET /admin/record-plans
   */
  getList: (params?: {
    page?: number;
    limit?: number;
    keyword?: string;
  }): Promise<ApiResponse<ListResponse<RecordPlan>>> => {
    return request.get('/admin/record-plans', { params });
  },

  /**
   * 获取录像计划详情
   * GET /admin/record-plans/:id
   */
  getDetail: (id: number): Promise<ApiResponse<RecordPlan>> => {
    return request.get(`/admin/record-plans/${id}`);
  },

  /**
   * 创建录像计划
   * POST /admin/record-plans
   */
  create: (data: RecordPlanFormData): Promise<ApiResponse<RecordPlan>> => {
    return request.post('/admin/record-plans', data);
  },

  /**
   * 更新录像计划
   * PUT /admin/record-plans/:id
   */
  update: (id: number, data: RecordPlanFormData): Promise<ApiResponse<RecordPlan>> => {
    return request.put(`/admin/record-plans/${id}`, data);
  },

  /**
   * 删除录像计划
   * DELETE /admin/record-plans/:id
   */
  delete: (id: number): Promise<ApiResponse<void>> => {
    return request.delete(`/admin/record-plans/${id}`);
  },

  /**
   * 切换录像计划状态
   * PUT /admin/record-plans/:id/toggle-status
   */
  toggleStatus: (id: number, status: boolean): Promise<ApiResponse<void>> => {
    return request.put(`/admin/record-plans/${id}/toggle-status`, { status });
  },

  /**
   * 绑定通道到录像计划
   * POST /admin/record-plans/:id/bind-channels
   */
  bindChannels: (id: number, channelIds: string[]): Promise<ApiResponse<void>> => {
    return request.post(`/admin/record-plans/${id}/bind-channels`, { channel_ids: channelIds });
  },

  /**
   * 解绑通道
   * POST /admin/record-plans/:id/unbind-channels
   */
  unbindChannels: (id: number, channelIds: string[]): Promise<ApiResponse<void>> => {
    return request.post(`/admin/record-plans/${id}/unbind-channels`, { channel_ids: channelIds });
  },

  // ================= 视频广场 =================

  /**
   * 获取在线流列表（所有推流中的通道）
   * GET /admin/video-plaza/streams
   */
  getOnlineStreams: (params?: {
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ListResponse<OnlineStream>>> => {
    return request.get('/admin/video-plaza/streams', { params });
  },

  /**
   * 获取视频广场卡片数据（包含缩略图）
   * GET /admin/video-plaza/cards
   */
  getVideoCards: (params?: {
    keyword?: string;
    status?: 'online' | 'offline';
  }): Promise<ApiResponse<VideoCard[]>> => {
    return request.get('/admin/video-plaza/cards', { params });
  },

  /**
   * 开始播放视频广场中的流
   * POST /admin/video-plaza/play
   */
  play: (data: {
    device_id: string;
    channel_id: string;
  }): Promise<ApiResponse<{ play_urls: Record<string, string> }>> => {
    return request.post('/admin/video-plaza/play', data);
  },

  /**
   * 停止播放
   * POST /admin/video-plaza/stop
   */
  stop: (data: {
    device_id: string;
    channel_id: string;
  }): Promise<ApiResponse<void>> => {
    return request.post('/admin/video-plaza/stop', data);
  }
};

export default recordPlanApi;
