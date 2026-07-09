<template>
  <ElDrawer
    v-model="visible"
    title="视频播放"
    :size="drawerSize"
    :close-on-click-modal="false"
    @close="handleClose"
    @open="handleOpen"
    append-to-body
    direction="rtl"
    class="fullscreen-drawer"
  >
    <div class="lr-layout">
      <!-- ========== 左侧：播放器区域 ========== -->
      <div class="left-panel">
        <!-- 顶部工具栏（播放器切换） -->
        <div v-if="showPlayerTabs" class="player-toolbar">
          <ElDropdown trigger="click" @command="handlePlayerChange">
            <ElButton size="small" type="primary" plain>
              {{ playerTypeLabel }}
              <ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="p in playerTypeOptions"
                  :key="p.value"
                  :command="p.value"
                  :disabled="p.value === activePlayer"
                >
                  <span v-if="p.value === activePlayer" style="margin-right:4px">✓</span>
                  {{ p.label }}
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
        <!-- 播放器容器 -->
        <div ref="playerContainerRef" class="player-container">
          <EasyPlayerPro
            v-if="isPlayerVisible('easyplayer')"
            ref="easyplayerRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :has-audio="true"
            :is-live="isLive"
            autoplay
            @error="handlePlayerError"
          />
          <JessibucaPlayer
            v-if="isPlayerVisible('jessibuca')"
            ref="jessibucaRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :has-audio="true"
            :is-live="isLive"
            autoplay
            fluent
            @error="handlePlayerError"
          />
          <WebRTCPlayer
            v-if="isPlayerVisible('webrtc')"
            ref="webrtcRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :is-live="isLive"
            autoplay
            @error="handlePlayerError"
          />
          <H265WebPlayer
            v-if="isPlayerVisible('h265web')"
            ref="h265webRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :has-audio="true"
            :is-live="isLive"
            autoplay
            @error="handlePlayerError"
          />
          <XGPlayer
            v-if="isPlayerVisible('xgplayer')"
            ref="xgplayerRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :is-live="isLive"
            autoplay
            @error="handlePlayerError"
          />
        </div>
      </div>

      <!-- ========== 右侧：控制面板 ========== -->
      <div class="right-panel">
        <ElTabs v-model="activeTab" class="ctrl-tabs" @tab-change="handleTabChange">
          <!-- 实时视频（流选择） -->
          <ElTabPane label="实时视频" name="media">
            <div v-if="availableStreams.length > 0" class="stream-selector">
              <span class="label">播放地址</span>
              <ElSelect
                v-model="selectedStreamUrl"
                placeholder="选择播放地址"
                @change="handleStreamChange"
              >
                <ElOption
                  v-for="stream in availableStreams"
                  :key="stream.key"
                  :label="stream.label"
                  :value="stream.url"
                >
                  <span class="stream-option-label">{{ stream.label }}</span>
                  <span class="stream-option-url">{{ stream.url }}</span>
                </ElOption>
              </ElSelect>
            </div>
            <ElEmpty v-else description="暂无可用流地址" :image-size="60" />
          </ElTabPane>

          <!-- 云台控制 -->
          <ElTabPane
            v-if="props.deviceId && props.channelId"
            label="云台控制"
            name="ptz"
          >
            <PTZControlPanel ref="ptzPanelRef" :channel-id="ptzChannelId" />
          </ElTabPane>

          <!-- 编码信息 -->
          <ElTabPane v-if="currentUrl && !props.showPlayUrlList" label="编码信息" name="codec">
            <MediaInfo
              ref="mediaInfoRef"
              :url="currentUrl"
              :stream-id="props.streamInfo?.stream_id"
            />
          </ElTabPane>

          <!-- 播放地址（流代理模式：列出全部地址并可复制） -->
          <ElTabPane
            v-if="props.showPlayUrlList && playUrlEntries.length"
            label="播放地址"
            name="playUrls"
          >
            <div class="play-url-list">
              <div v-for="item in playUrlEntries" :key="item.key" class="play-url-row">
                <span class="play-url-label">{{ item.label }}</span>
                <ElInput :model-value="item.url" readonly size="small">
                  <template #append>
                    <ElButton @click="copyPlayUrl(item.url)">复制</ElButton>
                  </template>
                </ElInput>
              </div>
            </div>
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import JessibucaPlayer from './JessibucaPlayer.vue'
import WebRTCPlayer from './WebRTCPlayer.vue'
import H265WebPlayer from './H265WebPlayer.vue'
import XGPlayer from './XGPlayer.vue'
import EasyPlayerPro from './EasyPlayerPro.vue'
import PTZControlPanel from '@/components/ptz/PTZControlPanel.vue'
import MediaInfo from './MediaInfo.vue'
import { gb28181Api } from '@/api/gb28181Api'

