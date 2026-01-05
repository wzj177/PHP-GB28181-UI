<template>
  <div class="media-server-config-container">
    <div class="page-header">
      <div class="header-left">
        <ElButton @click="goBack" :icon="ArrowLeft">返回</ElButton>
        <h2>流媒体网关配置 - {{ serverName }}</h2>
      </div>
      <div class="header-actions">
        <ElButton :loading="restarting" type="danger" @click="restartServer">重启服务</ElButton>
      </div>
    </div>

    <div class="config-content">
      <ElCard v-loading="loading" class="config-card">
        <ElAlert
          title="修改配置后需要重启流媒体服务才能生效"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <ElTabs v-model="activeTab">
          <ElTabPane
            v-for="key in configKeys"
            :key="key"
            :label="tabLabels[key] || key.toUpperCase()"
            :name="key"
          >
            <ElForm :model="configData[key]" label-width="200px" style="max-width: 800px">
              <ElFormItem
                v-for="(value, field) in configData[key]"
                :key="field"
                :label="fieldLabels[field] ? `${fieldLabels[field]} (${field})` : field"
              >
                <!-- 0/1 开关类型 -->
                <ElSwitch
                  v-if="isSwitchField(field, value)"
                  v-model="configData[key][field]"
                  active-value="1"
                  inactive-value="0"
                />
                <!-- 端口号类型 -->
                <ElInput
                  v-else-if="isPortField(field)"
                  v-model.number="configData[key][field]"
                  type="number"
                  :placeholder="`请输入${fieldLabels[field] || field}`"
                />
                <!-- 密码类型 -->
                <ElInput
                  v-else-if="field === 'secret' || field === 'icePwd' || field === 'passPhrase'"
                  v-model="configData[key][field]"
                  type="password"
                  show-password
                  :placeholder="`请输入${fieldLabels[field] || field}`"
                />
                <!-- 长文本类型 -->
                <ElInput
                  v-else-if="isLongTextField(field)"
                  v-model="configData[key][field]"
                  type="textarea"
                  :rows="3"
                  :placeholder="`请输入${fieldLabels[field] || field}`"
                />
                <!-- 普通文本输入 -->
                <ElInput
                  v-else
                  v-model="configData[key][field]"
                  :placeholder="`请输入${fieldLabels[field] || field}`"
                />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton v-if="key === 'general'" @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { mediaServerApi } from '@/api/mediaServerApi'
import type { ZLMConfig } from '@/types/media-server'

const route = useRoute()
const router = useRouter()

const serverId = ref<number>(parseInt(route.params.id as string))
const serverName = ref('')
const loading = ref(false)
const saving = ref(false)
const restarting = ref(false)
const activeTab = ref('api')

// 配置数据
const configData = ref<ZLMConfig>({})

// Tab 标签映射
const tabLabels: Record<string, string> = {
  api: 'API',
  http: 'HTTP',
  rtsp: 'RTSP',
  rtmp: 'RTMP',
  general: '通用',
  hls: 'HLS',
  hook: 'Hook',
  rtc: 'WebRTC',
  record: '录制',
  protocol: '协议',
  cluster: '集群',
  ffmpeg: 'FFmpeg',
  rtp: 'RTP',
  rtp_proxy: 'RTP代理',
  shell: 'Shell',
  srt: 'SRT',
  onvif: 'ONVIF',
  multicast: '组播'
}

