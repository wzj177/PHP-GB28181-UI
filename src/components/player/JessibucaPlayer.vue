<template>
  <div ref="containerRef" class="jessibuca-player">
    <div v-if="error" class="player-error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
// @ts-ignore - Icons exist but type definitions are incorrect
import { WarningFilled } from '@element-plus/icons-vue'

// Jessibuca 类型声明
declare global {
  interface Window {
    Jessibuca: any
  }
}

interface Props {
  visible?: boolean
  width?: string
  height?: string
  url?: string
  autoplay?: boolean
  fluent?: boolean
  isLive?: boolean // 是否为直播流
  hasAudio?: boolean
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  width: '100%',
  height: '100%',
  url: '',
  autoplay: true,
  fluent: true,
  isLive: true,
  hasAudio: false,
  debug: false
})

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'error', message: string): void
  (e: 'timeout'): void
}>()

const containerRef = ref<HTMLDivElement>()
const error = ref(false)
const errorMessage = ref('')

// 全局存储播放器实例，使用组件唯一标识
const instanceId = ref(Math.random().toString(36).substring(2, 15))
const playerKey = computed(() => `jessibuca_${instanceId.value}`)

// 初始化播放器
const initPlayer = () => {
  if (!containerRef.value || !window.Jessibuca) {
    console.error('Jessibuca library not loaded')
    return
  }

  destroyPlayer()

  const options = {
    container: containerRef.value,
    videoBuffer: 0.2, // 缓冲时长
    isResize: true, // 自适应尺寸
    loadingText: '加载中...', // Jessibuca 自带的 loading
    hasAudio: props.hasAudio,
    debug: props.debug,
    decoder: '/static/js/jessibuca/decoder.js', // 重要：指定 decoder 路径
    operateBtns: {
      fullscreen: true,
      screenshot: true,
      play: true,
      audio: true
    },
    forceNoOffscreen: true,
    isNotMute: true, // 开启音频
    timeout: 10,
    supportDblclickFullscreen: true,
    showBandwidth: false,
    autoWasm: true,
    heartTimeout: 5,
    onPlay: () => {
      error.value = false
      emit('play')
    },
    onPause: () => {
      emit('pause')
    },
    onError: (err: any) => {
      console.error('Jessibuca error:', err)
      error.value = true
      errorMessage.value = '播放失败'
      emit('error', err)
    },
    onTimeout: () => {
      error.value = true
      errorMessage.value = '播放超时'
      emit('timeout')
    }
  }

  // 存储到全局对象
  ;(window as any)[playerKey.value] = new window.Jessibuca(options)
}

// 销毁播放器
const destroyPlayer = () => {
  const player = (window as any)[playerKey.value]
  if (player) {
    try {
      player.pause()
      // destroy 返回 Promise
      if (typeof player.destroy === 'function') {
        player.destroy().catch((e: any) => {
          console.warn('Jessibuca destroy error:', e)
        })
      }
    } catch (e) {
      console.warn('Error destroying Jessibuca player:', e)
    }
    ;(window as any)[playerKey.value] = null
  }
  error.value = false
}

// 播放
const play = (url?: string) => {
  const playUrl = url || props.url
  if (!playUrl) {
    console.warn('No URL provided')
    return
  }

  const player = (window as any)[playerKey.value]
  if (!player) {
    initPlayer()
    nextTick(() => {
      const p = (window as any)[playerKey.value]
      if (p) {
        error.value = false
        p.play(playUrl)
      }
    })
    return
  }

  error.value = false
  player.play(playUrl)
}

// 暂停
const pause = () => {
  const player = (window as any)[playerKey.value]
  if (player) {
    player.pause()
  }
}

// 销毁
const destroy = () => {
  destroyPlayer()
}

// 截图
const screenshot = () => {
  const player = (window as any)[playerKey.value]
  if (player) {
    return player.screenshot()
  }
  return null
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
  // 等待 Jessibuca 库加载
  const checkLibrary = () => {
    if (window.Jessibuca && containerRef.value) {
      initPlayer()
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
  destroyPlayer()
})

// 暴露方法供父组件调用
defineExpose({
  play,
  pause,
  destroy,
  screenshot
})
</script>

<style scoped lang="scss">
.jessibuca-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;

  .player-error {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #f56c6c;
    z-index: 10;

    .el-icon {
      font-size: 32px;
    }
  }
}
</style>
