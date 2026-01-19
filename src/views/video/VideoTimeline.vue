<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ElDatePicker, ElButton, ElTag } from 'element-plus'

/* ================= 类型定义 ================= */

interface RecordingSegment {
  start: number
  end: number
  type: 'normal' | 'alarm'
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
  channelId?: string
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
  channelId: ''
})

const emit = defineEmits<Emits>()

/* ================= 状态 ================= */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const labelRef = ref<HTMLDivElement | null>(null)
const currentSecond = ref(props.currentTime)

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

// 生成播放器 iframe URL
const getPlayerIframeUrl = () => {
  if (!props.playUrl) return ''

  // 计算播放器尺寸
  const containerRef = ref<HTMLDivElement | null>(null)
  const playerWidth = 800
  const playerHeight = 600

  const params = new URLSearchParams({
    url: props.playUrl,
    playerType: 'jessibuca',  // 默认使用 jessibuca 播放器
    autoplay: 'true',
    hasAudio: 'true',
    isLive: 'false',  // 回放模式
    width: `${playerWidth}px`,
    height: `${playerHeight}px`
  })

  return `/play/player?${params.toString()}`
}

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
  recordsToDraw.forEach(r => {
    const x1 = timeToX(r.start)
    const x2 = timeToX(r.end)
    ctx.fillStyle = r.type === 'alarm' ? '#ef4444' : '#22c55e'
    ctx.fillRect(x1, axisY - 6, x2 - x1, 12)
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

// 处理鼠标按下
const handleMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return
  isDragging.value = true

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newTime = xToTime(x, rect)

  currentSecond.value = newTime
  draw()
}

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging.value || !canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newTime = xToTime(x, rect)

  currentSecond.value = newTime
  draw()
}

// 处理鼠标释放
const handleMouseUp = (e: MouseEvent) => {
  if (!isDragging.value || !canvasRef.value) return

  isDragging.value = false

  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newTime = xToTime(x, rect)

  // 查找对应的录像段
  const segment = findSegmentByTime(newTime)

  // 只在有录像的区域触发时间变化事件
  if (segment) {
    emit('timeChange', newTime, segment)
  } else {
    console.log('选择的位置没有录像，不触发回放操作')
  }

  draw()
}

const handleCanvasClick = (e: MouseEvent) => {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left

  const leftPadding = 10
  const rightPadding = 10
  const usableWidth = rect.width - leftPadding - rightPadding

  const clamped = Math.min(Math.max(x - leftPadding, 0), usableWidth)
  const newTime = Math.floor((clamped / usableWidth) * props.totalSeconds)

  currentSecond.value = newTime

  // 查找对应的录像段
  const segment = findSegmentByTime(newTime)

  // 只在有录像的区域触发时间变化事件
  if (segment) {
    // 触发时间变化事件（父组件处理停止旧回放→开始新回放）
    emit('timeChange', newTime, segment)
  } else {
    console.log('点击的位置没有录像，不触发回放操作')
  }

  draw()
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
          :src="getPlayerIframeUrl()"
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
        @mouseleave="isDragging = false"
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
  height: 72px;
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
