/**
 * 报警计划类型定义
 */

/**
 * 报警计划
 */
export interface AlarmPlan {
  id?: number
  name: string
  status: number  // 1=启用, 0=禁用
  remark?: string
  snapshot_interval_sec: number  // 快照间隔(秒)，0=不抓拍
  record_duration_sec: number    // 录像时长(秒)，0=不录像
  alarm_level?: number[]         // 报警级别匹配 [1,2,3,4]
  alarm_method?: number[]        // 报警方式匹配 [1,2,3,4,5,6,7]
  alarm_type?: number[]          // 报警类型匹配
  alarm_eventtype?: number[]     // 事件类型匹配
  created_at?: string
  updated_at?: string
}

/**
 * 分页信息
 */
export interface Paginator {
  firstPage: number
  currentPage: number
  perPage: number
  total: number
  pages: number[]
  lastPage: number
}

/**
 * 报警计划列表响应
 */
export interface AlarmPlanListResponse {
  list: AlarmPlan[]
  paginator: Paginator
}

/**
 * 报警事件资产
 */
export interface AlarmEventAsset {
  snapshots: AlarmEventSnapshot[]
  records: AlarmEventRecord[]
}

/**
 * 报警快照
 */
export interface AlarmEventSnapshot {
  id: number
  file_url: string
  shot_time: string
}

/**
 * 报警录像
 */
export interface AlarmEventRecord {
  id: number
  file_url: string
  start_time: string
  duration: number
}

/**
 * 报警事件
 */
export interface AlarmEvent {
  id: number
  device_id: string
  channel_id: string
  level: number        // 报警级别 1-4
  method: number       // 报警方式 1-7
  type?: number
  eventtype?: number
  description: string
  longitude?: number
  latitude?: number
  alarm_time: string
  recv_time: string
  alarm_plan_id?: number
  assets?: AlarmEventAsset
  raw_payload?: string  // 原始报文
  created_at: string
}

/**
 * 报警统计摘要
 */
export interface AlarmSummary {
  total: number
  today: number
  week: number
  month: number
}

/**
 * 报警事件列表响应
 */
export interface AlarmEventListResponse {
  list: AlarmEvent[]
  total: number
  summary?: AlarmSummary
}

/**
 * 报警事件查询参数
 */
export interface AlarmEventQueryParams {
  device_id?: string
  channel_id?: string
  level?: number
  method?: number
  start?: number
  page?: number,
  page_size?: number
  // 新的查询参数（优先使用）
  start_time?: string
  end_time?: string
  // 兼容旧参数
  alarm_time_gte?: string
  alarm_time_lte?: string
}

/**
 * 报警统计数据
 */
export interface AlarmStats {
  today: number
  week: number
  month: number
  total: number
}

/**
 * 绑定通道参数
 */
export interface BindChannelsParams {
  device_id: string
  channel_ids: string[]
}

/**
 * 报警计划绑定通道
 */
export interface AlarmPlanChannel {
  id: number
  device_id: string
  channel_id: string
  device_name?: string
  channel_name?: string
}

/**
 * 报警计划通道列表响应
 */
export interface AlarmPlanChannelListResponse {
  list: AlarmPlanChannel[]
  total: number
}

/**
 * 报警级别
 */
export enum AlarmLevel {
  LEVEL_1 = 1,  // 一般
  LEVEL_2 = 2,  // 重要
  LEVEL_3 = 3,  // 紧急
  LEVEL_4 = 4   // 特急
}

/**
 * 报警方式 (GB28181 国标)
 */
export enum AlarmMethod {
  PHONE = 1,        // 电话报警
  DEVICE = 2,       // 设备报警
  SMS = 3,          // 短信报警
  GPS = 4,          // GPS 报警
  VIDEO = 5,        // 视频报警
  DEVICE_FAULT = 6, // 设备故障报警
  OTHER = 7         // 其他报警
}

/**
 * 事件类型 (仅在 method=5 且 type=6 时有效)
 */
export enum EventType {
  ENTER = 1,    // 进入区域
  LEAVE = 2     // 离开区域
}

/**
 * 报警级别显示配置
 */
export const ALARM_LEVEL_CONFIG = {
  1: { label: '1级', type: 'info' as const, color: '#909399' },
  2: { label: '2级', type: 'warning' as const, color: '#E6A23C' },
  3: { label: '3级', type: 'danger' as const, color: '#F56C6C' },
  4: { label: '4级', type: 'danger' as const, color: '#F56C6C' }
}

/**
 * 报警方式显示配置 (GB28181 国标)
 */
export const ALARM_METHOD_CONFIG = {
  1: '电话报警',
  2: '设备报警',
  3: '短信报警',
  4: 'GPS 报警',
  5: '视频报警',
  6: '设备故障报警',
  7: '其他报警'
}

/**
 * 事件类型显示配置
 */
export const EVENT_TYPE_CONFIG = {
  1: '进入区域',
  2: '离开区域'
}

/**
 * 设备报警 (method=2) 时的 type 映射
 */
export const ALARM_TYPE_DEVICE: Record<number, string> = {
  1: '视频丢失报警',
  2: '设备防拆报警',
  3: '存储设备磁盘满报警',
  4: '设备高温报警',
  5: '设备低温报警'
}

/**
 * 视频报警 (method=5) 时的 type 映射
 */
export const ALARM_TYPE_VIDEO: Record<number, string> = {
  1: '人工视频报警',
  2: '运动目标检测报警',
  3: '遗留物检测报警',
  4: '物体移除检测报警',
  5: '绊线检测报警',
  6: '入侵检测报警',
  7: '逆行检测报警',
  8: '徘徊检测报警',
  9: '流量统计报警',
  10: '密度检测报警',
  11: '视频异常检测报警',
  12: '快速移动报警',
  13: '图像遮挡报警'
}

/**
 * 设备故障报警 (method=6) 时的 type 映射
 */
export const ALARM_TYPE_DEVICE_FAULT: Record<number, string> = {
  1: '存储设备磁盘故障报警',
  2: '存储设备风扇故障报警'
}

/**
 * 根据 method 和 type 获取报警类型名称
 * @param method 报警方式 (1-7)
 * @param type 报警类型
 * @returns 报警类型名称
 */
export function getAlarmTypeName(method: number, type: number | null | undefined): string {
  if (!type) return '-'

  switch (method) {
    case 2:
      return ALARM_TYPE_DEVICE[type] || `设备报警类型${type}`
    case 5:
      return ALARM_TYPE_VIDEO[type] || `视频报警类型${type}`
    case 6:
      return ALARM_TYPE_DEVICE_FAULT[type] || `设备故障类型${type}`
    default:
      return `报警类型${type}`
  }
}
