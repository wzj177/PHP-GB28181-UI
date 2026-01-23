<template>
  <ElDrawer
    v-model="visible"
    :title="`服务器状态 - ${serverName}`"
    direction="rtl"
    size="60%"
    @close="handleClose"
  >
    <div class="stats-drawer-content">
      <!-- Refresh Control -->
      <div class="refresh-header">
        <ElButton :icon="Refresh" @click="refreshStats" :loading="loading">刷新</ElButton>
        <span class="refresh-tip">数据每 5 秒自动刷新</span>
      </div>

      <!-- Server Info Card -->
      <ElCard v-loading="loading" class="stats-card">
        <template #header>
          <div class="card-header">
            <span>服务器信息</span>
            <ElTag :type="getStatusTagType(stats.status)">
              {{ getStatusLabel(stats.status) }}
            </ElTag>
          </div>
        </template>
        <ElDescriptions :column="2" border>
          <ElDescriptionsItem label="版本">{{ stats.version || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="构建时间">{{ formatDate(stats.build_date) }}</ElDescriptionsItem>
          <ElDescriptionsItem label="Git Hash">{{ stats.git_hash || '-' }}</ElDescriptionsItem>
          <ElDescriptionsItem label="运行状态">
            <ElTag :type="stats.running ? 'success' : 'danger'">
              {{ stats.running ? '运行中' : '已停止' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <!-- Resource Usage Cards -->
      <ElCard v-loading="loading" class="stats-card">
        <template #header>
          <span>资源使用</span>
        </template>
        <div class="resource-grid">
          <div class="resource-item">
            <div class="resource-label">CPU使用率：</div>
            <ElProgress :percentage="formatPercentage(stats.snapshot?.cpu_usage)" :color="getProgressColor(formatPercentage(stats.snapshot?.cpu_usage))" />
          </div>
          <div class="resource-item">
            <div class="resource-label">内存使用率</div>
            <ElProgress :percentage="formatPercentage(stats.snapshot?.memory_usage)" :color="getProgressColor(formatPercentage(stats.snapshot?.memory_usage))" />
          </div>
        </div>
      </ElCard>

      <!-- Stream Statistics Card -->
      <ElCard v-loading="loading" class="stats-card">
        <template #header>
          <span>流媒体统计</span>
        </template>
        <div class="stream-stats">
          <div class="stat-item">
            <div class="stat-value">{{ stats.snapshot?.rtp_count ?? stats.snapshot?.stream_count ?? 0 }}</div>
            <div class="stat-label">国标流端口数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.snapshot?.total_connection_count || 0 }}</div>
            <div class="stat-label">连接数量</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ formatBytes(stats.snapshot?.bytes_speed) }}/s</div>
            <div class="stat-label">数据产生速度</div>
          </div>
        </div>
      </ElCard>

      <!-- Thread Statistics Card -->
      <ElCard v-loading="loading" class="stats-card">
        <template #header>
          <span>线程统计</span>
        </template>
        <div class="stream-stats">
          <div class="stat-item">
            <div class="stat-value">{{ stats.snapshot?.network_thread_count || 0 }}</div>
            <div class="stat-label">网络线程数</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.snapshot?.work_thread_count || 0 }}</div>
            <div class="stat-label">工作线程数</div>
          </div>
        </div>
      </ElCard>

      <!-- Network Thread Load Chart -->
      <ElCard v-loading="loading" class="stats-card full-width">
        <template #header>
          <span>网络线程负载</span>
        </template>
        <div v-if="!stats.thread_load?.data?.length" class="chart-empty">
          <ElEmpty description="暂无数据" :image-size="60" />
        </div>
        <div v-else ref="networkThreadChartRef" class="chart-container"></div>
      </ElCard>

      <!-- Work Thread Load Chart -->
      <ElCard v-loading="loading" class="stats-card full-width">
        <template #header>
          <span>工作线程负载</span>
        </template>
        <div v-if="!stats.work_thread_load?.data?.length" class="chart-empty">
          <ElEmpty description="暂无数据" :image-size="60" />
        </div>
        <div v-else ref="workThreadChartRef" class="chart-container"></div>
      </ElCard>

      <!-- Object Statistics Chart -->
      <ElCard v-loading="loading" class="stats-card full-width">
        <template #header>
          <span>对象统计</span>
        </template>
        <div v-if="!Object.keys(stats.statistics || {}).filter(k => stats.statistics[k] > 0).length" class="chart-empty">
          <ElEmpty description="暂无数据" :image-size="60" />
        </div>
        <div v-else ref="objectStatsChartRef" class="chart-container"></div>
      </ElCard>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { mediaServerApi } from '@/api/mediaServerApi'
