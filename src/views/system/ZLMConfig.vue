<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElCard, ElForm, ElFormItem, ElInput, ElSwitch, ElInputNumber, ElButton, ElMessage, ElTabPane, ElTabs, ElAlert, ElDivider } from 'element-plus'
import { systemApi } from '@/api/systemApi'

const loading = ref(false)
const saving = ref(false)
const restarting = ref(false)

// API settings
const apiForm = ref({
  apiDebug: 0,
  defaultSnap: './www/logo.png',
  downloadRoot: './www',
  secret: '',
  snapRoot: './www/snap/'
})

// Cluster settings
const clusterForm = ref({
  origin_url: '',
  retry_count: 3,
  timeout_sec: 15
})

// FFmpeg settings
const ffmpegForm = ref({
  bin: '/opt/homebrew/bin/ffmpeg',
  cmd: '',
  log: './ffmpeg/ffmpeg.log',
  restart_sec: 0,
  snap: ''
})

// General settings
const generalForm = ref({
  broadcast_player_count_changed: 0,
  check_nvidia_dev: 1,
  enableVhost: 0,
  enable_ffmpeg_log: 0,
  flowThreshold: 1024,
  listen_ip: '::',
  maxStreamWaitMS: 15000,
  mediaServerId: '',
  mergeWriteMS: 0,
  resetWhenRePlay: 1,
  streamNoneReaderDelayMS: 20000,
  unready_frame_cache: 100,
  wait_add_track_ms: 3000,
  wait_audio_track_data_ms: 1000,
  wait_track_ready_ms: 10000
})

// HLS settings
const hlsForm = ref({
  broadcastRecordTs: 0,
  deleteDelaySec: 10,
  fastRegister: 0,
  fileBufSize: 65536,
  segDelay: 0,
  segDur: 2,
  segKeep: 0,
  segNum: 3,
  segRetain: 5
})

// Hook settings
const hookForm = ref({
  alive_interval: 10,
  enable: 1,
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
  retry: 1,
  retry_delay: 3,
  stream_changed_schemas: 'rtsp/rtmp/fmp4/ts/hls/hls.fmp4',
  timeoutSec: 10
})

// HTTP settings
const httpForm = ref({
  allow_cross_domains: 1,
  allow_ip_range: '::1,127.0.0.1,172.16.0.0-172.31.255.255,192.168.0.0-192.168.255.255,10.0.0.0-10.255.255.255',
  charSet: 'utf-8',
  dirMenu: 1,
  forbidCacheSuffix: '',
  forwarded_ip_header: '',
  keepAliveSecond: 30,
  maxReqSize: 40960,
  notFound: '',
  port: 8086,
  rootPath: './www',
  sendBufSize: 65536,
  sslport: 8443,
  virtualPath: ''
})

// Multicast settings
const multicastForm = ref({
  addrMax: '239.255.255.255',
  addrMin: '239.0.0.0',
  udpTTL: 64
})

// ONVIF settings
const onvifForm = ref({
  port: 3702
})

// Protocol settings
const protocolForm = ref({
  add_mute_audio: 1,
  auto_close: 0,
  continue_push_ms: 15000,
  enable_audio: 1,
  enable_fmp4: 1,
  enable_hls: 1,
  enable_hls_fmp4: 0,
  enable_mp4: 0,
  enable_rtmp: 1,
  enable_rtsp: 1,
  enable_ts: 1,
  fmp4_demand: 0,
  hls_demand: 0,
  hls_save_path: './www',
  modify_stamp: 2,
  mp4_as_player: 0,
  mp4_max_second: 3600,
  mp4_save_path: './www',
  paced_sender_ms: 0,
  rtmp_demand: 0,
  rtsp_demand: 0,
  ts_demand: 0
})

// Record settings
const recordForm = ref({
  appName: 'record',
  enableFmp4: 0,
  fastStart: 0,
  fileBufSize: 65536,
  fileRepeat: 0,
  sampleMS: 500
})