// Player container ref for size calculations
const playerContainerRef = ref<HTMLDivElement>()

interface StreamInfo {
  testUrl?: string // 测试模式下所有播放器使用的原始 URL
  stream_id?: string // 流 ID
  flv?: string
  https_flv?: string
  ws_flv?: string
  wss_flv?: string
  hls?: string
  https_hls?: string
  ws_hls?: string
  wss_hls?: string
  rtc?: string
  rtcs?: string
  rtmp?: string
  rtmps?: string
  rtsp?: string
  rtsps?: string
  fmp4?: string
  https_fmp4?: string
  ws_fmp4?: string
  wss_fmp4?: string
  ts?: string
  https_ts?: string
  ws_ts?: string
  wss_ts?: string
  mp4?: string
  https_mp4?: string
  [key: string]: string | undefined
}

interface Props {
  modelValue: boolean
  deviceId?: string
  channelId?: string
  streamInfo?: StreamInfo | null
  hasAudio?: boolean
  isLive?: boolean // 是否为直播流
  showPlayUrlList?: boolean // 流代理模式：用「播放地址」列表替换「编码信息」
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  hasAudio: false,
  isLive: false,
  showPlayUrlList: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

// 播放地址列表（流代理模式）：把 streamInfo 里的地址项整理成可复制的清单
const PLAY_URL_LABELS: Record<string, string> = {
  rtsp: 'RTSP', rtsps: 'RTSPS',
  rtmp: 'RTMP', rtmps: 'RTMPS',
  flv: 'FLV', http_flv: 'HTTP-FLV', https_flv: 'HTTPS-FLV',
  ws_flv: 'WS-FLV', wss_flv: 'WSS-FLV',
  hls: 'HLS', https_hls: 'HTTPS-HLS', ws_hls: 'WS-HLS', wss_hls: 'WSS-HLS',
  hls_fmp4: 'HLS-FMP4', https_hls_fmp4: 'HTTPS-HLS-FMP4',
  rtc: 'WebRTC', rtcs: 'WebRTC (Secure)',
  fmp4: 'FMP4', https_fmp4: 'HTTPS-FMP4', ws_fmp4: 'WS-FMP4', wss_fmp4: 'WSS-FMP4',
  ts: 'TS', https_ts: 'HTTPS-TS', ws_ts: 'WS-TS', wss_ts: 'WSS-TS',
  mp4: 'MP4', https_mp4: 'HTTPS-MP4'
}
const playUrlEntries = computed(() => {
  if (!props.streamInfo) return []
  return Object.entries(props.streamInfo)
    .filter(([k, v]) => PLAY_URL_LABELS[k] && typeof v === 'string' && v)
    .map(([k, v]) => ({ key: k, label: PLAY_URL_LABELS[k], url: v as string }))
})
const copyPlayUrl = (url: string) => {
  navigator.clipboard.writeText(url).then(() => ElMessage.success('已复制'))
}

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Track if we started a live stream (for cleanup)
const hasStartedLive = ref(false)

// Active player state - must be defined before availableStreams
const activePlayer = ref<'easyplayer' | 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer'>('easyplayer')
const activeTab = ref('media')
const isSwitching = ref(false)

// Available stream URLs (excluding rtsp) - filtered by current player capability and page protocol
const availableStreams = computed(() => {
  if (!props.streamInfo) return []

  const streams: Array<{ key: string; label: string; url: string }> = []

  // Detect current page protocol
  const isSecurePage = location.protocol === 'https:'

  // Define stream configs with player compatibility
  // ws_flv, wss_flv: only for jessibuca, h265web
  // http_flv, https_flv: for jessibuca, h265web, xgplayer
  // hls, https_hls: for h265web, xgplayer
  // hls_fmp4, https_hls_fmp4: for h265web, xgplayer
  // rtc, rtcs: only for webrtc
  const allStreamConfigs = [
    { key: 'http_flv', label: 'FLV (HTTP)', players: ['jessibuca', 'h265web', 'xgplayer'], secure: false },
    { key: 'https_flv', label: 'FLV (HTTPS)', players: ['jessibuca', 'h265web', 'xgplayer'], secure: true },
    { key: 'ws_flv', label: 'FLV (WS)', players: ['jessibuca', 'h265web'], secure: false },
    { key: 'wss_flv', label: 'FLV (WSS)', players: ['jessibuca', 'h265web'], secure: true },
    { key: 'flv', label: 'FLV', players: ['jessibuca', 'h265web', 'xgplayer'], secure: false },
    { key: 'hls', label: 'HLS', players: ['h265web', 'xgplayer'], secure: false },
    { key: 'https_hls', label: 'HLS (HTTPS)', players: ['h265web', 'xgplayer'], secure: true },
    { key: 'hls_fmp4', label: 'HLS-FMP4', players: ['h265web', 'xgplayer'], secure: false },
    { key: 'https_hls_fmp4', label: 'HLS-FMP4 (HTTPS)', players: ['h265web', 'xgplayer'], secure: true },
    { key: 'rtc', label: 'WebRTC', players: ['webrtc'], secure: false },
    { key: 'rtcs', label: 'WebRTC (Secure)', players: ['webrtc'], secure: true },
    { key: 'rtmp', label: 'RTMP', players: ['h265web', 'xgplayer'], secure: false },
    { key: 'mp4', label: 'MP4', players: ['h265web', 'xgplayer'], secure: false },
    { key: 'https_mp4', label: 'MP4 (HTTPS)', players: ['h265web', 'xgplayer'], secure: true }
  ]

  for (const config of allStreamConfigs) {
    // Only include streams that:
    // 1. Exist in streamInfo
    // 2. Are compatible with current active player
    // 3. Match page security protocol (https page only shows secure streams, http page shows all)
    if (props.streamInfo[config.key] && config.players.includes(activePlayer.value)) {
      // Filter by protocol: if page is HTTPS, only show HTTPS streams
      if (isSecurePage && !config.secure) continue

      streams.push({
        key: config.key,
        label: config.label,
        url: props.streamInfo[config.key]
      })
    }
  }

  return streams
})

// Current selected stream URL (can be switched by user)
const selectedStreamUrl = ref<string>('')

// Watch for stream changes
watch(() => availableStreams.value, (streams) => {
  if (streams.length > 0 && !selectedStreamUrl.value) {
    const isSecurePage = location.protocol === 'https:'

    // Select default stream based on player type and page protocol
    if (activePlayer.value === 'easyplayer') {
      // EasyPlayer: supports all protocols, prefer WebSocket-based streams
      if (isSecurePage) {
        // HTTPS page: prefer wss_flv, then https_flv, then https_hls
        const wssFlvStream = streams.find(s => s.key === 'wss_flv')
        const httpsFlvStream = streams.find(s => s.key === 'https_flv')
        const httpsHlsStream = streams.find(s => s.key === 'https_hls')
        const rtcsStream = streams.find(s => s.key === 'rtcs')
        selectedStreamUrl.value = wssFlvStream?.url || httpsFlvStream?.url || httpsHlsStream?.url || rtcsStream?.url || streams[0].url
      } else {
        // HTTP page: prefer ws_flv, then http_flv, then hls
        const wsFlvStream = streams.find(s => s.key === 'ws_flv')
        const httpFlvStream = streams.find(s => s.key === 'http_flv')
        const hlsStream = streams.find(s => s.key === 'hls')
        const rtcStream = streams.find(s => s.key === 'rtc')
        selectedStreamUrl.value = wsFlvStream?.url || httpFlvStream?.url || hlsStream?.url || rtcStream?.url || streams[0].url
      }
    } else if (activePlayer.value === 'xgplayer') {
      // XGPlayer: prefer http_flv/https_flv or hls/https_hls
      if (isSecurePage) {
        // HTTPS page: prefer https_flv, then https_hls, then https_hls_fmp4
        const httpsFlvStream = streams.find(s => s.key === 'https_flv')
        const httpsHlsStream = streams.find(s => s.key === 'https_hls')
        const httpsHlsFmp4Stream = streams.find(s => s.key === 'https_hls_fmp4')
        selectedStreamUrl.value = httpsFlvStream?.url || httpsHlsStream?.url || httpsHlsFmp4Stream?.url || streams[0].url
      } else {
        // HTTP page: prefer http_flv, then hls, then hls_fmp4
        const httpFlvStream = streams.find(s => s.key === 'http_flv')
        const hlsStream = streams.find(s => s.key === 'hls')
        const hlsFmp4Stream = streams.find(s => s.key === 'hls_fmp4')
        selectedStreamUrl.value = httpFlvStream?.url || hlsStream?.url || hlsFmp4Stream?.url || streams[0].url
      }
    } else {
      // Jessibuca/H265Web: prefer ws_flv/wss_flv
      if (isSecurePage) {
        // HTTPS page: prefer wss_flv
        const wssFlvStream = streams.find(s => s.key === 'wss_flv')
        const httpsFlvStream = streams.find(s => s.key === 'https_flv')
        selectedStreamUrl.value = wssFlvStream?.url || httpsFlvStream?.url || streams[0].url
      } else {
        // HTTP page: prefer ws_flv
        const wsFlvStream = streams.find(s => s.key === 'ws_flv')
        selectedStreamUrl.value = wsFlvStream?.url || streams[0].url
      }
    }
  }
}, { immediate: true })

// Reset selected stream when player changes
watch(activePlayer, () => {
  // Clear the selected URL so it will be re-selected based on new player
  selectedStreamUrl.value = ''
})

// Watch for stream info changes (when drawer opens)
watch(() => props.streamInfo, (newStreamInfo) => {
  if (newStreamInfo && props.isLive) {
    // Mark that we started a live stream
    hasStartedLive.value = true
  }
}, { immediate: true })

// Player configuration
const playerConfigs = {
  easyplayer: ['ws_flv', 'wss_flv', 'flv', 'https_flv', 'hls', 'https_hls', 'rtc', 'rtcs', 'hls_fmp4', 'https_hls_fmp4'],
  jessibuca: ['ws_flv', 'wss_flv', 'flv', 'https_flv'],
  webrtc: ['rtc', 'rtcs'],
  h265web: ['ws_flv', 'wss_flv'],
  xgplayer: ['hls', 'https_hls', 'mp4', 'fmp4', 'ts']
}

// 根据可用的流协议判断哪些播放器应该显示
const availablePlayers = computed(() => {
  if (!props.streamInfo) return ['easyplayer'] // 默认显示 easyplayer

  const players: string[] = ['easyplayer'] // EasyPlayerPro 始终显示（支持所有协议）

  // 检查 WebRTC
  if (props.streamInfo.rtc || props.streamInfo.rtcs) {
    if (!players.includes('webrtc')) players.push('webrtc')
  }

  // 检查 Jessibuca (FLV)
  if (props.streamInfo.ws_flv || props.streamInfo.wss_flv || props.streamInfo.flv || props.streamInfo.https_flv) {
    if (!players.includes('jessibuca')) players.push('jessibuca')
  }

  // 检查 XGPlayer 支持的格式
  if (props.streamInfo.hls || props.streamInfo.https_hls || props.streamInfo.mp4 || props.streamInfo.https_mp4 ||
      props.streamInfo.fmp4 || props.streamInfo.https_fmp4 || props.streamInfo.ts || props.streamInfo.https_ts) {
    if (!players.includes('xgplayer')) players.push('xgplayer')
  }

  // H265Web 支持几乎所有格式，只要有任何流就显示
  if (Object.keys(props.streamInfo).length > 0) {
    if (!players.includes('h265web')) {
      players.push('h265web')
    }
  }

  console.log('Available players:', players)

  return players.length > 0 ? players : ['easyplayer']
})

// Check if only one player is configured
const showPlayerTabs = computed(() => {
  return availablePlayers.value.length > 1
})

const jessibucaRef = ref()
const webrtcRef = ref()
const h265webRef = ref()
const xgplayerRef = ref()
const easyplayerRef = ref()
const mediaInfoRef = ref()
const ptzPanelRef = ref<{ stopVoiceTalk: () => Promise<void>; isVoiceTalkActive: () => boolean } | null>(null)

// 播放器类型选项
const playerTypeOptions = [
  { label: 'EasyPlayer (推荐)', value: 'easyplayer' },
  { label: 'Jessibuca (FLV)', value: 'jessibuca' },
  { label: 'H265Web (通用)', value: 'h265web' },
  { label: 'XGPlayer (HLS)', value: 'xgplayer' },
  { label: 'WebRTC', value: 'webrtc' },
]

// 当前播放器显示名
const playerTypeLabel = computed(() => {
  return playerTypeOptions.find(p => p.value === activePlayer.value)?.label.split(' ')[0] ?? activePlayer.value
})

// Drawer dimensions
const drawerSize = '100%'

// Player dimensions in pixels (computed from container)
const playerWidth = computed(() => {
  if (playerContainerRef.value) {
    return `${playerContainerRef.value.clientWidth}px`
  }
  return '100%'
})

const playerHeight = computed(() => {
  if (playerContainerRef.value) {
    return `${playerContainerRef.value.clientHeight}px`
  }
  return '100%'
})

// 判断播放器是否可见
const isPlayerVisible = (playerName: string) => {
  return visible.value && activePlayer.value === playerName && !isSwitching.value
}

// Compute current URL based on active player (or use user-selected stream)
const currentUrl = computed(() => {
  // If user manually selected a stream, use it
  if (selectedStreamUrl.value) {
    return selectedStreamUrl.value
  }

  if (!props.streamInfo) return ''

  // 优先使用 testUrl（测试模式下所有播放器使用同一个 URL）
  if (props.streamInfo.testUrl) {
    console.log('Using testUrl for all players:', props.streamInfo.testUrl)
    return props.streamInfo.testUrl
  }

  const protocols = playerConfigs[activePlayer.value]
  if (!protocols) return ''

  console.log('activePlayer:', activePlayer.value, 'protocols:', protocols)

  // Prefer HTTPS/WSS protocols if using HTTPS
  if (location.protocol === 'https:') {
    const secureProtocol = protocols.find(p => p.startsWith('wss_') || p.startsWith('https_') || p.startsWith('rtcs'))
    if (secureProtocol && props.streamInfo[secureProtocol]) {
      console.log('Using secure protocol:', secureProtocol, props.streamInfo[secureProtocol])
      return props.streamInfo[secureProtocol]
    }
  }

  // Fall back to first available protocol
  for (const protocol of protocols) {
    if (props.streamInfo[protocol]) {
      console.log('Using protocol:', protocol, props.streamInfo[protocol])
      return props.streamInfo[protocol]
    }
  }

  console.warn('No available URL for', activePlayer.value, 'protocols:', protocols)
  return ''
})

// PTZ Control Panel - combine device_id and channel_id
const ptzChannelId = computed(() => {
  if (!props.deviceId || !props.channelId) return ''
  // PTZControlPanel expects format: {device_id}-{channel_id}
  return `${props.deviceId}-${props.channelId}`
})

// Handle player change with proper cleanup
const handlePlayerChange = async (newPlayerName: string) => {
  if (newPlayerName === activePlayer.value) return

  console.log('Player switching from', activePlayer.value, 'to', newPlayerName)

  isSwitching.value = true

  // 销毁当前播放器
  const currentPlayerRef = getCurrentPlayerRef()
  if (currentPlayerRef?.value?.destroy) {
    try {
      await currentPlayerRef.value.destroy()
    } catch (e) {
      console.warn('Error destroying player:', e)
    }
  }

  // 清空 ref
  if (activePlayer.value === 'easyplayer') {
    easyplayerRef.value = null
  } else if (activePlayer.value === 'jessibuca') {
    jessibucaRef.value = null
  } else if (activePlayer.value === 'webrtc') {
    webrtcRef.value = null
  } else if (activePlayer.value === 'h265web') {
    h265webRef.value = null
  } else if (activePlayer.value === 'xgplayer') {
    xgplayerRef.value = null
  }

  // 切换播放器
  activePlayer.value = newPlayerName as typeof activePlayer.value

  // 等待 DOM 更新
  await nextTick()

  // 再等待一下确保清理完成
  setTimeout(() => {
    isSwitching.value = false

    // 新播放器会在 v-if 更新后自动初始化
    const newPlayerRef = getCurrentPlayerRef()
    if (newPlayerRef?.value && currentUrl.value) {
      // 确保播放器有 URL
      console.log('New player initialized, should play:', currentUrl.value)
    }
  }, 150)
}

// Get current player ref
const getCurrentPlayerRef = () => {
  switch (activePlayer.value) {
    case 'easyplayer':
      return easyplayerRef
    case 'jessibuca':
      return jessibucaRef
    case 'webrtc':
      return webrtcRef
    case 'h265web':
      return h265webRef
    case 'xgplayer':
      return xgplayerRef
    default:
      return easyplayerRef
  }
}

// Handle player error
const handlePlayerError = (error: any) => {
  console.error('Player error:', error)
  ElMessage.error('播放器错误: ' + (error.message || error))
}

// Handle tab change
const handleTabChange = (tabName: string) => {
  console.log('Tab changed to:', tabName)

  // Handle MediaInfo start/stop
  if (mediaInfoRef.value) {
    if (tabName === 'codec') {
      // Start media info polling
      mediaInfoRef.value.startTask?.()
    } else {
      // Stop media info polling when switching away
      mediaInfoRef.value.stopTask?.()
    }
  }
}

// Handle close
const handleClose = async () => {
  // Stop voice talk if active
  if (ptzPanelRef.value?.isVoiceTalkActive?.()) {
    try {
      await ptzPanelRef.value.stopVoiceTalk()
      console.log('Voice talk stopped on drawer close')
    } catch (error) {
      console.error('Failed to stop voice talk on drawer close:', error)
    }
  }

  // Stop live stream if we started one
  await stopLiveStream()

  // Destroy all players to prevent memory leaks
  if (easyplayerRef.value?.destroy) {
    easyplayerRef.value.destroy()
    easyplayerRef.value = null
  }
  if (jessibucaRef.value?.destroy) {
    jessibucaRef.value.destroy()
    jessibucaRef.value = null
  }
  if (webrtcRef.value?.destroy) {
    webrtcRef.value.destroy()
    webrtcRef.value = null
  }
  if (h265webRef.value?.destroy) {
    h265webRef.value.destroy()
    h265webRef.value = null
  }
  if (xgplayerRef.value?.destroy) {
    xgplayerRef.value.destroy()
    xgplayerRef.value = null
  }

  // Stop media info polling
  if (mediaInfoRef.value?.stopTask) {
    mediaInfoRef.value.stopTask()
  }

  visible.value = false
}

// Stop live stream API call
const stopLiveStream = async () => {
  if (!hasStartedLive.value || !props.deviceId || !props.channelId || !props.isLive) {
    return
  }

  try {
    await gb28181Api.stopLive({
      device_id: props.deviceId,
      channel_id: props.channelId
    })
    console.log('Live stream stopped successfully')
    hasStartedLive.value = false
  } catch (error: any) {
    console.error('Failed to stop live stream:', error)
    // Don't show error message on close, just log it
  }
}

// Handle stream URL change
const handleStreamChange = (url: string) => {
  selectedStreamUrl.value = url
  // Player will automatically use the new URL via the computed currentUrl
}

// Handle open
const handleOpen = () => {
  // Reset switching state when drawer opens
  isSwitching.value = false
}

// 根据 URL 判断最佳播放器
const detectBestPlayer = (url: string): 'easyplayer' | 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer' => {
  if (!url) return 'easyplayer'