import type { MediaServer, MediaServerStats } from '@/types/media-server'
import { MediaServerStatus } from '@/types/media-server'
import * as echarts from 'echarts'

interface Props {
  modelValue: boolean
  server: MediaServer | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const serverName = ref('')
const serverId = ref<number>(0)
const loading = ref(false)
const stats = ref<MediaServerStats>({
  running: false,
  status: MediaServerStatus.UNKNOWN,
  version: '',
  build_date: '',
  git_hash: '',
  snapshot: {
    cpu_usage: 0,
    memory_usage: 0,
    stream_count: 0,
    total_connection_count: 0,
    bytes_speed: 0,
    network_thread_count: 0,
    work_thread_count: 0
  },
  thread_load: { data: [], timestamp: 0 },
  work_thread_load: { data: [], timestamp: 0 },
  statistics: {}
})

// Chart refs
const networkThreadChartRef = ref<HTMLElement>()
const workThreadChartRef = ref<HTMLElement>()
const objectStatsChartRef = ref<HTMLElement>()

// Chart instances
let networkThreadChart: echarts.ECharts | null = null
let workThreadChart: echarts.ECharts | null = null
let objectStatsChart: echarts.ECharts | null = null

// Historical data for charts
const networkThreadHistory: Map<number, Array<[number, number]>> = new Map()
const workThreadHistory: Map<number, Array<[number, number]>> = new Map()

let refreshTimer: number | null = null

// Sync v-model
watch(() => props.modelValue, (val) => {
  visible.value = val
  if (val && props.server) {
    serverId.value = props.server.id
    serverName.value = props.server.name
    loadStats()
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
})

// Load server stats
const loadStats = async () => {
  if (!serverId.value) return

  loading.value = true
  try {
    const data = await mediaServerApi.getStats(serverId.value)

    if (data) {
      stats.value = data
      // Update charts when data is loaded
      await nextTick()
      initCharts()
      updateCharts()
    }
  } catch (error: any) {
    console.error('Failed to load server stats:', error)
    ElMessage.error(error.message || '加载服务器状态失败')
  } finally {
    loading.value = false
  }
}

// Refresh stats
const refreshStats = () => {
  loadStats()
}

// Start auto refresh
const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = window.setInterval(() => {
    loadStats()
  }, 5000)
}

// Stop auto refresh
const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// Handle drawer close
const handleClose = () => {
  stopAutoRefresh()
  // Clear chart data
  networkThreadHistory.clear()
  workThreadHistory.clear()
}

// Initialize charts
const initCharts = () => {
  // Initialize network thread chart
  if (networkThreadChartRef.value && !networkThreadChart) {
    networkThreadChart = echarts.init(networkThreadChartRef.value)
  }

  // Initialize work thread chart
  if (workThreadChartRef.value && !workThreadChart) {
    workThreadChart = echarts.init(workThreadChartRef.value)
  }

  // Initialize object stats chart
  if (objectStatsChartRef.value && !objectStatsChart) {
    objectStatsChart = echarts.init(objectStatsChartRef.value)
  }
}

// Update thread load chart
const updateThreadLoadChart = (
  chart: echarts.ECharts | null,
  threadLoadData: any[],
  historyMap: Map<number, Array<[number, number]>>
) => {
  if (!chart) return

  // Skip if no data
  if (!threadLoadData || threadLoadData.length === 0) {
    chart.clear()
    return
  }

  // Update historical data (convert load from decimal to percentage)
  threadLoadData.forEach(item => {
    if (!historyMap.has(item.thread_index)) {
      historyMap.set(item.thread_index, [])
    }
    const data = historyMap.get(item.thread_index)!
    data.push([item.timestamp * 1000, item.load * 100])
    // Keep only last 60 data points (5 minutes with 5s interval)
    if (data.length > 60) {
      data.shift()
    }
  })

  // Build series
  const series = Array.from(historyMap.entries()).map(([threadIndex, data]) => ({
    name: `Thread ${threadIndex}`,
    type: 'line',
    data: data,
    smooth: true,
    symbol: 'none'
  }))

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const time = new Date(params[0].value[0]).toLocaleTimeString('zh-CN')
        const result = `${time}<br/>`
        return result + params.map((p: any) => `${p.marker} ${p.seriesName}: ${p.value[1].toFixed(2)}%`).join('<br/>')
      }
    },
    legend: {
      type: 'scroll',
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: '{HH}:{mm}:{ss}' }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { formatter: '{value}%' }
    },
    series
  }

  chart.setOption(option, true)
}

