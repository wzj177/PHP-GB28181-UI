<template>
  <div ref="containerRef" class="h265web-player">
    <div :id="playerId" ref="playerBoxRef" class="h265web-container"></div>
    <div v-if="loading" class="player-loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>视频加载中</span>
    </div>
    <div v-if="error" class="player-error">
      <el-icon><WarningFilled /></el-icon>
      <span>{{ errorMessage }}</span>
    </div>

    <!-- 控制条 -->
    <div v-show="!loading && !error" class="player-controls" :class="{ 'controls-visible': showControls }">
      <div class="controls-left">
        <!-- 播放/暂停 -->
        <el-button
          :icon="isPlaying ? VideoPause : VideoPlay"
          circle
          size="small"
          @click="togglePlay"
        />
      </div>

      <div class="controls-center">
        <!-- 音量 -->
        <div class="volume-control">
          <el-button
            :icon="volume > 0 ? Microphone : MuteNotification"
            circle
            size="small"
            @click="toggleMute"
          />
          <el-slider
            v-model="volumeValue"
            :min="0"
            :max="100"
            :show-tooltip="false"
            @input="handleVolumeChange"
            style="width: 80px; margin: 0 8px;"
          />
        </div>
      </div>

      <div class="controls-right">
        <!-- 截图 -->
        <el-button
          :icon="Camera"
          circle
          size="small"
          @click="takeSnapshot"
          title="截图"
        />
        <!-- 全屏 -->
        <el-button
          :icon="isFullscreen ? Rank : FullScreen"
          circle
          size="small"
          @click="toggleFullscreen"
          title="全屏"
        />
      </div>
    </div>

    <!-- 用于截图的隐藏 canvas -->
    <canvas ref="snapshotCanvas" style="display: none;"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
// @ts-ignore - Icons exist but type definitions are incorrect
import { Loading, WarningFilled, VideoPlay, VideoPause, Microphone, MuteNotification, Camera, FullScreen, Rank } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

// h265web 类型声明
declare global {
  interface Window {
    new265webjs: any
  }
}

interface Props {
  visible?: boolean
  width?: string
  height?: string
  url?: string
  autoplay?: boolean
  hasAudio?: boolean
  isLive?: boolean // 是否为直播流
  showButton?: boolean
  debug?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  width: '100%',
  height: '100%',
  url: '',
  autoplay: true,
  hasAudio: false,
  isLive: true,
  showButton: true,
  debug: false
})

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'error', message: string): void
}>()

const containerRef = ref<HTMLDivElement>()
const playerBoxRef = ref<HTMLDivElement>()
const snapshotCanvas = ref<HTMLCanvasElement>()
const loading = ref(false)
const error = ref(false)
const errorMessage = ref('')

// 控制条相关状态
const isPlaying = ref(false)
const volumeValue = ref(50) // 0-100, 对应 H265Web 的 0-1.0
const volume = ref(0.5)
const isFullscreen = ref(false)
const showControls = ref(false)
let controlsHideTimer: number | null = null

// 生成唯一 ID
const instanceId = ref(Math.random().toString(36).substring(2, 15))
const playerId = computed(() => `h265web_player_${instanceId.value}`)
const playerKey = computed(() => `h265web_${instanceId.value}`)

// Token for h265web (from example)
const token = 'base64:QXV0aG9yOmNoYW5neWFubG9uZ3xudW1iZXJ3b2xmLEdpdGh1YjpodHRwczovL2dpdGh1Yi5jb20vbnVtYmVyd29sZixFbWFpbDpwb3JzY2hlZ3QyM0Bmb3htYWlsLmNvbSxRUTo1MzEzNjU4NzIsSG9tZVBhZ2U6aHR0cDovL3h2aWRlby52aWRlbyxEaXNjb3JkOm51bWJlcndvbGYjODY5NCx3ZWNoYXI6bnVtYmVyd29sZjExLEJlaWppbmcsV29ya0luOkJhaWR1'

// 强制修正 video 样式的定时器
let styleFixTimer: number | null = null

// 强制设置 video 宽高为 100%
const forceVideoStyle = () => {
  const videoElement = document.getElementById(`${playerId.value}-flv-hevc`) as HTMLVideoElement
  if (videoElement) {
    videoElement.style.width = '100%'
    videoElement.style.height = '100%'
    videoElement.style.objectFit = 'fill'
    console.log('H265: Force video style to 100%')
  }
}

// 显示控制条
const showControlsBar = () => {
  showControls.value = true
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
  }
  // 3秒后自动隐藏
  controlsHideTimer = window.setTimeout(() => {
    showControls.value = false
  }, 3000)
}

