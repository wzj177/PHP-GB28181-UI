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
          :disabled="querying"
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
       <!-- :play-url="playbackInfo.playUrls?.wss_flv || playbackInfo.playUrls?.ws_flv ||  playbackInfo.playUrls?.https_flv || playbackInfo.playUrls?.flv || ''" -->
      <div class="player-wrapper">
        <VideoTimeline
          ref="timelineRef"
          :mode="currentMode"
          :records="records"
          :current-time="currentTime"
          :is-playing="playbackInfo.isPlaying"
          :querying="cloudQuerying"
          :poll-result="cloudPollResult"
          :play-url="playbackInfo.playUrls?.ws_flv || playbackInfo.playUrls?.http_flv || ''"
          :device-id="props.deviceId"
          :channel-id="props.channelId"
          :channel-pk-id="props.channelPkId"
          :stream-id="playbackInfo.streamId"
          :playback-speed="currentPlaybackSpeed"
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
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
  originalStartTime?: number  // 原始 Unix 时间戳，用于回放 API
  originalEndTime?: number    // 原始 Unix 时间戳，用于回放 API
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

// 当前回放倍速（默认 1x）
const currentPlaybackSpeed = ref(1)

// 连续播放状态
const currentPlaybackIndex = ref(-1)  // 当前播放的录像段索引（-1 表示未播放）
const autoPlayTimer = ref<number | null>(null)  // 自动播放定时器
const isAutoPlaying = ref(false)  // 是否处于自动播放状态

// 播放进度跟踪
const currentTime = ref(0)  // 当前播放时间（当天的秒数）
const progressUpdateTimer = ref<number | null>(null)  // 进度更新定时器
const playbackStartTime = ref(0)  // 播放开始的时间戳

/* ================= 工具函数 ================= */

// 监听来自 iframe 播放器的消息（倍速变化等）
const handleIframeMessage = (event: MessageEvent) => {
  const { type, speed } = event.data || {}

  // 更新倍速状态
  if (type === 'speedChange' && typeof speed === 'number') {
    currentPlaybackSpeed.value = speed
    console.log('倍速状态已更新:', speed)
  }
}

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

