<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { ElTree, ElButton, ElMessage, ElInput, ElSelect, ElOption, ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus'
import { VideoPlay, RefreshRight, Setting, Monitor } from '@element-plus/icons-vue'
import PTZDialogNew from '@/components/ptz/PTZDialogNew.vue'
import { gb28181Api } from '@/api/gb28181Api'

// Grid container ref for size calculations
const gridRef = ref<HTMLDivElement>()

interface DeviceNode {
  id: string
  key: string
  label: string
  type: 'device' | 'channel'
  device_id?: string
  channel_id?: string
  device_type?: string
  status: 'online' | 'offline' | 'expired' | 'streaming'
  enabled?: number
  ip?: string
  port?: number
  manufacturer?: string
  model?: string
  children?: DeviceNode[]
}

interface Channel {
  id: string
  key: string
  label: string
  type: 'channel'
  channel_id: string
  device_id: string
  channel_type?: string
  status: 'online' | 'offline' | 'expired' | 'streaming'
  enabled?: number
  stream_status?: string
}

interface Cell {
  id: number
  channelId: string | null
  channelName: string
  deviceId: string | null
  url: string
  playerType: 'jessibuca' | 'h265web' | 'xgplayer' | 'webrtc'
  playing: boolean
  ready: boolean
}

// 播放器类型选项
const playerTypes = [
  { label: 'Jessibuca (FLV)', value: 'jessibuca' },
  { label: 'H265Web (通用)', value: 'h265web' },
  { label: 'XGPlayer (HLS)', value: 'xgplayer' },
  { label: 'WebRTC', value: 'webrtc' }
]

// State
const deviceTree = ref<DeviceNode[]>([])
const currentLayout = ref<number>(1)
const showPTZPanel = ref(false)
const activeCell = ref<number>(0)
const selectedChannel = ref<string | null>(null)

// 分屏状态
const cells = ref<Cell[]>(
  Array.from({ length: 6 }, (_, i) => ({
    id: i,
    channelId: null,
    channelName: '',
    deviceId: null,
    url: '',
    playerType: 'jessibuca',
    playing: false,
    ready: false
  }))
)

// Test stream URL
const testStreamUrl = ref('https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv')
const showPlayerDialog = ref(false)
const playerStreamInfo = ref<any>(null)

// Layout options
const layoutOptions = [1, 4, 6, 9]

// 生成 iframe URL
const getIframeUrl = (cell: Cell) => {
  if (!cell.url) return ''

  // Calculate actual cell dimensions in pixels
  let cellWidth = 800
  let cellHeight = 600

  if (gridRef.value) {
    const gridRect = gridRef.value.getBoundingClientRect()
    const gap = 4 // gap from CSS
    const padding = 4 // padding from CSS
    const availableWidth = gridRect.width - (padding * 2)
    const availableHeight = gridRect.height - (padding * 2)

    // Calculate cell size based on layout
    if (currentLayout.value === 1) {
      cellWidth = availableWidth
      cellHeight = availableHeight
    } else if (currentLayout.value === 4) {
      cellWidth = (availableWidth - gap) / 2
      cellHeight = (availableHeight - gap) / 2
    } else if (currentLayout.value === 6) {
      // Layout 6: 1 large cell (2x2) + 5 small cells
      const cellIndex = cells.value.findIndex(c => c.id === cell.id)
      if (cellIndex === 0) {
        // Large cell spans 2x2
        cellWidth = (availableWidth - gap * 2) / 3 * 2 + gap
        cellHeight = (availableHeight - gap * 2) / 3 * 2 + gap
      } else {
        // Small cells are 1/3 of remaining space
        cellWidth = (availableWidth - gap * 2) / 3
        cellHeight = (availableHeight - gap * 2) / 3
      }
    } else if (currentLayout.value === 9) {
      cellWidth = (availableWidth - gap * 2) / 3
      cellHeight = (availableHeight - gap * 2) / 3
    }

    console.log(`PTZ: Cell ${cell.id} size - layout: ${currentLayout.value}, width: ${cellWidth.toFixed(0)}px, height: ${cellHeight.toFixed(0)}px`)
  }

  const params = new URLSearchParams({
    url: cell.url,
    playerType: cell.playerType,
    autoplay: 'true',
    hasAudio: 'true',
    isLive: 'true',
    width: `${Math.round(cellWidth)}px`,
    height: `${Math.round(cellHeight)}px`
  })

  return `/play/player?${params.toString()}`
}

// 监听 iframe 消息
const handleIframeMessage = (event: MessageEvent, cellId: number) => {
  const { type, playerType, url, error } = event.data || {}
  const cell = cells.value[cellId]

  if (!cell) return

  console.log(`Cell ${cellId} received message:`, event.data)

  switch (type) {
    case 'ready':
      cell.ready = true
      cell.playing = true
      break
    case 'play':
      cell.playing = true
      break
    case 'pause':
      cell.playing = false
      break
    case 'error':
      ElMessage.error(`格 ${cellId + 1} 播放错误: ${error}`)
      cell.playing = false
      break
    case 'destroyed':
      cell.playing = false
      cell.ready = false
      break
  }
}

// Load device tree from backend
const loadDeviceTree = async () => {
  try {
    console.log('📼 Fetching device tree for PTZ...')
    const response = await gb28181Api.getDeviceTree()
    console.log('📼 Device tree response:', response)

    // API returns data directly in array format
    if (response && Array.isArray(response)) {
      deviceTree.value = response
    } else {
      deviceTree.value = []
    }

    console.log('📼 Loaded device tree with', deviceTree.value.length, 'devices')
  } catch (error: any) {
    console.error('加载设备树失败:', error)
    ElMessage.error(error.message || '获取设备树失败')
    deviceTree.value = []
  }
}

// Handle node click in the tree
const handleNodeClick = (data: DeviceNode | Channel) => {
  if ('type' in data && data.type === 'channel') {
    selectedChannel.value = data.id
  }
}

// ============================================================================
// ⚠️ TEST MODE - TODO: DELETE THIS SECTION WHEN API IS READY
// ============================================================================
// 临时测试模式：直接使用测试流地址播放，不调用后端API
// 对接API后删除此函数，使用下面的 playChannelWithAPI

// 根据 URL 检测最佳播放器
const detectBestPlayer = (url: string): 'jessibuca' | 'h265web' | 'xgplayer' | 'webrtc' => {
  if (!url) return 'jessibuca'

  const urlPath = url.split('?')[0].split('#')[0].toLowerCase()
  const extension = urlPath.substring(urlPath.lastIndexOf('.'))

  console.log('Detecting best player for', url, 'extension:', extension)

  // WebRTC 优先
  if (url.includes('rtc://') || url.includes('webrtc://')) {
    return 'webrtc'
  }
  // FLV → Jessibuca (性能最好)
  else if (extension === '.flv') {
    return 'jessibuca'
  }
  // HLS → H265Web 或 XGPlayer
  else if (extension === '.m3u8') {
    return 'xgplayer'
  }
  // MP4/MOV/MKV/TS → H265Web (通用性好)
  else if (['.mp4', '.mov', '.mkv', '.ts'].includes(extension)) {
    return 'h265web'
  }

  return 'jessibuca' // 默认
}

const playChannelTestMode = (cellIndex: number, channelId: string, deviceId: string, channelName: string = '') => {
  if (!testStreamUrl.value) {
    ElMessage.warning('请输入测试流地址')
    return
  }

  const cell = cells.value[cellIndex]

  // 根据 URL 自动检测最佳播放器
  const detectedPlayerType = detectBestPlayer(testStreamUrl.value)

  cell.channelId = channelId
  cell.channelName = channelName || `通道 ${channelId}`
  cell.deviceId = deviceId
  cell.url = testStreamUrl.value
  cell.playerType = detectedPlayerType
  cell.playing = true
  cell.ready = false

  console.log(`格 ${cellIndex + 1} 使用播放器: ${detectedPlayerType}`)
  ElMessage.success(`格 ${cellIndex + 1} 开始播放（${getPlayerTypeLabel(detectedPlayerType)}）`)
}

// ============================================================================
// ✅ PRODUCTION MODE - TODO: UNCOMMENT WHEN API IS READY
// ============================================================================
// const playChannelWithAPI = async (cellIndex: number, channelId: string, deviceId: string) => {
//   try {
//     const data = await gb28181Api.startLive({
//       device_id: deviceId,
//       channel_id: channelId
//     })
//
//     if (data?.play_urls) {
//       const cell = cells.value[cellIndex]
//       cell.channelId = channelId
//       cell.channelName = `通道 ${channelId}`
//       cell.deviceId = deviceId
//       cell.url = data.play_urls.ws_flv || data.play_urls.hls || data.play_urls.testUrl
//       cell.playerType = 'jessibuca'
//       cell.playing = true
//       cell.ready = false
//     } else {
//       throw new Error('启动实时播放失败')
//     }
//   } catch (error: any) {
//     console.error('Failed to start live playback:', error)
//     ElMessage.error(error.message || '启动实时播放失败')
//   }
// }
// ============================================================================

// Handle channel selection and play in active cell
const handleSelectChannel = async (channelId: string) => {
  if (activeCell.value === null || activeCell.value < 0) {
    ElMessage.warning('请先选择一个格子')
    return
  }

  // Find device and channel from tree
  let deviceId = ''
  let channelName = ''

  for (const device of deviceTree.value) {
    if (device.children) {
      const channel = device.children.find((ch: DeviceNode) => ch.id === channelId)
      if (channel) {
        deviceId = channel.device_id || device.device_id || ''
        channelName = channel.label
        break
      }
    }
  }

  if (!deviceId) {
    ElMessage.error('找不到设备ID')
    return
  }

  // TODO: Switch to playChannelWithAPI when backend is ready
  playChannelTestMode(activeCell.value, channelId, deviceId, channelName)
}

// Legacy function - kept for backward compatibility
const playTestStream = (cellIndex: number, channelId?: string, deviceId?: string) => {
  if (!testStreamUrl.value) {
    ElMessage.warning('请输入测试流地址')
    return
  }

  const cell = cells.value[cellIndex]
  const currentPlayerType = cell.playerType || 'jessibuca'

  cell.channelId = channelId || null
  cell.channelName = channelId || `测试流 ${cellIndex + 1}`
  cell.deviceId = deviceId || null
  cell.url = testStreamUrl.value
  cell.playerType = currentPlayerType
  cell.playing = true
  cell.ready = false

  ElMessage.success(`格 ${cellIndex + 1} 开始播放`)
}

// Stop playing in a cell
const stopPlay = (cellIndex: number) => {
  const cell = cells.value[cellIndex]

  if (cell.url) {
    // 发送停止消息给 iframe
    const iframe = document.querySelector(`iframe[data-cell-id="${cellIndex}"]`) as HTMLIFrameElement
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ action: 'destroy' }, '*')
    }
  }

  cell.channelId = null
  cell.channelName = ''
  cell.deviceId = null
  cell.url = ''
  cell.playing = false
  cell.ready = false
}