// 初始化播放器
const initPlayer = () => {
  // 先销毁旧实例
  destroyPlayer()

  if (!playerBoxRef.value || !window.new265webjs) {
    console.error('h265web library not loaded')
    error.value = true
    errorMessage.value = '播放器库未加载'
    return
  }

  loading.value = true
  error.value = false

  // 解析尺寸字符串，转换为像素值
  const parseSize = (size: string, dimension: 'width' | 'height'): number => {
    if (typeof size === 'number') return size
    if (size.endsWith('px')) {
      return parseInt(size)
    }
    // 对于百分比，获取容器的实际大小
    if (size.endsWith('%')) {
      if (playerBoxRef.value && playerBoxRef.value.parentElement) {
        const parentSize = dimension === 'width'
          ? playerBoxRef.value.parentElement.clientWidth
          : playerBoxRef.value.parentElement.clientHeight
        const percentage = parseInt(size) / 100
        const result = parentSize * percentage
        console.log(`H265: ${dimension} - parent: ${parentSize}, percentage: ${percentage}, result: ${result}`)
        return result > 0 ? result : 800
      }
    }
    return 800 // 默认值
  }

  try {
    const options: any = {
      player: playerId.value,
      token: token,
      extInfo: {
        coreProbePart: 0.4,
        probeSize: 8192,
        ignoreAudio: 0
      }
    }

    // 获取容器的实际宽高像素值
    const containerWidth = parseSize(props.width, 'width')
    const containerHeight = parseSize(props.height, 'height')

    options.width = containerWidth
    options.height = containerHeight

    console.log('Creating h265web player with options:', options)

    const player = window.new265webjs(props.url || '', options)

    ;(window as any)[playerKey.value] = player

    player.onOpenFullScreen = () => {
      console.log('H265: 全屏开启')
      isFullscreen.value = true
      forceVideoStyle()
    }

    player.onCloseFullScreen = () => {
      console.log('H265: 全屏关闭')
      isFullscreen.value = false
      forceVideoStyle()
    }

    player.onReadyShowDone = () => {
      loading.value = false
      error.value = false

      // 强制修正 video 样式
      nextTick(() => {
        forceVideoStyle()

        // 持续修正样式（h265web 会多次重置）
        if (styleFixTimer) clearInterval(styleFixTimer)
        styleFixTimer = window.setInterval(() => {
          forceVideoStyle()
        }, 100)

        // 5秒后停止定时修正
        setTimeout(() => {
          if (styleFixTimer) {
            clearInterval(styleFixTimer)
            styleFixTimer = null
          }
        }, 5000)
      })

      const result = player.play()
      console.log('H265: 准备完成，播放结果:', result)
      isPlaying.value = true
      emit('play')
    }

    player.onLoadFinish = () => {
      loading.value = false
      forceVideoStyle()
      console.log('H265: 加载完成')
    }

    player.onError = (err: any) => {
      console.error('H265 error:', err)
      loading.value = false
      error.value = true
      errorMessage.value = '播放失败'
      isPlaying.value = false
      if (styleFixTimer) {
        clearInterval(styleFixTimer)
        styleFixTimer = null
      }
      emit('error', err)
    }

    player.do()
  } catch (err) {
    console.error('Failed to create h265web player:', err)
    loading.value = false
    error.value = true
    errorMessage.value = '创建播放器失败'
  }
}

// 销毁播放器
const destroyPlayer = () => {
  if (styleFixTimer) {
    clearInterval(styleFixTimer)
    styleFixTimer = null
  }
  if (controlsHideTimer) {
    clearTimeout(controlsHideTimer)
    controlsHideTimer = null
  }

  const player = (window as any)[playerKey.value]
  if (player) {
    try {
      if (player.pause) {
        player.pause()
      }
      if (player.release) {
        player.release()
      }
    } catch (err) {
      console.warn('Error destroying h265web player:', err)
    }
    ;(window as any)[playerKey.value] = null
  }
  loading.value = false
  error.value = false
  isPlaying.value = false
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
    return
  }

  loading.value = true
  error.value = false

  try {
    if (player.play) {
      player.play()
    }
    nextTick(() => {
      forceVideoStyle()
    })
  } catch (err) {
    console.error('Failed to play:', err)
    loading.value = false
    error.value = true
    errorMessage.value = '播放失败'
  }
}

// 暂停
const pause = () => {
  const player = (window as any)[playerKey.value]
  if (player) {
    try {
      if (player.pause) {
        player.pause()
        isPlaying.value = false
      }
    } catch (err) {
      console.error('Error pausing player:', err)
    }
  }
}

// 切换播放/暂停
const togglePlay = () => {
  const player = (window as any)[playerKey.value]
  if (!player) return

  try {
    if (player.isPlaying && player.isPlaying()) {
      player.pause()
      isPlaying.value = false
      emit('pause')
    } else {
      player.play()
      isPlaying.value = true
      emit('play')
    }
  } catch (err) {
    console.error('Error toggling play:', err)
  }
}

