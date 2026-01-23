<template>
  <div ref="containerRef" class="easyplayer-pro-player">
    <div v-if="error" class="player-error">
      <el-icon>
        <WarningFilled />
      </el-icon>
      <span>{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed } from 'vue'
// @ts-ignore - Icons exist but type definitions are incorrect
import { WarningFilled } from '@element-plus/icons-vue'

// EasyPlayerPro 类型声明
declare global {
  interface Window {
    EasyPlayerPro: any
  }
}

// 自定义控制按钮配置（EasyPlayerPro 使用内置按钮，不需要外部传入）
interface Props {
  visible?: boolean
  width?: string
  height?: string
  url?: string
  autoplay?: boolean
  isLive?: boolean // 是否为直播流
  hasAudio?: boolean
  debug?: boolean
  channelId?: string | number  // 通道 ID（用于回放控制）
  streamId?: string  // 回放流 ID（用于回放控制）
  customControls?: any  // 保留接口兼容性，EasyPlayerPro 使用内置按钮
  controls?: string[]  // 要显示的控制按钮，如 ['scale', 'playback_download']
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  width: '100%',
  height: '100%',
  url: '',
  autoplay: true,
  isLive: true,
  hasAudio: true,
  debug: false,
  channelId: '',
  streamId: '',
  customControls: undefined,
  controls: () => []  // 默认为空数组，不显示任何自定义按钮
})

const emit = defineEmits<{
  (e: 'play'): void
  (e: 'pause'): void
  (e: 'error', message: string): void
  (e: 'timeout'): void
  (e: 'speedChange', speed: number, streamId: string): void  // 倍速变化
  (e: 'download', params: { start_time: string; end_time: string }, streamId: string): void  // 下载录像
}>()

const containerRef = ref<HTMLDivElement>()
const error = ref(false)
const errorMessage = ref('')

// 当前倍速状态
const currentSpeed = ref(1)

// 全局存储播放器实例，使用组件唯一标识
const instanceId = ref(Math.random().toString(36).substring(2, 15))
const playerKey = computed(() => `easyplayer_pro_${instanceId.value}`)

