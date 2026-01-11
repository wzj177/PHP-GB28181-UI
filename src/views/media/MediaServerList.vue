<template>
  <div class="media-server-list-container">
    <!-- Search and filters -->
    <div class="search-filters">
      <div class="filters">
        <ElSelect
          v-model="filters.type"
          placeholder="流媒体类型"
          clearable
          style="width: 150px; margin-right: 10px;"
        >
          <ElOption label="ZLM" value="zlm" />
          <ElOption label="SRS" value="srs" />
          <ElOption label="其他" value="other" />
        </ElSelect>

        <ElSelect
          v-model="filters.status"
          placeholder="运行状态"
          clearable
          style="width: 150px; margin-right: 10px;"
        >
          <ElOption label="运行中" value="running" />
          <ElOption label="未运行" value="stopped" />
          <ElOption label="离线" value="offline" />
          <ElOption label="关闭" value="unknown" />
        </ElSelect>

        <ElInput
          v-model="filters.keywords"
          placeholder="请输入名称或IP"
          style="width: 200px; margin-right: 10px;"
          @keyup.enter="searchServers"
        />

        <ElButton type="primary" @click="searchServers">搜索</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
        <ElButton type="primary" @click="openAddDialog">添加服务器</ElButton>
      </div>
    </div>

    <!-- Servers table -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="servers"
        style="width: 100%"
      >
        <ElTableColumn prop="name" label="名称" width="180" />
        <ElTableColumn label="类型" width="100">
          <template #default="{ row }">
            <ElTag :type="getTypeTagType(row.type)">
              {{ getTypeLabel(row.type) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="host" label="IP地址" width="150" />
        <ElTableColumn prop="port" label="端口" width="80" />
        <ElTableColumn label="收流IP" width="150">
          <template #default="{ row }">
            {{ row.stream_ip || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="网络环境" width="100">
          <template #default="{ row }">
            <ElTag :type="row.network_env === 'public' ? 'warning' : 'success'" size="small">
              {{ row.network_env === 'public' ? '公网' : '内网' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="server_id" label="网关编号" width="200" show-overflow-tooltip />
        <ElTableColumn prop="access_domain" label="访问域名" width="200" show-overflow-tooltip />
        <ElTableColumn label="运行状态" width="100">
          <template #default="{ row }">
            <ElTag :type="getStatusTagType(row.status)">
              {{ getStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="180" />
        <ElTableColumn label="操作" width="320" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton v-if="row.type === 'zlm'" size="small" type="info" @click="openStatsDrawer(row)">状态查询</ElButton>
            <ElButton v-if="row.type === 'zlm'" size="small" type="success" @click="openConfig(row)">网关配置</ElButton>
            <ElButton size="small" type="danger" @click="deleteServer(row)">删除</ElButton>
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

    <!-- Add/Edit dialog -->
    <MediaServerFormDialog
      v-model="formDialog.visible"
      :server="formDialog.server"
      @success="onFormSuccess"
    />

    <!-- Stats drawer -->
    <MediaServerStats
      v-model="statsDrawer.visible"
      :server="statsDrawer.server"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { mediaServerApi } from '@/api/mediaServerApi'
import type { MediaServer } from '@/types/media-server'
import MediaServerFormDialog from './MediaServerFormDialog.vue'
import MediaServerStats from './MediaServerStats.vue'

const router = useRouter()

// State
const servers = ref<MediaServer[]>([])
const loading = ref(false)
const filters = ref({
  type: '',
  status: '',
  keywords: ''
})
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// Form dialog
const formDialog = ref({
  visible: false,
  server: null as MediaServer | null
})

// Stats drawer
const statsDrawer = ref({
  visible: false,
  server: null as MediaServer | null
})

// Get server list
const getServerList = async () => {
  loading.value = true
  try {
    const params = {
      type: filters.value.type || undefined,
      status: filters.value.status || undefined,
      keywords: filters.value.keywords || undefined,
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize
    }

    const data = await mediaServerApi.getList(params)
    servers.value = data.list || []
    pagination.value.total = data.paginator?.total || 0
  } catch (error: any) {
    console.error('Failed to fetch media server list:', error)
    ElMessage.error(error.message || '获取流媒体服务器列表失败')
    servers.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// Search servers
const searchServers = () => {
  pagination.value.currentPage = 1
  getServerList()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    type: '',
    status: '',
    keywords: ''
  }
  pagination.value.currentPage = 1
  getServerList()
}

// Handle page size change
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  getServerList()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  getServerList()
}

// Get type label
const getTypeLabel = (type: string) => {
  switch (type) {
    case 'zlm':
      return 'ZLM'
    case 'srs':
      return 'SRS'
    default:
      return '其他'
  }
}

// Get type tag type
const getTypeTagType = (type: string) => {
  switch (type) {
    case 'zlm':
      return 'success'
    case 'srs':
      return 'warning'
    default:
      return 'info'
  }
}

// Get status label
const getStatusLabel = (status?: string) => {
  switch (status) {
    case 'running':
      return '运行中'
    case 'stopped':
      return '未运行'
    case 'offline':
      return '离线'
    case 'unknown':
      return '关闭'
    default:
      return '未知'
  }
}

// Get status tag type
const getStatusTagType = (status?: string) => {
  switch (status) {
    case 'running':
      return 'success'
    case 'stopped':
      return 'warning'
    case 'offline':
      return 'danger'
    case 'unknown':
      return 'info'
    default:
      return 'info'
  }
}

// Open add dialog
const openAddDialog = () => {
  formDialog.value.server = null
  formDialog.value.visible = true
}

// Open edit dialog
const openEditDialog = (server: MediaServer) => {
  formDialog.value.server = server
  formDialog.value.visible = true
}

// Form success handler
const onFormSuccess = () => {
  getServerList()
}

// Open stats drawer
const openStatsDrawer = (server: MediaServer) => {
  statsDrawer.value.server = server
  statsDrawer.value.visible = true
}

// Open config page
const openConfig = (server: MediaServer) => {
  router.push(`/media-server-config/${server.id}`)
}

// Delete server
const deleteServer = async (server: MediaServer) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除流媒体服务器 "${server.name}" 吗？删除后将无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await mediaServerApi.delete(server.id)
    ElMessage.success('删除成功')
    getServerList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete server:', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

// Initialize
onMounted(() => {
  getServerList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.media-server-list-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .search-filters {
    background: var(--bg-panel);
    padding: 20px;
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    margin-bottom: 16px;
  }

  .filters {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .table-container {
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    padding: 20px;
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}
</style>
