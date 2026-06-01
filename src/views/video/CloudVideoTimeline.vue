<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'

/* ================= 类型定义 ================= */

interface RecordingSegment {
  start: number
  end: number
  type: 'normal' | 'alarm'
  originalStartTime?: number
  originalEndTime?: number
  video_url?: string
}

interface Props {
  records?: RecordingSegment[]
  currentTime?: number
  totalSeconds?: number
  isPlaying?: boolean
  playUrl?: string
}

interface Emits {
  (e: 'timeChange', time: number, segment: RecordingSegment): void
  (e: 'videoEnded'): void
}

/* ================= Props ================= */

const props = withDefaults(defineProps<Props>(), {
  records: () => [],
  currentTime: 0,
  totalSeconds: 86400,
  isPlaying: false,
  playUrl: ''
})

const emit = defineEmits<Emits>()

/* ================= 状态 ================= */

const canvasRef = ref<HTMLCanvasElement | null>(null)
const labelRef = ref<HTMLDivElement | null>(null)
const currentSecond = ref(props.currentTime)
const hoveredSegment = ref<RecordingSegment | null>(null)
const mouseTime = ref<number | null>(null)
const lastDrawnRecords = ref<RecordingSegment[] | null>(null)

const hasRecords = computed(() => props.records && props.records.length > 0)
const displayRecords = computed(() => props.records || [])

/* ================= 工具函数 ================= */

const format = (sec: number): string => {
  if (isNaN(sec) || sec < 0) return '--:--:--'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 精确匹配：时间点落在录像段内
const findSegmentByTime = (time: number): RecordingSegment | null => {
  for (const record of displayRecords.value) {
    if (time >= record.start && time <= record.end) {
      return record
    }
  }
  return null
}

// 最近匹配：找最近的录像段（优先前面的，其次后面的）
const findNearestSegment = (time: number): RecordingSegment | null => {
  if (displayRecords.value.length === 0) return null

  // 先找精确的
  const exact = findSegmentByTime(time)
  if (exact) return exact

  // 找最近的前一个（end <= time）
  let prev: RecordingSegment | null = null
  let prevDist = Infinity
  for (const r of displayRecords.value) {
    if (r.end <= time) {
      const dist = time - r.end
      if (dist < prevDist) {
        prevDist = dist
        prev = r
      }
    }
  }

  // 找最近的后一个（start >= time）
  let next: RecordingSegment | null = null
  let nextDist = Infinity
  for (const r of displayRecords.value) {
    if (r.start >= time) {
      const dist = r.start - time
      if (dist < nextDist) {
        nextDist = dist
        next = r
      }
    }
  }

  // 优先返回更近的那个，同等距离优先前面的段
  if (prev && next) return prevDist <= nextDist ? prev : next
  return prev || next
}

/* ================= 绘制 ================= */

const drawnSegmentsCache = ref<Array<{ segment: RecordingSegment; x1: number; x2: number }>>([])

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

  ctx.fillStyle = '#020617'
  ctx.fillRect(0, 0, w, h)

  const axisY = h / 2
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

  /* ===== 小时刻度 ===== */
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
    ctx.fillText(`${String(hour).padStart(2, '0')}:00`, blockCenterX, axisY + 28)
  }

  /* ===== 录像段 ===== */
  const recordsToDraw = displayRecords.value

  if (recordsToDraw.length > 0 && recordsToDraw !== lastDrawnRecords.value) {
    lastDrawnRecords.value = recordsToDraw
  }

  const recordHeight = 40
  const minRecordWidth = 8
  const drawnSegments: Array<{ segment: RecordingSegment; x1: number; x2: number }> = []

  recordsToDraw.forEach(r => {
    let x1 = timeToX(r.start)
    let x2 = timeToX(r.end)

    if (x2 - x1 < minRecordWidth) {
      const centerX = (x1 + x2) / 2
      x1 = centerX - minRecordWidth / 2
      x2 = centerX + minRecordWidth / 2
    }

    const y = axisY - recordHeight / 2
    const isHovered = hoveredSegment.value === r

    if (isHovered) {
      ctx.fillStyle = r.type === 'alarm' ? '#f87171' : '#4ade80'
      ctx.shadowColor = r.type === 'alarm' ? '#ef4444' : '#22c55e'
      ctx.shadowBlur = 10
    } else {
      ctx.fillStyle = r.type === 'alarm' ? '#ef4444' : '#22c55e'
      ctx.shadowBlur = 0
    }

    ctx.fillRect(x1, y, x2 - x1, recordHeight)
    drawnSegments.push({ segment: r, x1, x2 })
    ctx.shadowBlur = 0

    if (isHovered) {
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      const duration = r.end - r.start
      const durationText = duration < 60 ? `${duration}秒` : `${Math.floor(duration / 60)}分${duration % 60}秒`
      ctx.fillText(`${format(r.start)} - ${format(r.end)} (${durationText})`, (x1 + x2) / 2, y - 8)
    }
  })

  drawnSegmentsCache.value = drawnSegments

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

  /* ===== 鼠标悬停指针 ===== */
  if (mouseTime.value !== null) {
    const mouseSafeTime = Math.max(0, Math.min(mouseTime.value, props.totalSeconds))
    const mouseX = timeToX(mouseSafeTime)

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(mouseX, 0)
    ctx.lineTo(mouseX, h)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = '11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(format(mouseSafeTime), mouseX, h - 8)
  }
}