// Switch player type for a cell
const switchPlayerType = (cellIndex: number, playerType: 'jessibuca' | 'h265web' | 'xgplayer' | 'webrtc') => {
  const cell = cells.value[cellIndex]

  if (!cell.url) {
    cell.playerType = playerType
    return
  }

  // 保存 URL 和其他信息
  const { url, channelId, channelName, deviceId } = cell

  // 先停止当前播放
  stopPlay(cellIndex)

  // 使用 nextTick 确保 iframe 已销毁
  setTimeout(() => {
    // 重新开始播放
    cell.channelId = channelId
    cell.channelName = channelName
    cell.deviceId = deviceId
    cell.url = url
    cell.playerType = playerType
    cell.playing = true
  }, 100)
}

// Change layout
const changeLayout = (layout: number) => {
  currentLayout.value = layout
  activeCell.value = 0
}

// Activate a cell
const activateCell = (index: number) => {
  activeCell.value = index
}

// Show PTZ controls for a specific channel
const showPTZControls = (channelId: string, deviceId: string) => {
  selectedChannel.value = channelId
  showPTZPanel.value = true
}

// Get status class for display
const getStatusClass = (status: string) => {
  switch (status) {
    case 'online': return 'online'
    case 'streaming': return 'online'
    case 'offline': return 'offline'
    case 'expired': return 'warning'
    case 'motion_detect': return 'warning'
    default: return 'offline'
  }
}

