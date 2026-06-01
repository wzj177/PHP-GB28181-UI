<template>
  <ElDrawer
    :model-value="modelValue"
    title="回放下载任务"
    size="60%"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="handleClose"
  >
    <div class="record-tasks-container">
      <!-- Filters -->
      <div class="filters">
        <ElSelect
          v-model="filters.status"
          placeholder="任务状态"
          clearable
          style="width: 150px; margin-right: 10px;"
          @change="getTasks"
        >
          <ElOption label="等待中" value="pending" />
          <ElOption label="邀请中" value="inviting" />
          <ElOption label="等待流" value="wait_stream" />
          <ElOption label="录制中" value="recording" />
          <ElOption label="完成中" value="finalizing" />
          <ElOption label="已完成" value="done" />
          <ElOption label="失败" value="failed" />
          <ElOption label="已取消" value="cancelled" />
        </ElSelect>

        <ElButton @click="refreshTasks">
          <ElIcon><Refresh /></ElIcon>
          刷新
        </ElButton>
      </div>

      <!-- Tasks table -->
      <div class="table-container">
        <ElTable
          v-loading="loading"
          :data="tasks"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="任务ID" width="80" />
          <ElTableColumn label="设备ID" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.device_id }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="通道ID" width="180" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.channel_id }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="状态" width="100">
            <template #default="{ row }">
              <ElTag :type="getStatusType(row.status)">
                {{ getStatusLabel(row.status) }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="开始时间" width="170">
            <template #default="{ row }">
              {{ row.start_time_formatted || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="结束时间" width="170">
            <template #default="{ row }">
              {{ row.end_time_formatted || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="录像时长" width="100">
            <template #default="{ row }">
              {{ formatDuration(row.record_duration) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="文件信息" width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <div v-if="row.record_file" class="file-info">
                <div>大小: {{ formatFileSize(row.record_file.file_size) }}</div>
              </div>
              <span v-else>-</span>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <ElButton
                v-if="row.record_file?.download_url"
                size="small"
                type="primary"
                @click="downloadFile(row)"
              >
                下载文件
              </ElButton>
              <ElButton
                size="small"
                type="danger"
                @click="handleDelete(row)"
              >
                删除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <ElPagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox, ElDrawer, ElIcon } from 'element-plus'
// @ts-ignore - Icons exist but type definitions are incorrect
import { Refresh } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'

/* ================= 类型定义 ================= */

interface RecordFile {
  id: number
  video_path: string
  file_size: number
  download_url: string
}

interface RecordTask {
  id: number
  task_type: string
  device_id: string
  channel_id: string
  status: string
  start_time: number
  start_time_formatted: string
  end_time: number
  end_time_formatted: string
  record_duration: number
  record_file?: RecordFile
  fail_reason?: string
}

interface Props {
  modelValue: boolean
  deviceId: string
  channelId: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

/* ================= 状态 ================= */

const tasks = ref<RecordTask[]>([])
const loading = ref(false)
const filters = ref({
  status: ''
})
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

/* ================= 工具函数 ================= */

// 获取状态类型
const getStatusType = (status: string) => {
  switch (status) {
    case 'done':
      return 'success'
    case 'pending':
      return 'info'
    case 'inviting':
    case 'wait_stream':
    case 'recording':
    case 'finalizing':
      return 'warning'
    case 'failed':
      return 'danger'
    case 'cancelled':
      return 'info'
    default:
      return 'info'
  }
}

// 获取状态标签
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: '等待中',
    inviting: '邀请中',
    wait_stream: '等待流',
    recording: '录制中',
    finalizing: '完成中',
    done: '已完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return labels[status] || status
}

// 格式化时长
const formatDuration = (seconds: number) => {
  if (!seconds || seconds === 0) return '-'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}小时${minutes}分${secs}秒`
  } else if (minutes > 0) {
    return `${minutes}分${secs}秒`
  } else {
    return `${secs}秒`
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes || bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let size = bytes
  let unitIndex = 0

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/* ================= 数据获取 ================= */

// 获取任务列表
const getTasks = async () => {
  loading.value = true
  try {
    const params = {
      device_id: props.deviceId,
      channel_id: props.channelId,
      task_type: 'playback_download',
      status: filters.value.status || undefined,
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize
    }

    const data = await gb28181Api.getRecordTasks(params)
    tasks.value = data.list || []
    pagination.value.total = data.paginator?.total || 0
  } catch (error: any) {
    console.error('Failed to fetch record tasks:', error)
    ElMessage.error(error.message || '获取任务列表失败')
    tasks.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// 刷新任务列表
const refreshTasks = () => {
  pagination.value.currentPage = 1
  getTasks()
}

/* ================= 操作处理 ================= */

// 下载文件
const downloadFile = (task: RecordTask) => {
  if (task.record_file?.download_url) {
    window.open(task.record_file.download_url, '_blank')
    ElMessage.success('开始下载文件')
  }
}

// 删除任务
const handleDelete = async (task: RecordTask) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除任务 "${task.id}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await gb28181Api.deleteRecordTask(task.id)
    ElMessage.success('删除成功')
    getTasks()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete record task:', error)
      ElMessage.error(error.message || '删除任务失败')
    }
  }
}

/* ================= 分页处理 ================= */

// 处理页大小变化
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  getTasks()
}

// 处理当前页变化
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  getTasks()
}

/* ================= 生命周期 ================= */

// Handle drawer close
const handleClose = () => {
  // 重置状态
  filters.value = {
    status: ''
  }
  pagination.value = {
    currentPage: 1,
    pageSize: 10,
    total: 0
  }
  tasks.value = []

  emit('update:modelValue', false)
}

// Watch for drawer open
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    // 抽屉打开时，获取任务列表
    getTasks()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.record-tasks-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;

  .filters {
    display: flex;
    align-items: center;
    padding: 16px;
    background: var(--bg-panel);
    border-bottom: 1px solid var(--border-base);
    flex-wrap: wrap;
    gap: 10px;
  }

  .table-container {
    flex: 1;
    overflow: auto;
    padding: 16px;
    background: var(--bg-panel);
  }

  .pagination {
    padding: 16px;
    background: var(--bg-panel);
    border-top: 1px solid var(--border-base);
    display: flex;
    justify-content: center;
  }

  .file-info {
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
