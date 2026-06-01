/**
 * 云端录像 API 服务
 * Base URL: /api/admin/gb28181
 * 文档：docs/GB28181 云端录像 API 文档.md
 */
import request from '@/utils/request'
import type {
  RecordPlan,
  RecordPlanFormData,
  RecordPlanRange,
  RecordPlanChannel,
  RecordTask,
  RecordingFile,
  PagedList,
  RecordTaskType,
  RecordTaskStatus,
  RecordingSourceType
} from '@/types/recording'

const BASE = '/admin/gb28181'

export const recordingApi = {
  // ================= 一、录像计划管理 =================

  /**
   * 获取录像计划列表
   * GET /admin/gb28181/record-plans
   */
  getPlanList: (params?: {
    name?: string
    status?: number
    start?: number
    page_size?: number
  }): Promise<PagedList<RecordPlan>> => {
    return request.get(`${BASE}/record-plans`, { params })
  },

  /**
   * 获取录像计划详情（含 ranges 和 channels）
   * GET /admin/gb28181/record-plans/{id}
   */
  getPlanDetail: (id: number): Promise<RecordPlan> => {
    return request.get(`${BASE}/record-plans/${id}`)
  },

  /**
   * 创建录像计划
   * POST /admin/gb28181/record-plans
   */
  createPlan: (data: RecordPlanFormData): Promise<RecordPlan> => {
    return request.post(`${BASE}/record-plans`, data)
  },

  /**
   * 更新录像计划（传 ranges 会全量替换时间段）
   * PUT /admin/gb28181/record-plans/{id}
   */
  updatePlan: (id: number, data: Partial<RecordPlanFormData>): Promise<RecordPlan> => {
    return request.put(`${BASE}/record-plans/${id}`, data)
  },

  /**
   * 删除录像计划（自动解绑所有通道）
   * DELETE /admin/gb28181/record-plans/{id}
   */
  deletePlan: (id: number): Promise<void> => {
    return request.delete(`${BASE}/record-plans/${id}`)
  },

  /**
   * 启用 / 禁用录像计划
   * POST /admin/gb28181/record-plans/{id}/toggle
   */
  togglePlan: (id: number, status: 0 | 1): Promise<void> => {
    return request.post(`${BASE}/record-plans/${id}/toggle`, { status })
  },

  /**
   * 设置时间段（全量替换）
   * POST /admin/gb28181/record-plans/{id}/ranges
   */
  setPlanRanges: (id: number, ranges: Omit<RecordPlanRange, 'id' | 'record_plan_id'>[]): Promise<void> => {
    return request.post(`${BASE}/record-plans/${id}/ranges`, { ranges })
  },

  /**
   * 绑定通道到录像计划
   * POST /admin/gb28181/record-plans/{id}/channels
   * @param channelIds 通道表主键 ID 数组（非国标通道编号）
   */
  bindChannels: (id: number, channelIds: number[]): Promise<{ count: number }> => {
    return request.post(`${BASE}/record-plans/${id}/channels`, { channel_ids: channelIds })
  },

  /**
   * 获取录像计划绑定的通道
   * GET /admin/gb28181/record-plans/{id}/channels
   */
  getPlanChannels: (id: number): Promise<RecordPlanChannel[]> => {
    return request.get(`${BASE}/record-plans/${id}/channels`)
  },

  /**
   * 解绑通道（单个）
   * DELETE /admin/gb28181/record-plans/channels/{channelId}
   * @param channelId 通道表主键 ID（非国标通道编号）
   */
  unbindChannel: (channelId: number): Promise<void> => {
    return request.delete(`${BASE}/record-plans/channels/${channelId}`)
  },

  /**
   * 批量解绑通道
   * POST /admin/gb28181/record-plans/channels/unbind
   * @param channelIds 通道表主键 ID 数组
   */
  batchUnbindChannels: (channelIds: number[]): Promise<{ count: number }> => {
    return request.post(`${BASE}/record-plans/channels/unbind`, { channel_ids: channelIds })
  },

  // ================= 二、录像任务管理 =================

  /**
   * 获取录像任务列表
   * GET /admin/gb28181/record-tasks
   */
  getTaskList: (params?: {
    task_type?: RecordTaskType
    device_id?: string
    channel_id?: string
    status?: RecordTaskStatus
    media_server_id?: string
    start_time_gte?: number
    start_time_lte?: number
    end_time_gte?: number
    end_time_lte?: number
    order_by?: string
    order_direction?: 'ASC' | 'DESC'
    start?: number
    page_size?: number
  }): Promise<PagedList<RecordTask>> => {
    return request.get(`${BASE}/record-tasks`, { params })
  },

  /**
   * 删除 / 取消录像任务
   * DELETE /admin/gb28181/record-tasks/{id}
   */
  deleteTask: (id: number): Promise<void> => {
    return request.delete(`${BASE}/record-tasks/${id}`)
  },

  // ================= 三、云端录像文件 =================

  /**
   * 获取录像文件列表
   * GET /admin/gb28181/recordings
   */
  getRecordingList: (params?: {
    device_id?: string
    channel_id?: string
    source_type?: RecordingSourceType
    plan_id?: number
    stream_id?: string
    media_server_id?: string
    start?: number
    page_size?: number
  }): Promise<PagedList<RecordingFile>> => {
    return request.get(`${BASE}/recordings`, { params })
  },

  /**
   * 获取录像文件详情
   * GET /admin/gb28181/recordings/{id}
   */
  getRecordingDetail: (id: number): Promise<RecordingFile> => {
    return request.get(`${BASE}/recordings/${id}`)
  },

  /**
   * 批量删除录像文件
   * POST /admin/recordings/batch-delete
   */
  batchDelete: (ids: number[]): Promise<{ deleted: number; file_errors: number; message: string }> => {
    return request.post('/admin/gb28181/recordings/batch-delete', { ids })
  }
}

export default recordingApi
