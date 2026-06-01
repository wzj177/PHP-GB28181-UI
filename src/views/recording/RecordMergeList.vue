<template>
  <div class="record-merge-page">
    <div class="page-header">
      <h2>录像合并</h2>
      <p class="page-description">将同一通道的多个录像片段合并为一个 MP4 文件</p>
    </div>

    <!-- 筛选区 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" :model="filters" class="filter-form">
        <el-form-item label="设备ID">
          <el-input
            v-model="filters.device_id"
            placeholder="请输入设备国标ID"
            clearable
            style="width: 220px"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="通道ID">
          <el-input
            v-model="filters.channel_id"
            placeholder="请输入通道国标ID"
            clearable
            style="width: 220px"
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="等待处理" value="pending" />
            <el-option label="合并中" value="merging" />
            <el-option label="已完成" value="done" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
      <div style="margin-top: 16px;">
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="openAdd">创建合并</el-button>
        </el-form-item>
      </div>
    </el-card>

    <!-- 列表 -->
    <el-card class="table-card" shadow="never">
      <el-table v-loading="loading" :data="tasks" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="device_id" label="设备ID" min-width="160" show-overflow-tooltip />
        <el-table-column prop="channel_id" label="通道ID" min-width="160" show-overflow-tooltip />
        <el-table-column label="时间范围" min-width="200">
          <template #default="{ row }">
            {{ row.start_time_formatted || '-' }} ~ {{ row.end_time_formatted || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="源文件" width="90" align="center">
          <template #default="{ row }">{{ row.source_file_count }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="文件大小" width="110" align="center">
          <template #default="{ row }">
            {{ row.output_file_size_mb ? `${row.output_file_size_mb} MB` : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="时长" width="110" align="center">
          <template #default="{ row }">{{ row.output_duration_formatted || '-' }}</template>
        </el-table-column>
        <el-table-column label="错误信息" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">{{ row.error_message || '-' }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="175">
          <template #default="{ row }">{{ row.created_at ?? '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'done' && row.output_url"
              type="primary"
              link
              :icon="VideoPlay"
              @click="openPlayback(row)"
            >播放</el-button>
            <el-button
              v-if="row.status === 'done'"
              type="primary"
              link
              :icon="Download"
              @click="downloadTask(row)"
            >下载</el-button>
            <el-button
              v-if="row.status === 'pending'"
              type="warning"
              link
              :icon="Close"
              @click="cancelTask(row)"
            >取消</el-button>
            <el-button
              v-if="row.status === 'done' || row.status === 'failed'"
              type="danger"
              link
              :icon="Delete"
              @click="deleteTask(row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadTasks"
          @current-change="loadTasks"
        />
      </div>
    </el-card>

    <!-- 创建合并任务 -->
    <RecordMergeFormDialog v-model="dialog.visible" @success="onSuccess" />

    <!-- 播放抽屉 -->
    <ElDrawer
      v-model="playbackDrawer.visible"
      :title="playbackDrawer.channelName || '录像回放'"
      direction="rtl"
      size="70%"
    >
      <RecordPlayback
        v-model="playbackDrawer.visible"
        :channel-name="playbackDrawer.channelName"
        :video-url="playbackDrawer.videoUrl"
      />
    </ElDrawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Plus, Delete, Download, Close, VideoPlay } from '@element-plus/icons-vue'
import { recordMergeApi } from '@/api/recordMergeApi'
import type { RecordMergeTask, RecordMergeStatus } from '@/types/recordMerge'
import RecordMergeFormDialog from './RecordMergeFormDialog.vue'
import RecordPlayback from '@/views/video/RecordPlayback.vue'

const loading = ref(false)
const tasks = ref<RecordMergeTask[]>([])
const filters = ref({
  device_id: '',
  channel_id: '',
  status: undefined as RecordMergeStatus | undefined
})
const pagination = ref({ page: 1, limit: 20, total: 0 })
const dialog = ref({ visible: false })
const playbackDrawer = ref({ visible: false, videoUrl: '', channelName: '' })

const openPlayback = (row: RecordMergeTask) => {
  playbackDrawer.value = {
    visible: true,
    videoUrl: row.output_url || '',
    channelName: `${row.device_id} - ${row.channel_id}`
  }
}

let refreshTimer: ReturnType<typeof setInterval> | null = null

const statusTagType = (status: RecordMergeStatus) => {
  const map: Record<RecordMergeStatus, '' | 'warning' | 'success' | 'danger' | 'info'> = {
    pending: 'warning',
    merging: '',
    done: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const statusLabel = (status: RecordMergeStatus) => {
  const map: Record<RecordMergeStatus, string> = {
    pending: '等待处理',
    merging: '合并中',
    done: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

const loadTasks = async () => {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const data = await recordMergeApi.getTaskList({
      device_id: filters.value.device_id || undefined,
      channel_id: filters.value.channel_id || undefined,
      status: filters.value.status,
      start: offset,
      limit: pagination.value.limit
    })
    tasks.value = data.list
    pagination.value.total = data.paginator.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取合并任务失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.page = 1
  loadTasks()
}

const resetFilters = () => {
  filters.value = { device_id: '', channel_id: '', status: undefined }
  search()
}

const openAdd = () => {
  dialog.value = { visible: true }
}

const onSuccess = () => loadTasks()

const cancelTask = async (task: RecordMergeTask) => {
  await ElMessageBox.confirm('确定要取消此合并任务吗？', '取消确认', { type: 'warning' })
  try {
    await recordMergeApi.cancelTask(task.id)
    ElMessage.success('已取消')
    loadTasks()
  } catch (e: any) {
    ElMessage.error(e.message || '取消失败')
  }
}

const deleteTask = async (task: RecordMergeTask) => {
  await ElMessageBox.confirm('确定要删除此合并任务吗？合并后的文件也将被删除。', '删除确认', {
    type: 'warning',
    confirmButtonText: '确定删除',
    confirmButtonClass: 'el-button--danger'
  })
  try {
    await recordMergeApi.deleteTask(task.id)
    ElMessage.success('删除成功')
    loadTasks()
  } catch (e: any) {
    ElMessage.error(e.message || '删除失败')
  }
}

const downloadTask = (task: RecordMergeTask) => {
  if (!task.output_url && !task.output_path) {
    ElMessage.warning('文件路径为空')
    return
  }
  const url = `/api/admin/gb28181/record-merge-tasks/${task.id}/download`
  window.open(url, '_blank')
}

// 自动刷新：每10秒轮询
const startAutoRefresh = () => {
  refreshTimer = setInterval(() => {
    loadTasks()
  }, 10000)
}

onMounted(() => {
  loadTasks()
  startAutoRefresh()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped lang="scss">
.record-merge-page {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;
}

.page-header {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    font-weight: 500;
    color: var(--text-main);
  }

  .page-description {
    margin: 0;
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
    margin: 0;

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
</style>
