<template>
  <div class="device-list-container">
    <!-- Search and filters -->
    <div class="search-filters">
      <div class="filters">
        <ElSelect
          v-model="filters.status"
          placeholder="设备状态"
          clearable
          style="width: 150px; margin-right: 10px;"
        >
          <ElOption label="在线" value="online" />
          <ElOption label="离线" value="offline" />
          <ElOption label="心跳超时" value="expired" />
          <ElOption label="已注销" value="unregistered" />
        </ElSelect>

        <ElInput
          v-model="filters.keyword"
          placeholder="请输入设备名称或编号"
          style="width: 200px; margin-right: 10px;"
          @keyup.enter="searchDevices"
        />

        <ElButton type="primary" @click="searchDevices">搜索</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
        <ElButton @click="getDeviceList">刷新</ElButton>
        <div class="auto-refresh-toggle">
          <span class="refresh-label">自动刷新：</span>
          <ElSwitch
            v-model="autoRefreshEnabled"
            @change="toggleAutoRefresh"
            active-text="开"
            inactive-text="关"
          />
        </div>
      </div>

      <!-- Batch actions -->
      <div v-if="selectedDevices.length > 0" class="batch-actions">
        <span class="selection-info">已选择 {{ selectedDevices.length }} 项</span>
        <ElButton type="danger" @click="batchDelete">批量删除</ElButton>
        <ElButton type="primary" @click="openBatchAreaDialog">批量更新行政区域</ElButton>
        <ElButton @click="clearSelection">取消选择</ElButton>
      </div>
    </div>

    <!-- Summary Statistics -->
    <div class="summary-section">
      <div class="summary-card total">
        <div class="summary-icon">
          <el-icon><Monitor /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.total_count || 0 }}</div>
          <div class="summary-label">设备总数</div>
        </div>
      </div>
      <div class="summary-card online">
        <div class="summary-icon">
          <el-icon><SuccessFilled /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.online_count || 0 }}</div>
          <div class="summary-label">在线设备</div>
        </div>
      </div>
      <div class="summary-card expired">
        <div class="summary-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.expired_count || 0 }}</div>
          <div class="summary-label">心跳超时</div>
        </div>
      </div>
      <div class="summary-card unregister">
        <div class="summary-icon">
          <el-icon><CircleCloseFilled /></el-icon>
        </div>
        <div class="summary-content">
          <div class="summary-value">{{ summary.unregister_count || 0 }}</div>
          <div class="summary-label">已注销</div>
        </div>
      </div>
    </div>

    <!-- Devices table -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="devices"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn prop="device_id" label="设备ID" width="180" />
        <ElTableColumn label="设备名称" width="200">
          <template #default="{ row }">
            <div class="device-name-cell">
              <div v-if="row.device_name" class="device-name">{{ row.device_name }}</div>
              <div v-if="row.show_name" class="show-name">{{ row.show_name }}</div>
              <div v-if="!row.device_name && row.show_name" class="device-name">{{ row.show_name }}</div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="manufacturer" label="厂商" width="120" />
        <ElTableColumn prop="model" label="型号" width="120" />
        <ElTableColumn label="设备状态" width="100">
          <template #default="{ row }">
            <ElTag :type="getStatusType(row.status)">
              {{ getStatusLabel(row.status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="启用状态" width="80">
          <template #default="{ row }">
            <ElTag :type="row.enabled === 1 ? 'success' : 'info'">
              {{ row.enabled === 1 ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="传输模式" width="120">
          <template #default="{ row }">
            {{ getTransModeLabel(row.rtp_trans_mode) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="通道数" width="80">
          <template #default="{ row }">
            {{ row.sum_num || 0 }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="行政区域" width="200">
          <template #default="{ row }">
            {{ getAreaName(row) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="ip" label="IP地址" width="150" />
        <ElTableColumn prop="port" label="端口" width="80" />
        <ElTableColumn prop="registered_at" label="注册时间" width="180" fixed="right" />
        <ElTableColumn prop="last_heartbeat_at" label="最后心跳时间" width="180" fixed="right" />
        <ElTableColumn label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <ElButton size="small" @click="viewDetail(row)">详情</ElButton>
            <ElButton size="small" @click="viewChannels(row)">通道列表</ElButton>
            <ElButton size="small" type="warning" @click="openEditDialog(row)">编辑</ElButton>
            <ElButton size="small" type="danger" @click="deleteDevice(row)">删除</ElButton>
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

    <!-- Device Edit Dialog -->
    <DeviceEditDialog
      v-model="editDialog.visible"
      :device="editDialog.device"
      @success="onEditSuccess"
    />

    <!-- Batch Area Update Dialog -->
    <ElDialog
      v-model="areaDialog.visible"
      title="批量更新行政区域"
      width="500px"
    >
      <ElForm label-width="100px">
        <ElFormItem label="行政区域">
          <ElCascader
            v-model="areaDialog.areaValue"
            :options="regionOptions"
            :props="{ value: 'value', label: 'label', children: 'children' }"
            placeholder="请选择行政区域"
            clearable
            filterable
            style="width: 100%;"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="areaDialog.visible = false">取消</ElButton>
        <ElButton type="primary" :loading="areaDialog.loading" @click="confirmBatchArea">确定</ElButton>
      </template>
    </ElDialog>

    <!-- Device Detail Dialog -->
    <ElDialog
      v-model="detailDialog.visible"
      title="设备详情"
      width="700px"
    >
      <div v-if="detailDialog.device" class="device-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="设备ID" :span="2">
            {{ detailDialog.device.device_id }}
          </el-descriptions-item>
          <el-descriptions-item label="设备名称" :span="2">
            {{ detailDialog.device.device_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="自定义名称" :span="2">
            {{ detailDialog.device.show_name || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="设备类型">
            {{ detailDialog.device.device_type || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="设备状态">
            <ElTag :type="getStatusType(detailDialog.device.status)">
              {{ getStatusLabel(detailDialog.device.status) }}
            </ElTag>
          </el-descriptions-item>
          <el-descriptions-item label="启用状态">
            <ElTag :type="detailDialog.device.enabled === 1 ? 'success' : 'info'">
              {{ detailDialog.device.enabled === 1 ? '启用' : '禁用' }}
            </ElTag>
          </el-descriptions-item>
          <el-descriptions-item label="通道总数">
            {{ detailDialog.device.sum_num || 0 }}
          </el-descriptions-item>
          <el-descriptions-item label="传输模式">
            {{ getTransModeLabel(detailDialog.device.rtp_trans_mode) }}
          </el-descriptions-item>
          <el-descriptions-item label="厂商">
            {{ detailDialog.device.manufacturer || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="型号">
            {{ detailDialog.device.model || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="固件版本">
            {{ detailDialog.device.firmware || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="User Agent" :span="2">
            {{ detailDialog.device.user_agent || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ detailDialog.device.ip }}
          </el-descriptions-item>
          <el-descriptions-item label="端口">
            {{ detailDialog.device.port }}
          </el-descriptions-item>
          <el-descriptions-item label="SIP From URI" :span="2">
            {{ detailDialog.device.from_uri || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="Contact" :span="2">
            {{ detailDialog.device.contact || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册有效期">
            {{ detailDialog.device.expires ? detailDialog.device.expires + '秒' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="注册时间">
            {{ detailDialog.device.registered_at || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后心跳时间" :span="2">
            {{ detailDialog.device.last_heartbeat_at || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="经度">
            {{ detailDialog.device.lng || detailDialog.device.custom_lng || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="纬度">
            {{ detailDialog.device.lat || detailDialog.device.custom_lat || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="行政区域" :span="2">
            {{ getAreaName(detailDialog.device) }}
          </el-descriptions-item>
          <el-descriptions-item label="字符集">
            {{ getCharsetLabel(detailDialog.device.charset) }}
          </el-descriptions-item>
          <el-descriptions-item label="流索引">
            {{ detailDialog.device.stream_index || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">订阅配置</el-divider>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="订阅目录">
            <ElTag :type="detailDialog.device.subscribe_catalog ? 'success' : 'info'" size="small">
              {{ detailDialog.device.subscribe_catalog ? '已启用' : '未启用' }}
            </ElTag>
          </el-descriptions-item>
          <el-descriptions-item label="订阅报警">
            <ElTag :type="detailDialog.device.subscribe_alarm ? 'success' : 'info'" size="small">
              {{ detailDialog.device.subscribe_alarm ? '已启用' : '未启用' }}
            </ElTag>
          </el-descriptions-item>
          <el-descriptions-item label="订阅位置">
            <ElTag :type="detailDialog.device.subscribe_position ? 'success' : 'info'" size="small">
              {{ detailDialog.device.subscribe_position ? '已启用' : '未启用' }}
            </ElTag>
          </el-descriptions-item>
          <el-descriptions-item label="订阅云台">
            <ElTag :type="detailDialog.device.subscribe_ptz ? 'success' : 'info'" size="small">
              {{ detailDialog.device.subscribe_ptz ? '已启用' : '未启用' }}
            </ElTag>
          </el-descriptions-item>
          <el-descriptions-item label="订阅有效期">
            {{ detailDialog.device.subscribe_expires ? detailDialog.device.subscribe_expires + '秒' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="位置间隔">
            {{ detailDialog.device.position_interval ? detailDialog.device.position_interval + '秒' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="目录间隔">
            {{ detailDialog.device.catalog_interval ? detailDialog.device.catalog_interval + '秒' : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后目录同步">
            {{ detailDialog.device.last_catalog_at || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">系统信息</el-divider>

        <el-descriptions :column="2" border>
          <el-descriptions-item label="创建时间" :span="2">
            {{ detailDialog.device.created_at || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="更新时间" :span="2">
            {{ detailDialog.device.updated_at || '-' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <ElButton @click="detailDialog.visible = false">关闭</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
// @ts-ignore - Icons exist but type definitions are incorrect
import { Monitor, CloseBold, CircleClose,CircleCheck } from '@element-plus/icons-vue'
// @ts-ignore
import { useRouter } from 'vue-router'
import { gb28181Api } from '@/api/gb28181Api'
import DeviceEditDialog from './DeviceEditDialog.vue'
import { regionData } from 'element-china-area-data'

// Use available icons as replacements
const SuccessFilled = CircleCheck
const WarningFilled = CloseBold
const CircleCloseFilled = CircleClose

const router = useRouter()

// Convert region data for cascader
const convertRegionData = (data: any[]): any[] => {
  return data.map((province: any) => ({
    value: province.value,
    label: province.label,
    children: province.children ? convertRegionData(province.children) : undefined
  }))
}

// Find region label by value from region data
const findRegionLabel = (value: string, data: any[]): string => {
  for (const item of data) {
    if (item.value === value) {
      return item.label
    }
    if (item.children) {
      const result = findRegionLabel(value, item.children)
      if (result) return result
    }
  }
  return ''
}

// Get area name from device's province_id, city_id, county_id
const getAreaName = (device: Device): string => {
  const parts: string[] = []
  if (device.province_id) {
    const label = findRegionLabel(device.province_id, regionData)
    if (label) parts.push(label)
  }
  if (device.city_id) {
    const label = findRegionLabel(device.city_id, regionData)
    if (label) parts.push(label)
  }
  if (device.county_id) {
    const label = findRegionLabel(device.county_id, regionData)
    if (label) parts.push(label)
  }
  return parts.length > 0 ? parts.join(' / ') : '-'
}

// Get charset label
const getCharsetLabel = (charset?: string): string => {
  switch (charset) {
    case 'auto':
      return '自动识别'
    case 'gb2312':
      return 'GB2312'
    case 'utf8':
      return 'UTF-8'
    default:
      return charset || '-'
  }
}

interface Device {
  id: number
  device_id: string
  device_name: string
  show_name?: string
  device_type?: string
  manufacturer: string
  model: string
  firmware: string
  user_agent?: string
  status: 'online' | 'offline' | 'expired' | 'unregistered'
  enabled: number
  rtp_trans_mode?: number
  ip: string
  port: number
  sum_num?: number
  from_uri?: string
  contact?: string
  expires?: number
  registered_at?: string
  last_heartbeat_at?: string
  lat?: string
  lng?: string
  custom_lat?: string
  custom_lng?: string
  province_id?: string
  city_id?: string
  county_id?: string
  created_at?: string
  updated_at?: string
  // Subscription fields
  subscribe_catalog?: number
  subscribe_alarm?: number
  subscribe_position?: number
  subscribe_ptz?: number
  subscribe_expires?: number
  position_interval?: number
  catalog_interval?: number
  last_catalog_at?: string
  charset?: 'auto' | 'gb2312' | 'utf8'
  stream_index?: string
  filter_channel_types?: any
  subscription_status?: any
  [key: string]: any
}

interface DeviceSummary {
  total_count: number
  online_count: number
  expired_count: number
  unregister_count: number
}

// State
const devices = ref<Device[]>([])
const loading = ref(false)
const summary = ref<DeviceSummary>({
  total_count: 0,
  online_count: 0,
  expired_count: 0,
  unregister_count: 0
})
const filters = ref({
  status: '',
  keyword: ''
})
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const selectedDevices = ref<Device[]>([])

// Auto-refresh timer
const autoRefreshEnabled = ref(true)
const refreshTimer = ref<number | null>(null)
const REFRESH_INTERVAL = 10000 // 10 seconds

// Start auto-refresh timer
const startAutoRefresh = () => {
  if (refreshTimer.value) return
  refreshTimer.value = window.setInterval(() => {
    if (autoRefreshEnabled.value) {
      getDeviceList()
    }
  }, REFRESH_INTERVAL)
}

// Stop auto-refresh timer
const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
  }
}

// Toggle auto-refresh
const toggleAutoRefresh = (enabled: boolean) => {
  autoRefreshEnabled.value = enabled
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// Edit dialog
const editDialog = ref({
  visible: false,
  device: null as Device | null
})

// Area update dialog
const regionOptions = ref<any[]>(convertRegionData(regionData))
const areaDialog = ref({
  visible: false,
  loading: false,
  areaValue: [] as string[]
})

// Detail dialog
const detailDialog = ref({
  visible: false,
  device: null as Device | null
})

// Get device list
const getDeviceList = async () => {
  loading.value = true
  try {
    const params = {
      status: filters.value.status || undefined,
      page: pagination.value.currentPage,
      limit: pagination.value.pageSize,
      keyword: filters.value.keyword || undefined
    }

    const data: any = await gb28181Api.getDeviceList(params)
    devices.value = data.list || []
    pagination.value.total = data.paginator?.total || 0
    // Update summary from API response
    if (data.summary) {
      summary.value = data.summary
    }
  } catch (error: any) {
    console.error('Failed to fetch device list:', error)
    ElMessage.error(error.message || '获取设备列表失败')
  } finally {
    loading.value = false
  }
}

// Search devices
const searchDevices = () => {
  pagination.value.currentPage = 1
  getDeviceList()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    status: '',
    keyword: ''
  }
  pagination.value.currentPage = 1
  getDeviceList()
}

// Handle page size change
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  getDeviceList()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  getDeviceList()
}

// Handle selection change
const handleSelectionChange = (selection: Device[]) => {
  selectedDevices.value = selection
}

// Clear selection
const clearSelection = () => {
  selectedDevices.value = []
}

// Get status type
const getStatusType = (status: string) => {
  switch (status) {
    case 'online':
      return 'success'
    case 'offline':
      return 'danger'
    case 'expired':
      return 'warning'
    case 'unregistered':
      return 'info'
    default:
      return 'info'
  }
}

// Get status label
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'online':
      return '在线'
    case 'offline':
      return '离线'
    case 'expired':
      return '心跳超时'
    case 'unregistered':
      return '已注销'
    default:
      return '未知'
  }
}

// Get transmission mode label
const getTransModeLabel = (mode?: number) => {
  switch (mode) {
    case 0:
      return 'UDP'
    case 1:
      return 'TCP被动'
    case 2:
      return 'TCP主动'
    default:
      return 'UDP'
  }
}

// View channels
const viewChannels = (device: Device) => {
  router.push(`/channels?device_id=${device.device_id}`)
}

// Open edit dialog
const openEditDialog = (device: Device) => {
  editDialog.value.device = device
  editDialog.value.visible = true
}

// View device detail
const viewDetail = (device: Device) => {
  detailDialog.value.device = device
  detailDialog.value.visible = true
}

// Edit success handler
const onEditSuccess = () => {
  getDeviceList()
}

// Batch delete
const batchDelete = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedDevices.value.length} 个设备吗？删除后将无法恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const ids = selectedDevices.value.map(d => d.id)
    await gb28181Api.batchDeleteDevices(ids)

    ElMessage.success('批量删除成功')
    clearSelection()
    getDeviceList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to batch delete devices:', error)
      ElMessage.error(error.message || '批量删除失败')
    }
  }
}

// Open batch area dialog
const openBatchAreaDialog = () => {
  areaDialog.value.areaValue = []
  areaDialog.value.visible = true
}

// Confirm batch area update
const confirmBatchArea = async () => {
  if (areaDialog.value.areaValue.length === 0) {
    ElMessage.warning('请选择行政区域')
    return
  }

  areaDialog.value.loading = true
  try {
    const ids = selectedDevices.value.map(d => d.id)
    const area = {
      province_id: areaDialog.value.areaValue[0],
      city_id: areaDialog.value.areaValue[1] || '',
      county_id: areaDialog.value.areaValue[2] || ''
    }

    await gb28181Api.batchUpdateDeviceArea(ids, area)

    ElMessage.success('批量更新行政区域成功')
    areaDialog.value.visible = false
    clearSelection()
    getDeviceList()
  } catch (error: any) {
    console.error('Failed to batch update device area:', error)
    ElMessage.error(error.message || '批量更新行政区域失败')
  } finally {
    areaDialog.value.loading = false
  }
}

// Delete single device
const deleteDevice = async (device: Device) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除设备 "${device.device_name}" 吗？删除后将无法恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await gb28181Api.deleteDevice(String(device.id))
    ElMessage.success('设备删除成功')
    getDeviceList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete device:', error)
      ElMessage.error(error.message || '删除设备失败')
    }
  }
}

// Initialize
onMounted(() => {
  getDeviceList()
  startAutoRefresh()
})

// Cleanup on unmount
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.device-list-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .search-filters {
    background: var(--bg-panel);
    padding: 20px;
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    margin-bottom: 16px;

    .filters {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .auto-refresh-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-left: 16px;
      border-left: 1px solid var(--border-base);

      .refresh-label {
        font-size: 14px;
        color: var(--text-secondary);
      }
    }

    .batch-actions {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-base);

      .selection-info {
        color: var(--text-secondary);
        font-size: 14px;
      }
    }
  }

  .summary-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 16px;

    .summary-card {
      background: var(--bg-panel);
      border-radius: $radius-panel;
      border: 1px solid var(--border-base);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .summary-icon {
        width: 56px;
        height: 56px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        font-size: 24px;
        flex-shrink: 0;
      }

      .summary-content {
        flex: 1;

        .summary-value {
          font-size: 28px;
          font-weight: 600;
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .summary-label {
          font-size: 13px;
          color: var(--text-muted);
        }
      }

      &.total .summary-icon {
        background: rgba($primary, 0.15);
        color: $primary;
      }
      &.total .summary-value {
        color: $primary;
      }

      &.online .summary-icon {
        background: rgba($success, 0.15);
        color: $success;
      }
      &.online .summary-value {
        color: $success;
      }

      &.expired .summary-icon {
        background: rgba($warning, 0.15);
        color: $warning;
      }
      &.expired .summary-value {
        color: $warning;
      }

      &.unregister .summary-icon {
        background: rgba($info, 0.15);
        color: $info;
      }
      &.unregister .summary-value {
        color: $info;
      }
    }
  }

  .table-container {
    background: var(--bg-panel);
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    padding: 20px;

    .device-name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .device-name {
        font-size: 14px;
        color: var(--text-main);
        font-weight: 500;
      }

      .show-name {
        font-size: 12px;
        color: var(--text-muted);
      }
    }
  }

  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: center;
  }
}
</style>
