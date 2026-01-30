<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElCard, ElTable, ElTableColumn, ElTag, ElMessage, ElSelect, ElOption, ElInput, ElDatePicker, ElButton } from 'element-plus'
import { Refresh, Download } from '@element-plus/icons-vue'
import { systemApi } from '@/api/systemApi'

interface LogEntry {
  id: string
  userId?: number
  module: string
  action: string
  message: string
  data?: string
  ip: string
  createdTime: number | string  // Unix timestamp (number) or ISO string (string)
  level: string
  level_text: string
  ipArea: string
  username?: string
}

const loading = ref(false)
const logs = ref<LogEntry[]>([])
const total = ref(0)

// Filters
const filters = ref({
  level: '',
  module: '',
  keyword: '',
  startDate: null as Date | null,
  endDate: null as Date | null,
  page: 1,
  limit: 50
})

const levelOptions = [
  { label: '全部', value: '' },
  { label: '调试', value: 'DEBUG' },
  { label: '信息', value: 'INFO' },
  { label: '警告', value: 'WARN' },
  { label: '错误', value: 'ERROR' },
  { label: '致命', value: 'FATAL' }
]

const moduleOptions = [
  { label: '全部', value: '' },
  { label: '系统', value: 'system' },
  { label: '认证', value: 'auth' },
  { label: '设备', value: 'device' },
  { label: '流媒体', value: 'media' },
  { label: '录像', value: 'record' },
  { label: 'API', value: 'api' },
  { label: '国标', value: 'gb28181' },
  { label: '订阅', value: 'subscribe' },
  { label: '其他', value: 'other' }
]

// Get log level tag type
const getLevelTagType = (level: string) => {
  const map: Record<string, any> = {
    'DEBUG': 'info',
    'INFO': 'primary',
    'WARN': 'warning',
    'ERROR': 'danger',
    'FATAL': 'danger'
  }
  return map[level] || 'info'
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

// Format timestamp (Unix timestamp in seconds or ISO string)
const formatTimestamp = (timestamp: number | string) => {
  let date: Date

  if (typeof timestamp === 'string') {
    // ISO string format: "2026-01-26T17:54:20+08:00"
    date = new Date(timestamp)
  } else {
    // Unix timestamp in seconds
    date = new Date(timestamp * 1000)
  }

  // Format: YYYY-MM-DD HH:mm:ss
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Load logs
const loadLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: filters.value.page,
      limit: filters.value.limit
    }

    if (filters.value.level) params.level = filters.value.level
    if (filters.value.module) params.module = filters.value.module
    if (filters.value.keyword) params.keyword = filters.value.keyword
    if (filters.value.startDate) params.start_time = filters.value.startDate.toISOString()
    if (filters.value.endDate) params.end_time = filters.value.endDate.toISOString()

    const data = await systemApi.getLogs(params)

    logs.value = data.list || []
    total.value = data.paginator?.total || 0
  } catch (error: any) {
    console.error('Failed to load logs:', error)
    ElMessage.error(error.message || '加载日志失败')
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

// Search logs
const searchLogs = () => {
  filters.value.page = 1
  loadLogs()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    level: '',
    module: '',
    keyword: '',
    startDate: null,
    endDate: null,
    page: 1,
    limit: 50
  }
  loadLogs()
}

// Export logs
const exportLogs = async () => {
  try {
    const params: any = {
      page: filters.value.page,
      limit: filters.value.limit
    }

    if (filters.value.level) params.level = filters.value.level
    if (filters.value.module) params.module = filters.value.module
    if (filters.value.keyword) params.keyword = filters.value.keyword
    if (filters.value.startDate) params.start_time = filters.value.startDate.toISOString()
    if (filters.value.endDate) params.end_time = filters.value.endDate.toISOString()

    const blob = await systemApi.exportLogs(params)

    // Create download link
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `logs_${new Date().toISOString()}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    ElMessage.success('导出成功')
  } catch (error: any) {
    console.error('Failed to export logs:', error)
    ElMessage.error(error.message || '导出失败')
  }
}

// Pagination
const handlePageChange = (page: number) => {
  filters.value.page = page
  loadLogs()
}

const handleSizeChange = (size: number) => {
  filters.value.limit = size
  filters.value.page = 1
  loadLogs()
}

// Auto refresh
let refreshTimer: number | null = null

onMounted(() => {
  loadLogs()
  // Auto refresh every 30 seconds
  refreshTimer = window.setInterval(() => {
    loadLogs()
  }, 30000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<template>
  <div class="system-logs-container">
    <div class="page-header">
      <h2>系统日志</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="loadLogs">刷新</el-button>
        <el-button :icon="Download" @click="exportLogs">导出</el-button>
      </div>
    </div>

    <div class="stats-content">
      <ElCard class="stats-card full-width">
        <!-- Filters -->
        <div class="filter-bar">
          <el-select v-model="filters.level" placeholder="日志级别" style="width: 120px">
            <el-option v-for="opt in levelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-select v-model="filters.module" placeholder="模块" style="width: 120px">
            <el-option v-for="opt in moduleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>

          <el-input v-model="filters.keyword" placeholder="搜索关键词" style="width: 200px" clearable />

          <el-date-picker
            v-model="filters.startDate"
            type="datetime"
            placeholder="开始时间"
            style="width: 180px"
          />

          <el-date-picker
            v-model="filters.endDate"
            type="datetime"
            placeholder="结束时间"
            style="width: 180px"
          />

          <el-button type="primary" @click="searchLogs">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </div>

        <!-- Table -->
        <ElTable
          v-loading="loading"
          :data="logs"
          style="width: 100%"
          stripe
        >
          <ElTableColumn prop="level_text" label="级别" width="100">
            <template #default="{ row }">
              <ElTag :type="getLevelTagType(row.level)" size="small">{{ row.level_text || row.level }}</ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="module_text" label="模块" width="120" />

          <ElTableColumn prop="action_text" label="操作" width="150" show-overflow-tooltip />

          <ElTableColumn prop="message" label="消息" min-width="200" show-overflow-tooltip />

          <ElTableColumn prop="data" label="数据" width="120" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.data || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="username" label="用户" width="100">
            <template #default="{ row }">
              {{ row.username || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="ip" label="IP地址" width="130" />

          <ElTableColumn prop="ipArea" label="IP地区" width="150" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.ipArea || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="createdTime" label="时间" width="170">
            <template #default="{ row }">
              {{ formatTimestamp(row.createdTime) }}
            </template>
          </ElTableColumn>
        </ElTable>

        <!-- Pagination -->
        <div class="pagination">
          <el-pagination
            :current-page="filters.page"
            :page-size="filters.limit"
            :page-sizes="[20, 50, 100, 200]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
          />
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.system-logs-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding: $spacing-md;
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);

    h2 {
      margin: 0;
      color: var(--text-main);
      font-size: 18px;
      font-weight: 600;
    }
  }

  .stats-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 16px;

    .stats-card {
      background: var(--bg-panel);
      border: 1px solid var(--border-base);
      border-radius: $radius-panel;

      &.full-width {
        grid-column: 1 / -1;
      }

      :deep(.el-card__header) {
        background: var(--bg-hover);
        border-bottom: 1px solid var(--border-base);
        padding: 12px 16px;
      }

      :deep(.el-card__body) {
        padding: 16px;
      }
    }
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 16px;
  }
}
</style>
