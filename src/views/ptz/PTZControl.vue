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
  { label: 'XGPlayer (HLS)', value: 'xgplayer' }
]

// State
const deviceTree = ref<DeviceNode[]>([])
const currentLayout = ref<number>(1)
const showPTZPanel = ref(false)
const activeCell = ref<number>(0)
const selectedChannel = ref<string | null>(null)

// 分屏状态
const cells = ref<Cell[]>(
  Array.from({ length: 9 }, (_, i) => ({
    id: i,
    channelId: null,
    channelName: '',
    deviceId: null,
    url: '',
    playerType: 'jessibuca',
    playing: false,
    ready: false,
    playerVersion: 0  // Version number to force iframe reload when player changes
  }))
)

const showPlayerDialog = ref(false)
const playerStreamInfo = ref<any>(null)

// Layout options
const layoutOptions = [1, 4, 6, 9]

// Generate iframe URL
const getIframeUrl = (cell: Cell, cellIndex: number) => {
  if (!cell.url) return ''

  // Calculate actual cell dimensions in pixels
  let cellWidth = 800
  let cellHeight = 600

  if (gridRef.value) {
    const gridRect = gridRef.value.getBoundingClientRect()
    const gap = 4 // gap from CSS
    const padding = 4 // padding from CSS
    const availableWidth = gridRect.width - (padding * 2)
    const availableHeight = gridRef.value.clientHeight - (padding * 2)

    // Calculate cell size based on layout
    if (currentLayout.value === 1) {
      cellWidth = availableWidth
      cellHeight = availableHeight
    } else if (currentLayout.value === 4) {
      cellWidth = (availableWidth - gap) / 2
      cellHeight = (availableHeight - gap) / 2
    } else if (currentLayout.value === 6) {
      // cellIndex is the index in the sliced array
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

    console.log(`PTZ: Cell ${cellIndex} size - layout: ${currentLayout.value}, width: ${cellWidth.toFixed(0)}px, height: ${cellHeight.toFixed(0)}px`)
  }

  const params = new URLSearchParams({
    url: cell.url,
    playerType: cell.playerType,
    autoplay: 'true',
    hasAudio: 'true',
    isLive: 'true',
    width: `${Math.round(cellWidth)}px`,
    height: `${Math.round(cellHeight)}px`,
    v: `${(cell as any).playerVersion || 0}`  // Version to force reload
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

// Stop live stream API call
const stopLiveStream = async (cell: Cell) => {
  if (!cell.channelId || !cell.deviceId) return

  try {
    await gb28181Api.stopLive({
      device_id: cell.deviceId,
      channel_id: cell.channelId
    })
    console.log(`Stopped live stream for device ${cell.deviceId}, channel ${cell.channelId}`)
  } catch (error: any) {
    console.error('Failed to stop live stream:', error)
  }
}

// Play channel with API
const playChannelWithAPI = async (cellIndex: number, channelId: string, deviceId: string, channelName: string = '') => {
  try {
    const data = await gb28181Api.startLive({
      device_id: deviceId,
      channel_id: channelId
    })

    if (data?.play_urls) {
      const cell = cells.value[cellIndex]
      // Select stream URL based on player type priority and page protocol
      let streamUrl = ''
      const playerType = cell.playerType || 'jessibuca'
      const isSecurePage = location.protocol === 'https:'

      if (playerType === 'jessibuca' || playerType === 'h265web') {
        // Jessibuca and H265Web support: ws_flv, wss_flv, http_flv, https_flv
        if (isSecurePage) {
          // Prefer secure streams on HTTPS page
          streamUrl = data.play_urls.wss_flv || data.play_urls.https_flv || ''
        } else {
          streamUrl = data.play_urls.ws_flv || data.play_urls.wss_flv || data.play_urls.http_flv || data.play_urls.https_flv || ''
        }
      } else if (playerType === 'xgplayer') {
        // XGPlayer only supports HTTP protocols: http_flv, https_flv, hls, https_hls, hls_fmp4, https_hls_fmp4
        // Does NOT support WebSocket protocols (ws_flv, wss_flv)
        if (isSecurePage) {
          // Prefer secure streams on HTTPS page
          streamUrl = data.play_urls.https_flv || data.play_urls.https_hls || data.play_urls.https_hls_fmp4 || ''
        } else {
          streamUrl = data.play_urls.http_flv || data.play_urls.https_flv || data.play_urls.hls || data.play_urls.https_hls || data.play_urls.hls_fmp4 || data.play_urls.https_hls_fmp4 || ''
        }
      }

      if (!streamUrl) {
        throw new Error('无可用的播放地址')
      }

      cell.channelId = channelId
      cell.channelName = channelName || `通道 ${channelId}`
      cell.deviceId = deviceId
      cell.url = streamUrl
      cell.playing = true
      cell.ready = false

      ElMessage.success(`格 ${cellIndex + 1} 开始播放`)
    } else {
      throw new Error('启动实时播放失败')
    }
  } catch (error: any) {
    console.error('Failed to start live playback:', error)
    ElMessage.error(error.message || '启动实时播放失败')
  }
}

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
      const channel = device.children.find((ch: DeviceNode) => ch.channel_id === channelId)
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

  await playChannelWithAPI(activeCell.value, channelId, deviceId, channelName)
}

// Stop playing in a cell
const stopPlay = async (cellIndex: number) => {
  const cell = cells.value[cellIndex]

  // Stop live stream via API
  await stopLiveStream(cell)

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

  // Only change player type and increment version to force iframe reload
  // Don't stop the stream or destroy the iframe unnecessarily
  cell.playerType = playerType
  ;(cell as any).playerVersion = ((cell as any).playerVersion || 0) + 1

  console.log(`Cell ${cellIndex + 1}: Switched to ${playerType} player`)
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

// Handle cell hover for showing controls
const hoveredCell = ref<number | null>(null)

const handleCellMouseEnter = (index: number) => {
  hoveredCell.value = index
}

const handleCellMouseLeave = () => {
  hoveredCell.value = null
}

// Check if cell should show controls
const shouldShowCellOverlay = (index: number) => {
  const cell = cells.value[index]
  // Show overlay if cell is playing and being hovered
  return cell.playing && hoveredCell.value === index
}

// Show PTZ controls for a specific channel
const showPTZControls = (channelId: string, deviceId: string) => {
  selectedChannel.value = channelId
  showPTZPanel.value = true
}

// Check if a channel is currently playing in any cell
const isChannelPlaying = (channelId: string) => {
  return cells.value.some(cell => cell.channelId === channelId && cell.playing)
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

// Cleanup on unmount
onBeforeUnmount(async () => {
  // Stop all playing cells and call stop-live API
  const stopPromises = cells.value
    .filter(cell => cell.channelId && cell.deviceId)
    .map(cell => stopLiveStream(cell))

  await Promise.allSettled(stopPromises)

  // Also destroy iframe players
  cells.value.forEach((cell, index) => {
    if (cell.url) {
      const iframe = document.querySelector(`iframe[data-cell-id="${index}"]`) as HTMLIFrameElement
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ action: 'destroy' }, '*')
      }
    }
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
            <div v-else-if="data.type === 'channel'" class="channel" @click.stop="handleSelectChannel(data.channel_id)">
              <div class="channel-left">
                <span class="status-dot" :class="getStatusClass(data.status || 'offline')" />
                <span class="node-label">{{ data.label }}</span>
              </div>

              <ElButton
                v-if="isChannelPlaying(data.channel_id)"
                size="small"
                type="primary"
                plain
                @click.stop="showPTZControls(data.channel_id, data.device_id)"
              >
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
          :class="['cell', { active: activeCell === index, playing: cell.playing }]"
          :style="currentLayout === 6 ? getGridItemStyle(index) : {}"
          @click="activateCell(index)"
          @mouseenter="handleCellMouseEnter(index)"
          @mouseleave="handleCellMouseLeave"
        >
          <!-- iframe player -->
          <iframe
            v-if="cell.url"
            :data-cell-id="cell.id"
            :src="getIframeUrl(cell, index)"
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

          <!-- Cell overlay (show on hover when playing) -->
          <div v-if="cell.playing" class="cell-overlay" :class="{ show: shouldShowCellOverlay(index) }">
            <div class="cell-info">
              <span class="channel-name">{{ getChannelName(cell) }}</span>
            </div>

            <div v-if="cell.url" class="cell-controls">
              <!-- 播放器切换 -->
              <ElDropdown trigger="click" @command="(cmd) => switchPlayerType(index, cmd)">
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
                @click.stop="stopPlay(index)"
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
  opacity: 0;
  transition: opacity 0.2s ease;

  &.show {
    opacity: 1;

    .cell-info {
      opacity: 1;
    }

    .cell-controls {
      opacity: 1;
    }
  }

  .cell-info {
    position: absolute;
    top: 8px;
    left: 8px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;

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
    pointer-events: auto;  // Always clickable regardless of parent's pointer-events
    opacity: 0;
    transition: opacity 0.2s ease;

    .el-button {
      font-size: 12px;
      padding: 4px 8px;
      pointer-events: auto;  // Ensure buttons are always clickable
    }
  }
}
</style>
