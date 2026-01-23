<!--
  回放控制按钮配置示例
  展示如何在 H265WebPlayer 中使用自定义控制按钮
-->
<template>
  <div class="record-player-controls-example">
    <!-- 方式1: 使用 customControls props 配置对象 -->
    <H265WebPlayer
      :url="playUrl"
      :channel-id="channelId"
      :custom-controls="customControlsConfig"
      @speed-change="handleSpeedChange"
      @seek="handleSeek"
      @download="handleDownload"
    />

    <!-- 方式2: 使用 slot 完全自定义 -->
    <H265WebPlayer :url="playUrl" :channel-id="channelId">
      <template #controls-right>
        <el-dropdown @command="handleSpeedCommand" trigger="click">
          <el-button size="small">
            {{ currentSpeed }}x
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="0.5">0.5x</el-dropdown-item>
              <el-dropdown-item command="1">1x</el-dropdown-item>
              <el-dropdown-item command="2">2x</el-dropdown-item>
              <el-dropdown-item command="4">4x</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-button size="small" @click="handleSeekClick">
          拖动进度
        </el-button>

        <el-button size="small" @click="handleDownloadClick">
          下载录像
        </el-button>
      </template>
    </H265WebPlayer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import H265WebPlayer from '@/components/player/H265WebPlayer.vue'
import { ElMessage } from 'element-plus'
import { gb28181Api } from '@/api/gb28181Api'

const props = defineProps<{
  playUrl: string
  channelId: string | number
  startTime?: string  // ISO format: 2024-01-01T00:00:00
  endTime?: string
}>()

const currentSpeed = ref(1)

// 方式1: 配置对象列表
const customControlsConfig = computed(() => ({
  right: [
    // 倍速控制下拉菜单
    {
      component: 'el-dropdown',
      props: {
        trigger: 'click'
      },
      // 注意: 下拉菜单需要用 slot 实现，这里只是示例
      action: 'speed-1'
    },
    // 下载按钮
    {
      label: '下载',
      icon: 'Download',
      props: {
        size: 'small',
        startTime: props.startTime,
        endTime: props.endTime
      },
      action: 'download'
    }
  ]
}))

// 处理倍速变化
const handleSpeedChange = async (speed: number) => {
  console.log('倍速变化:', speed)
  currentSpeed.value = speed

  if (!props.channelId) return

  try {
    // 调用回放控制 API
    const action = speed === 1 ? 'play' : speed > 1 ? 'fast_forward' : 'slow_forward'
    await gb28181Api.playbackControl(props.channelId, {
      action,
      speed: String(speed)
    })
  } catch (error) {
    console.error('倍速控制失败:', error)
  }
}

// 处理进度拖动
const handleSeek = async (time: string) => {
  console.log('拖动进度:', time)

  if (!props.channelId) return

  try {
    await gb28181Api.playbackControl(props.channelId, {
      action: 'seek',
      seek_time: time
    })
  } catch (error) {
    console.error('拖动进度失败:', error)
  }
}

// 处理下载
const handleDownload = async (params: { start_time: string; end_time: string }) => {
  console.log('下载录像:', params)

  if (!props.channelId) return

  try {
    await gb28181Api.playbackDownload(props.channelId, {
      start_time: params.start_time || props.startTime || '',
      end_time: params.end_time || props.endTime || ''
    })
  } catch (error) {
    console.error('下载录像失败:', error)
  }
}

// Slot 方式的处理函数
const handleSpeedCommand = async (command: string) => {
  const speed = parseFloat(command)
  await handleSpeedChange(speed)
}

const handleSeekClick = () => {
  // 弹出时间选择对话框
  ElMessage.info('请选择要拖动到的时间')
}

const handleDownloadClick = async () => {
  await handleDownload({
    start_time: props.startTime || '',
    end_time: props.endTime || ''
  })
}
</script>

<style scoped lang="scss">
.record-player-controls-example {
  width: 100%;
  height: 100%;
}
</style>