// RTC settings
const rtcForm = ref({
  bfilter: 0,
  enableTurn: 1,
  externIP: '',
  icePort: 3478,
  icePwd: 'ZLMediaKit',
  iceTcpPort: 3478,
  iceTransportPolicy: 0,
  iceUfrag: 'ZLMediaKit',
  interfaces: '',
  maxRtpCacheMS: 5000,
  maxRtpCacheSize: 2048,
  max_bitrate: 0,
  min_bitrate: 0,
  nackIntervalRatio: 1,
  nackMaxCount: 15,
  nackMaxMS: 3000,
  nackMaxSize: 2048,
  nackRtpSize: 8,
  port: 8000,
  portRange: '50000-65000',
  preferredCodecA: 'PCMA,PCMU,opus,mpeg4-generic',
  preferredCodecV: 'H264,H265,AV1,VP9,VP8',
  rembBitRate: 0,
  signalingPort: 3000,
  signalingSslPort: 3001,
  start_bitrate: 0,
  tcpPort: 8000,
  timeoutSec: 15
})

// RTMP settings
const rtmpForm = ref({
  directProxy: 1,
  enhanced: 1,
  handshakeSecond: 15,
  keepAliveSecond: 15,
  port: 1935,
  sslport: 0
})

// RTP settings
const rtpForm = ref({
  audioMtuSize: 600,
  h264_stap_a: 1,
  lowLatency: 0,
  rtpMaxSize: 10,
  videoMtuSize: 1400
})

// RTP Proxy settings
const rtpProxyForm = ref({
  dumpDir: '',
  gop_cache: 1,
  h264_pt: 98,
  h265_pt: 99,
  merge_frame: 1,
  opus_pt: 100,
  port: 10000,
  port_range: '30000-35000',
  ps_pt: 96,
  rtp_g711_dur_ms: 100,
  timeoutSec: 20,
  udp_recv_socket_buffer: 4194304
})

// RTSP settings
const rtspForm = ref({
  authBasic: 0,
  directProxy: 1,
  handshakeSecond: 15,
  keepAliveSecond: 15,
  lowLatency: 0,
  port: 554,
  rtpTransportType: -1,
  sslport: 0
})

// Shell settings
const shellForm = ref({
  maxReqSize: 1024,
  port: 0
})

// SRT settings
const srtForm = ref({
  latencyMul: 4,
  passPhrase: '',
  pktBufSize: 8192,
  port: 9000,
  timeoutSec: 5
})

// Load config
const loadConfig = async () => {
  loading.value = true
  try {
    // API 响应拦截器已自动提取 response.data (src/utils/request.ts:106-108)
    // 当 code === 0 时，直接返回 res.data
    const data = await systemApi.getZLMConfig()

    if (data) {
      apiForm.value = { ...apiForm.value, ...data.api }
      clusterForm.value = { ...clusterForm.value, ...data.cluster }
      ffmpegForm.value = { ...ffmpegForm.value, ...data.ffmpeg }
      generalForm.value = { ...generalForm.value, ...data.general }
      hlsForm.value = { ...hlsForm.value, ...data.hls }
      hookForm.value = { ...hookForm.value, ...data.hook }
      httpForm.value = { ...httpForm.value, ...data.http }
      multicastForm.value = { ...multicastForm.value, ...data.multicast }
      onvifForm.value = { ...onvifForm.value, ...data.onvif }
      protocolForm.value = { ...protocolForm.value, ...data.protocol }
      recordForm.value = { ...recordForm.value, ...data.record }
      rtcForm.value = { ...rtcForm.value, ...data.rtc }
      rtmpForm.value = { ...rtmpForm.value, ...data.rtmp }
      rtpForm.value = { ...rtpForm.value, ...data.rtp }
      rtpProxyForm.value = { ...rtpProxyForm.value, ...data.rtp_proxy }
      rtspForm.value = { ...rtspForm.value, ...data.rtsp }
      shellForm.value = { ...shellForm.value, ...data.shell }
      srtForm.value = { ...srtForm.value, ...data.srt }
    }
  } catch (error: any) {
    console.error('Failed to load ZLM config:', error)
    ElMessage.error(error.message || '加载配置失败')
  } finally {
    loading.value = false
  }
}

// Save config
const saveConfig = async () => {
  saving.value = true
  try {
    const data = {
      api: apiForm.value,
      cluster: clusterForm.value,
      ffmpeg: ffmpegForm.value,
      general: generalForm.value,
      hls: hlsForm.value,
      hook: hookForm.value,
      http: httpForm.value,
      multicast: multicastForm.value,
      onvif: onvifForm.value,
      protocol: protocolForm.value,
      record: recordForm.value,
      rtc: rtcForm.value,
      rtmp: rtmpForm.value,
      rtp: rtpForm.value,
      rtp_proxy: rtpProxyForm.value,
      rtsp: rtspForm.value,
      shell: shellForm.value,
      srt: srtForm.value
    }

    // API 响应拦截器已自动提取 response.data (src/utils/request.ts:106-108)
    // 保存成功时返回数据，失败时抛出异常
    await systemApi.saveZLMConfig(data)
    ElMessage.success('保存成功')
  } catch (error: any) {
    console.error('Failed to save ZLM config:', error)
    ElMessage.error(error.message || '保存失败')
  } finally {
    saving.value = false
  }
}

