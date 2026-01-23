<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ElDatePicker, ElButton, ElTag } from 'element-plus'

/* ================= 类型定义 ================= */

interface RecordingSegment {
  start: number
  end: number
  type: 'normal' | 'alarm'
  originalStartTime?: number  // 原始 Unix 时间戳，用于回放 API
  originalEndTime?: number    // 原始 Unix 时间戳，用于回放 API
}

interface Props {
  // 录像数据
  records?: RecordingSegment[]
  currentTime?: number
  totalSeconds?: number
  defaultDate?: Date

  // 回放模式
  mode?: 'local' | 'cloud'

  // 是否正在播放
  isPlaying?: boolean

  // 查询状态（云端模式）
  querying?: boolean
  pollResult?: 'success' | 'error' | null

  // 播放器相关
  playUrl?: string
  deviceId?: string
  channelId?: string,
  channelPkId?: number,
  streamId?: string

  // 回放倍速
  playbackSpeed?: number
}

interface Emits {
  (e: 'timeChange', time: number, segment: RecordingSegment | null): void
  (e: 'ready'): void
  (e: 'dateChange', date: string): void
  (e: 'query', date: string): void
  (e: 'clear'): void
}

/* ================= Props ================= */

const props = withDefaults(defineProps<Props>(), {
  records: () => [],
  currentTime: 17 * 3600,
  totalSeconds: 86400,
  defaultDate: () => new Date(),
  mode: 'local',
  isPlaying: false,
  querying: false,
  pollResult: null,
  playUrl: '',
  deviceId: '',
  channelId: '',
  channelPkId: 0,
  streamId: '',
  playbackSpeed: 1
})

const emit = defineEmits<Emits>()

/* ================= 状态 ================= */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const labelRef = ref<HTMLDivElement | null>(null)
const currentSecond = ref(props.currentTime)
const hoveredSegment = ref<RecordingSegment | null>(null)  // 鼠标悬浮的录像段
const mouseTime = ref<number | null>(null)  // 鼠标位置对应的时间
const lastDrawnRecords = ref<RecordingSegment[] | null>(null)  // 上次绘制的录像，用于调试日志

// 日期选择状态
const selectedDate = ref<string>(formatDate(new Date()))

// 计算属性
const hasRecords = computed(() => props.records && props.records.length > 0)
const displayRecords = computed(() => props.records || [])

// 云端模式演示数据
const cloudDemoRecords = computed<RecordingSegment[]>(() => {
  if (props.mode === 'cloud' && !hasRecords.value) {
    return [
      { start: 2 * 3600, end: 5 * 3600 + 1800, type: 'normal' },
      { start: 7 * 3600, end: 9 * 3600, type: 'normal' },
      { start: 16 * 3600 + 30, end: 17 * 3600 + 120, type: 'alarm' },
      { start: 19 * 3600, end: 21 * 3600 + 600, type: 'normal' }
    ]
  }
  return displayRecords.value
})

/* ================= 工具函数 ================= */

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 处理日期变化
const handleDateChange = (date: string) => {
  emit('dateChange', date)
}

// 查询录像
const handleQuery = () => {
  emit('query', selectedDate.value)
}

// 清空录像
const handleClear = () => {
  emit('clear')
}

// 生成播放器 iframe URL（回放模式使用 RecordPlayer）
const playerIframeUrl = computed(() => {
  if (!props.playUrl) return ''

  const playerWidth = 800
  const playerHeight = 600

  const params = new URLSearchParams({
    url: props.playUrl,
    player_type: 'easyplayer',  // 默认使用 easyplayer
    autoplay: 'true',
    isLive: 'true',  // 回放模式
    width: `${playerWidth}px`,
    height: `${playerHeight}px`,
    speed: String(props.playbackSpeed)  // 添加倍速参数
  })

  // 添加 channel_id 参数，用于回放控制
  if(props.channelPkId) {
    params.append('channel_id', String(props.channelPkId))
  }

  // 添加 stream_id 参数，用于回放控制
  if(props.streamId) {
    params.append('stream_id', props.streamId)
  }

  return `/play/record?${params.toString()}`
})

