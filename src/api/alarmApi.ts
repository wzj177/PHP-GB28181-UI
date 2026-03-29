import request from '@/utils/request';
import type {
  AlarmPlan,
  AlarmPlanListResponse,
  AlarmEvent,
  AlarmEventListResponse,
  AlarmEventQueryParams,
  BindChannelsParams,
  AlarmPlanChannelListResponse
} from '@/types/alarm';

/**
 * 报警管理 API 服务
 *
 * 包含三个部分：
 * 1. GB28181 告警管理（原有）
 * 2. 报警计划管理（新增）
 * 3. 报警事件查询（新增）
 */
export const alarmApi = {
  /**
   * 获取告警列表
   * GET /api/admin/gb28181/alarms
   */
  getAlarmList: (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    device_id?: string;
    start_time?: string;
    end_time?: string;
  }) => {
    return request.get('/admin/gb28181/alarms', { params });
  },

  /**
   * 获取告警详情
   * GET /api/admin/gb28181/alarms/{id}
   */
  getAlarmDetail: (id: string) => {
    return request.get(`/admin/gb28181/alarms/${id}`);
  },

  /**
   * 更新告警状态
   * PUT /api/admin/gb28181/alarms/{id}
   */
  updateAlarm: (id: string, data: {
    status?: string;
    remark?: string;
  }) => {
    return request.put(`/admin/gb28181/alarms/${id}`, data);
  },

  // ==================== 报警计划管理 ====================

  /**
   * 获取报警计划列表
   * GET /api/admin/alarm-plan
   */
  getAlarmPlans: (params?: {
    page?: number
    page_size?: number
    status?: number
  }) => {
    return request.get<AlarmPlanListResponse>('/admin/alarm-plan', { params })
  },

  /**
   * 获取报警计划详情
   * GET /api/admin/alarm-plan/{id}
   */
  getAlarmPlanDetail: (id: number) => {
    return request.get<AlarmPlan>(`/admin/alarm-plan/${id}`)
  },

  /**
   * 创建报警计划
   * POST /api/admin/alarm-plan
   */
  createAlarmPlan: (data: AlarmPlan) => {
    return request.post<AlarmPlan>('/admin/alarm-plan', data)
  },

  /**
   * 更新报警计划
   * PUT /api/admin/alarm-plan/{id}
   */
  updateAlarmPlan: (id: number, data: Partial<AlarmPlan>) => {
    return request.put<AlarmPlan>(`/admin/alarm-plan/${id}`, data)
  },

  /**
   * 删除报警计划
   * DELETE /api/admin/alarm-plan/{id}
   */
  deleteAlarmPlan: (id: number) => {
    return request.delete(`/admin/alarm-plan/${id}`)
  },

  /**
   * 绑定通道到报警计划
   * POST /api/admin/alarm-plan/{id}/channels
   */
  bindChannels: (id: number, data: BindChannelsParams) => {
    return request.post(`/admin/alarm-plan/${id}/channels`, data)
  },

  /**
   * 解绑通道
   * DELETE /api/admin/alarm-plan/{id}/channels/{channelId}
   */
  unbindChannel: (id: number, channelId: string) => {
    return request.delete(`/admin/alarm-plan/${id}/channels/${channelId}`)
  },

  /**
   * 获取报警计划已绑定的通道列表
   * GET /api/admin/alarm-plan/{id}/channels
   * 返回直接数组，不是包装对象
   */
  getAlarmPlanChannels: (id: number) => {
    return request.get<AlarmPlanChannel[]>(`/admin/alarm-plan/${id}/channels`)
  },

  // ==================== 报警事件查询 ====================

  /**
   * 获取报警事件列表
   * GET /api/admin/gb28181/alarms
   */
  getAlarmEvents: (params?: AlarmEventQueryParams) => {
    return request.get<AlarmEventListResponse>('/admin/gb28181/alarms', { params })
  },

  /**
   * 获取报警事件详情
   * GET /api/admin/gb28181/alarms/{id}
   */
  getAlarmEventDetail: (id: number) => {
    return request.get<AlarmEvent>(`/admin/gb28181/alarms/${id}`)
  },

  /**
   * 获取报警统计数据
   * GET /api/admin/alarm-event/stats
   */
  getAlarmStats: () => {
    return request.get<AlarmSummary>('/admin/alarm-event/stats')
  }
};

export default alarmApi;
