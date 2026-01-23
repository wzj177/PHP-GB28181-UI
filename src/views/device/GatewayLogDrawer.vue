<template>
  <ElDrawer
    :model-value="modelValue"
    :title="`网关日志 - ${deviceName}`"
    size="60%"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="gateway-log-container">
      <!-- Date selector and actions -->
      <div class="log-controls">
        <ElDatePicker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          format="YYYY-MM-DD"
          value-format="YYYYMMDD"
          :clearable="false"
          style="width: 200px; margin-right: 10px;"
        />
        <ElButton type="primary" :loading="loading" :disabled="!selectedDate" @click="startStream">
          查询日志
        </ElButton>
        <ElButton @click="clearLogs">清空日志</ElButton>
        <ElCheckbox v-model="autoScroll" style="margin-left: 20px;">自动滚动</ElCheckbox>

        <!-- Progress indicator -->
        <div v-if="progress.total > 0" class="progress-info">
          <ElProgress
            :percentage="progressPercentage"
            :format="() => `${progress.index} / ${progress.total}`"
          />
        </div>
      </div>

      <!-- Status indicator -->
      <div class="status-bar">
        <ElTag :type="statusType" size="small">
          {{ statusText }}
        </ElTag>
        <span v-if="eventSource" class="connection-status">
          已连接
        </span>
      </div>

      <!-- Log content -->
      <div ref="logContainer" class="log-content">
        <div v-if="logs.length === 0 && !loading && !error" class="empty-state">
          <ElEmpty description="请选择日期并点击查询按钮获取日志" />
        </div>
        <div v-if="error" class="error-state">
          <ElAlert :title="error" type="error" :closable="false" />
        </div>
        <div v-if="logs.length > 0" class="log-entries">
          <div
            v-for="(log, index) in logs"
            :key="index"
            class="log-entry"
          >
            <div class="log-entry-content">{{ log.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { authUtils } from '@/utils/authUtils'

interface Props {
  modelValue: boolean
  deviceId: string
  deviceName: string
}

interface LogEntry {
  device_id: string
  date: string
  index: number
  total: number
  content: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

// State
const selectedDate = ref<string>(formatDate(new Date()))
const logs = ref<LogEntry[]>([])
const loading = ref(false)
const error = ref<string>('')
const eventSource = ref<EventSource | null>(null)
const autoScroll = ref(true)
const logContainer = ref<HTMLElement | null>(null)
const xmlBuffer = ref<string>('') // XML 缓冲区

// Progress
const progress = ref({
  index: 0,
  total: 0
})

const statusType = computed(() => {
  if (error.value) return 'danger'
  if (loading.value) return 'warning'
  if (progress.value.total > 0 && progress.value.index >= progress.value.total) return 'success'
  if (eventSource.value) return 'primary'
  return 'info'
})

const statusText = computed(() => {
  if (error.value) return '错误'
  if (loading.value) return '加载中...'
  if (progress.value.total > 0 && progress.value.index >= progress.value.total) return '已完成'
  if (eventSource.value) return '接收中...'
  return '等待查询'
})

const progressPercentage = computed(() => {
  if (progress.value.total === 0) return 0
  return Math.round((progress.value.index / progress.value.total) * 100)
})

// Format date to YYYYMMDD
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// 处理 XML 数据片段，拼接完整的 XML
function processXMLChunk(chunk: string): string[] {
  const completeXMLs: string[] = []

  // 将新片段添加到缓冲区
  xmlBuffer.value += chunk

  // 如果缓冲区为空，直接返回
  if (!xmlBuffer.value.trim()) {
    return completeXMLs
  }

  // 尝试提取完整的 XML
  // GB28181 的 XML 通常以 <?xml 或 <Notify> 等开始
  // 以 </Notify> 或 </Response> 等结束
  const patterns = [
    // 完整的 XML 声明格式
    /<\?xml[^>]*>[\s\S]*?<\/Notify>/g,
    /<\?xml[^>]*>[\s\S]*?<\/Response>/g,
    /<\?xml[^>]*>[\s\S]*?<\/Query>/g,
    /<\?xml[^>]*>[\s\S]*?<\/DeviceInfo>/g,
    /<\?xml[^>]*>[\s\S]*?<\/Catalog>/g,
    // 无 XML 声明的格式
    /<Notify>[\s\S]*?<\/Notify>/g,
    /<Response>[\s\S]*?<\/Response>/g,
    /<Query>[\s\S]*?<\/Query>/g,
    /<DeviceInfo>[\s\S]*?<\/DeviceInfo>/g,
    /<Catalog>[\s\S]*?<\/Catalog>/g,
  ]

  let found = false
  for (const pattern of patterns) {
    const matches = xmlBuffer.value.match(pattern)
    if (matches && matches.length > 0) {
      matches.forEach(xml => {
        completeXMLs.push(xml)
        // 从缓冲区移除已提取的完整 XML
        xmlBuffer.value = xmlBuffer.value.replace(xml, '')
        found = true
      })
      // 找到匹配后跳出循环
      break
    }
  }

  // 如果没有匹配到完整 XML，且缓冲区太大，清空防止内存泄漏
  if (!found && xmlBuffer.value.length > 100000) {
    console.warn('XML buffer too large (' + xmlBuffer.value.length + ' bytes), clearing')
    xmlBuffer.value = ''
  }

  return completeXMLs
}

// Build SSE URL
function buildSSEUrl(): string {
  // SSE 需要绕过 Vite 代理，使用完整的后端地址
  const baseURL = import.meta.env.VITE_API_BASE_URL_FULL || import.meta.env.VITE_API_BASE_URL || '/api'
  const token = authUtils.getToken()
  if (!token) {
    throw new Error('未登录或 token 已过期')
  }
  return `${baseURL}/admin/gb28181/devices/${props.deviceId}/event-stream?date=${selectedDate.value}&token=${encodeURIComponent(token)}`
}

// Start SSE stream
const startStream = () => {
  if (!props.deviceId || !selectedDate.value) {
    ElMessage.warning('请先选择日期')
    return
  }

  // Close existing connection
  stopStream()

  // Reset state
  logs.value = []
  error.value = ''
  progress.value = { index: 0, total: 0 }
  xmlBuffer.value = '' // 清空 XML 缓冲区
  loading.value = true

  try {
    const url = buildSSEUrl()
    console.log('Connecting to SSE:', url)

    eventSource.value = new EventSource(url)

    // Handle connection open
    eventSource.value.onopen = () => {
      console.log('SSE connection opened')
    }

    // Handle incoming messages
    eventSource.value.onmessage = (event) => {
      console.log('SSE message received, length:', event.data.length)

      // 使用缓冲区拼接完整的 XML
      const completeXMLs = processXMLChunk(event.data)

      if (completeXMLs.length > 0) {
        console.log(` 提取到 ${completeXMLs.length} 个完整 XML`)
        // 将完整的 XML 添加到日志
        completeXMLs.forEach((xml) => {
          logs.value.push({
            device_id: props.deviceId,
            date: selectedDate.value,
            index: logs.value.length + 1,
            total: 0,
            content: xml
          })
        })

        // 更新进度计数
        progress.value.index = logs.value.length

        // Auto scroll to bottom
        if (autoScroll.value) {
          nextTick(() => {
            scrollToBottom()
          })
        }
      } else {
        // 数据片段已添加到缓冲区，等待更多数据
        console.log(' 数据已添加到缓冲区，当前缓冲区大小:', xmlBuffer.value.length)
      }
    }

    // Handle end event
    eventSource.value.addEventListener('end', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        progress.value.total = data.total
        progress.value.index = data.total
        console.log(' SSE stream ended:', data)
      } catch (err) {
        console.error('Failed to parse end event:', err)
      }
      loading.value = false
      stopStream()
    })

    // Handle error event (custom error from server)
    eventSource.value.addEventListener('error', (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data)
        error.value = data.error || '发生错误'
        console.error(' SSE error event:', data)
      } catch (err) {
        error.value = '连接错误'
      }
      loading.value = false
      stopStream()
    })

    // Handle connection errors (browser-level error)
    eventSource.value.onerror = (err) => {
      console.error(' SSE connection error:', err)
      console.error('EventSource state:', eventSource.value?.readyState)
      console.error('EventSource URL:', eventSource.value?.url)

      // Check readyState
      if (eventSource.value?.readyState === EventSource.CLOSED) {
        error.value = '连接已关闭，可能是接口不存在或认证失败'
      } else if (eventSource.value?.readyState === EventSource.CONNECTING) {
        error.value = '连接中...'
      } else {
        error.value = '连接中断或超时'
      }

      loading.value = false
      stopStream()
    }
  } catch (err: any) {
    console.error('Failed to create EventSource:', err)
    error.value = err.message || '无法创建连接'
    loading.value = false
    ElMessage.error(error.value)
  }
}