// 字段标签映射
const fieldLabels: Record<string, string> = {
  // API 字段
  apiDebug: 'API调试',
  defaultSnap: '默认截图路径',
  downloadRoot: '下载根目录',
  secret: 'API密钥',
  snapRoot: '截图根目录',

  // HTTP 字段
  port: 'HTTP端口',
  sslport: 'HTTPS端口',
  rootPath: '根目录',
  allow_cross_domains: '允许跨域',
  allow_ip_range: '允许IP范围',
  charSet: '字符集',
  dirMenu: '目录菜单',
  forbidCacheSuffix: '禁止缓存后缀',
  forwarded_ip_header: '转发IP头',
  keepAliveSecond: '保持连接秒数',
  maxReqSize: '最大请求大小(KB)',
  notFound: '404页面内容',
  sendBufSize: '发送缓冲区大小',
  virtualPath: '虚拟路径',

  // RTSP 字段
  authBasic: '基本认证',
  directProxy: '直接代理',
  handshakeSecond: '握手超时秒数',
  keepAliveSecond: '保活秒数',
  lowLatency: '低延迟',
  rtpTransportType: 'RTP传输类型',

  // RTMP 字段
  enhanced: '增强模式',

  // General 字段
  mediaServerId: '服务器ID',
  listen_ip: '监听IP地址',
  maxStreamWaitMS: '最大流等待毫秒数',
  flowThreshold: '流量阈值',
  enableVhost: '启用虚拟主机',
  enable_ffmpeg_log: '启用FFmpeg日志',
  check_nvidia_dev: '检查NVIDIA设备',
  resetWhenRePlay: '重播时重置',
  mergeWriteMS: '合并写入毫秒数',
  streamNoneReaderDelayMS: '流无读者延迟毫秒数',
  unready_frame_cache: '未就绪帧缓存',
  wait_add_track_ms: '等待添加轨道毫秒数',
  wait_audio_track_data_ms: '等待音频轨道数据毫秒数',
  wait_track_ready_ms: '等待轨道就绪毫秒数',
  broadcast_player_count_changed: '广播播放数变化',

  // 其他通用字段
  enable: '启用',
  enableTurn: '启用TURN',
  enable_audio: '启用音频',
  enable_fmp4: '启用FMP4',
  enable_hls: '启用HLS',
  enable_hls_fmp4: '启用HLS-FMP4',
  enable_mp4: '启用MP4',
  enable_rtmp: '启用RTMP',
  enable_rtsp: '启用RTSP',
  enable_ts: '启用TS',
  enableFmp4: '启用FMP4录制',

  // RTC 字段
  externIP: '外部IP',
  icePort: 'ICE端口',
  iceTcpPort: 'ICE TCP端口',
  icePwd: 'ICE密码',
  iceUfrag: 'ICE用户片段',
  interfaces: '网络接口',
  portRange: '端口范围',
  preferredCodecA: '首选音频编解码器',
  preferredCodecV: '首选视频编解码器',
  signalingPort: '信令端口',
  signalingSslPort: '信令SSL端口',
  tcpPort: 'TCP端口',
  timeoutSec: '超时秒数',

  // Hook 字段
  alive_interval: '保活间隔',
  retry: '重试次数',
  retry_delay: '重试延迟',
  timeoutSec: '超时秒数',
  stream_changed_schemas: '流变化模式',
  on_flow_report: '流量上报回调',
  on_http_access: 'HTTP访问回调',
  on_play: '播放回调',
  on_publish: '发布回调',
  on_record_mp4: 'MP4录制回调',
  on_record_ts: 'TS录制回调',
  on_rtp_server_timeout: 'RTP服务器超时回调',
  on_rtsp_auth: 'RTSP认证回调',
  on_rtsp_realm: 'RTSP认证域',
  on_send_rtp_stopped: '停止发送RTP回调',
  on_server_exited: '服务器退出回调',
  on_server_keepalive: '服务器保活回调',
  on_server_started: '服务器启动回调',
  on_shell_login: 'Shell登录回调',
  on_stream_changed: '流变化回调',
  on_stream_none_reader: '流无读者回调',
  on_stream_not_found: '流未找到回调',

  // Cluster 字段
  origin_url: '源站URL',
  retry_count: '重试次数',
  timeout_sec: '超时秒数',

  // FFmpeg 字段
  bin: 'FFmpeg路径',
  cmd: '命令模板',
  log: '日志路径',
  restart_sec: '重启秒数',
  snap: '截图命令模板',

  // Protocol 字段
  add_mute_audio: '添加静音音频',
  auto_close: '自动关闭',
  continue_push_ms: '继续推送毫秒数',
  fmp4_demand: 'FMP4按需',
  hls_demand: 'HLS按需',
  hls_save_path: 'HLS保存路径',
  modify_stamp: '修改时间戳',
  mp4_as_player: 'MP4作为播放器',
  mp4_max_second: 'MP4最大秒数',
  mp4_save_path: 'MP4保存路径',
  paced_sender_ms: ' paced发送毫秒数',
  rtmp_demand: 'RTMP按需',
  rtsp_demand: 'RTSP按需',
  ts_demand: 'TS按需',

  // Record 字段
  appName: '应用名',
  fastStart: '快速启动',
  fileBufSize: '文件缓冲区大小',
  fileRepeat: '文件重复',
  sampleMS: '采样毫秒数',

  // RTP 字段
  audioMtuSize: '音频MTU大小',
  h264_stap_a: 'H264 STAP-A',
  rtpMaxSize: 'RTP最大大小',
  videoMtuSize: '视频MTU大小',

  // RTP Proxy 字段
  dumpDir: '转储目录',
  gop_cache: 'GOP缓存',
  h264_pt: 'H264 负载类型',
  h265_pt: 'H265 负载类型',
  merge_frame: '合并帧',
  opus_pt: 'Opus 负载类型',
  port_range: '端口范围',
  ps_pt: 'PS 负载类型',
  rtp_g711_dur_ms: 'RTP G711 持续时间毫秒数',
  udp_recv_socket_buffer: 'UDP接收套接字缓冲区',

  // Shell 字段
  maxReqSize: '最大请求大小',

  // SRT 字段
  latencyMul: '延迟倍数',
  passPhrase: '密码',
  pktBufSize: '包缓冲区大小',

  // ONVIF 字段
  port: 'ONVIF端口',

  // Multicast 字段
  addrMax: '最大组播地址',
  addrMin: '最小组播地址',
  udpTTL: 'UDP TTL'
}

