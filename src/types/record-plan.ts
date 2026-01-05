/**
 * 录像计划类型定义
 */

/**
 * 超出限制后的处理方式
 */
export enum OverStepPlan {
  DEL_FILE = 'delFile',  // 删除文件
  STOP_DVR = 'stopDvr'  // 停止录制
}

/**
 * 录像计划
 */
export interface RecordPlan {
  id: number
  name: string                        // 计划名称
  status: boolean                     // 是否启用 (true=启用, false=禁用)
  remark?: string                     // 计划描述
  limit_space: number                 // 空间大小限制（GB）
  limit_days: number                  // 天数限制
  over_step_plan: OverStepPlan        // 超出后执行动作
  plan_ranges: RecordPlanRange[]      // 计划时间段明细
  created_time?: number               // 创建时间
  updated_time?: number               // 修改时间
}

/**
 * 录像计划时间段明细
 * 每天的录像时间段，格式：s1=开始时间, e1=结束时间（星期一）
 * 例如：{ s1: "00:00", e1: "12:00", s2: "00:00", e2: "24:00" } 表示星期一全天录像
 */
export interface RecordPlanRange {
  s1?: string  // 星期一 00:00-24:00
  e1?: string
  s2?: string  // 星期二
  e2?: string
  s3?: string  // 星期三
  e3?: string
  s4?: string  // 星期四
  e4?: string
  s5?: string  // 星期五
  e5?: string
  s6?: string  // 星期六
  e6?: string
  s7?: string  // 星期日
  e7?: string
}

/**
 * 录像计划表单数据
 */
export interface RecordPlanFormData {
  id?: number
  name: string
  status: boolean
  remark?: string
  limit_space: number
  limit_days: number
  over_step_plan: OverStepPlan
  plan_ranges: RecordPlanRange[] | null
}

/**
 * 视频广场-在线流信息
 */
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

/**
 * 视频广场卡片数据
 */
export interface VideoCard {
  id: string                         // 唯一标识，device_id_channel_id
  device_id: string
  channel_id: string
  channel_name: string
  device_name: string
  stream_id: string
  media_server_id: string
  status: 'online' | 'offline'       // 通道状态
  stream_status: 'idle' | 'pushing' | 'failed'
  play_url?: string
  thumbnail?: string
}
