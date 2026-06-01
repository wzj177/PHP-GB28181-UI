/**
 * SIP 网关集群管理类型定义
 * 对应 API 文档：SIP Gateway 集群管理 API 文档
 */

import type { PagedList } from './recording'

/** 网关状态 */
export type SipGatewayStatus = 'active' | 'inactive' | 'disabled'

/** SIP 传输协议 */
export type SipTransport = 'UDP' | 'TCP' | 'ALL'

/** 消息队列类型 */
export type MqType = 'redis' | 'rabbitmq'

/** 字符编码 */
export type EncodingType = 'GB2312' | 'UTF-8'

/** 日志级别 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR'

/** Redis 配置 */
export interface RedisConfig {
  host: string
  password?: string | null
  port: number
  database: number
  prefix: string
  queue_name?: string
}

/** RabbitMQ 配置 */
export interface MqConfig {
  host: string
  port: number
  user: string
  password: string
  vhost: string
}

/** API 回调配置 */
export interface ApiConfig {
  hock_url: string
  pull_url: string
  token: string
}

/** SIP 网关 */
export interface SipGateway {
  id: number
  gateway_id: string
  gateway_name: string
  server_id: string
  server_domain: string
  sip_host: string
  sip_port: number
  transport: SipTransport
  public_ip: string
  device_password: string
  authentication: boolean
  sip_username: string
  register_expires: number
  keepalive_interval: number
  heartbeat_timeout: number
  keepalive_lost_number: number
  catalog_auto_query: 0 | 1
  encoding_type: EncodingType
  task_worker_num: number
  timer_interval: number
  max_devices: number
  broadcast_push_after_ack: boolean
  mq_type: MqType
  mq_config: MqConfig | Record<string, unknown>
  redis_config: RedisConfig
  api_config: ApiConfig
  log_level: LogLevel
  debug: boolean
  status: SipGatewayStatus
  last_seen_at?: string
  pid?: number
  ip?: string
  tcp_status?: string
  tcp_pid?: number
  device_count: number
  created_at?: string
  updated_at?: string
}

/** 网关列表查询参数 */
export interface SipGatewayListParams {
  status?: SipGatewayStatus
  mq_type?: MqType
  gateway_name?: string
  start?: number
  limit?: number
}

/** 网关创建/编辑表单数据 */
export interface SipGatewayFormData {
  gateway_id?: string
  gateway_name?: string
  server_id?: string
  server_domain?: string
  sip_host?: string
  sip_port?: number
  transport?: SipTransport
  public_ip?: string
  device_password?: string
  authentication?: 0 | 1
  sip_username?: string
  register_expires?: number
  keepalive_interval?: number
  heartbeat_timeout?: number
  keepalive_lost_number?: number
  catalog_auto_query?: 0 | 1
  encoding_type?: EncodingType
  task_worker_num?: number
  timer_interval?: number
  max_devices?: number
  broadcast_push_after_ack?: boolean
  mq_type?: MqType
  mq_config?: MqConfig | Record<string, unknown>
  redis_config?: RedisConfig
  api_config?: ApiConfig
  log_level?: LogLevel
  debug?: boolean
}

/** 设备绑定参数 */
export interface SipGatewayBindParams {
  gateway_id: string
  device_ids: string[]
}

/** 设备解绑参数 */
export interface SipGatewayUnbindParams {
  device_ids: string[]
}