// 初始化播放器
const initPlayer = () => {
  if (!containerRef.value || !window.EasyPlayerPro) {
    console.error('EasyPlayerPro library not loaded')
    return
  }

  destroyPlayer()

  const options = {
    container: containerRef.value,
    isLive: props.isLive,
    hasAudio: props.hasAudio,
    isMute: false,
    stretch: true,
    bufferTime: 1,
    loadTimeOut: 10,
    loadTimeReplay: 3,
    MSE: false,
    WCS: false,
    WASM: false,
    WASMSIMD: false,
    gpuDecoder: false,
    isFlv: false,
    webGPU: false,
    canvasRender: false,
    isRtcSRS: false,
    isRtcZLM: false,
    isFlow: false,
    debug: props.debug,
    isBand: true,
    btns: {
      fullscreen: true,
      screenshot: true,
      play: true,
      audio: true,
      record: true,
      stretch: true,
      zoom: false,
      ptz: false,
      quality: false
    },
    onPlay: () => {
      error.value = false
      emit('play')
    },
    onPause: () => {
      emit('pause')
    },
    onError: (err: any) => {
      console.error('EasyPlayerPro error:', err)
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
  try {
    const player = new window.EasyPlayerPro(containerRef.value, options)
      ; (window as any)[playerKey.value] = player
    addCustomControls(player)
  } catch (e) {
    console.error('Failed to create EasyPlayerPro instance:', e)
    error.value = true
    errorMessage.value = '播放器初始化失败'
  }
}

const showOrReplaceControlBox = (parent, content) => {
  // 移除旧的
  const old = parent.querySelector('.easyplayer-controls-box');
  if (old) return old.remove();

  // 创建新的
  const box = document.createElement('div');
  box.className = 'easyplayer-controls-box';
  if (typeof content === 'string') {
    box.innerHTML = content;
  } else if (content instanceof Node) {
    box.appendChild(content);
  }
  parent.appendChild(box);
  return box;
}

const generateScaleBoxHTML = () => {
  // 根据当前倍速设置默认选中状态
  const getActiveClass = (rate: number) => {
    return rate === currentSpeed.value ? 'control-active' : ''
  }

  return `
    <div class="easyplayer-scale-btns" style="
      display: flex;
      gap: 6px;
      padding: 8px;
      background: rgba(30, 30, 30, 0.8);
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    ">
      <button class="el-button el-button--small ${getActiveClass(0.5)}" data-rate="0.5">0.5x</button>
      <button class="el-button el-button--small ${getActiveClass(1)}" data-rate="1">1x</button>
      <button class="el-button el-button--small ${getActiveClass(2)}" data-rate="2">2x</button>
      <button class="el-button el-button--small ${getActiveClass(4)}" data-rate="4">4x</button>
    </div>
  `;
}

const addCustomControls = (playerInstance: any) => {
  // 获取当前播放器实例和 streamId
  const player = playerInstance
  const currentStreamId = props.streamId || ''
  const controls = props.controls || []

  // 如果 controls 为空，不添加任何自定义按钮
  if (!controls || controls.length === 0) {
    console.log('EasyPlayerPro: controls 为空，不添加自定义按钮')
    return
  }

  console.log('EasyPlayerPro: 添加自定义按钮', controls)

  // 可以在这里添加自定义控制按钮的逻辑
  const ctrl = player.player.control;

  // 倍速按钮
  if (controls.includes('scale')) {
    ctrl.addExtendBtn({
      name: 'scale',
      icon: '/static/images/scale.png',         // 默认图标
      iconTitle: '倍速切换',                           // 提示文字
      click: function (event) {
        const box = showOrReplaceControlBox(event.target.parentElement, generateScaleBoxHTML())
        const btnsContainer = box.querySelector('.easyplayer-scale-btns');
        if (btnsContainer) {
          const handleScaleClick = (e) => {
            const btn = e.target.closest('button[data-rate]');
            if (!btn) return

            const rate = parseFloat(btn.dataset.rate)
            console.log('设置播放倍速为:', rate)

            // 更新当前倍速状态
            currentSpeed.value = rate

            // 调用播放器的 setRate 方法（如果支持）
            if (typeof player.setRate === 'function') {
              player.setRate(rate)
            }

            // 触发 speedChange 事件
            emit('speedChange', rate, currentStreamId)

            // 更新选中状态
            btnsContainer.querySelectorAll('button').forEach(b => {
              b.classList.toggle('control-active', b === btn)
            })
          }
          btnsContainer.removeEventListener('click', handleScaleClick)
          btnsContainer.addEventListener('click', handleScaleClick)
        }
      }
    })
  }

  // 下载按钮
  if (controls.includes('playback_download')) {
    ctrl.addExtendBtn({
      name: 'playback_download',
      icon: '/static/images/playback_download.png',         // 默认图标
      iconTitle: '回放下载',                           // 提示文字
      click: function (event) {
        console.log('回放下载被点击')

        // 触发 download 事件
        // 注意：开始和结束时间需要从父组件传入或从当前播放状态获取
        // 这里暂时使用空字符串，父组件需要补充实际的时间参数
        emit('download', {
          start_time: '',
          end_time: ''
        }, currentStreamId)
      }
    })
  }
}

// 销毁播放器
const destroyPlayer = () => {
  const player = (window as any)[playerKey.value]
  if (player) {
    try {
      // 停止播放
      if (typeof player.pause === 'function') {
        player.pause()
      }
      // 销毁播放器
      if (typeof player.destroy === 'function') {
        player.destroy()
      }
    } catch (e) {
      console.warn('Error destroying EasyPlayerPro:', e)
    }
    ; (window as any)[playerKey.value] = null
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
        if (props.isLive) {
          p.play(playUrl)
        } else {
          p.playback(playUrl)
        }
      }
    })
    return
  }

  error.value = false
  if (props.isLive) {
    player.play(playUrl)
  } else {
    player.playback(playUrl)
  }
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
  if (player && typeof player.screenshot === 'function') {
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
  // 等待 EasyPlayerPro 库加载
  const checkLibrary = () => {
    if (window.EasyPlayerPro && containerRef.value) {
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
.easyplayer-pro-player {
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
<style lang="css">
.easyplayer-container .easyplayer-controls .easyplayer-controls-bottom .easyplayer-controls-right .easyplayer-control-extend-scale .easyplayer-controls-box {
  position: absolute;
  bottom: 28px;
  right: -60px;
  padding: 0 12px 8px;
  border-radius: 2px;
  width: 320px;
  background: rgba(33, 33, 33, .9);
}

/* 倍速按钮激活状态 */
.easyplayer-scale-btns .control-active {
  background-color: #409eff !important;
  border-color: #409eff !important;
  color: #ffffff !important;
}
</style>