// Generate grid styles based on layout
const gridStyle = computed(() => {
  if (currentLayout.value === 1) return { gridTemplate: '1fr / 1fr' }
  if (currentLayout.value === 4) return { gridTemplate: '1fr 1fr / 1fr 1fr' }
  if (currentLayout.value === 9) return { gridTemplate: 'repeat(3,1fr) / repeat(3,1fr)' }
  return {}
})

const getGridItemStyle = (index: number) => {
  if (currentLayout.value !== 6) return {}

  if (index === 0) {
    return { gridColumn: '1 / 3', gridRow: '1 / 3' }
  } else if (index === 1) {
    return { gridColumn: '3', gridRow: '1' }
  } else if (index === 2) {
    return { gridColumn: '3', gridRow: '2' }
  } else if (index === 3) {
    return { gridColumn: '1', gridRow: '3' }
  } else if (index === 4) {
    return { gridColumn: '2', gridRow: '3' }
  } else if (index === 5) {
    return { gridColumn: '3', gridRow: '3' }
  }

  return {}
}

// Get channel name from device tree
const getChannelName = (cell: Cell) => {
  if (cell.channelName) {
    return cell.channelName
  }

  if (!cell.channelId) return `格 ${cell.id + 1} 未播放`

  // Find the channel by ID
  for (const device of deviceTree.value) {
    if (device.children) {
      const channel = device.children.find((ch: DeviceNode) => ch.id === cell.channelId)
      if (channel) {
        return `${device.label} - ${channel.label}`
      }
    }
  }

  return `格 ${cell.id + 1} 未播放`
}