  // 提取 URL 路径（去掉查询参数和 hash）
  const urlPath = url.split('?')[0].split('#')[0].toLowerCase()
  const extension = urlPath.substring(urlPath.lastIndexOf('.'))

  console.log('Detecting best player for URL:', url, 'extension:', extension)

  // WebRTC 协议优先
  if (url.includes('rtc://') || url.includes('webrtc://')) {
    return 'webrtc'
  }

  // 默认使用 easyplayer（支持格式最广）
  return 'easyplayer'
}

// Initialize active player
watch(() => props.streamInfo, (newStreamInfo) => {
  if (newStreamInfo && visible.value) {
    let bestPlayer: 'easyplayer' | 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer' = 'easyplayer'

    // 测试模式：根据 testUrl 判断
    if (newStreamInfo.testUrl) {
      bestPlayer = detectBestPlayer(newStreamInfo.testUrl)
    } else {
      // API 模式：默认使用 easyplayer（支持所有协议）
      bestPlayer = 'easyplayer'
    }

    console.log('Auto-selected player:', bestPlayer, 'available:', availablePlayers.value)

    // 确保选择的播放器在可用列表中
    if (availablePlayers.value.includes(bestPlayer)) {
      if (activePlayer.value !== bestPlayer) {
        activePlayer.value = bestPlayer
      }
    } else {
      // 如果检测到的播放器不可用，使用可用列表中的第一个
      const fallbackPlayer = availablePlayers.value[0] as 'easyplayer' | 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer'
      console.log('Best player not available, using fallback:', fallbackPlayer)
      if (activePlayer.value !== fallbackPlayer) {
        activePlayer.value = fallbackPlayer
      }
    }
  }
}, { immediate: true })