// 计算配置的所有 key
const configKeys = computed(() => {
  return Object.keys(configData.value)
})

// 判断是否是开关类型字段 (值为 '0' 或 '1')
const isSwitchField = (field: string, value: string): boolean => {
  const switchFields = [
    'apiDebug',
    'allow_cross_domains',
    'dirMenu',
    'authBasic',
    'directProxy',
    'lowLatency',
    'enhanced',
    'enableVhost',
    'enable_ffmpeg_log',
    'check_nvidia_dev',
    'resetWhenRePlay',
    'broadcast_player_count_changed',
    'enable',
    'enableTurn',
    'enable_audio',
    'enable_fmp4',
    'enable_hls',
    'enable_hls_fmp4',
    'enable_mp4',
    'enable_rtmp',
    'enable_rtsp',
    'enable_ts',
    'enableFmp4',
    'fastStart',
    'fileRepeat',
    'add_mute_audio',
    'auto_close',
    'fmp4_demand',
    'hls_demand',
    'h264_stap_a',
    'mp4_as_player',
    'paced_sender_ms',
    'modify_stamp',
    'rtmp_demand',
    'rtsp_demand',
    'ts_demand',
    'gop_cache',
    'merge_frame'
  ]
  return switchFields.includes(field) && (value === '0' || value === '1')
}

// 判断是否是端口号字段
const isPortField = (field: string): boolean => {
  return field === 'port' || field === 'sslport' || field === 'icePort' ||
         field === 'iceTcpPort' || field === 'signalingPort' || field === 'signalingSslPort' ||
         field === 'tcpPort' || field === 'rtpTransportType'
}

// 判断是否是长文本字段
const isLongTextField = (field: string): boolean => {
  return field === 'cmd' || field === 'snap' || field === 'notFound' ||
         field.startsWith('on_') || field === 'preferredCodecA' || field === 'preferredCodecV' ||
         field === 'allow_ip_range' || field === 'forbidCacheSuffix' || field === 'interfaces'
}

