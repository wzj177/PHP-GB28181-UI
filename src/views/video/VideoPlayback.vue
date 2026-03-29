<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElCard,
  ElButton,
  ElInput,
  ElSelect,
  ElOption,
  ElTable,
  ElTableColumn,
  ElMessage,
  ElTag
} from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { gb28181Api } from '@/api/gb28181Api'
import ChannelPlaybackDrawer from '@/views/device/ChannelPlaybackDrawer.vue'

const router = useRouter()

// Define interfaces for the new table structure
interface DeviceTableItem {
  id: string
  pkId?: number  // 设备主键 ID
  name: string
  channelName?: string,
  type: 'video-channel' | 'group' | 'device',
  status: 'online' | 'offline' | 'motion_detect'
  hasChildren?: boolean
  children?: DeviceTableItem[]
}

// State
const tableData = ref<DeviceTableItem[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// 筛选条件
const filters = ref({
  status: '',      // 在线/离线
  keyword: ''      // 搜索关键字
})

// 原始数据（用于筛选）
const originalTableData = ref<DeviceTableItem[]>([])

// Playback drawer state
const playbackDrawer = ref({
  visible: false,
  deviceId: '',
  devicePkId: 0,   // 设备主键 ID
  channelId: '',
  channelPkId: 0,  // 通道主键 ID（VideoPlayback 页面可能没有）
  channelName: ''
})

// Load device data
const loadDeviceTree = async () => {
  loading.value = true
  try {
    console.log('📼 Fetching device list...')
    const response = await gb28181Api.getDeviceList();

    console.log('📼 Device list response:', response)

    // Handle different response structures
    let devices: any[] = []

    if (response?.list) {
      // Mock API returns { list: [...], paginator: {...} }
      devices = response.list
    } else if (response?.code === 0 && response.data?.list) {
      // Real API returns { code: 0, data: { list: [...] } }
      devices = response.data.list
    } else if (response?.code === 0 && Array.isArray(response.data)) {
      // Alternative: { code: 0, data: [...] }
      devices = response.data
    } else if (Array.isArray(response)) {
      // Direct array response
      devices = response
    }

    console.log('📼 Parsed devices:', devices)

    // Transform the device data to match the expected table structure
    const transformedData: DeviceTableItem[] = devices.map((device: any) => ({
      id: device.device_id || device.id,
      pkId: device.id,  // 设备主键 ID
      name: device.device_name || device.name || '未知设备',
      type: 'video-channel',
      status: device.status || 'offline',
      channelName: '通道1',
      hasChildren: false
    }));

    originalTableData.value = transformedData
    applyFilters()  // 应用筛选
    console.log('Device list loaded:', transformedData.length, 'items')
  } catch (error: any) {
    console.error('❌ Failed to load device tree:', error)
    ElMessage.error(error.message || '获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// 应用筛选条件
const applyFilters = () => {
  let filtered = [...originalTableData.value]

  // 按状态筛选
  if (filters.value.status) {
    filtered = filtered.filter(item => item.status === filters.value.status)
  }

  // 按关键字筛选
  if (filters.value.keyword) {
    const keyword = filters.value.keyword.toLowerCase()
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(keyword) ||
      item.id.toLowerCase().includes(keyword)
    )
  }

  tableData.value = filtered
}

// 搜索按钮点击
const handleSearch = () => {
  filters.value.keyword = searchKeyword.value
  applyFilters()
}

// 重置筛选
const handleReset = () => {
  filters.value.status = ''
  searchKeyword.value = ''
  applyFilters()
}

// Get status tag
const getStatusTag = (status: string) => {
  switch (status) {
    case 'online':
      return { type: 'success', label: '在线' }
    case 'offline':
      return { type: 'danger', label: '离线' }
    case 'motion_detect':
      return { type: 'warning', label: '移动侦测' }
    default:
      return { type: 'info', label: '未知' }
  }
}

// Navigate to playback view
const goToPlayback = (row: DeviceTableItem) => {
  // Open the cloud playback drawer
  playbackDrawer.value = {
    visible: true,
    deviceId: row.id,
    devicePkId: row.pkId || 0,
    channelId: row.id,
    channelPkId: 0,  // VideoPlayback 页面没有通道主键 ID
    channelName: row.name
  }
}

// Navigate to recordings list view
const goToList = (row: DeviceTableItem) => {
  router.push({ path: '/cloud-recordings', query: { device_id: row.id } })
}

// Initialize on component mounted
onMounted(() => {
  loadDeviceTree()
})
</script>

<template>
  <div class="video-playback-page">
    <div class="main-content">
      <!-- Main content - Device table -->
      <div class="content-area">
        <!-- Search controls -->
        <ElCard class="search-card">
          <div class="search-controls">
            <ElSelect
              v-model="filters.status"
              placeholder="设备状态"
              clearable
              style="width: 120px; margin-right: 10px;"
              @change="applyFilters"
            >
              <ElOption label="在线" value="online" />
              <ElOption label="离线" value="offline" />
            </ElSelect>

            <ElInput
              v-model="searchKeyword"
              placeholder="设备名称/设备号搜索"
              style="width: 200px; margin-right: 10px;"
              clearable
              @keyup.enter="handleSearch"
            />

            <ElButton
              type="primary"
              :icon="Search"
              @click="handleSearch"
            >
              搜索
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
            <ElButton @click="loadDeviceTree">刷新</ElButton>
          </div>
        </ElCard>

        <!-- Device table -->
        <ElCard class="device-table-card">
          <ElTable
            v-loading="loading"
            :data="tableData"
            style="width: 100%"
            row-key="id"
            default-expand-all
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
          >
            <ElTableColumn
              prop="name"
              label="设备号"
              min-width="200"
            >
              <template #default="{ row }">
                <span>{{ row.name }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn
              prop="channelName"
              label="通道号"
              width="150"
            />
            <ElTableColumn
              label="状态"
              width="120"
            >
              <template #default="{ row }">
                <ElTag :type="getStatusTag(row.status).type">
                  {{ getStatusTag(row.status).label }}
                </ElTag>
              </template>
            </ElTableColumn>
            <ElTableColumn
              label="操作"
              width="250"
            >
              <template #default="{ row }">
                <ElButton
                  v-if="row.type === 'video-channel'"
                  size="small"
                  type="primary"
                  @click="goToPlayback(row)"
                >
                  录像回放时间轴
                </ElButton>
                <ElButton
                  v-if="row.type === 'video-channel'"
                  size="small"
                  type="info"
                  @click="goToList(row)"
                >
                  录像列表
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElCard>
      </div>
    </div>

    <!-- Cloud Playback Drawer -->
    <ChannelPlaybackDrawer
      v-model="playbackDrawer.visible"
      :device-id="playbackDrawer.deviceId"
      :device-pk-id="playbackDrawer.devicePkId"
      :channel-id="playbackDrawer.channelId"
      :channel-pk-id="playbackDrawer.channelPkId"
      :channel-name="playbackDrawer.channelName"
      mode="cloud"
    />
  </div>
</template>

<style scoped>
.video-playback-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

.header {
  padding: 1rem 1.5rem;
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.content-area {
  flex: 1;
  padding: 1rem;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: #f5f7fa;
}

.search-card {
  margin: 0 0 1rem 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #e6e6e6;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.device-table-card {
  flex: 1;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 1px solid #e6e6e6;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem !important;
  border-bottom: 1px solid #e6e6e6;
  font-weight: 600;
  color: #333;
}

:deep(.el-table) {
  background-color: transparent;
  border-radius: 8px;
}

:deep(.el-table__header) {
  background-color: #fafafa;
}

:deep(.el-table__row) {
  background-color: #fff;
  margin-bottom: 4px;
  border-radius: 4px;
}

:deep(.el-table__row:hover > td) {
  background-color: #f5f7fa;
}
</style>