// Restart ZLM
const restartZLM = async () => {
  restarting.value = true
  try {
    // API 响应拦截器已自动提取 response.data (src/utils/request.ts:106-108)
    await systemApi.restartZLM()
    ElMessage.success('ZLM服务正在重启...')
  } catch (error: any) {
    console.error('Failed to restart ZLM:', error)
    ElMessage.error(error.message || '重启失败')
  } finally {
    restarting.value = false
  }
}

// Reset to defaults
const resetDefaults = async () => {
  try {
    // API 响应拦截器已自动提取 response.data (src/utils/request.ts:106-108)
    await systemApi.resetZLMConfig()
    await loadConfig()
    ElMessage.success('已重置为默认配置')
  } catch (error: any) {
    console.error('Failed to reset config:', error)
    ElMessage.error(error.message || '重置失败')
  }
}

onMounted(() => {
  loadConfig()
})
</script>

<template>
  <div class="zlm-config-container">
    <div class="page-header">
      <h2>ZLMediaKit 配置</h2>
      <div class="header-actions">
        <ElButton :loading="restarting" type="danger" @click="restartZLM">重启服务</ElButton>
      </div>
    </div>

    <div class="stats-content">
      <ElCard class="stats-card full-width">
        <ElAlert
          title="修改配置后需要重启ZLM服务才能生效"
          type="warning"
          :closable="false"
          style="margin-bottom: 20px"
        />

        <ElTabs v-loading="loading">
          <!-- API 配置 -->
          <ElTabPane label="API" name="api">
            <ElForm :model="apiForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="API Secret">
                <ElInput v-model="apiForm.secret" type="password" show-password placeholder="请输入API密钥" />
                <div class="form-tip">用于API请求鉴权，请妥善保管</div>
              </ElFormItem>
              <ElFormItem label="默认截图">
                <ElInput v-model="apiForm.defaultSnap" />
              </ElFormItem>
              <ElFormItem label="下载根目录">
                <ElInput v-model="apiForm.downloadRoot" />
              </ElFormItem>
              <ElFormItem label="截图根目录">
                <ElInput v-model="apiForm.snapRoot" />
              </ElFormItem>
              <ElFormItem label="API调试">
                <ElSwitch v-model="apiForm.apiDebug" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- FFmpeg 配置 -->
          <ElTabPane label="FFmpeg" name="ffmpeg">
            <ElForm :model="ffmpegForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="FFmpeg路径">
                <ElInput v-model="ffmpegForm.bin" />
                <div class="form-tip">FFmpeg可执行文件的完整路径</div>
              </ElFormItem>
              <ElFormItem label="命令模板">
                <ElInput v-model="ffmpegForm.cmd" type="textarea" :rows="3" />
              </ElFormItem>
              <ElFormItem label="截图命令">
                <ElInput v-model="ffmpegForm.snap" type="textarea" :rows="3" />
              </ElFormItem>
              <ElFormItem label="日志路径">
                <ElInput v-model="ffmpegForm.log" />
              </ElFormItem>
              <ElFormItem label="重启间隔(秒)">
                <ElInputNumber v-model="ffmpegForm.restart_sec" :min="0" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- Hook 配置 -->
          <ElTabPane label="Hook" name="hook">
            <ElForm :model="hookForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="启用Hook">
                <ElSwitch v-model="hookForm.enable" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="心跳间隔(秒)">
                <ElInputNumber v-model="hookForm.alive_interval" :min="1" :max="300" />
              </ElFormItem>
              <ElFormItem label="超时时间(秒)">
                <ElInputNumber v-model="hookForm.timeoutSec" :min="1" :max="300" />
              </ElFormItem>
              <ElFormItem label="重试次数">
                <ElInputNumber v-model="hookForm.retry" :min="0" :max="10" />
              </ElFormItem>
              <ElFormItem label="重试延迟(秒)">
                <ElInputNumber v-model="hookForm.retry_delay" :min="1" :max="60" />
              </ElFormItem>
              <ElFormItem label="流变化协议">
                <ElInput v-model="hookForm.stream_changed_schemas" />
              </ElFormItem>

              <ElDivider />
              <h4>Hook 事件回调</h4>

              <ElFormItem label="流量上报">
                <ElInput v-model="hookForm.on_flow_report" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="HTTP访问">
                <ElInput v-model="hookForm.on_http_access" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="播放事件">
                <ElInput v-model="hookForm.on_play" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="推流事件">
                <ElInput v-model="hookForm.on_publish" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="MP4录制">
                <ElInput v-model="hookForm.on_record_mp4" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="TS录制">
                <ElInput v-model="hookForm.on_record_ts" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="RTP超时">
                <ElInput v-model="hookForm.on_rtp_server_timeout" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="RTSP认证">
                <ElInput v-model="hookForm.on_rtsp_auth" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="RTSP领域">
                <ElInput v-model="hookForm.on_rtsp_realm" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="发送RTP停止">
                <ElInput v-model="hookForm.on_send_rtp_stopped" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="服务器退出">
                <ElInput v-model="hookForm.on_server_exited" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="服务器心跳">
                <ElInput v-model="hookForm.on_server_keepalive" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="服务器启动">
                <ElInput v-model="hookForm.on_server_started" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="Shell登录">
                <ElInput v-model="hookForm.on_shell_login" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="流变化">
                <ElInput v-model="hookForm.on_stream_changed" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="流无观看者">
                <ElInput v-model="hookForm.on_stream_none_reader" :disabled="!hookForm.enable" />
              </ElFormItem>
              <ElFormItem label="流未找到">
                <ElInput v-model="hookForm.on_stream_not_found" :disabled="!hookForm.enable" />
              </ElFormItem>

              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- HTTP 配置 -->
          <ElTabPane label="HTTP" name="http">
            <ElForm :model="httpForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="HTTP端口">
                <ElInputNumber v-model="httpForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="HTTPS端口">
                <ElInputNumber v-model="httpForm.sslport" :min="0" :max="65535" />
              </ElFormItem>
              <ElFormItem label="根目录">
                <ElInput v-model="httpForm.rootPath" />
              </ElFormItem>
              <ElFormItem label="虚拟路径">
                <ElInput v-model="httpForm.virtualPath" />
              </ElFormItem>
              <ElFormItem label="允许跨域">
                <ElSwitch v-model="httpForm.allow_cross_domains" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="允许IP范围">
                <ElInput v-model="httpForm.allow_ip_range" type="textarea" :rows="3" />
              </ElFormItem>
              <ElFormItem label="目录菜单">
                <ElSwitch v-model="httpForm.dirMenu" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="保持连接(秒)">
                <ElInputNumber v-model="httpForm.keepAliveSecond" :min="1" />
              </ElFormItem>
              <ElFormItem label="最大请求大小(KB)">
                <ElInputNumber v-model="httpForm.maxReqSize" :min="1" />
              </ElFormItem>
              <ElFormItem label="发送缓冲大小">
                <ElInputNumber v-model="httpForm.sendBufSize" :min="1" />
              </ElFormItem>
              <ElFormItem label="字符集">
                <ElInput v-model="httpForm.charSet" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- RTSP 配置 -->
          <ElTabPane label="RTSP" name="rtsp">
            <ElForm :model="rtspForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="RTSP端口">
                <ElInputNumber v-model="rtspForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="RTSP SSL端口">
                <ElInputNumber v-model="rtspForm.sslport" :min="0" :max="65535" />
              </ElFormItem>
              <ElFormItem label="握手超时(秒)">
                <ElInputNumber v-model="rtspForm.handshakeSecond" :min="1" />
              </ElFormItem>
              <ElFormItem label="保持连接(秒)">
                <ElInputNumber v-model="rtspForm.keepAliveSecond" :min="1" />
              </ElFormItem>
              <ElFormItem label="直接代理">
                <ElSwitch v-model="rtspForm.directProxy" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="低延迟">
                <ElSwitch v-model="rtspForm.lowLatency" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="Basic认证">
                <ElSwitch v-model="rtspForm.authBasic" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- RTMP 配置 -->
          <ElTabPane label="RTMP" name="rtmp">
            <ElForm :model="rtmpForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="RTMP端口">
                <ElInputNumber v-model="rtmpForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="RTMP SSL端口">
                <ElInputNumber v-model="rtmpForm.sslport" :min="0" :max="65535" />
              </ElFormItem>
              <ElFormItem label="握手超时(秒)">
                <ElInputNumber v-model="rtmpForm.handshakeSecond" :min="1" />
              </ElFormItem>
              <ElFormItem label="保持连接(秒)">
                <ElInputNumber v-model="rtmpForm.keepAliveSecond" :min="1" />
              </ElFormItem>
              <ElFormItem label="直接代理">
                <ElSwitch v-model="rtmpForm.directProxy" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="增强">
                <ElSwitch v-model="rtmpForm.enhanced" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- RTC 配置 -->
          <ElTabPane label="RTC" name="rtc">
            <ElForm :model="rtcForm" label-width="200px" style="max-width: 700px">
              <ElFormItem label="RTC端口">
                <ElInputNumber v-model="rtcForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="TCP端口">
                <ElInputNumber v-model="rtcForm.tcpPort" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="信令端口">
                <ElInputNumber v-model="rtcForm.signalingPort" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="信令SSL端口">
                <ElInputNumber v-model="rtcForm.signalingSslPort" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="ICE端口">
                <ElInputNumber v-model="rtcForm.icePort" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="ICE TCP端口">
                <ElInputNumber v-model="rtcForm.iceTcpPort" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="端口范围">
                <ElInput v-model="rtcForm.portRange" />
              </ElFormItem>
              <ElFormItem label="启用TURN">
                <ElSwitch v-model="rtcForm.enableTurn" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="外部IP">
                <ElInput v-model="rtcForm.externIP" placeholder="多个以,隔开" />
              </ElFormItem>
              <ElFormItem label="ICE用户碎片">
                <ElInput v-model="rtcForm.iceUfrag" />
              </ElFormItem>
              <ElFormItem label="ICE密码">
                <ElInput v-model="rtcForm.icePwd" type="password" show-password />
              </ElFormItem>
              <ElFormItem label="首选音频编解码">
                <ElInput v-model="rtcForm.preferredCodecA" />
              </ElFormItem>
              <ElFormItem label="首选视频编解码">
                <ElInput v-model="rtcForm.preferredCodecV" />
              </ElFormItem>
              <ElFormItem label="超时时间(秒)">
                <ElInputNumber v-model="rtcForm.timeoutSec" :min="1" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- HLS 配置 -->
          <ElTabPane label="HLS" name="hls">
            <ElForm :model="hlsForm" label-width="180px" style="max-width: 700px">
              <ElFormItem label="启用HLS">
                <ElSwitch v-model="protocolForm.enable_hls" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="分段数量">
                <ElInputNumber v-model="hlsForm.segNum" :min="1" />
              </ElFormItem>
              <ElFormItem label="分段时长(秒)">
                <ElInputNumber v-model="hlsForm.segDur" :min="1" :step="0.1" />
              </ElFormItem>
              <ElFormItem label="保留分段数">
                <ElInputNumber v-model="hlsForm.segRetain" :min="0" />
              </ElFormItem>
              <ElFormItem label="删除延迟(秒)">
                <ElInputNumber v-model="hlsForm.deleteDelaySec" :min="0" />
              </ElFormItem>
              <ElFormItem label="文件缓冲大小">
                <ElInputNumber v-model="hlsForm.fileBufSize" :min="1" />
              </ElFormItem>
              <ElFormItem label="快速注册">
                <ElSwitch v-model="hlsForm.fastRegister" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="广播录制TS">
                <ElSwitch v-model="hlsForm.broadcastRecordTs" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem>
                <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
                <ElButton @click="resetDefaults">重置默认</ElButton>
              </ElFormItem>
            </ElForm>
          </ElTabPane>

          <!-- 其他配置 -->
          <ElTabPane label="其他" name="other">
            <h4>通用配置</h4>
            <ElForm :model="generalForm" label-width="200px" style="max-width: 700px">
              <ElFormItem label="服务器ID">
                <ElInput v-model="generalForm.mediaServerId" />
              </ElFormItem>
              <ElFormItem label="监听IP">
                <ElInput v-model="generalForm.listen_ip" />
              </ElFormItem>
              <ElFormItem label="流最大等待时间(ms)">
                <ElInputNumber v-model="generalForm.maxStreamWaitMS" :min="1" />
              </ElFormItem>
              <ElFormItem label="流无人阅读延迟(ms)">
                <ElInputNumber v-model="generalForm.streamNoneReaderDelayMS" :min="1" />
              </ElFormItem>
            </ElForm>

            <ElDivider />

            <h4>集群配置</h4>
            <ElForm :model="clusterForm" label-width="200px" style="max-width: 700px">
              <ElFormItem label="源站URL">
                <ElInput v-model="clusterForm.origin_url" />
              </ElFormItem>
              <ElFormItem label="重试次数">
                <ElInputNumber v-model="clusterForm.retry_count" :min="0" />
              </ElFormItem>
              <ElFormItem label="超时时间(秒)">
                <ElInputNumber v-model="clusterForm.timeout_sec" :min="1" />
              </ElFormItem>
            </ElForm>

            <ElDivider />

            <h4>协议配置</h4>
            <ElForm :model="protocolForm" label-width="200px" style="max-width: 700px">
              <ElFormItem label="启用RTSP">
                <ElSwitch v-model="protocolForm.enable_rtsp" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="启用RTMP">
                <ElSwitch v-model="protocolForm.enable_rtmp" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="启用HLS">
                <ElSwitch v-model="protocolForm.enable_hls" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="启用TS">
                <ElSwitch v-model="protocolForm.enable_ts" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="启用FMP4">
                <ElSwitch v-model="protocolForm.enable_fmp4" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="启用音频">
                <ElSwitch v-model="protocolForm.enable_audio" :active-value="1" :inactive-value="0" />
              </ElFormItem>
              <ElFormItem label="添加静音音频">
                <ElSwitch v-model="protocolForm.add_mute_audio" :active-value="1" :inactive-value="0" />
              </ElFormItem>
            </ElForm>

            <ElDivider />

            <h4>RTP 配置</h4>
            <ElForm :model="rtpForm" label-width="200px" style="max-width: 700px">
              <ElFormItem label="音频MTU大小">
                <ElInputNumber v-model="rtpForm.audioMtuSize" :min="1" />
              </ElFormItem>
              <ElFormItem label="视频MTU大小">
                <ElInputNumber v-model="rtpForm.videoMtuSize" :min="1" />
              </ElFormItem>
              <ElFormItem label="RTP最大大小">
                <ElInputNumber v-model="rtpForm.rtpMaxSize" :min="1" />
              </ElFormItem>
            </ElForm>

            <ElDivider />

            <h4>RTP 代理配置</h4>
            <ElForm :model="rtpProxyForm" label-width="200px" style="max-width: 700px">
              <ElFormItem label="端口">
                <ElInputNumber v-model="rtpProxyForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="端口范围">
                <ElInput v-model="rtpProxyForm.port_range" />
              </ElFormItem>
              <ElFormItem label="超时时间(秒)">
                <ElInputNumber v-model="rtpProxyForm.timeoutSec" :min="1" />
              </ElFormItem>
              <ElFormItem label="GOP缓存">
                <ElSwitch v-model="rtpProxyForm.gop_cache" :active-value="1" :inactive-value="0" />
              </ElFormItem>
            </ElForm>

            <ElDivider />

            <h4>其他服务</h4>
            <ElForm label-width="200px" style="max-width: 700px">
              <ElFormItem label="ONVIF端口">
                <ElInputNumber v-model="onvifForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="Shell端口">
                <ElInputNumber v-model="shellForm.port" :min="0" :max="65535" />
              </ElFormItem>
              <ElFormItem label="SRT端口">
                <ElInputNumber v-model="srtForm.port" :min="1" :max="65535" />
              </ElFormItem>
              <ElFormItem label="组播最小地址">
                <ElInput v-model="multicastForm.addrMin" />
              </ElFormItem>
              <ElFormItem label="组播最大地址">
                <ElInput v-model="multicastForm.addrMax" />
              </ElFormItem>
            </ElForm>

            <ElFormItem>
              <ElButton type="primary" :loading="saving" @click="saveConfig">保存</ElButton>
              <ElButton @click="resetDefaults">恢复当前配置</ElButton>
            </ElFormItem>
          </ElTabPane>
        </ElTabs>
      </ElCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.zlm-config-container {
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

    h2 {
      margin: 0;
      color: var(--text-main);
      font-size: 18px;
      font-weight: 600;
    }
  }

  .stats-content {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;

    .stats-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-base);
      border-radius: $radius-panel;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-card__body) {
        padding: 24px;
      }
    }
  }

  .form-tip {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 4px;
  }

  h4 {
    margin: 16px 0 12px 0;
    color: var(--text-main);
    font-size: 14px;
    font-weight: 600;
  }

  .el-divider {
    margin: 24px 0;
  }
}
</style>