// 监听可用播放器列表变化，确保当前播放器始终可用
watch(() => availablePlayers.value, (newAvailablePlayers) => {
  if (!newAvailablePlayers.includes(activePlayer.value)) {
    const fallbackPlayer = newAvailablePlayers[0] as 'easyplayer' | 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer'
    console.log('Current player no longer available, switching to:', fallbackPlayer)
    activePlayer.value = fallbackPlayer
  }
})

// Cleanup on unmount - stop live stream and voice talk
onUnmounted(async () => {
  // Stop voice talk if active
  if (ptzPanelRef.value?.isVoiceTalkActive?.()) {
    try {
      await ptzPanelRef.value.stopVoiceTalk()
      console.log('Voice talk stopped on component unmount')
    } catch (error) {
      console.error('Failed to stop voice talk on component unmount:', error)
    }
  }

  await stopLiveStream()
})
</script>

<style scoped lang="scss">
/* ===== Drawer 全屏覆盖 ===== */
:deep(.fullscreen-drawer) {
  .el-drawer__header {
    margin-bottom: 0;
    padding: 12px 20px;
    border-bottom: 1px solid var(--el-border-color-light);
  }

  .el-drawer__body {
    padding: 0;
    overflow: hidden;
    height: calc(100% - 53px); /* 53px = header height */
  }
}

