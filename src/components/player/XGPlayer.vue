<template>
  <div ref="containerRef" class="xgplayer-container">
    <div :id="playerId" ref="playerRef" class="xgplayer-wrapper"></div>
    <div v-if="error" class="player-error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>
    <div v-if="!url" class="player-error">
      <el-icon><WarningFilled /></el-icon>
      <span>当前播放器不支持该视频格式（需要 HLS/MP4/FMP4/TS）</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
// @ts-ignore - Icons exist but type definitions are incorrect
import { WarningFilled } from '@element-plus/icons-vue'

// XGPlayer 类型声明（使用 CDN 方式）
declare global {
  interface Window {
    Player: any
    FlvPlayer: any
    HlsPlayer: any
  }
}

interface Props {
  visible?: boolean
  width?: string
  height?: string
  url?: string
  autoplay?: boolean
  poster?: string
  hasAudio?: boolean
  isLive?: boolean // 是否为直播流
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  width: '100%',
  height: '100%',
  url: '',
  autoplay: true,
  poster: '',
  hasAudio: true,
  isLive: false,
  debug: false
})

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'ended'): void
  (e: 'error', error: any): void
}>()

const containerRef = ref<HTMLDivElement>()
const playerRef = ref<HTMLDivElement>()
const error = ref(false)
const errorMessage = ref('')

// 生成唯一 ID
const instanceId = ref(Math.random().toString(36).substring(2, 15))
const playerId = computed(() => `xgplayer_${instanceId.value}`)

let player: any = null

// 初始化播放器
const initPlayer = () => {
  destroyPlayer()

  if (!playerRef.value) {
    console.error('XGPlayer container not found')
    return
  }

  if (!window.Player) {
    console.error('XGPlayer library not loaded (window.Player not found)')
    error.value = true
    errorMessage.value = '播放器库未加载'
    return
  }

  if (!props.url) {
    console.warn('No URL provided')
    return
  }

  error.value = false

  try {
    const plugins: any[] = []

    // 检测 URL 类型并添加相应的插件
    // 获取 URL 的路径部分（去掉查询参数和 hash）
    const urlPath = props.url.split('?')[0].split('#')[0].toLowerCase()
    const extension = urlPath.substring(urlPath.lastIndexOf('.'))

    console.log('XGPlayer URL detection:', { url: props.url, urlPath, extension })

    if (extension === '.flv') {
      if (window.FlvPlayer) {
        plugins.push(window.FlvPlayer)
        console.log('XGPlayer: Added FlvPlayer plugin')
      }
    } else if (extension === '.m3u8') {
      if (window.HlsPlayer) {
        plugins.push(window.HlsPlayer)
        console.log('XGPlayer: Added HlsPlayer plugin')
      }
    } else {
      // MP4, TS 等其他格式，XGPlayer 原生支持，不需要插件
      console.log('XGPlayer: Using native support for', extension || 'unknown format')
    }

    const options: any = {
      id: playerId.value,
      url: props.url,
      autoplay: props.autoplay,
      playsinline: true,
      volume: 0.3, // 固定音量 30%
      plugins: plugins,
      pip: true,
      download: true,
      isLive: props.isLive,
      width: '100%',
      height: '100%'
    }

    if (props.poster) {
      options.poster = props.poster
    }

    console.log('Creating XGPlayer with options:', options)

    player = new window.Player(options)

    // 监听事件
    player.on('play', () => {
      console.log('XGPlayer: play')
      error.value = false
      emit('play')
    })

    player.on('pause', () => {
      console.log('XGPlayer: pause')
      emit('pause')
    })

    player.on('ended', () => {
      console.log('XGPlayer: ended')
      emit('ended')
    })

    player.on('error', (err: any) => {
      console.error('XGPlayer error:', err)
      error.value = true
      errorMessage.value = '播放失败'
      emit('error', err)
    })

  } catch (err) {
    console.error('Failed to create XGPlayer:', err)
    error.value = true
    errorMessage.value = '创建播放器失败'
    emit('error', err)
  }
}

// 销毁播放器
const destroyPlayer = () => {
  if (player) {
    try {
      player.destroy()
      player = null
    } catch (err) {
      console.warn('Error destroying XGPlayer:', err)
    }
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

  if (!player) {
    initPlayer()
    return
  }

  error.value = false

  // 如果 URL 变了，需要重新创建播放器
  if (player.src !== playUrl) {
    player.src = playUrl
    player.play()
  } else {
    player.play()
  }
}

// 暂停
const pause = () => {
  if (player) {
    player.pause()
  }
}

// 销毁
const destroy = () => {
  destroyPlayer()
}

onMounted(() => {
  console.log('XGPlayer onMounted, url:', props.url, 'autoplay:', props.autoplay)

  // 等待 XGPlayer 库加载
  const checkLibrary = () => {
    if (window.Player && playerRef.value) {
      // 使用 nextTick 确保 DOM 完全渲染后再初始化播放器
      nextTick(() => {
        if (props.url && props.autoplay) {
          initPlayer()
        }
      })
    } else {
      setTimeout(checkLibrary, 100)
    }
  }
  checkLibrary()
})

// 监听 url 变化
watch(() => props.url, (newUrl) => {
  console.log('XGPlayer url changed:', newUrl, 'visible:', props.visible)
  if (newUrl && props.visible) {
    // 使用 nextTick 确保 DOM 已渲染
    nextTick(() => {
      play(newUrl)
    })
  }
})

// 监听 visible 变化
watch(() => props.visible, (visible) => {
  console.log('XGPlayer visible changed:', visible, 'url:', props.url)
  if (visible) {
    if (props.url && props.autoplay) {
      nextTick(() => {
        play(props.url)
      })
    }
  } else {
    pause()
  }
})

onBeforeUnmount(() => {
  destroyPlayer()
})

// 暴露方法供父组件调用
defineExpose({
  play,
  pause,
  destroy
})
</script>

<style scoped lang="scss">
.xgplayer-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;

  .xgplayer-wrapper {
    width: 100%;
    height: 100%;
  }

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

// XGPlayer 全局样式覆盖
:deep(.xgplayer) {
  background: #000;
}
</style>
