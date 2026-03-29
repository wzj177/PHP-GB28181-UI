<template>
  <div class="stream-proxy-log-container">
    <!-- 搜索过滤 -->
    <div class="search-filters">
      <ElSelect v-model="filters.level" placeholder="日志级别" clearable style="width: 120px; margin-right: 10px;">
        <ElOption label="INFO" value="info" />
        <ElOption label="WARN" value="warn" />
        <ElOption label="ERROR" value="error" />
      </ElSelect>
      <ElSelect v-model="filters.event" placeholder="事件类型" clearable style="width: 160px; margin-right: 10px;">
        <ElOption label="started" value="started" />
        <ElOption label="stopped" value="stopped" />
        <ElOption label="restarted" value="restarted" />
        <ElOption label="online" value="online" />
        <ElOption label="offline" value="offline" />
        <ElOption label="error" value="error" />
        <ElOption label="reconnect" value="reconnect" />
        <ElOption label="created" value="created" />
        <ElOption label="deleted" value="deleted" />
        <ElOption label="updated" value="updated" />
      </ElSelect>
      <ElSelect v-model="filters.proxy_id" placeholder="选择代理" clearable style="width: 200px; margin-right: 10px;" filterable>
        <ElOption
          v-for="item in proxyOptions"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </ElSelect>
      <ElDatePicker
        v-model="filters.dateRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始时间"
        end-placeholder="结束时间"
        style="width: 360px; margin-right: 10px;"
        value-format="YYYY-MM-DD HH:mm:ss"
      />
      <ElInput
        v-model="filters.keyword"
        placeholder="搜索关键词"
        style="width: 180px; margin-right: 10px;"
        clearable
        @keyup.enter="search"
      />
      <ElButton type="primary" @click="search">搜索</ElButton>
      <ElButton @click="resetFilters">重置</ElButton>
      <ElButton @click="fetchList">刷新</ElButton>
      <div class="auto-refresh-toggle">
        <span class="refresh-label">自动刷新：</span>
        <ElSwitch v-model="autoRefresh" active-text="开" inactive-text="关" @change="toggleAutoRefresh" />
      </div>
      <ElButton type="danger" style="margin-left: auto;" @click="openCleanupDialog">清理旧日志</ElButton>
    </div>

    <!-- 表格 -->
    <div class="table-container">
      <ElTable v-loading="loading" :data="list" style="width: 100%">
        <ElTableColumn prop="id" label="ID" width="80" />
        <ElTableColumn label="代理名称" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ row.proxy_name || row.proxy_id || '-' }}</template>
        </ElTableColumn>
        <ElTableColumn label="级别" width="90">
          <template #default="{ row }">
            <ElTag :type="getLevelType(row.level)" size="small">{{ row.level?.toUpperCase() }}</ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="事件类型" width="120">
          <template #default="{ row }">
            <ElTag v-if="row.event" type="info" size="small">{{ row.event }}</ElTag>
            <span v-else class="text-muted">-</span>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="message" label="消息" min-width="260" show-overflow-tooltip />
        <ElTableColumn prop="created_at" label="时间" width="175" />
      </ElTable>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 清理对话框 -->
    <ElDialog v-model="cleanupDialog.visible" title="清理旧日志" width="400px">
      <div class="cleanup-content">
        <p>清理多少天前的日志？</p>
        <ElInputNumber
          v-model="cleanupDialog.days"
          :min="1"
          :max="365"
          style="width: 120px;"
        />
        <span style="margin-left: 8px;">天前的日志</span>
      </div>
      <template #footer>
        <ElButton @click="cleanupDialog.visible = false">取消</ElButton>
        <ElButton type="danger" :loading="cleanupDialog.loading" @click="handleCleanup">确认清理</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { streamProxyApi } from '@/api/streamProxyApi'

interface LogItem {
  id: number
  proxy_id: number
  proxy_name?: string
  level: 'info' | 'warn' | 'error'
  event?: string
  message: string
  created_at: string
}

const list = ref<LogItem[]>([])
const loading = ref(false)
const proxyOptions = ref<Array<{ id: number; name: string }>>([])
const pagination = ref({ currentPage: 1, pageSize: 20, total: 0 })
const filters = ref({
  level: '',
  event: '',
  proxy_id: '' as number | string,
  keyword: '',
  dateRange: [] as string[]
})

// 自动刷新
const autoRefresh = ref(true)
const REFRESH_INTERVAL = 30000
let refreshTimer: ReturnType<typeof setInterval> | null = null

const startAutoRefresh = () => {
  if (refreshTimer) return
  refreshTimer = setInterval(() => {
    if (autoRefresh.value) fetchList()
  }, REFRESH_INTERVAL)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const toggleAutoRefresh = (val: boolean) => {
  val ? startAutoRefresh() : stopAutoRefresh()
}

// 清理对话框
const cleanupDialog = ref({ visible: false, days: 30, loading: false })

const openCleanupDialog = () => {
  cleanupDialog.value = { visible: true, days: 30, loading: false }
}

const handleCleanup = async () => {
  try {
    await ElMessageBox.confirm(
      `确定清理 ${cleanupDialog.value.days} 天前的日志？此操作不可恢复。`,
      '警告',
      { type: 'warning' }
    )
    cleanupDialog.value.loading = true
    await streamProxyApi.cleanupLogs({ days: cleanupDialog.value.days })
    ElMessage.success('清理成功')
    cleanupDialog.value.visible = false
    fetchList()
  } catch {
    // cancel
  } finally {
    cleanupDialog.value.loading = false
  }
}

const getLevelType = (level: string) => {
  const map: Record<string, string> = { info: 'success', warn: 'warning', error: 'danger' }
  return map[level] || 'info'
}

const fetchProxyOptions = async () => {
  try {
    const data: any = await streamProxyApi.getList({ limit: 200 })
    proxyOptions.value = (data?.list || []).map((item: any) => ({ id: item.id, name: item.name }))
  } catch {
    // ignore
  }
}

const fetchList = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = {
      level: filters.value.level || undefined,
      event: filters.value.event || undefined,
      proxy_id: filters.value.proxy_id || undefined,
      keyword: filters.value.keyword || undefined,
      start: (pagination.value.currentPage - 1) * pagination.value.pageSize,
      limit: pagination.value.pageSize
    }
    if (filters.value.dateRange?.length === 2) {
      params.start_time = filters.value.dateRange[0]
      params.end_time = filters.value.dateRange[1]
    }
    const data: any = await streamProxyApi.getLogs(params)
    list.value = data?.list || []
    pagination.value.total = data?.paginator?.total || 0
  } catch (error: any) {
    ElMessage.error(error.message || '获取日志失败')
  } finally {
    loading.value = false
  }
}

const search = () => {
  pagination.value.currentPage = 1
  fetchList()
}

const resetFilters = () => {
  filters.value = { level: '', event: '', proxy_id: '', keyword: '', dateRange: [] }
  pagination.value.currentPage = 1
  fetchList()
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  fetchList()
}

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  fetchList()
}

onMounted(() => {
  fetchProxyOptions()
  fetchList()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.stream-proxy-log-container {
  padding: 16px;
}

.search-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 0;
  margin-bottom: 16px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.auto-refresh-toggle {
  display: flex;
  align-items: center;
  margin-left: 10px;

  .refresh-label {
    font-size: 13px;
    color: #606266;
    margin-right: 6px;
  }
}

.table-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

.cleanup-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
}

.text-muted {
  color: #c0c4cc;
}
</style>
