/**
 * 流媒体服务器类型定义
 */

/**
 * 流媒体服务器类型枚举
 */
export enum MediaServerType {
  ZLM = 'zlm',
  SRS = 'srs',
  OTHER = 'other'
}

/**
 * 流媒体服务器状态枚举
 */
export enum MediaServerStatus {
  STOPPED = 'stopped',     // 未运行
  RUNNING = 'running',     // 运行中
  OFFLINE = 'offline',     // 离线
  UNKNOWN = 'unknown'      // 关闭/未知
}

/**
 * RTP传输模式枚举
 */
export enum RtpTransMode {
  UDP = 0,                 // UDP模式（延迟最低，局域网推荐）
  TCP_PASSIVE = 1,         // TCP被动模式（公网推荐，设备主动连接）
  TCP_ACTIVE = 2           // TCP主动模式（服务器连接设备，需设备端口映射）
}

/**
 * 流媒体服务器信息
 */
export interface MediaServer {
  id: number
  name: string                      // 服务器名称
  type: MediaServerType             // 类型（zlm、srs）
  host: string                      // IP地址或域名
  port: number                      // 端口
  secret: string                    // API密钥
  server_id: string                 // 网关编号（uuid）
  status: MediaServerStatus         // 运行状态
  access_domain?: string            // 访问域名（nginx反向代理场景）
  network_env?: 'internal' | 'public'  // 网络环境：内网、公网
  stream_ip?: string                // 收流IP（用于SDP，为空则使用host）
  default_config?: string           // 默认配置JSON
  created_at: string                // 创建时间
  updated_at: string                // 更新时间
}

/**
 * 流媒体服务器表单数据
 */
export interface MediaServerFormData {
  name: string
  type: MediaServerType
  host: string
  port: number
  secret: string
  access_domain?: string   // 访问域名（用于nginx反向代理场景）
  network_env?: 'internal' | 'public'  // 网络环境：内网、公网
  stream_ip?: string       // 收流IP（用于SDP，为空则使用host）
}

/**
 * 线程负载数据项
 */
export interface ThreadLoadItem {
  timestamp: number
  thread_index: number
  thread_name: string
  load: number
  delay: number
  fd_count: number
}

/**
 * 线程负载数据
 */
export interface ThreadLoadData {
  data: ThreadLoadItem[]
  timestamp: number
}

/**
 * 快照数据
 */
export interface SnapshotData {
  cpu_usage: number
  memory_usage: number
  stream_count: number
  total_connection_count: number
  bytes_speed: number
  network_thread_count: number
  work_thread_count: number
}

/**
 * 对象统计
 */
export interface StatisticsData {
  [key: string]: number
}

/**
 * 流媒体服务器统计信息
 */
export interface MediaServerStats {
  // 服务状态
  running: boolean
  status: MediaServerStatus
  version: string
  build_date: string
  git_hash: string

  // 当前快照数据
  snapshot: SnapshotData

  // 网络线程负载数据
  thread_load: ThreadLoadData

  // 工作线程负载数据
  work_thread_load: ThreadLoadData

  // 对象统计
  statistics: StatisticsData
}

/**
 * 流媒体服务器配置（ZLM）
 * 注意：ZLM API 返回的所有配置值都是字符串类型
 */
