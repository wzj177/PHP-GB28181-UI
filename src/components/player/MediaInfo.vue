<template>
  <div v-loading="loading" class="media-info">
    <ElDescriptions v-if="mediaInfo" :column="2" border>
      <ElDescriptionsItem label="流 ID">
        {{ mediaInfo.stream || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="应用">
        {{ mediaInfo.app || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频编码">
        {{ mediaInfo.videoCodec || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频分辨率">
        {{ mediaInfo.videoResolution || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频帧率">
        {{ mediaInfo.videoFps ? `${mediaInfo.videoFps} fps` : '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="视频比特率">
        {{ formatBitrate(mediaInfo.videoBitrate) }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频编码">
        {{ mediaInfo.audioCodec || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频采样率">
        {{ mediaInfo.audioSampleRate ? `${mediaInfo.audioSampleRate} Hz` : '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频通道">
        {{ mediaInfo.audioChannels || '-' }}
      </ElDescriptionsItem>
      <ElDescriptionsItem label="音频比特率">
        {{ formatBitrate(mediaInfo.audioBitrate) }}
      </ElDescriptionsItem>
    </ElDescriptions>

    <ElEmpty v-else-if="!loading" description="暂无编码信息" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

interface Props {
  app: string
  stream: string
  mediaServerId: string
  autoStart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoStart: true
})

const loading = ref(false)
const mediaInfo = ref<any>(null)
let timer: any = null

// 格式化比特率
const formatBitrate = (bitrate?: number) => {
  if (!bitrate) return '-'
  if (bitrate < 1000) return `${bitrate} bps`
  if (bitrate < 1000000) return `${(bitrate / 1000).toFixed(2)} Kbps`
  return `${(bitrate / 1000000).toFixed(2)} Mbps`
}

// 获取流媒体信息
const fetchMediaInfo = async () => {
  loading.value = true
  try {
    // TODO: 调用实际的 API
    // const response = await mediaServerApi.getStreamInfo({
    //   app: props.app,
    //   stream: props.stream,
    //   mediaServerId: props.mediaServerId
    // })
    // mediaInfo.value = response.data

    // 模拟数据（实际使用时删除）
    mediaInfo.value = {
      stream: props.stream,
      app: props.app,
      videoCodec: 'H264',
      videoResolution: '1920x1080',
      videoFps: 25,
      videoBitrate: 4096000,
      audioCodec: 'AAC',
      audioSampleRate: 8000,
      audioChannels: 1,
      audioBitrate: 128000
    }
  } catch (error: any) {
    console.error('Failed to fetch media info:', error)
    ElMessage.error('获取编码信息失败')
  } finally {
    loading.value = false
  }
}

// 启动轮询
const startTask = () => {
  fetchMediaInfo()
  timer = setInterval(() => {
    fetchMediaInfo()
  }, 2000) // 每2秒更新一次
}

// 停止轮询
const stopTask = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

// 监听属性变化
watch(() => [props.app, props.stream, props.mediaServerId], () => {
  stopTask()
  if (props.autoStart) {
    startTask()
  }
}, { immediate: true })

// 组件卸载时停止
import { onBeforeUnmount } from 'vue'
onBeforeUnmount(() => {
  stopTask()
})

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