// 切换静音
const toggleMute = () => {
  const player = (window as any)[playerKey.value]
  if (!player) return

  try {
    if (volume.value > 0) {
      // 静音
      player.setVoice(0)
      volumeValue.value = 0
      volume.value = 0
    } else {
      // 恢复音量到 50%
      player.setVoice(0.5)
      volumeValue.value = 50
      volume.value = 0.5
    }
  } catch (err) {
    console.error('Error toggling mute:', err)
  }
}

// 处理音量变化
const handleVolumeChange = (value: number) => {
  const player = (window as any)[playerKey.value]
  if (!player) return

  try {
    const vol = value / 100
    player.setVoice(vol)
    volume.value = vol
  } catch (err) {
    console.error('Error setting volume:', err)
  }
}

// 切换全屏
const toggleFullscreen = () => {
  const player = (window as any)[playerKey.value]
  if (!player) return

  try {
    if (isFullscreen.value) {
      player.closeFullScreen()
    } else {
      player.fullScreen()
    }
  } catch (err) {
    console.error('Error toggling fullscreen:', err)
    // 如果 H265Web 的全屏失败，尝试使用浏览器原生全屏
    try {
      if (!isFullscreen.value && containerRef.value) {
        containerRef.value.requestFullscreen()
      } else if (document.fullscreenElement) {
        document.exitFullscreen()
      }
    } catch (e) {
      console.error('Native fullscreen also failed:', e)
    }
  }
}

// 截图
const takeSnapshot = () => {
  const player = (window as any)[playerKey.value]
  if (!player || !snapshotCanvas.value) {
    ElMessage.warning('播放器未就绪')
    return
  }

  try {
    // 设置 canvas 尺寸与视频一致
    const canvas = snapshotCanvas.value
    canvas.width = 1920
    canvas.height = 1080

    // 调用 H265Web 的 snapshot API
    if (player.snapshot) {
      player.snapshot(canvas)

      // 转换为图片并下载
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `snapshot_${Date.now()}.png`
          a.click()
          URL.revokeObjectURL(url)
          ElMessage.success('截图已保存')
        }
      }, 'image/png')
    }
  } catch (err) {
    console.error('Error taking snapshot:', err)
    ElMessage.error('截图失败')
  }
}

// 销毁
const destroy = () => {
  destroyPlayer()
}

// 监听 url 变化
watch(() => props.url, (newUrl) => {
  console.log('H265Web url changed:', newUrl, 'visible:', props.visible)
  if (newUrl && props.visible) {
    nextTick(() => {
      destroyPlayer()
      initPlayer()
    })
  }
})

// 监听 visible 变化
watch(() => props.visible, (visible) => {
  console.log('H265Web visible changed:', visible, 'url:', props.url)
  if (visible) {
    if (props.url && props.autoplay) {
      nextTick(() => {
        initPlayer()
      })
    }
  } else {
    pause()
  }
})

onMounted(() => {
  const checkLibrary = () => {
    if ((window.new265webjs) && playerBoxRef.value) {
      nextTick(() => {
        if (props.url && props.autoplay) {
          console.log('H265Web onMounted, url:', props.url, 'autoplay:', props.autoplay)
          initPlayer()
        }
      })
    } else {
      setTimeout(checkLibrary, 100)
    }
  }
  checkLibrary()

  // 鼠标移动时显示控制条
  if (containerRef.value) {
    containerRef.value.addEventListener('mousemove', showControlsBar)
    containerRef.value.addEventListener('mouseenter', showControlsBar)
    containerRef.value.addEventListener('mouseleave', () => {
      showControls.value = false
    })
  }
})

onBeforeUnmount(() => {
  destroyPlayer()
})

// 暴露方法供父组件调用
defineExpose({
  play,
  pause,
  destroy,
  togglePlay,
  toggleFullscreen,
  takeSnapshot
})
</script>

<style scoped lang="scss">
.h265web-player {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;

  .h265web-container {
    width: 100%;
    height: 100%;
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

  // 控制条样式
  .player-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 20;

    &.controls-visible {
      opacity: 1;
    }

    .controls-left,
    .controls-center,
    .controls-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .volume-control {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #fff;
    }

    :deep(.el-button) {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: #fff;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
        transform: scale(1.05);
      }
    }

    :deep(.el-slider) {
      .el-slider__runway {
        background: rgba(255, 255, 255, 0.3);
        height: 4px;
      }

      .el-slider__bar {
        background: #409EFF;
      }

      .el-slider__button {
        width: 12px;
        height: 12px;
        border: 2px solid #409EFF;
      }
    }
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
