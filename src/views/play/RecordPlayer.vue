<template>
  <div class="record-player">
    <!-- 播放器容器 -->
    <div class="player-container">
      <!-- 根据播放器类型显示不同组件 -->
      <!-- H265WebPlayer 播放器（默认） -->
      <H265WebPlayer
        v-if="playerType === 'h265web'"
        ref="playerRef"
        :url="currentUrl"
        :width="width"
        :height="height"
        :has-audio="hasAudio"
        :is-live="isLive"
        :autoplay="autoplay"
        :channel-id="channelId"
        :stream-id="streamId"
        :custom-controls="customControls"
        @play="handlePlay"
        @pause="handlePause"
        @error="handleError"
        @speed-change="handleSpeedChange"
        @seek="handleSeek"
        @download="handleDownload"
      />

      <!-- XGPlayer 播放器 -->
      <XGPlayer
        v-else-if="playerType === 'xgplayer'"
        ref="playerRef"
        :url="currentUrl"
        :width="width"
        :height="height"
        :is-live="isLive"
        :autoplay="autoplay"
        @play="handlePlay"
        @pause="handlePause"
        @error="handleError"
      />

      <!-- EasyPlayerPro 播放器 -->
      <EasyPlayerPro
        v-else-if="playerType === 'easyplayer'"
        ref="playerRef"
        :url="currentUrl"
        :width="width"
        :height="height"
        :has-audio="hasAudio"
        :is-live="isLive"
        :autoplay="autoplay"
        @play="handlePlay"
        @pause="handlePause"
        @error="handleError"
      />

      <!-- 无效播放器 -->
      <div v-if="!currentUrl" class="error-placeholder">
        <el-icon><WarningFilled /></el-icon>
        <span>无效的播放地址</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useRoute } from 'vue-router'
// @ts-ignore - Icons exist but type definitions are incorrect
import { WarningFilled } from '@element-plus/icons-vue'
import H265WebPlayer from '@/components/player/H265WebPlayer.vue'
import XGPlayer from '@/components/player/XGPlayer.vue'
import EasyPlayerPro from '@/components/player/EasyPlayerPro.vue'
// @ts-ignore
import { Download, DArrowRight, ZoomIn, ZoomOut } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'

// 从路由参数获取配置
const route = useRoute()

interface RecordPlayerConfig {
  url: string
  playerType?: 'h265web' | 'xgplayer' | 'easyplayer'
  width?: string
  height?: string
  autoplay?: boolean
  hasAudio?: boolean
  isLive?: boolean
  channelId?: string | number
  streamId?: string
}

const props = defineProps<{
  config?: RecordPlayerConfig
}>()

// URL 参数优先于 props
const urlParam = route.query.url as string
const playerTypeParam = route.query.player_type as string
const widthParam = route.query.width as string
const heightParam = route.query.height as string
const autoplayParam = route.query.autoplay
const hasAudioParam = route.query.hasAudio
const isLiveParam = route.query.isLive
const channelIdParam = route.query.channel_id as string | undefined
const streamIdParam = route.query.stream_id as string | undefined
const speedParam = route.query.speed as string | undefined

const currentUrl = computed(() => {
  return props.config?.url || urlParam || ''
})

// 根据 URL 自动判断播放器类型：默认使用 EasyPlayerPro
const detectBestPlayer = (url: string): 'h265web' | 'xgplayer' | 'easyplayer' => {
  // 默认使用 easyplayer
  return 'easyplayer'
}

const playerType = computed(() => {
  // 优先级：URL 参数 > props 配置 > 自动检测
  if (playerTypeParam) {
    return playerTypeParam as 'h265web' | 'xgplayer' | 'easyplayer'
  }
  if (props.config?.playerType) {
    return props.config.playerType
  }
  return detectBestPlayer(currentUrl.value)
})

const width = computed(() => {
  return props.config?.width || widthParam || '100%'
})

