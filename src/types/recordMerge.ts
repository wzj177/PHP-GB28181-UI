/**
 * 录像合并模块类型定义
 * 对应 API 文档：GB28181 录像合并 API 文档
 */

import type { PagedList } from './recording'

/** 合并任务状态 */
export type RecordMergeStatus = 'pending' | 'merging' | 'done' | 'failed'

/** 合并任务 */
export interface RecordMergeTask {
  id: number
  device_id: string
  channel_id: string
  start_time: number
  end_time: number
  start_time_formatted?: string
  end_time_formatted?: string
  source_file_ids: number[]
  source_file_count: number
  status: RecordMergeStatus
  output_path: string
  output_url?: string
  output_file_size: number
  output_file_size_mb: number
  output_duration: number
  output_duration_formatted?: string
  error_message: string
  started_at?: string
  finished_at?: string
  created_at?: string
  updated_at?: string
}

/** 创建合并任务参数 */
export interface RecordMergeCreateParams {
  device_id: string
  channel_id: string
  start_time: number
  end_time: number
}

/** 合并任务列表查询参数 */
export interface RecordMergeListParams {
  device_id?: string
  channel_id?: string
  status?: RecordMergeStatus
  start?: number
  limit?: number
}