export interface ZLMConfig {
  api?: {
    apiDebug: string
    defaultSnap: string
    downloadRoot: string
    secret: string
    snapRoot: string
  }
  cluster?: {
    origin_url: string
    retry_count: string
    timeout_sec: string
  }
  ffmpeg?: {
    bin: string
    cmd: string
    log: string
    restart_sec: string
    snap: string
  }
  general?: {
    broadcast_player_count_changed: string
    check_nvidia_dev: string
    enableVhost: string
    enable_ffmpeg_log: string
    flowThreshold: string
    listen_ip: string
    maxStreamWaitMS: string
    mediaServerId: string
    mergeWriteMS: string
    resetWhenRePlay: string
    streamNoneReaderDelayMS: string
    unready_frame_cache: string
    wait_add_track_ms: string
    wait_audio_track_data_ms: string
    wait_track_ready_ms: string
  }
  hls?: {
    broadcastRecordTs: string
    deleteDelaySec: string
    fastRegister: string
    fileBufSize: string
    segDelay: string
    segDur: string
    segKeep: string
    segNum: string
    segRetain: string
  }
  hook?: {
    alive_interval: string
    enable: string
    on_flow_report: string
    on_http_access: string
    on_play: string
    on_publish: string
    on_record_mp4: string
    on_record_ts: string
    on_rtp_server_timeout: string
    on_rtsp_auth: string
    on_rtsp_realm: string
    on_send_rtp_stopped: string
    on_server_exited: string
    on_server_keepalive: string
    on_server_started: string
    on_shell_login: string
    on_stream_changed: string
    on_stream_none_reader: string
    on_stream_not_found: string
    retry: string
    retry_delay: string
    stream_changed_schemas: string
    timeoutSec: string
  }
  http?: {
    allow_cross_domains: string
    allow_ip_range: string
    charSet: string
    dirMenu: string
    forbidCacheSuffix: string
    forwarded_ip_header: string
    keepAliveSecond: string
    maxReqSize: string
    notFound: string
    port: string
    rootPath: string
    sendBufSize: string
    sslport: string
    virtualPath: string
  }
  multicast?: {
    addrMax: string
    addrMin: string
    udpTTL: string
  }
  onvif?: {
    port: string
  }
  protocol?: {
    add_mute_audio: string
    auto_close: string
    continue_push_ms: string
    enable_audio: string
    enable_fmp4: string
    enable_hls: string
    enable_hls_fmp4: string
    enable_mp4: string
    enable_rtmp: string
    enable_rtsp: string
    enable_ts: string
    fmp4_demand: string
    hls_demand: string
    hls_save_path: string
    modify_stamp: string
    mp4_as_player: string
    mp4_max_second: string
    mp4_save_path: string
    paced_sender_ms: string
    rtmp_demand: string
    rtsp_demand: string
    ts_demand: string
  }
  record?: {
    appName: string
    enableFmp4: string
    fastStart: string
    fileBufSize: string
    fileRepeat: string
    sampleMS: string
  }
  rtc?: {
    bfilter: string
    enableTurn: string
    externIP: string
    icePort: string
    icePwd: string
    iceTcpPort: string
    iceTransportPolicy: string
    iceUfrag: string
    interfaces: string
    maxRtpCacheMS: string
    maxRtpCacheSize: string
    max_bitrate: string
    min_bitrate: string
    nackIntervalRatio: string
    nackMaxCount: string
    nackMaxMS: string
    nackMaxSize: string
    nackRtpSize: string
    port: string
    portRange: string
    preferredCodecA: string
    preferredCodecV: string
    rembBitRate: string
    signalingPort: string
    signalingSslPort: string
    start_bitrate: string
    tcpPort: string
    timeoutSec: string
  }
  rtmp?: {
    directProxy: string
    enhanced: string
    handshakeSecond: string
    keepAliveSecond: string
    port: string
    sslport: string
  }
  rtp?: {
    audioMtuSize: string
    h264_stap_a: string
    lowLatency: string
    rtpMaxSize: string
    videoMtuSize: string
  }
  rtp_proxy?: {
    dumpDir: string
    gop_cache: string
    h264_pt: string
    h265_pt: string
    merge_frame: string
    opus_pt: string
    port: string
    port_range: string
    ps_pt: string
    rtp_g711_dur_ms: string
    timeoutSec: string
    udp_recv_socket_buffer: string
  }
  rtsp?: {
    authBasic: string
    directProxy: string
    handshakeSecond: string
    keepAliveSecond: string
    lowLatency: string
    port: string
    rtpTransportType: string
    sslport: string
  }
  shell?: {
    maxReqSize: string
    port: string
  }
  srt?: {
    latencyMul: string
    passPhrase: string
    pktBufSize: string
    port: string
    timeoutSec: string
  }
}

/**
 * 设备信息（用于编辑）
 */
export interface DeviceEditData {
  device_id: string
  show_name?: string                 // 自定义名称
  rtp_trans_mode?: RtpTransMode     // RTP传输模式
  province_id?: string               // 省份ID
  city_id?: string                   // 城市ID
  county_id?: string                 // 区县ID
}

/**
 * 通道信息
 */
export interface ChannelInfo {
  id: number
  device_id: string
  channel_id: string
  channel_name: string
  media_server_id: string            // 绑定的流媒体服务器ID
}

/**
 * 行政区域信息
 */
export interface RegionInfo {
  code: string                       // 行政区划代码
  name: string                       // 名称
  parent_code?: string               // 上级代码
}

/**
 * 省份信息
 */
export type ProvinceInfo = RegionInfo

/**
 * 城市信息
 */
export type CityInfo = RegionInfo

/**
 * 区县信息
 */
export type CountyInfo = RegionInfo
