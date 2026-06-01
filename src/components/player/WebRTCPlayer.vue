<template>
  <div ref="containerRef" class="webrtc-player">
    <video
      ref="videoRef"
      autoplay
      playsinline
      muted
      class="webrtc-video"
      :style="{ width: width, height: height }"
    ></video>
    <div v-if="loading" class="player-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>连接中...</span>
    </div>
    <div v-if="error" class="player-error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
// @ts-ignore - Icons exist but type definitions are incorrect
import { Loading, WarningFilled } from '@element-plus/icons-vue'

// ZLMRTCClient 类型声明
declare global {
  interface Window {
    ZLMRTCClient: any
  }
}

interface Props {
  visible?: boolean
  width?: string
  height?: string
  url?: string
  autoplay?: boolean
  isLive?: boolean // 是否为直播流
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  width: '100%',
  height: '100%',
  url: '',
  autoplay: true,
  isLive: true,
  debug: false
})

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'error', message: string): void
  (e: 'stats', stats: any): void
}>()

const containerRef = ref<HTMLDivElement>()
const videoRef = ref<HTMLVideoElement>()
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')

// 全局存储播放器实例
const instanceId = ref(Math.random().toString(36).substring(2, 15))
const playerKey = computed(() => `webrtc_${instanceId.value}`)

// 初始化 WebRTC
const initWebRTC = () => {
  if (!videoRef.value || !window.ZLMRTCClient) {
    console.error('ZLMRTCClient library not loaded')
    return
  }

  destroyWebRTC()
}

// 销毁 WebRTC
const destroyWebRTC = () => {
  const player = (window as any)[playerKey.value]
  if (player) {
    try {
      player.close()
    } catch (e) {
      console.warn('Error destroying WebRTC player:', e)
    }
    ;(window as any)[playerKey.value] = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
    videoRef.value.load()
  }

  // 清理状态
  loading.value = false
  error.value = false
}

// 播放
const play = (url?: string) => {
  const playUrl = url || props.url
  if (!playUrl) {
    console.warn('No URL provided')
    return
  }

  if (!videoRef.value || !window.ZLMRTCClient) {
    setTimeout(() => play(url), 100)
    return
  }

  destroyWebRTC()

  loading.value = true
  error.value = false

  try {
    const player = new window.ZLMRTCClient.Endpoint({
      element: videoRef.value,
      debug: props.debug,
      zlmsdpUrl: playUrl,
      audioEnable: true,
      videoEnable: true,
      recvOnly: true,
      useCamera: false,
      useMic: false
    })

    // 存储到全局对象
    ;(window as any)[playerKey.value] = player

    // 监听连接状态变化
    player.on(window.ZLMRTCClient.Events.WEBRTC_ON_CONNECTION_STATE_CHANGE, (state: string) => {
      if (props.debug) {
        console.log('WebRTC state:', state)
      }
      if (state === 'connected') {
        loading.value = false
        error.value = false
        emit('play')
      } else if (state === 'failed' || state === 'disconnected') {
        loading.value = false
        error.value = true
        errorMessage.value = '连接失败'
        emit('error', 'Connection failed')
      }
    })

    // 监听错误
    player.on(window.ZLMRTCClient.Events.WEBRTC_NOT_SUPPORT, (e: any) => {
      console.error('WebRTC not supported:', e)
      loading.value = false
      error.value = true
      errorMessage.value = '浏览器不支持 WebRTC'
      emit('error', 'WebRTC not supported')
    })

    player.on(window.ZLMRTCClient.Events.WEBRTC_ICE_CANDIDATE_ERROR, (e: any) => {
      console.error('ICE error:', e)
      loading.value = false
      error.value = true
      errorMessage.value = 'ICE 协商失败'
      emit('error', 'ICE candidate error')
    })

    player.on(window.ZLMRTCClient.Events.WEBRTC_OFFER_ANWSER_EXCHANGE_FAILED, (e: any) => {
      console.error('Offer/Answer error:', e)
      loading.value = false
      error.value = true
      errorMessage.value = '信令交换失败'
      emit('error', 'Offer/Answer exchange failed')
    })

    // 监听统计信息
    player.on(window.ZLMRTCClient.Events.WEBRTC_ON_STATS, (stats: any) => {
      emit('stats', stats)
    })
  } catch (err) {
    console.error('Failed to create WebRTC client:', err)
    loading.value = false
    error.value = true
    errorMessage.value = '创建 WebRTC 失败'
    emit('error', err)
  }
}

// 暂停
const pause = () => {
  destroyWebRTC()
  emit('pause')
}

// 销毁
const destroy = () => {
  destroyWebRTC()
}

// 监听 url 变化
watch(() => props.url, (newUrl) => {
  if (newUrl && props.visible) {
    play(newUrl)
  }
})

// 监听 visible 变化
watch(() => props.visible, (visible) => {
  if (visible) {
    if (props.url && props.autoplay) {
      play(props.url)
    }
  } else {
    pause()
  }
})

onMounted(() => {
  // 等待 ZLMRTCClient 库加载
  const checkLibrary = () => {
    if (window.ZLMRTCClient && videoRef.value) {
      initWebRTC()
      if (props.url && props.autoplay) {
        play(props.url)
      }
    } else {
      setTimeout(checkLibrary, 100)
    }
  }
  checkLibrary()
})

onBeforeUnmount(() => {
  destroyWebRTC()
})

// 暴露方法供父组件调用
defineExpose({
  play,
  pause,
  destroy
})
</script>

<style scoped lang="scss">
.webrtc-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;

  video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .player-loading,
  .player-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #fff;
    z-index: 10;

    .el-icon {
      font-size: 32px;
    }
  }

  .player-loading {
    .el-icon {
      animation: rotating 2s linear infinite;
    }
  }

  .player-error {
    color: #f56c6c;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