const height = computed(() => {
  return props.config?.height || heightParam || '100%'
})

const autoplay = computed(() => {
  return props.config?.autoplay !== false && autoplayParam !== 'false'
})

const hasAudio = computed(() => {
  return props.config?.hasAudio === true || hasAudioParam === 'true'
})

const isLive = computed(() => {
  // 只有明确设置为 'true' 时才是直播模式，否则默认为回放模式
  if (isLiveParam === 'true') return true
  if (props.config?.isLive === true) return true
  // 默认为回放模式（false），这样才会显示自定义控制按钮
  return false
})

const channelId = computed(() => {
  return props.config?.channelId || channelIdParam || ''
})

const streamId = computed(() => {
  return props.config?.streamId || streamIdParam || ''
})


// 自定义控制按钮配置
const customControls = computed(() => {
  // 只在非直播模式（回放模式）下显示控制按钮
  if (isLive.value) return undefined

  return {
    left: [
      // 倍速控制按钮
      {
        label: '0.5x',
        props: { size: 'small' },
        action: 'speed-0.5',
        active: currentSpeed.value === 0.5
      },
      {
        label: '1x',
        props: { size: 'small' },
        action: 'speed-1',
        active: currentSpeed.value === 1
      },
      {
        label: '2x',
        props: { size: 'small' },
        action: 'speed-2',
        active: currentSpeed.value === 2
      },
      {
        label: '4x',
        props: { size: 'small' },
        action: 'speed-4',
        active: currentSpeed.value === 4
      }
    ],
    right: [
      // 缩放控制
      {
        icon: ZoomOut,
        props: { size: 'small' },
        action: 'scale-out'
      },
      {
        icon: ZoomIn,
        props: { size: 'small' },
        action: 'scale-in'
      },
      // 下载按钮
      {
        label: '下载',
        icon: Download,
        props: { size: 'small' },
        action: 'download'
      }
    ]
  }
})

const playerRef = ref()
const currentSpeed = ref(Number(speedParam) || 1)  // 当前倍速，从 URL 参数读取，默认 1x

// 事件处理
const handlePlay = () => {
  postMessage({ type: 'play' })
}

const handlePause = () => {
  postMessage({ type: 'pause' })
}

const handleError = (error: any) => {
  postMessage({ type: 'error', error: error.message || error })
}

// 倍速控制
const handleSpeedChange = async (speed: number, streamIdParam: string) => {
  console.log('倍速变化:', speed)
  currentSpeed.value = speed  // 更新当前倍速状态

  // 调用后端 API
  if (!channelId.value) {
    console.warn('倍速控制失败: 缺少 channelId')
    postMessage({ type: 'speedChange', speed })
    return
  }

  if (!streamIdParam) {
    console.warn('倍速控制失败: 缺少 streamId')
    postMessage({ type: 'speedChange', speed })
    return
  }

  try {
    // 倍速控制使用 action=scale
    await gb28181Api.playbackControl(channelId.value, {
      action: 'scale',
      scale: String(speed),
      stream_id: streamIdParam
    })
    console.log('倍速控制成功:', speed)
    postMessage({ type: 'speedChange', speed })
  } catch (error) {
    console.error('倍速控制失败:', error)
    postMessage({ type: 'error', error: '倍速控制失败' })
  }
}

