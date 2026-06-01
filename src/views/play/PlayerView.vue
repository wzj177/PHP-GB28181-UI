<template>
  <div class="player-view">
    <!-- 播放器容器 -->
    <div class="player-container">
      <!-- Jessibuca 播放器 -->
      <JessibucaPlayer
        v-if="playerType === 'jessibuca'"
        ref="playerRef"
        :url="currentUrl"
        :width="width"
        :height="height"
        :has-audio="hasAudio"
        :is-live="isLive"
        :autoplay="autoplay"
        fluent
        @play="handlePlay"
        @pause="handlePause"
        @error="handleError"
      />

      <!-- H265Web 播放器 -->
      <H265WebPlayer
        v-else-if="playerType === 'h265web'"
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

      <!-- WebRTC 播放器 -->
      <WebRTCPlayer
        v-else-if="playerType === 'webrtc'"
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
      <div v-else class="error-placeholder">
        <el-icon><WarningFilled /></el-icon>
        <span>无效的播放器类型: {{ playerType }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
// @ts-ignore
import { useRoute } from 'vue-router'
// @ts-ignore - Icons exist but type definitions are incorrect
import { WarningFilled } from '@element-plus/icons-vue'
import { JessibucaPlayer, H265WebPlayer, XGPlayer, WebRTCPlayer, EasyPlayerPro } from '@/components/player'

// 从路由参数获取配置
const route = useRoute()

interface PlayerConfig {
  url: string
  playerType?: 'jessibuca' | 'h265web' | 'xgplayer' | 'webrtc' | 'easyplayer'
  width?: string
  height?: string
  autoplay?: boolean
  hasAudio?: boolean
  isLive?: boolean
}

const props = defineProps<{
  config?: PlayerConfig
}>()

// URL 参数优先于 props
const urlParam = route.query.url as string
const playerTypeParam = route.query.playerType as string
const widthParam = route.query.width as string
const heightParam = route.query.height as string
const autoplayParam = route.query.autoplay
const hasAudioParam = route.query.hasAudio
const isLiveParam = route.query.isLive

const currentUrl = computed(() => {
  return props.config?.url || urlParam || ''
})

const playerType = computed(() => {
  return props.config?.playerType || (playerTypeParam as any) || detectBestPlayer(currentUrl.value)
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
  return props.config?.isLive !== false || isLiveParam === 'true'
})

const playerRef = ref()

// 根据 URL 检测最佳播放器
const detectBestPlayer = (url: string): 'jessibuca' | 'h265web' | 'xgplayer' | 'webrtc' | 'easyplayer' => {
  if (!url) return 'easyplayer'

  const urlPath = url.split('?')[0].split('#')[0].toLowerCase()
  const extension = urlPath.substring(urlPath.lastIndexOf('.'))

  console.log('PlayerView: Detecting best player for', url, 'extension:', extension)

  // 默认使用 easyplayer
  return 'easyplayer'
}

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

// 向父页面发送消息
const postMessage = (message: any) => {
  if (window.parent !== window) {
    window.parent.postMessage(message, '*')
  }
}

// 监听来自父页面的消息
const handleParentMessage = (event: MessageEvent) => {
  const { action, url, playerType, command } = event.data || {}

  console.log('PlayerView received message:', event.data)

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
    case 'switchPlayer':
      // 切换播放器类型需要重新加载组件
      if (playerType && playerType !== playerType.value) {
        location.href = `${location.pathname}?url=${encodeURIComponent(url)}&playerType=${playerType}`
      }
      break
    case 'ptz':
      // PTZ 命令
      if (playerRef.value?.ptz) {
        playerRef.value.ptz(command)
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
    playerType: playerType.value,
    url: currentUrl.value
  })

  console.log('PlayerView mounted:', {
    url: currentUrl.value,
    playerType: playerType.value,
    width: width.value,
    height: height.value
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
.player-view {
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
</style>
