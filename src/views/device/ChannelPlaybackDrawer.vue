<template>
  <ElDrawer
    :model-value="modelValue"
    :title="`${channelName} - ${currentMode === 'local' ? '本地录像回放' : '云端录像回放'}`"
    size="80%"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="playback-container">
      <!-- Date selector (only for local mode) -->
      <div v-if="currentMode === 'local'" class="playback-controls">
        <ElDatePicker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          :clearable="false"
          style="width: 200px; margin-right: 10px;"
        />
        <ElButton type="primary" :loading="querying" :disabled="!selectedDate" @click="queryRecords">
          查询录像
        </ElButton>
        <ElButton @click="clearRecords">清空</ElButton>

        <!-- Query status -->
        <div v-if="querying || pollResult" class="query-status">
          <ElTag v-if="querying" type="warning">查询中...</ElTag>
          <ElTag v-else-if="pollResult === 'success'" type="success">查询完成</ElTag>
          <ElTag v-else-if="pollResult === 'error'" type="danger">查询失败</ElTag>
        </div>
      </div>

      <!-- Video player and timeline -->
      <div class="player-wrapper">
        <VideoTimeline
          ref="timelineRef"
          :mode="currentMode"
          :records="records"
          :is-playing="playbackInfo.isPlaying"
          :querying="cloudQuerying"
          :poll-result="cloudPollResult"
          :play-url="playbackInfo.playUrls?.http_flv || playbackInfo.playUrls?.flv || ''"
          :device-id="props.deviceId"
          :channel-id="props.channelId"
          @time-change="handleTimeChange"
          @ready="onTimelineReady"
          @date-change="handleDateChange"
          @query="handleCloudQuery"
          @clear="handleCloudClear"
        />
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted, nextTick } from 'vue'
import {
  ElMessage,
  ElButton,
  ElTag,
  ElDatePicker,
  ElDrawer
} from 'element-plus'
import { gb28181Api } from '@/api/gb28181Api'
import VideoTimeline from '@/views/video/VideoTimeline.vue'

/* ================= 类型定义 ================= */

interface RecordingSegment {
  start: number  // 当天的秒数 (0-86399)
  end: number
  type: 'normal' | 'alarm'
}