// Stop SSE stream
const stopStream = () => {
  if (eventSource.value) {
    eventSource.value.close()
    eventSource.value = null
  }
}

// Clear logs
const clearLogs = () => {
  logs.value = []
  error.value = ''
  progress.value = { index: 0, total: 0 }
  xmlBuffer.value = '' // 清空 XML 缓冲区
}

// Scroll to bottom
const scrollToBottom = () => {
  if (logContainer.value) {
    logContainer.value.scrollTop = logContainer.value.scrollHeight
  }
}

// Handle drawer close
const handleClose = () => {
  stopStream()
  // 重置所有状态
  logs.value = []
  error.value = ''
  progress.value = { index: 0, total: 0 }
  xmlBuffer.value = ''
  loading.value = false
  // 重置日期为今天
  selectedDate.value = formatDate(new Date())
  emit('update:modelValue', false)
}

// Watch for drawer open/close
watch(() => props.modelValue, (newVal) => {
  if (!newVal) {
    // 关闭时清理所有状态
    stopStream()
    logs.value = []
    error.value = ''
    progress.value = { index: 0, total: 0 }
    xmlBuffer.value = ''
    loading.value = false
    selectedDate.value = formatDate(new Date())
  }
})

// Cleanup on unmount
onUnmounted(() => {
  stopStream()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.gateway-log-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;

  .log-controls {
    display: flex;
    align-items: center;
    padding: 16px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-base);
    flex-wrap: wrap;
    gap: 10px;

    .progress-info {
      flex: 1;
      margin-left: 20px;
      min-width: 200px;
    }
  }

  .status-bar {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    background: var(--bg-hover);
    border-bottom: 1px solid var(--border-base);
    gap: 12px;

    .connection-status {
      font-size: 12px;
      color: $success;

      &::before {
        content: '●';
        margin-right: 4px;
        animation: pulse 1.5s infinite;
      }
    }
  }

  .log-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 13px;
    line-height: 1.6;

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 300px;
    }

    .error-state {
      margin-bottom: 16px;
    }

    .log-entries {
      .log-entry {
        margin-bottom: 8px;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        border-left: 3px solid rgba($primary, 0.6);

        &:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .log-entry-content {
          white-space: pre-wrap;
          word-break: break-all;
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}
</style>