// 初始化默认配置数据
const getDefaultConfig = (): ZLMConfig => ({
  api: {
    apiDebug: '0',
    defaultSnap: './www/logo.png',
    downloadRoot: './www',
    secret: '',
    snapRoot: './www/snap/'
  },
  http: {
    allow_cross_domains: '1',
    allow_ip_range: '::1,127.0.0.1',
    charSet: 'utf-8',
    dirMenu: '1',
    forbidCacheSuffix: '',
    forwarded_ip_header: '',
    keepAliveSecond: '30',
    maxReqSize: '40960',
    notFound: '',
    port: '8086',
    rootPath: './www',
    sendBufSize: '65536',
    sslport: '8443',
    virtualPath: ''
  },
  rtsp: {
    authBasic: '0',
    directProxy: '1',
    handshakeSecond: '15',
    keepAliveSecond: '15',
    lowLatency: '0',
    port: '554',
    rtpTransportType: '-1',
    sslport: '0'
  },
  rtmp: {
    directProxy: '1',
    enhanced: '1',
    handshakeSecond: '15',
    keepAliveSecond: '15',
    port: '1935',
    sslport: '0'
  },
  general: {
    broadcast_player_count_changed: '0',
    check_nvidia_dev: '1',
    enableVhost: '0',
    enable_ffmpeg_log: '0',
    flowThreshold: '1024',
    listen_ip: '::',
    maxStreamWaitMS: '15000',
    mediaServerId: '',
    mergeWriteMS: '0',
    resetWhenRePlay: '1',
    streamNoneReaderDelayMS: '20000',
    unready_frame_cache: '100',
    wait_add_track_ms: '3000',
    wait_audio_track_data_ms: '1000',
    wait_track_ready_ms: '10000'
  },
  hls: {
    broadcastRecordTs: '0',
    deleteDelaySec: '10',
    fastRegister: '0',
    fileBufSize: '65536',
    segDelay: '0',
    segDur: '2',
    segKeep: '0',
    segNum: '3',
    segRetain: '5'
  },
  hook: {
    alive_interval: '10.0',
    enable: '1',
    on_flow_report: '',
    on_http_access: '',
    on_play: '',
    on_publish: '',
    on_record_mp4: '',
    on_record_ts: '',
    on_rtp_server_timeout: '',
    on_rtsp_auth: '',
    on_rtsp_realm: '',
    on_send_rtp_stopped: '',
    on_server_exited: '',
    on_server_keepalive: '',
    on_server_started: '',
    on_shell_login: '',
    on_stream_changed: '',
    on_stream_none_reader: '',
    on_stream_not_found: '',
    retry: '1',
    retry_delay: '3.0',
    stream_changed_schemas: 'rtsp/rtmp/fmp4/ts/hls/hls.fmp4',
    timeoutSec: '10'
  },
  rtc: {
    bfilter: '0',
    enableTurn: '1',
    externIP: '',
    icePort: '3478',
    icePwd: 'ZLMediaKit',
    iceTcpPort: '3478',
    iceTransportPolicy: '0',
    iceUfrag: 'ZLMediaKit',
    interfaces: '',
    maxRtpCacheMS: '5000',
    maxRtpCacheSize: '2048',
    max_bitrate: '0',
    min_bitrate: '0',
    nackIntervalRatio: '1.0',
    nackMaxCount: '15',
    nackMaxMS: '3000',
    nackMaxSize: '2048',
    nackRtpSize: '8',
    port: '8000',
    portRange: '50000-65000',
    preferredCodecA: 'PCMA,PCMU,opus,mpeg4-generic',
    preferredCodecV: 'H264,H265,AV1,VP9,VP8',
    rembBitRate: '0',
    signalingPort: '3000',
    signalingSslPort: '3001',
    start_bitrate: '0',
    tcpPort: '8000',
    timeoutSec: '15'
  },
  record: {
    appName: 'record',
    enableFmp4: '0',
    fastStart: '0',
    fileBufSize: '65536',
    fileRepeat: '0',
    sampleMS: '500'
  },
  protocol: {
    add_mute_audio: '1',
    auto_close: '0',
    continue_push_ms: '15000',
    enable_audio: '1',
    enable_fmp4: '1',
    enable_hls: '1',
    enable_hls_fmp4: '0',
    enable_mp4: '0',
    enable_rtmp: '1',
    enable_rtsp: '1',
    enable_ts: '1',
    fmp4_demand: '0',
    hls_demand: '0',
    hls_save_path: './www',
    modify_stamp: '2',
    mp4_as_player: '0',
    mp4_max_second: '3600',
    mp4_save_path: './www',
    paced_sender_ms: '0',
    rtmp_demand: '0',
    rtsp_demand: '0',
    ts_demand: '0'
  },
  cluster: {
    origin_url: '',
    retry_count: '3',
    timeout_sec: '15'
  },
  ffmpeg: {
    bin: '',
    cmd: '%s -re -i %s -c:a aac -strict -2 -ar 44100 -ab 48k -c:v libx264 -f flv %s',
    log: './ffmpeg/ffmpeg.log',
    restart_sec: '0',
    snap: '%s -i %s -y -f mjpeg -frames:v 1 -an %s'
  },
  rtp: {
    audioMtuSize: '600',
    h264_stap_a: '1',
    lowLatency: '0',
    rtpMaxSize: '10',
    videoMtuSize: '1400'
  },
  rtp_proxy: {
    dumpDir: '',
    gop_cache: '1',
    h264_pt: '96',
    h265_pt: '98',
    merge_frame: '1',
    opus_pt: '97',
    port: '10000',
    port_range: '30000-35000',
    ps_pt: '98',
    rtp_g711_dur_ms: '100',
    timeoutSec: '20',
    udp_recv_socket_buffer: '4194304'
  },
  shell: {
    maxReqSize: '1024',
    port: '0'
  },
  srt: {
    latencyMul: '4',
    passPhrase: '',
    pktBufSize: '8192',
    port: '9000',
    timeoutSec: '5'
  },
  onvif: {
    port: '3702'
  },
  multicast: {
    addrMax: '239.255.255.255',
    addrMin: '239.0.0.0',
    udpTTL: '64'
  }
})