// Update object statistics chart
const updateObjectStatsChart = () => {
  if (!objectStatsChart) return

  const statistics = stats.value.statistics || {}
  const keys = Object.keys(statistics).filter(k => statistics[k] > 0)

  // Show empty state if no data
  if (keys.length === 0) {
    objectStatsChart.clear()
    return
  }

  const values = keys.map(k => statistics[k])

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const p = params[0]
        return `${p.name}: ${p.value}`
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: keys,
      axisLabel: { rotate: 45, interval: 0 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: (value: number) => {
        if (value >= 10000) return `${value / 10000}w`
        if (value >= 1000) return `${value / 1000}k`
        return value.toString()
      }}
    },
    series: [{
      type: 'bar',
      data: values,
      itemStyle: { color: '#409eff' }
    }]
  }

  objectStatsChart.setOption(option, true)
}

// Update all charts
const updateCharts = () => {
  updateThreadLoadChart(
    networkThreadChart,
    stats.value.thread_load?.data || [],
    networkThreadHistory
  )
  updateThreadLoadChart(
    workThreadChart,
    stats.value.work_thread_load?.data || [],
    workThreadHistory
  )
  updateObjectStatsChart()
}

// Get status label
const getStatusLabel = (status?: MediaServerStatus | string) => {
  switch (status) {
    case MediaServerStatus.RUNNING:
      return '运行中'
    case MediaServerStatus.STOPPED:
      return '未运行'
    case MediaServerStatus.OFFLINE:
      return '离线'
    case MediaServerStatus.UNKNOWN:
      return '关闭'
    default:
      return '未知'
  }
}

// Get status tag type
const getStatusTagType = (status?: MediaServerStatus | string) => {
  switch (status) {
    case MediaServerStatus.RUNNING:
      return 'success'
    case MediaServerStatus.STOPPED:
      return 'warning'
    case MediaServerStatus.OFFLINE:
      return 'danger'
    case MediaServerStatus.UNKNOWN:
      return 'info'
    default:
      return 'info'
  }
}

// Get progress color based on percentage
const getProgressColor = (percentage?: number) => {
  if (!percentage) return '#409eff'
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// Format percentage (API returns decimal like 0.25 for 25%)
const formatPercentage = (value?: number) => {
  if (!value) return 0
  return Math.round(value * 1)
}

// Format bytes
const formatBytes = (bytes?: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

// Format date
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.stats-drawer-content {
  padding: 0 20px 20px 0;

  .refresh-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding: 12px 16px;
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);

    .refresh-tip {
      color: var(--text-secondary);
      font-size: 14px;
    }
  }

  .stats-content {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .stats-card {
    background: var(--bg-panel);
    border: 1px solid var(--border-base);
    border-radius: $radius-panel;
    margin-bottom: 16px;

    &.full-width {
      grid-column: 1 / -1;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .resource-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;

      .resource-item {
        .resource-label {
          margin-bottom: 12px;
          color: var(--text-secondary);
          font-size: 14px;
        }
      }
    }

    .stream-stats {
      display: flex;
      justify-content: space-around;

      .stat-item {
        text-align: center;

        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 14px;
        }
      }
    }

    .chart-container {
      height: 300px;
    }

    .chart-empty {
      height: 300px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
}
</style>
