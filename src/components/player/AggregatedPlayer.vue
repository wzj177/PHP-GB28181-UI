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
  >
    <div class="aggregated-player">
      <!-- Player tabs -->
      <ElTabs v-if="showPlayerTabs" v-model="activePlayer" type="card" @tab-change="handlePlayerChange">
        <ElTabPane v-if="availablePlayers.includes('jessibuca')" label="Jessibuca" name="jessibuca">
          <div ref="playerContainerRef" class="player-container">
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
          </div>
        </ElTabPane>
        <ElTabPane v-if="availablePlayers.includes('webrtc')" label="WebRTC" name="webrtc">
          <div ref="playerContainerRef" class="player-container">
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
          </div>
        </ElTabPane>
        <ElTabPane v-if="availablePlayers.includes('h265web')" label="H265Web" name="h265web">
          <div ref="playerContainerRef" class="player-container">
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
          </div>
        </ElTabPane>
        <ElTabPane v-if="availablePlayers.includes('xgplayer')" label="XGPlayer" name="xgplayer">
          <div ref="playerContainerRef" class="player-container">
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
        </ElTabPane>
      </ElTabs>

      <!-- Single player (if only one is configured) -->
      <template v-else>
        <div ref="playerContainerRef" class="player-container">
          <JessibucaPlayer
            v-if="availablePlayers.includes('jessibuca') && activePlayer === 'jessibuca'"
            ref="jessibucaRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :has-audio="true"
            :is-live="isLive"
            autoplay
            fluent
          />
          <WebRTCPlayer
            v-if="availablePlayers.includes('webrtc') && activePlayer === 'webrtc'"
            ref="webrtcRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :is-live="isLive"
            autoplay
          />
          <H265WebPlayer
            v-if="availablePlayers.includes('h265web') && activePlayer === 'h265web'"
            ref="h265webRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :has-audio="true"
            :is-live="isLive"
            autoplay
          />
          <XGPlayer
            v-if="availablePlayers.includes('xgplayer') && activePlayer === 'xgplayer'"
            ref="xgplayerRef"
            :url="currentUrl"
            :width="playerWidth"
            :height="playerHeight"
            :is-live="isLive"
            autoplay
          />
        </div>
      </template>
    </div>

    <!-- Bottom tabs -->
    <ElTabs v-model="activeTab" @tab-change="handleTabChange">
      <ElTabPane label="实时视频" name="media">
        <div class="media-info">
          <div class="info-row">
            <span class="label">播放地址：</span>
            <ElInput v-model="playUrl" readonly>
              <template #append>
                <ElButton @click="copyUrl(playUrl)" icon="DocumentCopy" />
              </template>
            </ElInput>
          </div>
          <div class="info-row">
            <span class="label">iframe：</span>
            <ElInput v-model="iframeUrl" readonly>
              <template #append>
                <ElButton @click="copyUrl(iframeUrl)" icon="DocumentCopy" />
              </template>
            </ElInput>
          </div>
          <div v-if="streamInfo" class="info-row">
            <span class="label">资源地址：</span>
            <ElInput v-model="resourceUrl" readonly>
              <template #append>
                <ElDropdown @command="copyUrl" trigger="click">
                  <ElButton icon="ArrowDown" />
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem v-if="streamInfo.flv" :command="streamInfo.flv">
                        <ElTag>FLV:</ElTag>
                        <span class="url-text">{{ streamInfo.flv }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.https_flv" :command="streamInfo.https_flv">
                        <ElTag>FLV(HTTPS):</ElTag>
                        <span class="url-text">{{ streamInfo.https_flv }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.ws_flv" :command="streamInfo.ws_flv">
                        <ElTag>FLV(WS):</ElTag>
                        <span class="url-text">{{ streamInfo.ws_flv }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.wss_flv" :command="streamInfo.wss_flv">
                        <ElTag>FLV(WSS):</ElTag>
                        <span class="url-text">{{ streamInfo.wss_flv }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.hls" :command="streamInfo.hls">
                        <ElTag>HLS:</ElTag>
                        <span class="url-text">{{ streamInfo.hls }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.https_hls" :command="streamInfo.https_hls">
                        <ElTag>HLS(HTTPS):</ElTag>
                        <span class="url-text">{{ streamInfo.https_hls }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.rtc" :command="streamInfo.rtc">
                        <ElTag>RTC:</ElTag>
                        <span class="url-text">{{ streamInfo.rtc }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.rtcs" :command="streamInfo.rtcs">
                        <ElTag>RTCS:</ElTag>
                        <span class="url-text">{{ streamInfo.rtcs }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.rtmp" :command="streamInfo.rtmp">
                        <ElTag>RTMP:</ElTag>
                        <span class="url-text">{{ streamInfo.rtmp }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.rtsp" :command="streamInfo.rtsp">
                        <ElTag>RTSP:</ElTag>
                        <span class="url-text">{{ streamInfo.rtsp }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.mp4" :command="streamInfo.mp4">
                        <ElTag>MP4:</ElTag>
                        <span class="url-text">{{ streamInfo.mp4 }}</span>
                      </ElDropdownItem>
                      <ElDropdownItem v-if="streamInfo.https_mp4" :command="streamInfo.https_mp4">
                        <ElTag>MP4(HTTPS):</ElTag>
                        <span class="url-text">{{ streamInfo.https_mp4 }}</span>
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </template>
            </ElInput>
          </div>
        </div>
      </ElTabPane>

      <ElTabPane label="云台控制" name="ptz" v-if="props.deviceId && props.channelId">
        <PTZControlPanel :channel-id="ptzChannelId" />
      </ElTabPane>

      <ElTabPane label="编码信息" name="codec" v-if="props.streamInfo">
        <MediaInfo
          ref="mediaInfoRef"
          :app="streamApp"
          :stream="streamId"
          :media-server-id="mediaServerId"
        />
      </ElTabPane>
    </ElTabs>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
// @ts-ignore - Icons exist but type definitions are incorrect
import { DocumentCopy, ArrowDown } from '@element-plus/icons-vue'
import JessibucaPlayer from './JessibucaPlayer.vue'
import WebRTCPlayer from './WebRTCPlayer.vue'
import H265WebPlayer from './H265WebPlayer.vue'
import XGPlayer from './XGPlayer.vue'
import PTZControlPanel from '@/components/ptz/PTZControlPanel.vue'
import MediaInfo from './MediaInfo.vue'

// Player container ref for size calculations
const playerContainerRef = ref<HTMLDivElement>()

interface StreamInfo {
  testUrl?: string // 测试模式下所有播放器使用的原始 URL
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
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  hasAudio: false,
  isLive: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Player configuration
const playerConfigs = {
  jessibuca: ['ws_flv', 'wss_flv', 'flv', 'https_flv'],
  webrtc: ['rtc', 'rtcs'],
  h265web: ['ws_flv', 'wss_flv'],
  xgplayer: ['hls', 'https_hls', 'mp4', 'fmp4', 'ts']
}

// 根据可用的流协议判断哪些播放器应该显示
const availablePlayers = computed(() => {
  if (!props.streamInfo) return ['h265web'] // 默认显示 h265web

  const players: string[] = []

  // 检查 WebRTC
  if (props.streamInfo.rtc || props.streamInfo.rtcs) {
    players.push('webrtc')
  }

  // 检查 Jessibuca (FLV)
  if (props.streamInfo.ws_flv || props.streamInfo.wss_flv || props.streamInfo.flv || props.streamInfo.https_flv) {
    players.push('jessibuca')
  }

  // 检查 XGPlayer 支持的格式
  if (props.streamInfo.hls || props.streamInfo.https_hls || props.streamInfo.mp4 || props.streamInfo.https_mp4 ||
      props.streamInfo.fmp4 || props.streamInfo.https_fmp4 || props.streamInfo.ts || props.streamInfo.https_ts) {
    players.push('xgplayer')
  }

  // H265Web 支持几乎所有格式，只要有任何流就显示
  if (Object.keys(props.streamInfo).length > 0) {
    if (!players.includes('h265web')) {
      players.push('h265web')
    }
  }

  console.log('Available players:', players)

  return players.length > 0 ? players : ['h265web']
})

// Check if only one player is configured
const showPlayerTabs = computed(() => {
  return availablePlayers.value.length > 1
})

const activePlayer = ref<'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer'>('jessibuca')
const activeTab = ref('media')
const isSwitching = ref(false)

const jessibucaRef = ref()
const webrtcRef = ref()
const h265webRef = ref()
const xgplayerRef = ref()
const mediaInfoRef = ref()

// Drawer dimensions - use percentage for better responsiveness
const drawerSize = '60%'

// Player dimensions in pixels (computed from container)
const playerWidth = computed(() => {
  if (playerContainerRef.value) {
    return `${playerContainerRef.value.clientWidth}px`
  }
  return '800px' // Default fallback
})

const playerHeight = computed(() => {
  if (playerContainerRef.value) {
    return `${playerContainerRef.value.clientHeight}px`
  }
  return '400px' // Default fallback
})

// 判断播放器是否可见
const isPlayerVisible = (playerName: string) => {
  return visible.value && activePlayer.value === playerName && !isSwitching.value
}

// Compute current URL based on active player
const currentUrl = computed(() => {
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

// Shared URLs
const playUrl = computed(() => {
  return currentUrl.value || ''
})

const iframeUrl = computed(() => {
  if (!currentUrl.value) return ''
  return `<iframe src="${window.location.origin}/#/play/wasm/${encodeURIComponent(currentUrl.value)}"></iframe>`
})

const resourceUrl = computed(() => {
  return currentUrl.value || ''
})

// PTZ Control Panel - combine device_id and channel_id
const ptzChannelId = computed(() => {
  if (!props.deviceId || !props.channelId) return ''
  // PTZControlPanel expects format: {device_id}-{channel_id}
  return `${props.deviceId}-${props.channelId}`
})

// MediaInfo parameters - extract from stream info
const streamApp = computed(() => {
  // Try to extract app from stream info or use default
  return props.streamInfo?.app || 'live'
})

const streamId = computed(() => {
  // Try to extract stream from stream info or use channelId
  return props.streamInfo?.stream || props.channelId || ''
})

const mediaServerId = computed(() => {
  // Try to extract media server ID from stream info
  return props.streamInfo?.mediaServerId || ''
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
  if (activePlayer.value === 'jessibuca') {
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
    case 'jessibuca':
      return jessibucaRef
    case 'webrtc':
      return webrtcRef
    case 'h265web':
      return h265webRef
    case 'xgplayer':
      return xgplayerRef
    default:
      return jessibucaRef
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

// Copy URL to clipboard
const copyUrl = (url: string) => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      ElMessage.success('已复制到剪贴板')
    }).catch(() => {
      fallbackCopy(url)
    })
  } else {
    fallbackCopy(url)
  }
}

const fallbackCopy = (url: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = url
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    document.execCommand('copy')
    ElMessage.success('已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
  document.body.removeChild(textarea)
}

// Handle close
const handleClose = () => {
  // Destroy all players to prevent memory leaks
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

// Handle open
const handleOpen = () => {
  // Reset switching state when drawer opens
  isSwitching.value = false
}

// 根据 URL 判断最佳播放器
const detectBestPlayer = (url: string): 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer' => {
  if (!url) return 'h265web'

  // 提取 URL 路径（去掉查询参数和 hash）
  const urlPath = url.split('?')[0].split('#')[0].toLowerCase()
  const extension = urlPath.substring(urlPath.lastIndexOf('.'))

  console.log('Detecting best player for URL:', url, 'extension:', extension)

  // WebRTC 协议优先
  if (url.includes('rtc://') || url.includes('webrtc://')) {
    return 'webrtc'
  }

  // 根据文件扩展名判断
  if (extension === '.flv') {
    // FLV 格式优先使用 Jessibuca（性能最好）
    return 'jessibuca'
  } else if (extension === '.m3u8') {
    // HLS 格式优先使用 h265web，其次 XGPlayer
    return 'h265web'
  } else if (extension === '.mp4' || extension === '.mov' || extension === '.mkv') {
    // MP4 等格式使用 h265web 或 XGPlayer
    return 'h265web'
  } else if (extension === '.ts') {
    // MPEG-TS 格式使用 h265web
    return 'h265web'
  }

  // 默认使用 h265web（支持格式最广）
  return 'h265web'
}

// Initialize active player
watch(() => props.streamInfo, (newStreamInfo) => {
  if (newStreamInfo && visible.value) {
    let bestPlayer: 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer' = 'h265web'

    // 测试模式：根据 testUrl 判断
    if (newStreamInfo.testUrl) {
      bestPlayer = detectBestPlayer(newStreamInfo.testUrl)
    } else {
      // API 模式：根据可用流判断
      if (newStreamInfo.rtc || newStreamInfo.rtcs) {
        bestPlayer = 'webrtc'
      } else if (newStreamInfo.ws_flv || newStreamInfo.wss_flv || newStreamInfo.flv || newStreamInfo.https_flv) {
        // FLV 格式优先使用 Jessibuca
        bestPlayer = 'jessibuca'
      } else if (newStreamInfo.hls || newStreamInfo.https_hls) {
        // HLS 格式使用 h265web
        bestPlayer = 'h265web'
      } else if (newStreamInfo.mp4 || newStreamInfo.https_mp4) {
        // MP4 格式使用 h265web
        bestPlayer = 'h265web'
      } else if (newStreamInfo.ts || newStreamInfo.https_ts) {
        // TS 格式使用 h265web
        bestPlayer = 'h265web'
      }
    }

    console.log('Auto-selected player:', bestPlayer, 'available:', availablePlayers.value)

    // 确保选择的播放器在可用列表中
    if (availablePlayers.value.includes(bestPlayer)) {
      if (activePlayer.value !== bestPlayer) {
        activePlayer.value = bestPlayer
      }
    } else {
      // 如果检测到的播放器不可用，使用可用列表中的第一个
      const fallbackPlayer = availablePlayers.value[0] as 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer'
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
    const fallbackPlayer = newAvailablePlayers[0] as 'jessibuca' | 'webrtc' | 'h265web' | 'xgplayer'
    console.log('Current player no longer available, switching to:', fallbackPlayer)
    activePlayer.value = fallbackPlayer
  }
})
</script>

<style scoped lang="scss">
.aggregated-player {
  width: 100%;
  margin-bottom: 16px;

  :deep(.el-tabs__content) {
    padding: 0;
  }

  :deep(.el-tab-pane) {
    padding: 0;
  }
}

.player-container {
  width: 100%;
  height: 400px;
  background: #000;
  position: relative;

  > div {
    width: 100%;
    height: 100%;
  }
}

.media-info {
  padding: 16px 0;

  .info-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;
    gap: 12px;

    .label {
      white-space: nowrap;
      min-width: 80px;
      text-align: right;
      color: var(--el-text-color-secondary);
    }

    .el-input {
      flex: 1;
    }
  }
}

.url-text {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  max-width: 400px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