// Load config
const loadConfig = async () => {
  loading.value = true
  try {
    const [config, server] = await Promise.all([
      mediaServerApi.getConfig(serverId.value),
      mediaServerApi.getDetail(serverId.value)
    ])

    if (config) {
      console.log('Loaded config:', config)
      // 合并默认配置和服务器配置
      const defaultConfig = getDefaultConfig()
      configData.value = { ...defaultConfig, ...config }
      // 过滤掉ffmpeg.bin，zlm是不能配置该项的
      if (configData.value.ffmpeg) {
        delete configData.value.ffmpeg.bin
      }
      // delete http.port
      if (configData.value.http) {
        delete configData.value.http.port
      }
    }

    if (server) {
      serverName.value = server.name
    }
  } catch (error: any) {
    console.error('Failed to load config:', error)
    ElMessage.error(error.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

// Save config
const saveConfig = async () => {
  saving.value = true
  try {
    await mediaServerApi.saveConfig(serverId.value, configData.value)
    ElMessage.success('保存成功')
  } catch (error: any) {
    console.error('Failed to save config:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// Reset to defaults
const resetDefaults = async () => {
  try {
    await mediaServerApi.resetConfig(serverId.value)
    await loadConfig()
    ElMessage.success('已重置为默认配置')
  } catch (error: any) {
    console.error('Failed to reset config:', error)
    ElMessage.error(error.message || '重置失败')
  }
}

// Restart server
const restartServer = async () => {
  // 先确认提示
  ElMessageBox.confirm(
    '注意：ZLM 流媒体服务器必须以 -d 守护进程模式启动才能使用重启功能。如果服务器以前台方式运行，重启将无法生效。是否继续？',
    '重启服务确认',
    {
      confirmButtonText: '确定重启',
      cancelButtonText: '取消',
      type: 'warning',
      distinguishCancelAndClose: true
    }
  ).then(async () => {
    restarting.value = true
    try {
      await mediaServerApi.restart(serverId.value)
      ElMessage.success('服务器正在重启...')
    } catch (error: any) {
      console.error('Failed to restart server:', error)
      ElMessage.error(error.message || '重启失败')
    } finally {
      restarting.value = false
    }
  }).catch(() => {
    // 用户取消
  })
}

// Go back
const goBack = () => {
  router.back()
}

onMounted(() => {
  loadConfig()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.media-server-config-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: $spacing-md;
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      h2 {
        margin: 0;
        color: var(--text-main);
        font-size: 18px;
        font-weight: 600;
      }
    }
  }

  .config-content {
    .config-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-base);
      border-radius: $radius-panel;
    }
  }
}
</style>