// 格式化本地日期时间为 ISO 格式 (YYYY-MM-DDTHH:mm:ss)
// 使用本地时间而非 UTC 时间，避免时区转换问题
function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day}T${hour}:${minute}:${second}`
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

// 获取查询结果（最大轮询5次，有记录就停止）
const fetchQueryResult = async (startTime: string, endTime: string) => {
  const maxPollCount = 5  // 最大轮询次数
  const pollInterval = 1000  // 轮询间隔（毫秒）
  let pollCount = 0

  const poll = async (): Promise<void> => {
    try {
      pollCount++
      console.log(`获取录像查询结果（第 ${pollCount}/${maxPollCount} 次）`)

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
        // 有记录或超过最大轮询次数，停止轮询
        if (recordsList.length > 0 || pollCount >= maxPollCount) {
          pollResult.value = 'success'
          querying.value = false  // 关闭 loading

          // 转换录像数据为时间轴格式，保存原始时间戳用于回放
          const convertedRecords = recordsList.map((record: any) => {
            const start = timeToSeconds(record.start_time)
            const end = timeToSeconds(record.end_time)
            console.log('录像转换:', {
              原始: { start_time: record.start_time, end_time: record.end_time },
              转换后: { start, end },
              时长: end - start
            })
            return {
              start,
              end,
              type: 'normal',  // 默认为正常录像
              // 保存原始时间戳，用于回放 API
              originalStartTime: record.start_time,
              originalEndTime: record.end_time
            }
          })

          // 过滤掉无效的录像段（时长 <= 0）
          records.value = convertedRecords.filter(r => r.end > r.start)

          console.log('有效录像段:', records.value.length, '/', convertedRecords.length)

          if (records.value.length === 0) {
            ElMessage.info('该日期暂无录像')
          } else {
            ElMessage.success(`查询到 ${records.value.length} 段录像`)

            // 延迟500ms后开始连续播放，确保 DOM 更新完成
            setTimeout(() => {
              startContinuousPlayback()
            }, 500)
          }
        } else {
          // 没有记录且未达到最大轮询次数，继续轮询
          setTimeout(() => poll(), pollInterval)
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

  // 开始轮询
  await poll()
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

// 开始连续播放（从最早时间按顺序播放到最晚时间）
const startContinuousPlayback = (startIndex?: number, autoPlayFirst: boolean = true) => {
  if (records.value.length === 0) return

  // 清除之前的自动播放定时器
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }

  // 从指定索引开始，如果没有指定则从第一段（最早时间）开始
  currentPlaybackIndex.value = startIndex ?? 0
  isAutoPlaying.value = true

  console.log(`开始顺序播放，共 ${records.value.length} 段录像，从第 ${currentPlaybackIndex.value + 1}/${records.value.length} 段开始`)

  // 如果需要立即播放第一段，使用录像段的原始时间
  if (autoPlayFirst) {
    const currentSegment = records.value[currentPlaybackIndex.value]
    playSegmentWithAutoNext(currentSegment, false)  // false = 使用录像段原始时间
  }
}

// 播放录像段并在播放完成后自动播放下一段
// useFullDayRange: 是否使用当天完整时间范围
const playSegmentWithAutoNext = async (segment: RecordingSegment, useFullDayRange: boolean = false) => {
  // 1. 先停止当前回放
  if (playbackInfo.value.isPlaying) {
    await stopPlaybackInternal()
  }

  // 2. 开始播放新段
  await startPlaybackInternal(segment, useFullDayRange)

  // 3. 如果处于自动播放模式，设置定时器在播放完成后切换到下一段
  if (isAutoPlaying.value && currentPlaybackIndex.value >= 0) {
    // 计算实际播放时长（从开始时间到当前段结束时间）
    const duration = (segment.end - segment.start) * 1000

    console.log(`录像段时长: ${duration / 1000} 秒，${formatSeconds(segment.start)} ~ ${formatSeconds(segment.end)}`)

    // 清除之前的定时器
    if (autoPlayTimer.value) {
      clearTimeout(autoPlayTimer.value)
    }

    // 设置定时器，在录像段播放完成后切换到下一段
    // 加上1秒缓冲时间确保播放完整
    autoPlayTimer.value = window.setTimeout(async () => {
      await playNextSegment()
    }, duration + 1000)
  }
}

// 播放下一段录像（按时间顺序播放）
const playNextSegment = async () => {
  // 检查是否还有下一段
  if (currentPlaybackIndex.value < records.value.length - 1) {
    currentPlaybackIndex.value++
    const nextSegment = records.value[currentPlaybackIndex.value]

    console.log(`自动切换到下一段录像（第 ${currentPlaybackIndex.value + 1}/${records.value.length} 段）：${formatSeconds(nextSegment.start)} ~ ${formatSeconds(nextSegment.end)}`)

    await playSegmentWithAutoNext(nextSegment)
  } else {
    // 所有录像段播放完毕，从头开始循环播放
    console.log('所有录像段播放完毕，从头开始循环播放')

    // 延迟200ms后从头开始
    setTimeout(async () => {
      currentPlaybackIndex.value = 0
      const firstSegment = records.value[0]

      console.log(`从头开始播放（第 ${currentPlaybackIndex.value + 1}/${records.value.length} 段）：${formatSeconds(firstSegment.start)} ~ ${formatSeconds(firstSegment.end)}`)

      await playSegmentWithAutoNext(firstSegment)
    }, 200)
  }
}

// 处理时间变化（用户点击时间轴）
// 业务逻辑：停止旧回放 → 开始新回放（使用录像段的原始时间） → 继续顺序播放到最后
const handleTimeChange = async (time: number, segment: RecordingSegment | null) => {
  selectedTime.value = time
  selectedSegment.value = segment

  if (!segment) {
    console.warn(`时间 ${formatSeconds(time)} 没有对应的录像`)
    return
  }

  console.log(`时间轴交互: 用户点击时间 ${formatSeconds(time)}`)

  // 清除之前的自动播放定时器
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }

  // 1. 先停止当前回放
  if (playbackInfo.value.isPlaying) {
    await stopPlaybackInternal()
  }

  // 2. 使用录像段的原始时间进行回放
  // 必须使用 recordList 中返回的实际录像时间段，否则设备会因"无录像数据"而结束流
  if (!segment.originalStartTime || !segment.originalEndTime) {
    console.error('录像段缺少原始时间戳，无法播放')
    ElMessage.error('录像数据异常，无法播放')
    return
  }

  console.log('使用录像段原始时间回放:', {
    originalStartTime: segment.originalStartTime,
    originalEndTime: segment.originalEndTime
  })

  // 3. 找到当前点击的录像段在 records 中的索引
  const segmentIndex = records.value.findIndex(r =>
    r.start === segment.start && r.end === segment.end
  )

  if (segmentIndex === -1) {
    console.warn('找不到对应的录像段索引')
    return
  }

  // 4. 设置为自动播放模式，从当前点击的段开始
  currentPlaybackIndex.value = segmentIndex
  isAutoPlaying.value = true

  console.log(`从第 ${segmentIndex + 1}/${records.value.length} 段开始继续顺序播放`)

  // 5. 使用 playSegmentWithAutoNext 播放当前段，并自动切换到下一段
  await playSegmentWithAutoNext(segment)

  console.log('回放已启动')
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

// 开始进度更新
const startProgressUpdate = (segment: RecordingSegment) => {
  // 清除之前的定时器
  stopProgressUpdate()

  // 记录播放开始时间和当前录像段的起始时间
  playbackStartTime.value = Date.now()
  currentTime.value = segment.start

  // 每秒更新一次进度
  progressUpdateTimer.value = window.setInterval(() => {
    const elapsed = (Date.now() - playbackStartTime.value) / 1000  // 已播放的秒数
    currentTime.value = segment.start + Math.floor(elapsed)

    // 确保不超过录像段的结束时间
    if (currentTime.value > segment.end) {
      currentTime.value = segment.end
    }
  }, 1000)
}

// 停止进度更新
const stopProgressUpdate = () => {
  if (progressUpdateTimer.value) {
    clearInterval(progressUpdateTimer.value)
    progressUpdateTimer.value = null
  }
}

// 内部方法：开始回放
// useFullDayRange: 是否使用当天完整时间范围（00:00:00 - 23:59:59），默认 false 使用录像段时间
const startPlaybackInternal = async (segment: RecordingSegment, useFullDayRange: boolean = false) => {
  if (currentMode.value === 'cloud') {
    // 云端模式：TODO 等待后端接口
    console.log('云端回放暂未实现')
    return
  }

  // 本地模式
  startingPlayback.value = true

  try {
    let startTime: string
    let endTime: string

    if (useFullDayRange) {
      // 使用当天完整时间范围
      startTime = `${selectedDate.value}T00:00:00`
      endTime = `${selectedDate.value}T23:59:59`
      console.log('使用当天完整时间范围:', { startTime, endTime })
    } else {
      // 使用录像段的原始时间戳（Unix 时间戳）
      if (!segment.originalStartTime || !segment.originalEndTime) {
        throw new Error('录像段缺少原始时间戳')
      }

      // 将 Unix 时间戳转换为本地时间格式 (YYYY-MM-DDTHH:mm:ss)
      const startDate = new Date(segment.originalStartTime * 1000)
      const endDate = new Date(segment.originalEndTime * 1000)

      startTime = formatLocalDateTime(startDate)
      endTime = formatLocalDateTime(endDate)

      console.log('使用录像段原始时间:', {
        originalStartTime: segment.originalStartTime,
        originalEndTime: segment.originalEndTime,
        startTime,
        endTime
      })
    }

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

      // 启动进度更新
      startProgressUpdate(segment)

      // 如果倍速不是 1x，重新设置倍速
      if (currentPlaybackSpeed.value !== 1 && props.channelPkId) {
        try {
          await gb28181Api.playbackControl(props.channelPkId, {
            action: 'scale',
            scale: String(currentPlaybackSpeed.value),
            stream_id: data.stream_id
          })
          console.log('倍速重新设置成功:', currentPlaybackSpeed.value)
        } catch (error) {
          console.error('倍速重新设置失败:', error)
        }
      }

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

    // 停止进度更新
    stopProgressUpdate()
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

  // 停止进度更新
  stopProgressUpdate()

  // 清理自动播放定时器
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }

  // 重置自动播放状态
  isAutoPlaying.value = false
  currentPlaybackIndex.value = -1

  // 重置当前播放时间
  currentTime.value = 0

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

  // 重置倍速状态
  currentPlaybackSpeed.value = 1

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

// 注册 iframe 消息监听器
onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})

// Cleanup
onUnmounted(() => {
  // 移除 iframe 消息监听器
  window.removeEventListener('message', handleIframeMessage)

  stopPlayback()
  // 清理进度更新定时器
  stopProgressUpdate()
  // 清理自动播放定时器
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
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