/* ===== 左右布局容器 ===== */
.lr-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
  gap: 10px;
  background: var(--el-border-color-light); /* gap 颜色即分隔线 */
}

/* ===== 左侧：播放器 ===== */
.left-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: #000;
}

.player-container {
  flex: 1;
  min-height: 0;
  background: #000;
  position: relative;

  > * {
    width: 100% !important;
    height: 100% !important;
  }
}

/* 播放器顶部工具栏 */
.player-toolbar {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 4px 8px;
  background: #111;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);

  :deep(.el-button) {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    color: #ddd;

    &:hover {
      background: rgba(255, 255, 255, 0.18);
      border-color: rgba(255, 255, 255, 0.4);
      color: #fff;
    }
  }
}

/* ===== 右侧：控制面板 ===== */
.right-panel {
  width: 560px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 5px;
  background: var(--el-bg-color);

  .ctrl-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-tabs__header) {
      flex-shrink: 0;
      margin: 0;
    }

    :deep(.el-tabs__content) {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0;
    }

    /* 让各 tab-pane 根据内容自动撑高，不强制 100% 裁切 */
    :deep(.el-tab-pane) {
      height: auto;
      min-height: 100%;
    }
  }
}

/* ===== 实时视频 tab 内容 ===== */
.stream-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;

  .label {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-secondary);
  }

  :deep(.el-select) {
    width: 100%;
  }
}

.stream-option-label {
  font-weight: 500;
  margin-right: 12px;
}

.stream-option-url {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.play-url-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}

.play-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.play-url-label {
  width: 92px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
</style>