// Get truncated URL for display
const getTruncatedUrl = () => {
  if (!testStreamUrl.value) return ''
  const maxLength = 30
  if (testStreamUrl.value.length <= maxLength) return testStreamUrl.value
  return testStreamUrl.value.substring(0, maxLength) + '...'
}

// Cleanup on unmount
onBeforeUnmount(() => {
  // Stop all players
  cells.value.forEach((cell, index) => {
    stopPlay(index)
  })
})

onMounted(() => {
  loadDeviceTree()
})
</script>

<template>
  <div class="page">
    <!-- Device tree panel -->
    <aside class="device-panel">
      <ElTree
        :data="deviceTree"
        :props="{ children: 'children', label: 'name' }"
        node-key="id"
        :expand-on-click-node="false"
        default-expand-all
        :class="'device-tree'"
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <!-- Device -->
            <div v-if="data.type === 'device'" class="device">
              <span class="status-dot" :class="getStatusClass(data.status || 'offline')" />
              <span class="node-label">{{ data.label }}</span>
            </div>

            <!-- Channel -->
            <div v-else-if="data.type === 'channel'" class="channel" @click.stop="handleSelectChannel(data.id)">
              <div class="channel-left">
                <span class="status-dot" :class="getStatusClass(data.status || 'offline')" />
                <span class="node-label">{{ data.label }}</span>
              </div>

              <ElButton size="small" type="primary" plain @click.stop="showPTZControls(data.channel_id, data.device_id)">
                云台
              </ElButton>
            </div>
          </div>
        </template>
      </ElTree>
    </aside>

    <!-- Main content -->
    <main class="main">
      <!-- Top toolbar -->
      <div class="toolbar">
        <div class="test-stream-input">
          <span class="label">测试流地址：</span>
          <ElInput
            v-model="testStreamUrl"
            placeholder="https://sf1-cdn-tos.huoshanstatic.com/obj/media-fe/xgplayer_doc_video/flv/xgplayer-demo-720p.flv"
            style="width: 400px; margin-right: 10px;"
          />
        </div>
        <div class="layout-buttons">
          <ElButton
            v-for="layout in layoutOptions"
            :key="layout"
            :class="['layout-btn', { active: currentLayout === layout }]"
            @click="changeLayout(layout)"
          >
            {{ layout }}
          </ElButton>
        </div>
      </div>

      <!-- Video grid with iframes -->
      <div ref="gridRef" class="grid" :style="currentLayout === 6 ? {} : gridStyle">
        <div
          v-for="(cell, index) in cells.slice(0, currentLayout)"
          :key="cell.id"
          :class="['cell', { active: activeCell === cell.id, playing: cell.playing }]"
          :style="currentLayout === 6 ? getGridItemStyle(index) : {}"
          @click="activateCell(cell.id)"
        >
          <!-- iframe player -->
          <iframe
            v-if="cell.url"
            :data-cell-id="cell.id"
            :src="getIframeUrl(cell)"
            class="player-iframe"
            frameborder="0"
            allow="autoplay; fullscreen"
          ></iframe>

          <!-- Placeholder -->
          <div v-else class="placeholder">
            <template v-if="!cell.channelId">
              <span class="empty-text">格 {{ cell.id + 1 }}</span>
              <span class="hint">点击选中通道播放</span>
            </template>
          </div>

          <!-- Cell overlay (active cell) -->
          <div v-if="activeCell === cell.id" class="cell-overlay">
            <div class="cell-info">
              <span class="channel-name">{{ getChannelName(cell) }}</span>
              <span v-if="cell.url" class="stream-url">{{ getTruncatedUrl() }}</span>
            </div>

            <div v-if="cell.url" class="cell-controls">
              <!-- 播放器切换 -->
              <ElDropdown trigger="click" @command="(cmd) => switchPlayerType(cell.id, cmd)">
                <ElButton size="small" :icon="Monitor">
                  {{ getPlayerTypeLabel(cell.playerType) }}
                </ElButton>
                <template #dropdown>
                  <ElDropdownMenu>
                    <ElDropdownItem
                      v-for="type in playerTypes"
                      :key="type.value"
                      :command="type.value"
                      :disabled="type.value === cell.playerType"
                    >
                      <span v-if="type.value === cell.playerType" style="margin-right: 4px;">✓</span>
                      {{ type.label }}
                    </ElDropdownItem>
                  </ElDropdownMenu>
                </template>
              </ElDropdown>

              <!-- 云台控制 -->
              <ElButton
                v-if="cell.channelId"
                size="small"
                type="primary"
                @click.stop="showPTZControls(cell.channelId, cell.deviceId || '')"
              >
                云台
              </ElButton>

              <!-- 停止播放 -->
              <ElButton
                v-if="cell.url"
                size="small"
                type="danger"
                @click.stop="stopPlay(cell.id)"
              >
                停止
              </ElButton>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- PTZ Dialog -->
    <PTZDialogNew
      v-model="showPTZPanel"
      :channel-id="selectedChannel || ''"
      @close="showPTZPanel = false"
    />
  </div>