interface Props {
  modelValue: boolean
  deviceId: string
  devicePkId?: number  // 设备主键 ID（用于 API 调用）
  channelId: string
  channelPkId?: number  // 通道主键 ID（用于查询录像等操作）
  channelName: string
  mode?: 'local' | 'cloud' // 回放模式：local=本地录像, cloud=云端录像
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

/* ================= 状态 ================= */

// 当前模式（带默认值）
const currentMode = computed(() => props.mode || 'local')

// 云端模式的演示数据（已移到 VideoTimeline 内部）

// 云端模式查询状态
const cloudQuerying = ref(false)
const cloudPollResult = ref<'success' | 'error' | null>(null)

// 显示的录像数据
const displayRecords = computed(() => records.value)

const selectedDate = ref<string>(formatDate(new Date()))
const selectedDateObj = computed(() => new Date(selectedDate.value))
const records = ref<RecordingSegment[]>([])
const querying = ref(false)
const pollResult = ref<'success' | 'error' | null>(null)
const selectedTime = ref(0)
const selectedSegment = ref<RecordingSegment | null>(null)
const timelineRef = ref()
const timelineReady = ref(false)

// Playback info
const playbackInfo = ref({
  isPlaying: false,
  startTime: '',  // ISO format
  endTime: '',    // ISO format
  streamId: '',   // 回放流的 stream_id
  playUrls: null as any  // 播放地址
})
const startingPlayback = ref(false)

/* ================= 工具函数 ================= */

// 格式化日期为 YYYY-MM-DD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 格式化秒数为 HH:mm:ss
function formatSeconds(sec: number): string {
  if (isNaN(sec) || sec < 0) return '--:--:--'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = Math.floor(sec % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// 格式化 ISO 时间
function formatTime(isoTime: string): string {
  if (!isoTime) return '--:--:--'
  const date = new Date(isoTime)
  return formatSeconds(date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds())
}

// 将当天的秒数转换为 ISO 时间字符串（格式：2024-01-01T00:00:00）
function secondsToISO(seconds: number): string {
  const date = new Date(selectedDate.value)
  date.setHours(0, 0, 0, 0)
  date.setSeconds(seconds)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
}

/* ================= 查询录像 ================= */

// 发送查询录像命令
const queryRecords = async () => {
  if (!props.channelPkId) {
    ElMessage.warning('缺少通道主键 ID，无法查询录像')
    console.error('Missing channelPkId for query playback')
    return
  }

  if (!selectedDate.value) {
    ElMessage.warning('请选择日期')
    return
  }

  querying.value = true
  pollResult.value = null
  records.value = []

  try {
    // 构造开始和结束时间（当天的 00:00:00 到 23:59:59）
    const startTime = `${selectedDate.value}T00:00:00`
    const endTime = `${selectedDate.value}T23:59:59`

    console.log('查询录像参数:', {
      channelPkId: props.channelPkId,
      startTime,
      endTime
    })

    // 调用新的查询录像接口（使用通道主键 ID）
    await gb28181Api.queryPlayback(props.channelPkId, {
      start_time: startTime,
      end_time: endTime
    })

    // 获取查询结果（只查询一次）
    await fetchQueryResult(startTime, endTime)
  } catch (error: any) {
    console.error('Failed to query records:', error)
    ElMessage.error(error.message || '查询录像失败')
    querying.value = false
    pollResult.value = 'error'
  }
}

// 获取查询结果（只查询一次）
const fetchQueryResult = async (startTime: string, endTime: string) => {
  try {
    console.log('获取录像查询结果')

    // 调用查询结果接口，使用通道主键 ID
    const result = await gb28181Api.getRecordInfoResult(
      props.channelPkId ? props.channelPkId.toString() : props.channelId,
      {
        start_time: startTime,
        end_time: endTime
      }
    )

    console.log('查询结果:', result)

    // 接口返回格式：{ total: 0, list: [], start_time: 1768752000, end_time: 1768838399 }
    const recordsList = result?.list

    if (Array.isArray(recordsList)) {
      pollResult.value = 'success'
      querying.value = false  // 关闭 loading

      // 转换录像数据为时间轴格式
      records.value = recordsList.map((record: any) => ({
        start: timeToSeconds(record.start_time),
        end: timeToSeconds(record.end_time),
        type: 'normal'  // 默认为正常录像
      }))

      if (records.value.length === 0) {
        ElMessage.info('该日期暂无录像')
      } else {
        ElMessage.success(`查询到 ${records.value.length} 段录像`)

        // 自动播放最后一段录像
        await nextTick()
        if (timelineRef.value && records.value.length > 0) {
          const lastRecord = records.value[records.value.length - 1]
          console.log('自动播放最后一段录像:', formatSeconds(lastRecord.end))
          timelineRef.value.seekToTime(lastRecord.end)
        }
      }
    } else {
      console.error('查询失败：返回数据格式异常')
      pollResult.value = 'error'
      querying.value = false
      ElMessage.error('查询录像失败')
    }
  } catch (error: any) {
    console.error('获取查询结果异常:', error)
    pollResult.value = 'error'
    querying.value = false
    ElMessage.error(error.message || '获取查询结果失败')
  }
}

// 清空录像
const clearRecords = () => {
  records.value = []
  pollResult.value = null
  querying.value = false
  selectedTime.value = 0
  selectedSegment.value = null
}

// 将时间字符串或时间戳转换为当天的秒数
function timeToSeconds(timeStr: string | number): number {
  let date: Date

  if (typeof timeStr === 'number') {
    // 时间戳格式（如 1768451537）
    date = new Date(timeStr * 1000)  // 转换为毫秒
  } else {
    // ISO 格式: 2024-01-01T12:30:45
    date = new Date(timeStr)
  }

  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds()
}

/* ================= 时间轴交互 ================= */

// 处理时间变化（用户点击时间轴）
// 业务逻辑：停止旧回放 → 开始新回放
const handleTimeChange = async (time: number, segment: RecordingSegment | null) => {
  selectedTime.value = time
  selectedSegment.value = segment

  if (!segment) {
    console.warn(`时间 ${formatSeconds(time)} 没有对应的录像`)
    return
  }

  console.log(`时间轴交互: ${formatSeconds(segment.start)} ~ ${formatSeconds(segment.end)}`)

  // 1. 先停止当前回放
  if (playbackInfo.value.isPlaying) {
    await stopPlaybackInternal()
  }

  // 2. 再开始新回放
  await startPlaybackInternal(segment)
}

// 时间轴准备好后，自动开始最近时间的回放
const onTimelineReady = () => {
  timelineReady.value = true

  // 只有本地模式且有录像数据时才自动开始回放
  if (currentMode.value === 'local' && records.value.length > 0) {
    // 获取最近录像时间
    const nearestTime = timelineRef.value?.getNearestRecordTime()
    if (nearestTime && nearestTime > 0) {
      console.log(`自动开始回放: ${formatSeconds(nearestTime)}`)
      timelineRef.value?.seekToTime(nearestTime)
    }
  }
}

// 处理日期变化（云端模式）
const handleDateChange = (date: string) => {
  console.log('云端模式日期变化:', date)
  // TODO: 调用云端录像查询接口
  // 目前云端模式使用 VideoTimeline 内部的 demo 数据
}

// 云端模式查询录像
const handleCloudQuery = (date: string) => {
  console.log('云端模式查询录像:', date)
  // TODO: 调用云端录像查询接口
  cloudQuerying.value = true
  cloudPollResult.value = null

  // 模拟查询
  setTimeout(() => {
    cloudQuerying.value = false
    cloudPollResult.value = 'success'
  }, 1000)
}

// 云端模式清空录像
const handleCloudClear = () => {
  console.log('云端模式清空录像')
  cloudPollResult.value = null
}

/* ================= 回放控制 ================= */

// 内部方法：开始回放
const startPlaybackInternal = async (segment: RecordingSegment) => {
  if (currentMode.value === 'cloud') {
    // 云端模式：TODO 等待后端接口
    console.log('云端回放暂未实现')
    return
  }

  // 本地模式
  startingPlayback.value = true

  try {
    const startTime = secondsToISO(segment.start)
    const endTime = secondsToISO(segment.end)

    const data = await gb28181Api.startPlayback({
      device_id: props.deviceId,
      channel_id: props.channelId,
      start_time: startTime,
      end_time: endTime
    })

    if (data?.play_urls) {
      playbackInfo.value = {
        isPlaying: true,
        startTime,
        endTime,
        streamId: data.stream_id || '',
        playUrls: data.play_urls
      }
      console.log('回放开始成功', data.stream_id)

      // TODO: 集成播放器组件，使用 data.play_urls
    } else {
      throw new Error('启动回放失败')
    }
  } catch (error: any) {
    console.error('Failed to start playback:', error)
    // 不显示错误消息，因为这是自动触发的
  } finally {
    startingPlayback.value = false
  }
}

// 内部方法：停止回放
const stopPlaybackInternal = async () => {
  if (!playbackInfo.value.isPlaying) return

  try {
    await gb28181Api.stopPlayback({
      device_id: props.deviceId,
      channel_id: props.channelId,
      stream_id: playbackInfo.value.streamId
    })

    playbackInfo.value = {
      isPlaying: false,
      startTime: '',
      endTime: '',
      streamId: '',
      playUrls: null
    }
    console.log('回放已停止')
  } catch (error: any) {
    console.error('Failed to stop playback:', error)
  }
}

// 公开方法：开始回放（保留供外部调用）
const startPlayback = async () => {
  if (!selectedSegment.value) {
    console.warn('没有选中的录像段')
    return
  }
  await startPlaybackInternal(selectedSegment.value)
}

// 公开方法：停止回放（保留供外部调用）
const stopPlayback = async () => {
  await stopPlaybackInternal()
}

/* ================= 生命周期 ================= */

// Handle drawer close
const handleClose = () => {
  // 停止回放
  stopPlaybackInternal()

  // 重置查询状态
  querying.value = false
  pollResult.value = null

  // 重置录像数据
  records.value = []
  selectedTime.value = 0
  selectedSegment.value = null

  // 重置回放信息
  playbackInfo.value = {
    isPlaying: false,
    startTime: '',
    endTime: '',
    streamId: '',
    playUrls: null
  }

  // 重置云端模式状态
  cloudQuerying.value = false
  cloudPollResult.value = null

  emit('update:modelValue', false)
}

// Watch for drawer open/close
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // 抽屉打开时，重置日期为当天
    selectedDate.value = formatDate(new Date())

    // 本地模式自动查询录像
    if (currentMode.value === 'local') {
      console.log('抽屉打开，准备查询录像', {
        channelPkId: props.channelPkId,
        channelId: props.channelId,
        devicePkId: props.devicePkId
      })
      queryRecords()
    }
  }
  // 关闭时的清理由 handleClose 处理
})

// Cleanup
onUnmounted(() => {
  stopPlayback()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.playback-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.mode-indicator {
  padding: 12px 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-base);
  display: flex;
  align-items: center;
}

.playback-controls {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-base);
  flex-wrap: wrap;
  gap: 10px;

  .query-status {
    margin-left: auto;
  }

  &.cloud-mode {
    display: block;
    padding: 12px 16px;
  }
}

.player-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-hover);
  padding: 16px;
}
</style>