const format = (sec: number): string => {
  if (isNaN(sec) || sec < 0) return '--:--:--'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const formatSegment = (segment: RecordingSegment): string => {
  return `${format(segment.start)} ~ ${format(segment.end)}`
}

// 根据时间查找录像段
const findSegmentByTime = (time: number): RecordingSegment | null => {
  const recordsToSearch = props.mode === 'cloud' ? cloudDemoRecords.value : displayRecords.value
  for (const record of recordsToSearch) {
    if (time >= record.start && time <= record.end) {
      return record
    }
  }
  return null
}

// 找到最近的一个录像时间点（用于初始加载）
const findNearestRecordTime = (): number => {
  const recordsToSearch = props.mode === 'cloud' ? cloudDemoRecords.value : displayRecords.value
  if (recordsToSearch.length === 0) return 0

  const now = new Date()
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()

  // 找到包含当前时间的录像段
  for (const record of recordsToSearch) {
    if (currentSeconds >= record.start && currentSeconds <= record.end) {
      return currentSeconds
    }
  }

  // 如果当前时间没有录像，找第一个录像的开始时间
  return recordsToSearch[0].start
}

/* ================= 绘制 ================= */

const draw = () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const w = canvas.clientWidth
  const h = canvas.clientHeight
  const dpr = window.devicePixelRatio || 1

  canvas.width = w * dpr
  canvas.height = h * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

  ctx.clearRect(0, 0, w, h)

  /* ===== 背景 ===== */
  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)

  const axisY = h / 2

  /* ===== 时间映射 ===== */
  const leftPadding = 10
  const rightPadding = 10
  const usableWidth = w - leftPadding - rightPadding

  const timeToX = (sec: number) =>
    leftPadding + (sec / props.totalSeconds) * usableWidth

  /* ===== 主时间轴 ===== */
  ctx.strokeStyle = '#334155'
  ctx.beginPath()
  ctx.moveTo(leftPadding, axisY)
  ctx.lineTo(leftPadding + usableWidth, axisY)
  ctx.stroke()

  /* ===== 小时区间刻度 ===== */
  const hourWidth = usableWidth / 24

  for (let hour = 0; hour < 24; hour++) {
    const blockStartX = leftPadding + hour * hourWidth
    const blockCenterX = blockStartX + hourWidth / 2

    if (hour > 0) {
      ctx.strokeStyle = '#475569'
      ctx.beginPath()
      ctx.moveTo(blockStartX, axisY - 12)
      ctx.lineTo(blockStartX, axisY + 12)
      ctx.stroke()
    }

    ctx.fillStyle = '#94a3b8'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${String(hour).padStart(2, '0')}:00`,
      blockCenterX,
      axisY + 28
    )
  }

  /* ===== 录像段 ===== */
  const recordsToDraw = props.mode === 'cloud' ? cloudDemoRecords.value : displayRecords.value

  // 调试日志（只在录像数据变化时输出一次）
  if (recordsToDraw.length > 0 && recordsToDraw !== lastDrawnRecords.value) {
    console.log('绘制录像段:', recordsToDraw.map(r => ({
      start: r.start,
      end: r.end,
      duration: r.end - r.start,
      format: `${format(r.start)} - ${format(r.end)}`,
      x1: timeToX(r.start),
      x2: timeToX(r.end),
      width: timeToX(r.end) - timeToX(r.start)
    })))
    lastDrawnRecords.value = recordsToDraw
  }

  const recordHeight = 40  // 录像段高度（进一步增加可点击区域）
  const minRecordWidth = 2  // 录像段最小宽度（像素），确保短视频像也能看见

  recordsToDraw.forEach(r => {
    let x1 = timeToX(r.start)
    let x2 = timeToX(r.end)

    // 确保录像段至少有最小宽度
    if (x2 - x1 < minRecordWidth) {
      const centerX = (x1 + x2) / 2
      x1 = centerX - minRecordWidth / 2
      x2 = centerX + minRecordWidth / 2
    }

    const y = axisY - recordHeight / 2

    // 检查是否是悬浮的录像段
    const isHovered = hoveredSegment.value === r

    // 绘制录像段背景
    if (isHovered) {
      // 悬浮时使用更亮的颜色
      ctx.fillStyle = r.type === 'alarm' ? '#f87171' : '#4ade80'
      // 添加发光效果
      ctx.shadowColor = r.type === 'alarm' ? '#ef4444' : '#22c55e'
      ctx.shadowBlur = 10
    } else {
      ctx.fillStyle = r.type === 'alarm' ? '#ef4444' : '#22c55e'
      ctx.shadowBlur = 0
    }

    // 居中绘制录像段
    ctx.fillRect(x1, y, x2 - x1, recordHeight)

    // 重置阴影
    ctx.shadowBlur = 0

    // 如果悬浮，显示录像段的时间信息
    if (isHovered) {
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      const timeText = `${format(r.start)} - ${format(r.end)}`
      // 在录像段上方显示时间
      ctx.fillText(timeText, (x1 + x2) / 2, y - 8)
    }
  })

  /* ===== 当前时间指针 ===== */
  const safeTime = Math.max(0, Math.min(currentSecond.value, props.totalSeconds))
  const px = timeToX(safeTime)

  ctx.strokeStyle = '#ef4444'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(px, 0)
  ctx.lineTo(px, h)
  ctx.stroke()

  ctx.fillStyle = '#ef4444'
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(format(safeTime), px, 14)

  if (labelRef.value) {
    labelRef.value.textContent = format(safeTime)
  }

  /* ===== 鼠标悬停时间指针 ===== */
  if (mouseTime.value !== null) {
    const mouseSafeTime = Math.max(0, Math.min(mouseTime.value, props.totalSeconds))
    const mouseX = timeToX(mouseSafeTime)

    // 鼠标指针使用半透明的白色
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])  // 虚线
    ctx.beginPath()
    ctx.moveTo(mouseX, 0)
    ctx.lineTo(mouseX, h)
    ctx.stroke()
    ctx.setLineDash([])  // 重置虚线

    // 在底部显示时间
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(format(mouseSafeTime), mouseX, h - 8)
  }
}

/* ================= 时间轴交互 ================= */

// 拖动状态
const isDragging = ref(false)

// 将 x 坐标转换为时间
const xToTime = (x: number, rect: DOMRect): number => {
  const leftPadding = 10
  const rightPadding = 10
  const usableWidth = rect.width - leftPadding - rightPadding
  const clamped = Math.min(Math.max(x - leftPadding, 0), usableWidth)
  return Math.floor((clamped / usableWidth) * props.totalSeconds)
}

// 根据鼠标位置查找悬浮的录像段
const findHoveredSegment = (x: number, rect: DOMRect): RecordingSegment | null => {
  const time = xToTime(x, rect)
  return findSegmentByTime(time)
}

// 处理鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return
  isDragging.value = true

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newTime = xToTime(x, rect)

  // 更新鼠标预览时间（虚线指针），不更新当前时间
  mouseTime.value = newTime
  draw()
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newMouseTime = xToTime(x, rect)

  // 更新鼠标位置对应的时间（预览）
  if (mouseTime.value !== newMouseTime) {
    mouseTime.value = newMouseTime
    draw()
  }

  // 检测悬浮的录像段
  const prevHovered = hoveredSegment.value
  hoveredSegment.value = findHoveredSegment(x, rect)

  // 如果悬浮状态改变，重新绘制
  if (prevHovered !== hoveredSegment.value) {
    draw()
  }

  // 更新鼠标样式
  if (hoveredSegment.value) {
    canvasRef.value.style.cursor = 'pointer'
  } else {
    canvasRef.value.style.cursor = isDragging.value ? 'grabbing' : 'grab'
  }
}

// 处理鼠标释放
const handleMouseUp = (e: MouseEvent) => {
  if (!isDragging.value || !canvasRef.value) return

  isDragging.value = false

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newTime = xToTime(x, rect)

  // 更新当前时间到选中的位置
  currentSecond.value = newTime

  // 清除鼠标预览
  mouseTime.value = null

  // 查找对应的录像段
  const segment = findSegmentByTime(newTime)

  // 只在有录像的区域触发时间变化事件
  if (segment) {
    console.log('拖动结束，触发回放:', format(newTime))
    emit('timeChange', newTime, segment)
  } else {
    console.log('选择的位置没有录像，不触发回放操作')
  }

  draw()
}

// 处理鼠标离开
const handleMouseLeave = () => {
  if (hoveredSegment.value) {
    hoveredSegment.value = null
    draw()
  }
  if (mouseTime.value !== null) {
    mouseTime.value = null
    draw()
  }
}

/* ================= 生命周期 ================= */

// 全局 mouseup 处理函数
const handleGlobalMouseUp = () => {
  if (isDragging.value) {
    isDragging.value = false
  }
}

onMounted(() => {
  nextTick(() => {
    draw()
    emit('ready')
  })
  window.addEventListener('resize', draw)

  // 添加全局 mouseup 监听器，处理拖动到 canvas 外部释放的情况
  window.addEventListener('mouseup', handleGlobalMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('resize', draw)
  window.removeEventListener('mouseup', handleGlobalMouseUp)
})

watch(() => props.records, draw, { deep: true })
watch(() => props.currentTime, v => {
  if (typeof v === 'number') {
    currentSecond.value = v
    draw()
  }
})

defineExpose({
  seekToTime(time: number) {
    currentSecond.value = time
    const segment = findSegmentByTime(time)
    emit('timeChange', time, segment)
    draw()
  },

  // 获取最近录像时间
  getNearestRecordTime() {
    return findNearestRecordTime()
  },

  // 检查某个时间是否有录像
  hasRecordAt(time: number): boolean {
    return findSegmentByTime(time) !== null
  }
})
</script>

<template>
  <div class="container">
    <!-- 云端模式搜索栏 -->
    <div v-if="mode === 'cloud'" class="search-bar">
      <ElDatePicker
        v-model="selectedDate"
        type="date"
        placeholder="选择日期"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        :clearable="false"
        style="width: 200px; margin-right: 10px;"
      />
      <ElButton type="primary" :loading="querying" :disabled="!selectedDate" @click="handleQuery">
        查询录像
      </ElButton>
      <ElButton @click="handleClear">清空</ElButton>

      <!-- Query status -->
      <div v-if="querying || pollResult" class="query-status">
        <ElTag v-if="querying" type="warning">查询中...</ElTag>
        <ElTag v-else-if="pollResult === 'success'" type="success">查询完成</ElTag>
        <ElTag v-else-if="pollResult === 'error'" type="danger">查询失败</ElTag>
      </div>
    </div>

    <!-- 播放器区域 -->
    <div class="player">
      <template v-if="props.playUrl && props.isPlaying">
        <iframe
          :key="`${props.streamId || 'default'}-${props.playbackSpeed}`"
          :src="playerIframeUrl"
          class="player-iframe"
          frameborder="0"
          allow="autoplay; fullscreen"
        />
      </template>
      <template v-else>
        <div class="player-placeholder">
          <!-- 本地模式 -->
          <template v-if="mode === 'local'">
            <template v-if="querying">
              <p>正在查询录像...</p>
            </template>
            <template v-else-if="!hasRecords">
              <p>暂无录像数据</p>
            </template>
            <template v-else>
              <p>点击时间轴开始回放</p>
            </template>
          </template>

          <!-- 云端模式 -->
          <template v-else>
            <template v-if="querying">
              <p>正在查询录像...</p>
            </template>
            <template v-else-if="!hasRecords">
              <p>暂无录像数据</p>
            </template>
            <template v-else>
              <p>点击时间轴开始回放</p>
            </template>
          </template>
        </div>
      </template>
    </div>

    <!-- 时间轴 -->
    <div class="timeline-wrapper">
      <div class="timeline-header">
        <div class="timeline-title">
          {{ mode === 'cloud' ? '云端录像' : '本地录像' }}时间轴（24 小时）
        </div>
        <div ref="labelRef">
          {{ format(currentSecond) }}
        </div>
      </div>

      <canvas
        ref="canvasRef"
        class="timeline-canvas"
        :class="{ disabled: !hasRecords && mode === 'local' }"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseLeave"
      />

      <div class="legend">
        <span><i class="dot" /> 正常录像</span>
        <span><i class="dot red" /> 报警录像</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  padding: 16px;
  background: #0f172a;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #1e293b;
  border-radius: 8px;
  margin-bottom: 16px;
  gap: 10px;
  flex-wrap: wrap;

  .query-status {
    margin-left: auto;
  }
}

.player {
  min-height: 420px;
  background: #000;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.player-iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.player-placeholder {
  color: #94a3b8;
  text-align: center;
}

.playback-info {
  color: #cbd5e5;
  font-size: 16px;
}

.timeline-wrapper {
  margin-top: 16px;
  padding: 12px;
  background: #020617;
  border-radius: 12px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  color: #cbd5f5;
  margin-bottom: 6px;
  font-size: 13px;
}

.timeline-canvas {
  width: 100%;
  height: 100px; 
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

.legend {
  margin-top: 6px;
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #94a3b8;
}

.dot {
  width: 10px;
  height: 10px;
  background: #22c55e;
  border-radius: 2px;
  display: inline-block;
}

.dot.red {
  background: #ef4444;
}
</style>