</template>

<script lang="ts">
// Helper function to get player type label
const getPlayerTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    jessibuca: 'Jessibuca',
    h265web: 'H265Web',
    xgplayer: 'XGPlayer',
    webrtc: 'WebRTC'
  }
  return labels[type] || type
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100%; /* 使用 100% 而不是 100vh，适应 content-wrapper 的可用高度 */
  overflow: hidden; /* 防止页面级滚动条 */
  background: $bg-main;
  color: $text-main;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* Device Panel */
.device-panel {
  background: $bg-panel;
  border-right: 1px solid $border-base;
  padding: 16px 12px;
  overflow-y: auto;
  height: 100%;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: $border-light;
    border-radius: 3px;

    &:hover {
      background: $border-base;
    }
  }

  :deep(.el-tree) {
    background-color: transparent;
    color: $text-main;

    // 移除默认图标，使用自定义样式
    .el-tree-node__expand-icon {
      color: $text-muted;
    }
  }

  :deep(.el-tree-node__content) {
    height: auto;
    padding: 0;
    margin: 0 0 8px 0;
    background-color: transparent !important;

    &:hover {
      background-color: transparent !important;
    }
  }

  :deep(.el-tree-node:focus > .el-tree-node__content) {
    background-color: transparent !important;
  }

  :deep(.el-tree-node > .el-tree-node__children) {
    background-color: transparent !important;
    overflow: hidden;
    padding-left: 0;
  }

  :deep(.el-tree-node__label) {
    color: $text-main;
  }
}

