/**
 * 云端录像模块类型定义
 * 对应 API 文档：GB28181 云端录像 API 文档
 */

// ===================== 公共 =====================

export interface Paginator {
  total: number
  offset: number
  page_size: number
  currentPage?: number
  lastPage?: number
}

export interface PagedList<T> {
  list: T[]
  paginator: Paginator
}

// ===================== 录像计划 =====================

/** 星期枚举（与 API 对应） */
export type WeekDay = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN'

/** 超出限制处理策略 */
export type OverStepPlan = 'del_file' | 'stop_record'

/** 录像计划时间段 */
export interface RecordPlanRange {
  id?: number
  record_plan_id?: number
  week_day: WeekDay
  start_time: string   // HH:MM
  end_time: string     // HH:MM
}

/** 录像计划绑定的通道 */
export interface RecordPlanChannel {
  id: number
  device_id: string
  channel_id: string
  channel_name: string
  record_plan_id: number
  record_status: number   // 0=未录像, 1=录像中
}

/** 录像计划 */
export interface RecordPlan {
  id: number
  name: string
  status: number              // 0=禁用, 1=启用
  remark?: string
  limit_space: number         // Byte, 0=不限
  limit_days: number          // 天数, 0=不限
  over_step_plan: OverStepPlan
  partner_id?: number
  created_at?: string
  updated_at?: string
  channel_count?: number      // 列表接口返回
  ranges?: RecordPlanRange[]  // 详情接口返回
  channels?: RecordPlanChannel[]
}

/** 创建 / 更新录像计划表单数据 */
export interface RecordPlanFormData {
  name: string
  remark?: string
  status?: number
  limit_space?: number
  limit_days?: number
  over_step_plan?: OverStepPlan
  ranges?: Omit<RecordPlanRange, 'id' | 'record_plan_id'>[]
}

// ===================== 视频广场 =====================

/** 视频广场在线流 */
export interface OnlineStream {
  device_id: string
  channel_id: string
  channel_name: string
  device_name: string
  stream_id: string
  media_server_id: string
  stream_status: 'idle' | 'pushing' | 'failed'
  play_url?: string
  thumbnail?: string
}

/** 视频广场卡片 */
export interface VideoCard {
  id: string
  device_id: string
  channel_id: string
  channel_name: string
  device_name: string
  stream_id: string
  media_server_id: string
  status: 'online' | 'offline'
  stream_status: 'idle' | 'pushing' | 'failed'
  play_url?: string
  thumbnail?: string
}

/** 任务类型 */
export type RecordTaskType = 'plan' | 'alarm' | 'playback_download'

/** 任务状态 */
export type RecordTaskStatus =
  | 'pending'
  | 'inviting'
  | 'wait_stream'
  | 'recording'
  | 'finalizing'
  | 'done'
  | 'failed'
  | 'cancelled'

/** 录像任务 */
export interface RecordTask {
  id: number
  task_type: RecordTaskType
  device_id: string
  channel_id: string
  status: RecordTaskStatus
  media_server_id?: string
  start_time?: number
  end_time?: number
  created_at?: string
  updated_at?: string
  record_file?: RecordingFile
}

// ===================== 云端录像文件 =====================

/** 录像来源 */
export type RecordingSourceType = 'cloud_plan' | 'alarm' | 'playback_download'

/** 录像文件 */
export interface RecordingFile {
  id: number
  device_id: string
  channel_id: string
  channel_name?: string
  channel_name_display?: string
  device_name?: string
  media_server_id?: string
  source_type: RecordingSourceType
  start_time: number
  start_time_formatted?: string
  end_time: number
  end_time_formatted?: string
  duration: number
  duration_formatted?: string
  file_size: number
  file_size_mb?: number
  video_path?: string
  video_url?: string
  download_url?: string
  stream_id?: string
  record_date?: string
  source_id?: number
  source_desc?: string
  plan_id?: number
  created_at?: string
  updated_at?: string
}
