<template>
  <div class="record-task-page">
    <!-- 页头 -->
    <div class="page-header">
      <h2>录像任务管理</h2>
      <p class="page-description">查看和管理录像任务状态</p>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" class="filter-form">
        <el-form-item>
          <el-select v-model="filters.task_type" placeholder="任务类型" clearable style="width: 150px">
            <el-option label="计划录像" value="plan" />
            <el-option label="报警录像" value="alarm" />
            <el-option label="回放下载" value="playback_download" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filters.status" placeholder="任务状态" clearable style="width: 140px">
            <el-option v-for="s in TASK_STATUSES" :key="s.value" :label="s.label" :value="s.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filters.device_id"
            placeholder="设备国标 ID"
            style="width: 220px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
          <el-button :icon="Refresh" :loading="loading" circle @click="loadList" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="list" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column label="任务类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="taskTypeTag(row.task_type)" size="small">{{ taskTypeLabel(row.task_type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="设备名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.record_file?.channel_name || row.channel_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="任务状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="175">
          <template #default="{ row }">{{ row.start_time ? formatTs(row.start_time) : '-' }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="175">
          <template #default="{ row }">{{ row.end_time ? formatTs(row.end_time) : '-' }}</template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="175" />
        <el-table-column label="操作" min-width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="deleteTask(row)">
              {{ ['pending','inviting','wait_stream','recording','finalizing'].includes(row.status) ? '取消' : '删除' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
      <ElPagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadList"
        @current-change="loadList"
      />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Refresh } from '@element-plus/icons-vue'
import { recordingApi } from '@/api/recordingApi'
import type { RecordTask, RecordTaskType, RecordTaskStatus } from '@/types/recording'

const TASK_STATUSES: { value: RecordTaskStatus; label: string }[] = [
  { value: 'pending', label: '待执行' },
  { value: 'inviting', label: 'INVITE 中' },
  { value: 'wait_stream', label: '等待流' },
  { value: 'recording', label: '录像中' },
  { value: 'finalizing', label: '完成中' },
  { value: 'done', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'cancelled', label: '已取消' }
]

const loading = ref(false)
const list = ref<RecordTask[]>([])
const filters = ref({
  task_type: undefined as RecordTaskType | undefined,
  status: undefined as RecordTaskStatus | undefined,
  device_id: ''
})
const pagination = ref({ page: 1, limit: 20, total: 0 })

const loadList = async () => {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const data = await recordingApi.getTaskList({
      task_type: filters.value.task_type,
      status: filters.value.status,
      device_id: filters.value.device_id || undefined,
      start: offset,
      limit: pagination.value.limit,
      order_direction: 'DESC'
    })
    list.value = data.list
    pagination.value.total = data.paginator.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取录像任务失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.page = 1
  loadList()
}
const resetFilters = () => {
  filters.value = { task_type: undefined, status: undefined, device_id: '' }
  search()
}

const ACTIVE_STATUSES = ['pending', 'inviting', 'wait_stream', 'recording', 'finalizing']

const deleteTask = async (task: RecordTask) => {
  const isActive = ACTIVE_STATUSES.includes(task.status)
  await ElMessageBox.confirm(
    isActive ? `确定要取消录像任务 #${task.id} 吗？` : `确定要删除录像任务 #${task.id} 吗？`,
    isActive ? '取消任务' : '删除任务',
    { type: 'warning' }
  )
  try {
    await recordingApi.deleteTask(task.id)
    ElMessage.success(isActive ? '任务已取消' : '删除成功')
    loadList()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  }
}

const taskTypeLabel = (type: RecordTaskType) => {
  const map: Record<RecordTaskType, string> = {
    plan: '计划录像', alarm: '报警录像', playback_download: '回放下载'
  }
  return map[type] ?? type
}

const taskTypeTag = (type: RecordTaskType): 'success' | 'danger' | 'primary' | 'info' => {
  const map: Record<RecordTaskType, 'success' | 'danger' | 'primary'> = {
    plan: 'success', alarm: 'danger', playback_download: 'primary'
  }
  return map[type] ?? 'info'
}

const statusLabel = (status: RecordTaskStatus) => {
  return TASK_STATUSES.find(s => s.value === status)?.label ?? status
}

const statusTagType = (status: RecordTaskStatus): 'success' | 'danger' | 'primary' | 'info' | 'warning' => {
  const map: Partial<Record<RecordTaskStatus, 'success' | 'danger' | 'primary' | 'info' | 'warning'>> = {
    pending: 'info', inviting: 'warning', wait_stream: 'warning',
    recording: 'success', finalizing: 'primary',
    failed: 'danger', cancelled: 'info'
  }
  return map[status] ?? 'info'
}

const formatTs = (ts: number) => new Date(ts * 1000).toLocaleString('zh-CN')

onMounted(() => loadList())
</script>

<style scoped lang="scss">
.record-task-page {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .page-header {
    margin-bottom: 16px;

    h2 {
      margin: 0 0 8px;
      font-size: 20px;
      font-weight: 500;
      color: var(--text-main);
    }

    .page-description {
      font-size: 14px;
      color: var(--text-muted);
    }
  }

  .filter-card {
    margin-bottom: 16px;

    .filter-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;

      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }

  .table-card {
    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
}
</style>
