<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElIcon } from 'element-plus'
// @ts-ignore
import { Loading, FullScreen } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'
import CloudVideoTimeline from '@/views/video/CloudVideoTimeline.vue'

/* ================= 类型 ================= */

interface RecordingSegment {
  start: number
  end: number
  type: 'normal' | 'alarm'
  originalStartTime?: number
  originalEndTime?: number
  video_url?: string
}

interface Props {
  modelValue: boolean
  deviceId?: string
  channelId?: string
  channelPkId?: number
  channelName: string
  selectedDate?: string
  videoUrl?: string  // 直接播放模式
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

/* ================= 状态 ================= */

const records = ref<RecordingSegment[]>([])
const loading = ref(false)
const timelineRef = ref()
const downloading = ref(false)

const playbackInfo = ref({
  isPlaying: false,
  playUrl: ''
})
const currentPlaybackSpeed = ref(1)
const currentTime = ref(0)
const currentRecordStartTime = ref(0)
const currentRecordEndTime = ref(0)

const autoPlayTimer = ref<number | null>(null)
const currentPlaybackIndex = ref(-1)
const isAutoPlaying = ref(false)
const playbackStartTime = ref(0)
const progressUpdateTimer = ref<number | null>(null)

// 全屏容器引用
const containerRef = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

/* ================= 工具 ================= */

function timeToSeconds(ts: number): number {
  const d = new Date(ts * 1000)
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds()
}

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ================= 查询录像（云端） ================= */

const queryRecords = async () => {
  loading.value = true
  records.value = []

  try {
    const date = props.selectedDate || ''
    const result = await gb28181Api.getRecordings({
      device_id: props.deviceId || '',
      channel_id: props.channelId || '',
      start_time: `${date}T00:00:00`,
      end_time: `${date}T23:59:59`,
      no_paging: 1
    } as any)

    const list: any[] = Array.isArray(result) ? result : (result?.list || [])

    records.value = list
      .map((r: any) => ({
        start: timeToSeconds(r.start_time),
        end: timeToSeconds(r.end_time),
        type: 'normal' as const,
        originalStartTime: r.start_time,
        originalEndTime: r.end_time,
        video_url: r.video_url || ''
      }))
      .filter(r => r.end > r.start)
      .sort((a, b) => a.start - b.start)  // 按时间升序排列

    console.log(`[RecordPlayback] 加载录像 ${records.value.length} 段 (${props.selectedDate}):`,
      records.value.map((r, i) => `[${i}] ${formatSeconds(r.start)}-${formatSeconds(r.end)} url=${r.video_url ? '✓' : '✗'}`)
    )

    if (records.value.length > 0) {
      setTimeout(() => startContinuousPlayback(), 300)
    } else {
      ElMessage.info('该日期暂无录像')
    }
  } catch {
    ElMessage.error('查询录像失败')
  } finally {
    loading.value = false
  }
}

/* ================= 进度更新 ================= */

const startProgressUpdate = (segment: RecordingSegment) => {
  stopProgressUpdate()
  playbackStartTime.value = Date.now()
  currentTime.value = segment.start
  progressUpdateTimer.value = window.setInterval(() => {
    const elapsed = (Date.now() - playbackStartTime.value) / 1000
    currentTime.value = Math.min(segment.start + Math.floor(elapsed), segment.end)
  }, 1000)
}

const stopProgressUpdate = () => {
  if (progressUpdateTimer.value) {
    clearInterval(progressUpdateTimer.value)
    progressUpdateTimer.value = null
  }
}

/* ================= 回放控制（直接用 video_url） ================= */

const startPlaybackInternal = (segment: RecordingSegment) => {
  if (
    playbackInfo.value.isPlaying &&
    currentRecordStartTime.value === segment.originalStartTime &&
    currentRecordEndTime.value === segment.originalEndTime
  ) return

  if (!segment.video_url) {
    ElMessage.warning('该录像段暂无播放链接')
    return
  }

  currentRecordStartTime.value = segment.originalStartTime || 0
  currentRecordEndTime.value = segment.originalEndTime || 0

  playbackInfo.value = {
    isPlaying: true,
    playUrl: segment.video_url
  }
  startProgressUpdate(segment)
}

const stopPlaybackInternal = () => {
  if (!playbackInfo.value.isPlaying) return
  stopProgressUpdate()
  if (autoPlayTimer.value) { clearTimeout(autoPlayTimer.value); autoPlayTimer.value = null }
  isAutoPlaying.value = false
  currentPlaybackIndex.value = -1
  playbackInfo.value = { isPlaying: false, playUrl: '' }
  currentRecordStartTime.value = 0
  currentRecordEndTime.value = 0
}

const startContinuousPlayback = (startIndex = 0) => {
  if (records.value.length === 0) return
  if (autoPlayTimer.value) { clearTimeout(autoPlayTimer.value); autoPlayTimer.value = null }
  currentPlaybackIndex.value = startIndex
  isAutoPlaying.value = true
  console.log(`[RecordPlayback] 开始轮播，共 ${records.value.length} 段，从第 ${startIndex} 段开始`)
  playSegmentWithAutoNext(records.value[startIndex])
}

const playSegmentWithAutoNext = (segment: RecordingSegment) => {
  // Save auto-play state before stopPlaybackInternal resets it
  const savedAutoPlaying = isAutoPlaying.value
  const savedIndex = currentPlaybackIndex.value
  if (playbackInfo.value.isPlaying) stopPlaybackInternal()
  isAutoPlaying.value = savedAutoPlaying
  currentPlaybackIndex.value = savedIndex
  console.log(`[RecordPlayback] 播放第 ${savedIndex}/${records.value.length - 1} 段: ${formatSeconds(segment.start)}-${formatSeconds(segment.end)} autoPlay=${savedAutoPlaying}`)
  startPlaybackInternal(segment)
}

const handleVideoEnded = () => {
  console.log(`[RecordPlayback] 视频结束，index=${currentPlaybackIndex.value} isAutoPlaying=${isAutoPlaying.value}`)
  if (isAutoPlaying.value) playNextSegment()
}

const playNextSegment = () => {
  if (currentPlaybackIndex.value < records.value.length - 1) {
    currentPlaybackIndex.value++
    console.log(`[RecordPlayback] 播放下一段 → index=${currentPlaybackIndex.value}`)
    playSegmentWithAutoNext(records.value[currentPlaybackIndex.value])
  } else {
    console.log('[RecordPlayback] 所有录像段播放完毕')
    isAutoPlaying.value = false
    currentPlaybackIndex.value = -1
    stopPlaybackInternal()
  }
}

/* ================= 时间轴事件 ================= */

const handleTimeChange = (time: number, segment: RecordingSegment) => {
  if (autoPlayTimer.value) { clearTimeout(autoPlayTimer.value); autoPlayTimer.value = null }

  const idx = records.value.findIndex(r => r.start === segment.start && r.end === segment.end)
  currentPlaybackIndex.value = idx
  isAutoPlaying.value = true
  playSegmentWithAutoNext(segment)
}

/* ================= 全屏功能 ================= */

const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    containerRef.value?.requestFullscreen().catch((err) => {
      ElMessage.error(`无法进入全屏模式: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

/* ================= iframe 消息 ================= */

const handleIframeMessage = (event: MessageEvent) => {
  const { type, speed, message, error } = event.data || {}
  if (type === 'speedChange' && typeof speed === 'number') currentPlaybackSpeed.value = speed
  if (type === 'downloadStart') downloading.value = true
  if (type === 'download' && message) { downloading.value = false; ElMessage.success(message) }
  if (type === 'error' && error) { downloading.value = false; ElMessage.error(error) }
}

/* ================= 生命周期 ================= */

const handleClose = () => {
  stopPlaybackInternal()
  stopProgressUpdate()
  if (autoPlayTimer.value) { clearTimeout(autoPlayTimer.value); autoPlayTimer.value = null }
  isAutoPlaying.value = false
  currentPlaybackIndex.value = -1
  currentTime.value = 0
  records.value = []
  downloading.value = false
  currentPlaybackSpeed.value = 1
  emit('update:modelValue', false)
}

// Handle modelValue changes (when switching channels)
watch(() => props.modelValue, (val) => {
  if (val && !props.videoUrl) queryRecords()
})

// Watch device/channel/date changes to reload recordings
watch(
  [() => props.deviceId, () => props.channelId, () => props.selectedDate],
  async () => {
    if (props.modelValue && !props.videoUrl && props.deviceId && props.channelId) {
      // 停止之前的播放
      stopPlaybackInternal()
      stopProgressUpdate()
      if (autoPlayTimer.value) {
        clearTimeout(autoPlayTimer.value)
        autoPlayTimer.value = null
      }
      isAutoPlaying.value = false
      currentPlaybackIndex.value = -1
      currentTime.value = 0

      // 查询新录像
      await queryRecords()
    }
  },
  { immediate: true }
)

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})
onUnmounted(() => {
  window.removeEventListener('message', handleIframeMessage)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  stopPlaybackInternal()
  stopProgressUpdate()
  if (autoPlayTimer.value) clearTimeout(autoPlayTimer.value)
})
</script>

<template>
  <div ref="containerRef" class="record-playback-container" :class="{ 'is-fullscreen': isFullscreen }">
    <div class="playback-header">
      <h3>{{ videoUrl ? channelName : `${channelName} - 云端录像回放` }}</h3>
      <div class="header-actions">
        <el-button
          :icon="isFullscreen ? undefined : FullScreen"
          size="small"
          circle
          @click="toggleFullscreen"
        >
          {{ isFullscreen ? '退出' : '' }}
        </el-button>
      </div>
    </div>

    <div class="playback-container">
      <!-- 直接播放模式 -->
      <div v-if="videoUrl" class="video-player-wrapper">
        <video :src="videoUrl" controls autoplay class="video-player" />
      </div>

      <!-- 云端录像模式：时间轴 -->
      <template v-else>
        <div v-if="downloading" class="download-status">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在下载录像...</span>
        </div>

        <!-- 无录像数据提示 -->
        <div v-if="!loading && records.length === 0" class="no-records-tip">
          <div class="no-records-icon">📹</div>
          <p>该日期暂无录像数据</p>
          <p class="no-records-sub">请选择其他日期查看</p>
        </div>

        <CloudVideoTimeline
          v-if="records.length > 0"
          ref="timelineRef"
          :records="records"
          :current-time="currentTime"
          :is-playing="playbackInfo.isPlaying"
          :play-url="playbackInfo.playUrl"
          @time-change="handleTimeChange"
          @video-ended="handleVideoEnded"
        />
      </template>
    </div>
  </div>
</template>

<style scoped lang="scss">
.record-playback-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #000;
  overflow: hidden;
  position: relative;

  &.is-fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
  }
}

.playback-header {
  padding: 12px 16px;
  background: rgba(42, 42, 42, 0.9);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: #fff;
  }

  .header-actions {
    display: flex;
    gap: 8px;
  }
}

.playback-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.video-player-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.download-status {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  backdrop-filter: blur(4px);
}

.no-records-tip {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  gap: 8px;

  .no-records-icon {
    font-size: 48px;
    opacity: 0.5;
  }

  p {
    margin: 0;
    font-size: 14px;
  }

  .no-records-sub {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.3);
  }
}
</style>
