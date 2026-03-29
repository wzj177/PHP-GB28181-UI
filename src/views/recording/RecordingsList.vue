<template>
  <div class="recordings-page">
    <!-- 页头 -->
    <div class="page-header">
      <h2>录像文件管理</h2>
      <p class="page-description">查看和下载云端录像文件</p>
    </div>

    <!-- 筛选 -->
    <el-card class="filter-card" shadow="never">
      <el-form :inline="true" class="filter-form">
        <el-form-item label="设备ID">
          <el-input
            v-model="filters.device_id"
            placeholder="设备国标 ID"
            style="width: 200px"
            clearable
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item label="通道ID">
          <el-input
            v-model="filters.channel_id"
            placeholder="通道国标 ID"
            style="width: 200px"
            clearable
            @keyup.enter="search"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="filters.channel_name"
            placeholder="通道名称"
            style="width: 180px"
            clearable
            @keyup.enter="search"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-select v-model="filters.source_type" placeholder="来源类型" clearable style="width: 150px">
            <el-option label="计划录像" value="cloud_plan" />
            <el-option label="报警录像" value="alarm" />
            <el-option label="回放下载" value="playback_download" />
          </el-select>
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
        <el-table-column label="设备名称" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.device_name || row.device_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="通道名称" min-width="130" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.channel_name_display || row.channel_name || row.channel_id || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="来源" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="sourceTagType(row.source_type)" size="small">
              {{ sourceLabel(row.source_type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="开始时间" width="175">
          <template #default="{ row }">{{ row.start_time_formatted ?? formatTs(row.start_time) }}</template>
        </el-table-column>
        <el-table-column label="结束时间" width="175">
          <template #default="{ row }">{{ row.end_time_formatted ?? formatTs(row.end_time) }}</template>
        </el-table-column>
        <el-table-column label="时长" width="100" align="center">
          <template #default="{ row }">{{ row.duration_formatted ?? formatDuration(row.duration) }}</template>
        </el-table-column>
        <el-table-column label="文件大小" width="110" align="center">
          <template #default="{ row }">
            {{ row.file_size_mb ? `${row.file_size_mb.toFixed(1)} MB` : formatBytes(row.file_size) }}
          </template>
        </el-table-column>
        <el-table-column prop="record_date" label="录像日期" width="110" align="center" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.download_url"
              type="primary"
              link
              :icon="Download"
              @click="download(row)"
            >
              下载
            </el-button>
            <el-tag v-else type="info" size="small">暂无链接</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
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
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { recordingApi } from '@/api/recordingApi'
import type { RecordingFile, RecordingSourceType } from '@/types/recording'

const route = useRoute()

const loading = ref(false)
const list = ref<RecordingFile[]>([])
const filters = ref({
  channel_name: '',
  device_id: '',
  channel_id: '',
  source_type: undefined as RecordingSourceType | undefined
})
const pagination = ref({ page: 1, limit: 20, total: 0 })

const loadList = async () => {
  loading.value = true
  try {
    const offset = (pagination.value.page - 1) * pagination.value.limit
    const data = await recordingApi.getRecordingList({
      device_id: filters.value.device_id || undefined,
      channel_id: filters.value.channel_id || undefined,
      source_type: filters.value.source_type,
      start: offset,
      page_size: pagination.value.limit
    })
    list.value = data.list
    pagination.value.total = data.paginator.total
  } catch (e: any) {
    ElMessage.error(e.message || '获取录像文件失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.page = 1
  loadList()
}

const resetFilters = () => {
  filters.value = { channel_name: '', device_id: '', channel_id: '', source_type: undefined }
  search()
}

const sourceLabel = (type: RecordingSourceType) => {
  const map: Record<RecordingSourceType, string> = {
    cloud_plan: '计划录像',
    alarm: '报警录像',
    playback_download: '回放下载'
  }
  return map[type] ?? type
}

const sourceTagType = (type: RecordingSourceType): 'success' | 'danger' | 'primary' | 'info' | 'warning' => {
  const map: Record<RecordingSourceType, 'success' | 'danger' | 'primary'> = {
    cloud_plan: 'success',
    alarm: 'danger',
    playback_download: 'primary'
  }
  return map[type] ?? 'info'
}

const formatTs = (ts?: number) => {
  if (!ts) return '-'
  return new Date(ts * 1000).toLocaleString('zh-CN')
}

const formatDuration = (sec?: number) => {
  if (!sec) return '-'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

const formatBytes = (bytes?: number) => {
  if (!bytes) return '-'
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`
  return `${bytes} B`
}

const download = (row: RecordingFile) => {
  if (!row.download_url) return
  const a = document.createElement('a')
  a.href = row.download_url
  a.download = `recording_${row.id}.mp4`
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

onMounted(() => {
  // 从路由 query 中读取设备 ID 和通道 ID（从录像回放页跳转过来时携带）
  if (route.query.device_id) filters.value.device_id = route.query.device_id as string
  if (route.query.channel_id) filters.value.channel_id = route.query.channel_id as string
  loadList()
})
</script>

<style scoped lang="scss">
.recordings-page {
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
