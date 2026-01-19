<template>
  <div v-loading="loading" class="media-info">
    <ElDescriptions v-if="codecInfo" :column="2" border>
      <!-- 视频信息 -->
      <ElDescriptionsItem label="视频编码">
        {{ codecInfo.video?.codec_long_name || codecInfo.video?.codec_name || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频分辨率">
        {{ codecInfo.video?.width && codecInfo.video?.height
          ? `${codecInfo.video.width}x${codecInfo.video.height}`
          : '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频帧率">
        {{ formatFps(codecInfo.video?.fps) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频比特率">
        {{ formatBitrate(codecInfo.video?.bit_rate) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="像素格式">
        {{ codecInfo.video?.pix_fmt || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="编码配置">
        {{ codecInfo.video?.profile || '-' }}
      </ElDescriptionsItem>

      <!-- 音频信息 -->
      <ElDescriptionsItem label="音频编码">
        {{ codecInfo.audio?.codec_long_name || codecInfo.audio?.codec_name || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频采样率">
        {{ codecInfo.audio?.sample_rate ? `${codecInfo.audio.sample_rate} Hz` : '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频通道">
        {{ codecInfo.audio?.channels ? formatChannels(codecInfo.audio.channels, codecInfo.audio.channel_layout) : '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频比特率">
        {{ formatBitrate(codecInfo.audio?.bit_rate) }}
      </ElDescriptionsItem>

      <!-- 格式信息 -->
      <ElDescriptionsItem label="封装格式">
        {{ codecInfo.format?.format_long_name || codecInfo.format?.format_name || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="时长">
        {{ codecInfo.format?.duration ? formatDuration(codecInfo.format.duration) : '-' }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElEmpty v-else-if="!loading" description="暂无编码信息" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { gb28181Api } from '@/api/gb28181Api'

interface CodecInfo {
  video: {
    codec_name: string
    codec_long_name: string
    width: number
    height: number
    fps: number
    bit_rate: string
    pix_fmt: string
    profile: string
  }
  audio: {
    codec_name: string
    codec_long_name: string
    sample_rate: number
    channels: number
    channel_layout: string
    bit_rate: string
    sample_fmt: string
  } | null
  format: {
    format_name: string
    format_long_name: string
    duration: string
    size: string
    bit_rate: string
  }
}

interface Props {
  url: string
  streamId?: string
}

const props = defineProps<Props>()

const loading = ref(false)
const codecInfo = ref<CodecInfo | null>(null)

// 格式化比特率
const formatBitrate = (bitRate?: string) => {
  if (!bitRate || bitRate === '') return '-'
  const rate = parseInt(bitRate)
  if (isNaN(rate)) return '-'
  if (rate < 1000) return `${rate} bps`
  if (rate < 1000000) return `${(rate / 1000).toFixed(2)} Kbps`
  return `${(rate / 1000000).toFixed(2)} Mbps`
}

// 格式化帧率（fps 字段可能是时间基，需要特殊处理）
const formatFps = (fps?: number) => {
  if (!fps) return '-'
  // 如果 fps 值非常大（如 90000），可能是时间基，显示为 N/A
  if (fps > 1000) return 'N/A'
  return `${fps} fps`
}

// 格式化通道数
const formatChannels = (channels?: number, layout?: string) => {
  if (!channels) return '-'
  if (layout) return `${channels} (${layout})`
  return `${channels} ch`
}

// 格式化时长
const formatDuration = (duration: string) => {
  const seconds = parseFloat(duration)
  if (isNaN(seconds)) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// 获取编码信息
const fetchCodecInfo = async () => {
  if (!props.url) {
    console.log('No URL provided, skipping codec info fetch')
    return
  }

  loading.value = true
  try {
    const response = await gb28181Api.getCodecInfo({
      url: props.url,
      stream_id: props.streamId
    })

    // 处理两种返回格式
    if (response && typeof response === 'object') {
      // 检查是否有 way 字段
      if ('way' in response && 'data' in response) {
        const way = (response as any).way
        const data = (response as any).data

        if (way === 'media-api') {
          // 第一种格式：media-api
          // 转换 data 为组件需要的格式
          codecInfo.value = {
            video: {
              codec_name: data.video?.codec || '',
              codec_long_name: data.video?.codec || '',
              width: data.video?.width || 0,
              height: data.video?.height || 0,
              fps: data.video?.fps || 0,
              bit_rate: data.video?.bit_rate?.toString() || '',
              pix_fmt: '',
              profile: ''
            },
            audio: data.audio ? {
              codec_name: data.audio.codec || '',
              codec_long_name: data.audio.codec || '',
              sample_rate: data.audio.sample_rate?.toString() || '',
              channels: data.audio.channels || 0,
              channel_layout: '',
              bit_rate: '',
              sample_fmt: ''
            } : null,
            format: {
              format_name: '',
              format_long_name: '',
              duration: '',
              size: '',
              bit_rate: ''
            }
          }
        } else if (way === 'ffprobe') {
          // 第二种格式：ffprobe（原有格式）
          codecInfo.value = data || null
        } else {
          codecInfo.value = null
        }
      } else {
        // 兼容旧格式（没有 way 字段）
        codecInfo.value = response as any
      }
    } else {
      codecInfo.value = null
    }
  } catch (error: any) {
    console.error('Failed to fetch codec info:', error)
    // 静默失败，不显示错误提示
    codecInfo.value = null
  } finally {
    loading.value = false
  }
}

// 手动触发一次请求（不轮询）
const startTask = () => {
  fetchCodecInfo()
}

// 停止任务（空操作，因为没有轮询）
const stopTask = () => {
  // 不需要停止任何东西
}

// 暴露方法
defineExpose({
  startTask,
  stopTask
})
</script>

<style scoped lang="scss">
.media-info {
  padding: 16px;
  min-height: 200px;
}
</style>