// 进度拖动
const handleSeek = async (time: string, streamIdParam: string) => {
  console.log('拖动进度:', time)

  // 调用后端 API
  if (!channelId.value) {
    console.warn('进度拖动失败: 缺少 channelId')
    postMessage({ type: 'seek', time })
    return
  }

  if (!streamIdParam) {
    console.warn('进度拖动失败: 缺少 streamId')
    postMessage({ type: 'seek', time })
    return
  }

  try {
    // 转换时间格式为后端支持的格式
    let seekTime: string | number

    // 如果 time 是 ISO 格式（如 2024-01-01T14:30:00），提取时分秒
    if (time.includes('T') || time.includes('-')) {
      const date = new Date(time)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      const seconds = date.getSeconds()
      // 转换为 HH:MM:SS 格式
      seekTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    } else {
      // 已经是 HH:MM:SS 或秒数格式，直接使用
      seekTime = time
    }

    await gb28181Api.playbackControl(channelId.value, {
      action: 'seek',
      seek_time: seekTime,
      stream_id: streamIdParam
    })
    console.log('进度拖动成功:', seekTime)
    postMessage({ type: 'seek', time })
  } catch (error) {
    console.error('进度拖动失败:', error)
    postMessage({ type: 'error', error: '进度拖动失败' })
  }
}

// 下载录像
const handleDownload = async (params: { start_time: string; end_time: string }, streamIdParam: string) => {
  console.log('下载录像:', params)

  // 调用后端 API
  if (!channelId.value) {
    console.warn('下载录像失败: 缺少 channelId')
    postMessage({ type: 'download', params })
    return
  }

  if (!streamIdParam) {
    console.warn('下载录像失败: 缺少 streamId')
    postMessage({ type: 'download', params })
    return
  }

  try {
    await gb28181Api.playbackDownload(channelId.value, {
      start_time: params.start_time,
      end_time: params.end_time,
      stream_id: streamIdParam
    })
    console.log('下载录像成功')
    postMessage({ type: 'download', params })
  } catch (error) {
    console.error('下载录像失败:', error)
    postMessage({ type: 'error', error: '下载录像失败' })
  }
}

// 向父页面发送消息
const postMessage = (message: any) => {
  if (window.parent !== window) {
    window.parent.postMessage(message, '*')
  }
}

// 监听来自父页面的消息
const handleParentMessage = (event: MessageEvent) => {
  const { action, url, command } = event.data || {}

  console.log('RecordPlayer received message:', event.data)

  switch (action) {
    case 'play':
      if (playerRef.value?.play) {
        playerRef.value.play(url)
      }
      break
    case 'pause':
      if (playerRef.value?.pause) {
        playerRef.value.pause()
      }
      break
    case 'stop':
    case 'destroy':
      if (playerRef.value?.destroy) {
        playerRef.value.destroy()
      }
      break
  }
}

onMounted(() => {
  // 监听父页面消息
  window.addEventListener('message', handleParentMessage)

  // 通知父页面播放器已就绪
  postMessage({
    type: 'ready',
    url: currentUrl.value,
    playerType: playerType.value
  })

  console.log('RecordPlayer mounted:', {
    url: currentUrl.value,
    playerType: playerType.value,
    width: width.value,
    height: height.value,
    isLive: isLive.value
  })
})

onBeforeUnmount(() => {
  // 清理播放器
  if (playerRef.value?.destroy) {
    playerRef.value.destroy()
  }

  // 移除消息监听
  window.removeEventListener('message', handleParentMessage)

  // 通知父页面播放器已销毁
  postMessage({
    type: 'destroyed'
  })
})

// 暴露方法供父组件调用
defineExpose({
  play: (url?: string) => playerRef.value?.play(url),
  pause: () => playerRef.value?.pause(),
  destroy: () => playerRef.value?.destroy()
})
</script>

<style scoped lang="scss">
.record-player {
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}

.player-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.error-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f56c6c;
  font-size: 14px;
  gap: 12px;

  .el-icon {
    font-size: 48px;
  }
}

// 修复 H265Web video 元素宽度问题
:deep(.h265web-player) {
  width: 100% !important;
  height: 100% !important;

  .h265web-container {
    width: 100% !important;
    height: 100% !important;
  }

  // 强制 video 元素填满容器
  video {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain !important;
  }

  // 修复 H265Web 生成的 canvas 元素
  canvas {
    width: 100% !important;
    height: 100% !important;
  }
}
</style>