.tree-node {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.device {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  width: 100%;
  font-size: 13px;
  color: $text-main;
  background: $bg-active;
  border: 1px solid $border-base;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.2s ease;

  &:hover {
    border-color: $border-light;
    background: $bg-hover;
  }
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);

  &.online {
    background: $success;
    box-shadow: 0 0 6px rgba($success, 0.4);
  }

  &.offline {
    background: $danger;
  }

  &.warning {
    background: $warning;
  }
}

.channel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 13px;
  border: 1px solid $border-light;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  margin-top: 4px;
  background: rgba($bg-active, 0.5);
  transition: all 0.2s ease;

  &:hover {
    background: $bg-hover;
    border-color: $border-base;
  }

  .channel-left {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;

    .node-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  // 云台按钮样式
  :deep(.el-button) {
    padding: 4px 10px;
    font-size: 12px;
    height: auto;
    flex-shrink: 0;
  }
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Main content */
.main {
  display: flex;
  flex-direction: column;
  min-height: 0; /* 允许在 grid 子项中正确收缩 */
  height: 100%;
  overflow: hidden;
  background: #000;
}

/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  background: $bg-panel;
  border-bottom: 1px solid $border-base;
  flex-shrink: 0; /* 防止被压缩 */
  height: 50px; /* 固定高度 */
  overflow: visible; /* 不需要内部滚动 */
}

.test-stream-input {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 300px;

  .label {
    white-space: nowrap;
    color: $text-muted;
    font-size: 13px;
  }
}

.layout-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.layout-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid $border-light;
  background: transparent;
  color: $text-main;

  &.active {
    background: $primary;
    border-color: $primary;
    color: #fff;
  }
}

/* Video Grid */
.grid {
  flex: 1;
  min-height: 0; /* 允许 flex 容器正确收缩 */
  display: grid;
  gap: 4px;
  padding: 4px;
  background: #000;
  overflow: hidden;
}

.cell {
  position: relative;
  min-height: 0; /* 允许 grid 单元格正确收缩 */
  overflow: hidden; /* 防止内容溢出 */
  background: #000;
  border: 1px solid #111;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    outline: 2px solid $primary;
    z-index: 10;
  }

  &.playing {
    border-color: #67C23A;
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(0, 0, 0, 0) 100%);
  }

  &:hover {
    border-color: $primary;
  }
}

.player-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: $text-muted;
  font-size: 13px;
  padding: 12px;
  text-align: center;

  .empty-text {
    font-size: 16px;
    font-weight: 500;
  }

  .hint {
    font-size: 11px;
    color: $text-muted;
    opacity: 0.6;
  }
}

.cell-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 20;

  .cell-info {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;

    .channel-name {
      font-size: 12px;
      color: #fff;
      text-shadow: 0 1px 2px rgba(0,0,0,0.8);
    }

    .stream-url {
      font-size: 10px;
      color: rgba(255,255,255,0.7);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .cell-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 6px;
    pointer-events: auto;

    .el-button {
      font-size: 12px;
      padding: 4px 8px;
    }
  }
}
</style>
