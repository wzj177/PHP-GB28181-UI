/**
 * 录像合并 API 服务
 * Base URL: /api/admin/gb28181/record-merge-tasks
 * 文档：docs/api-project/docs/2026/Record-Merge-API.md
 */
import request from '@/utils/request'
import type { RecordMergeTask, RecordMergeCreateParams, RecordMergeListParams } from '@/types/recordMerge'
import type { PagedList } from '@/types/recording'

const BASE = '/admin/gb28181/record-merge-tasks'

export const recordMergeApi = {
  getTaskList: (params?: RecordMergeListParams): Promise<PagedList<RecordMergeTask>> => {
    return request.get(BASE, { params })
  },

  getTaskDetail: (id: number): Promise<RecordMergeTask> => {
    return request.get(`${BASE}/${id}`)
  },

  createTask: (data: RecordMergeCreateParams): Promise<RecordMergeTask> => {
    return request.post(BASE, data)
  },

  cancelTask: (id: number): Promise<void> => {
    return request.post(`${BASE}/${id}/cancel`)
  },

  deleteTask: (id: number): Promise<void> => {
    return request.delete(`${BASE}/${id}`)
  }
}

export default recordMergeApi