/* ================= 时间轴交互 ================= */

const isDragging = ref(false)

const xToTime = (x: number, rect: DOMRect): number => {
  const leftPadding = 10
  const rightPadding = 10
  const usableWidth = rect.width - leftPadding - rightPadding
  const clamped = Math.min(Math.max(x - leftPadding, 0), usableWidth)
  return Math.floor((clamped / usableWidth) * props.totalSeconds)
}

const findHoveredSegment = (x: number): RecordingSegment | null => {
  for (const { segment, x1, x2 } of drawnSegmentsCache.value) {
    if (x >= x1 && x <= x2) return segment
  }
  return null
}

const handleMouseDown = (e: MouseEvent) => {
  if (!canvasRef.value) return
  isDragging.value = true
  const rect = canvasRef.value.getBoundingClientRect()
  mouseTime.value = xToTime(e.clientX - rect.left, rect)
  draw()
}

const handleMouseMove = (e: MouseEvent) => {
  if (!canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const newMouseTime = xToTime(x, rect)

  if (mouseTime.value !== newMouseTime) {
    mouseTime.value = newMouseTime
    draw()
  }

  const prevHovered = hoveredSegment.value
  hoveredSegment.value = findHoveredSegment(x)
  if (prevHovered !== hoveredSegment.value) draw()

  canvasRef.value.style.cursor = hoveredSegment.value
    ? 'pointer'
    : isDragging.value ? 'grabbing' : 'grab'
}

const handleMouseUp = (e: MouseEvent) => {
  if (!isDragging.value || !canvasRef.value) return
  isDragging.value = false

  const rect = canvasRef.value.getBoundingClientRect()
  const newTime = xToTime(e.clientX - rect.left, rect)

  currentSecond.value = newTime
  mouseTime.value = null

  // 云端模式：找到最近的录像段（不阻塞空白区域点击）
  const segment = findNearestSegment(newTime)
  if (segment) {
    emit('timeChange', newTime, segment)
  }

  draw()
}

const handleMouseLeave = () => {
  if (hoveredSegment.value) { hoveredSegment.value = null; draw() }
  if (mouseTime.value !== null) { mouseTime.value = null; draw() }
}

const handleGlobalMouseUp = () => {
  if (isDragging.value) isDragging.value = false
}

/* ================= 生命周期 ================= */

onMounted(() => {
  nextTick(() => { draw() })
  window.addEventListener('resize', draw)
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
    const segment = findNearestSegment(time)
    if (segment) emit('timeChange', time, segment)
    draw()
  }
})
</script>

<template>
  <div class="cloud-timeline-container">
    <!-- 播放器 -->
    <div class="player">
      <video
        v-if="playUrl"
        :key="playUrl"
        :src="playUrl"
        controls
        autoplay
        class="video-player"
        @ended="emit('videoEnded')"
      />
      <div v-else class="player-placeholder">
        <template v-if="!hasRecords">
          <p>暂无录像数据</p>
        </template>
        <template v-else>
          <p>点击时间轴开始回放</p>
        </template>
      </div>
    </div>

    <!-- 时间轴 -->
    <div class="timeline-wrapper">
      <div class="timeline-header">
        <div class="timeline-title">云端录像时间轴（24 小时）</div>
        <div ref="labelRef">{{ format(currentSecond) }}</div>
      </div>

      <canvas
        ref="canvasRef"
        class="timeline-canvas"
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
.cloud-timeline-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
  background: #0f172a;
  overflow: hidden;
}

.player {
  flex: 1;
  min-height: 0;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.player-placeholder {
  color: #94a3b8;
  text-align: center;
  font-size: 14px;
}

.timeline-wrapper {
  flex-shrink: 0;
  padding: 12px;
  background: #020617;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  color: #cbd5f5;
  margin-bottom: 6px;
  font-size: 13px;
}

.timeline-title {
  font-weight: 500;
}

.timeline-canvas {
  width: 100%;
  height: 100px;
  cursor: grab;
  display: block;

  &:active {
    cursor: grabbing;
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
  vertical-align: middle;
  margin-right: 4px;
}

.dot.red {
  background: #ef4444;
}
</style>
