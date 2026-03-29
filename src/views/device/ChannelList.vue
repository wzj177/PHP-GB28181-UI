<template>
  <div class="channel-list-container">
    <!-- Channel filters -->
    <div class="channel-filters">
      <div class="filters-left">
        <ElSelect
          v-model="filters.status"
          placeholder="通道状态"
          clearable
          style="width: 120px; margin-right: 10px;"
        >
          <ElOption label="在线" value="online" />
          <ElOption label="离线" value="offline" />
        </ElSelect>

        <ElSelect
          v-model="filters.channel_type"
          placeholder="通道类型"
          clearable
          style="width: 150px; margin-right: 10px;"
        >
          <ElOption
            v-for="type in channelTypeOptions"
            :key="type.code"
            :label="type.name"
            :value="type.code"
          />
        </ElSelect>

        <ElInput
          v-model="filters.keyword"
          placeholder="请输入通道名称或编号"
          style="width: 180px; margin-right: 10px;"
          @keyup.enter="searchChannels"
        />

        <ElButton type="primary" @click="searchChannels">搜索</ElButton>
        <ElButton @click="resetFilters">重置</ElButton>
        <ElButton @click="refreshChannels">刷新</ElButton>
      </div>

      <!-- Batch actions -->
      <div v-if="validSelectedChannels.length > 0" class="batch-actions">
        <span class="selection-info">已选择 {{ validSelectedChannels.length }} 项</span>
        <ElButton type="primary" @click="openBindDialog">批量绑定流媒体</ElButton>
        <ElButton @click="clearSelection">取消选择</ElButton>
      </div>
    </div>

    <!-- Channels table -->
    <div class="table-container">
      <ElTable
        v-loading="loading"
        :data="channels"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <ElTableColumn type="selection" width="55" />
        <ElTableColumn prop="channel_id" label="通道ID" width="180" />
        <ElTableColumn prop="channel_name" label="通道名称" width="150" />
        <ElTableColumn label="流媒体服务器" width="150" show-overflow-tooltip >
          <template #default="{ row }">
            <ElTag :type="row.media_server ? 'success' : 'danger'">
              {{ row.media_server ? row.media_server.name : '未绑定' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="通道类型" width="100">
          <template #default="{ row }">
            {{ row.channel_type_text || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="通道状态" width="100">
          <template #default="{ row }">
            <ElTag :type="getStatusType(row.status)">
              {{ row.status_text }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="推流状态" width="100">
          <template #default="{ row }">
            <ElTag :type="row.stream_status === 'pushing' ? 'success' : 'info'" size="small">
              {{ row.stream_status_text }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="启用" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn prop="stream_id" label="流ID" width="140" show-overflow-tooltip />
        <ElTableColumn prop="device_id" label="设备ID" width="180" />
        <ElTableColumn prop="manufacturer" label="厂商" width="120" />
        <ElTableColumn prop="model" label="型号" width="120" />
        <ElTableColumn label="最后心跳" width="160">
          <template #default="{ row }">
            {{ row.last_heartbeat_at || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="created_at" label="创建时间" width="160" />
        <ElTableColumn label="操作" width="500" fixed="right">
          <template #default="{ row }">
            <!-- 只有通道类型为 131、132 时才显示视频操作按钮 -->
            <template v-if="['131', '132'].includes(row.channel_type)">
              <ElButton size="small" type="primary" @click="startPlay(row)">播放</ElButton>
              <ElButton size="small" type="info" @click="getPlayback(row)">回放(本地录像)</ElButton>
              <ElButton size="small" @click="getPicture(row)">抓拍</ElButton>
              <ElButton size="small" @click="openEditDialog(row)">编辑</ElButton>
            </template>
            <!-- 回放下载任务按钮对所有通道类型都显示 -->
            <ElButton size="small" type="success" @click="openRecordTasksDrawer(row)">回放下载任务</ElButton>
            <!-- 删除按钮对所有通道类型都显示 -->
            <ElButton size="small" type="danger" @click="handleDelete(row)">删除</ElButton>
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

    <!-- Aggregated Player Dialog -->
    <AggregatedPlayer
      v-model="playDialog.visible"
      :device-id="playDialog.deviceId"
      :channel-id="playDialog.channelId"
      :stream-info="playDialog.streamInfo"
      :has-audio="playDialog.hasAudio"
      :is-live="true"
    />

    <!-- Channel Bind Dialog -->
    <ChannelBindDialog
      v-model="bindDialog.visible"
      :channels="selectedChannelsForBind"
      @success="onBindSuccess"
    />

    <!-- Channel Edit Dialog -->
    <ChannelEditDialog
      v-model="editDialog.visible"
      :channel="editDialog.channel"
      @success="onEditSuccess"
    />

    <!-- Channel Playback Drawer -->
    <ChannelPlaybackDrawer
      v-model="playbackDialog.visible"
      :device-id="playbackDialog.deviceId"
      :device-pk-id="playbackDialog.devicePkId"
      :channel-id="playbackDialog.channelId"
      :channel-pk-id="playbackDialog.channelPkId"
      :channel-name="playbackDialog.channelName"
      :mode="playbackDialog.mode"
    />

    <!-- Channel Record Tasks Drawer -->
    <ChannelRecordTasksDrawer
      v-model="recordTasksDialog.visible"
      :device-id="recordTasksDialog.deviceId"
      :channel-id="recordTasksDialog.channelId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage, ElMessageBox, ElSwitch } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { gb28181Api } from '@/api/gb28181Api'
import ChannelBindDialog from './ChannelBindDialog.vue'
import ChannelEditDialog from './ChannelEditDialog.vue'
import ChannelPlaybackDrawer from './ChannelPlaybackDrawer.vue'
import ChannelRecordTasksDrawer from './ChannelRecordTasksDrawer.vue'
import { AggregatedPlayer } from '@/components/player'

const router = useRouter()
const route = useRoute()

// Define channel type
interface Channel {
  id: number
  channel_id: string
  channel_name: string
  device_id: string      // 设备 GB28181 ID（字符串）
  device_pk_id?: number  // 设备主键 ID（数字，用于 API 调用）
  channel_type: string   // 通道类型字符串：'131', '132' 等
  channel_type_text?: string  // 通道类型文本
  manufacturer: string
  owner: string
  model: string
  status: string
  stream_status: string
  enabled: number
  media_server_id: string
  main_id: string
  ssrc: string
  stream_id: string
  last_heartbeat_at: string | null
  created_at: string
  updated_at: string
  show_name?: string
  origin_code?: string
  custom_lat?: string
  custom_lng?: string
  [key: string]: any
}

// Channel type option
interface ChannelTypeOption {
  code: number
  name: string
}

// State
const channels = ref<Channel[]>([])
const loading = ref(false)
const channelTypeOptions = ref<ChannelTypeOption[]>([])
const filters = ref({
  status: '',
  channel_type: undefined as string | undefined,
  keyword: ''
})
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const selectedChannels = ref<Channel[]>([])

// Play dialog
const playDialog = ref({
  visible: false,
  deviceId: '',
  channelId: '',
  streamInfo: null as any,
  hasAudio: false
})

// Bind dialog
const bindDialog = ref({
  visible: false
})

// Edit dialog
const editDialog = ref({
  visible: false,
  channel: null as {
    id: number
    channel_id: string
    channel_name: string
    show_name?: string
    origin_code?: string
    custom_lat?: string
    custom_lng?: string
  } | null
})

// Playback dialog
const playbackDialog = ref({
  visible: false,
  deviceId: '',         // 设备 GB28181 ID（字符串）
  devicePkId: 0,        // 设备主键 ID（数字，用于 API 调用）
  channelId: '',
  channelPkId: 0,       // 通道主键 ID（数字，用于查询录像结果）
  channelName: '',
  mode: 'local' as 'local' | 'cloud'
})

// Record tasks dialog
const recordTasksDialog = ref({
  visible: false,
  deviceId: '',
  channelId: ''
})

// Filter selected channels that can be batch operated (only 131, 132 types)
const validSelectedChannels = computed(() => {
  return selectedChannels.value.filter(c => ['131', '132'].includes(c.channel_type))
})

const selectedChannelsForBind = computed(() => {
  return validSelectedChannels.value.map(c => ({
    id: c.id,
    channel_id: c.channel_id,
    channel_name: c.channel_name,
    device_id: c.device_id
  }))
})

// Get channel list
const getChannelList = async () => {
  const deviceId = route.query.device_id as string

  loading.value = true
  try {
    // Use getAllChannels for support across all devices if no device_id specified
    const params = {
      device_id: deviceId || undefined,
      status: filters.value.status || undefined,
      channel_type: filters.value.channel_type,
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize,
      keyword: filters.value.keyword || undefined
    }

    const data = await gb28181Api.getAllChannels(params)
    channels.value = data.list || []
    pagination.value.total = data.paginator?.total || 0
  } catch (error: any) {
    console.error('Failed to fetch channel list:', error)
    ElMessage.error(error.message || '获取通道列表失败')
    channels.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

// Search channels
const searchChannels = () => {
  pagination.value.currentPage = 1
  getChannelList()
}

// Reset filters
const resetFilters = () => {
  filters.value = {
    status: '',
    channel_type: undefined,
    keyword: ''
  }
  pagination.value.currentPage = 1
  getChannelList()
}

// Refresh channels
const refreshChannels = () => {
  getChannelList()
}

// Handle page size change
const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  getChannelList()
}

// Handle current page change
const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  getChannelList()
}

// Handle selection change
const handleSelectionChange = (selection: Channel[]) => {
  selectedChannels.value = selection
}

// Clear selection
const clearSelection = () => {
  selectedChannels.value = []
}

// Get status type
const getStatusType = (status: string) => {
  switch (status) {
    case 'online':
      return 'success'
    case 'offline':
      return 'danger'
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
    default:
      return '未知'
  }
}

// Open bind dialog
const openBindDialog = () => {
  bindDialog.value.visible = true
}

// Bind success handler
const onBindSuccess = () => {
  clearSelection()
  getChannelList()
}

// Open edit dialog
const openEditDialog = (channel: Channel) => {
  editDialog.value.channel = {
    id: channel.id,
    channel_id: channel.channel_id,
    channel_name: channel.channel_name,
    show_name: channel.show_name || '',
    origin_code: channel.origin_code || '',
    custom_lat: channel.custom_lat || '',
    custom_lng: channel.custom_lng || ''
  }
  editDialog.value.visible = true
}

// Edit success handler
const onEditSuccess = () => {
  getChannelList()
}

// ============================================================================
// Start live playback
const startPlay = async (channel: Channel) => {
  try {
    const data = await gb28181Api.startLive({
      device_id: channel.device_id,
      channel_id: channel.channel_id
    })

    if (data?.play_urls) {
      // 将通道的 stream_id 添加到 play_urls 中
      const streamInfo = {
        ...data.play_urls,
        stream_id: channel.stream_id
      }

      playDialog.value = {
        visible: true,
        deviceId: channel.device_id,
        channelId: channel.channel_id,
        streamInfo: streamInfo,
        hasAudio: false  // API doesn't return has_audio field
      }
    } else {
      throw new Error('启动实时播放失败')
    }
  } catch (error: any) {
    console.error('Failed to start live playback:', error)
    ElMessage.error(error.message || '启动实时播放失败')
  }
}


// Get playback
const getPlayback = (channel: Channel, mode: 'local' | 'cloud' = 'local') => {
  playbackDialog.value = {
    visible: true,
    deviceId: channel.device_id,
    devicePkId: channel.device_pk_id || 0,
    channelId: channel.channel_id,
    channelPkId: channel.id,  // 通道主键 ID
    channelName: channel.channel_name,
    mode
  }
}

// Open record tasks drawer
const openRecordTasksDrawer = (channel: Channel) => {
  recordTasksDialog.value = {
    visible: true,
    deviceId: channel.device_id,
    channelId: channel.channel_id
  }
}

// Get picture/snapshot
const getPicture = async (channel: Channel) => {
  await setTimeout(() => {}, 500)
   return ElMessage.info('正在开发中...')
  // try {
  //   const data = await gb28181Api.snapshot({
  //     device_id: channel.device_id,
  //     channel_id: channel.channel_id
  //   })

  //   if (data?.snapshot_url) {
  //     window.open(data.snapshot_url, '_blank')
  //     ElMessage.success('抓拍成功')
  //   } else {
  //     throw new Error('抓拍失败')
  //   }
  // } catch (error: any) {
  //   console.error('Failed to get snapshot:', error)
  //   ElMessage.error(error.message || '抓拍失败')
  // }
}

// Delete channel
const handleDelete = async (channel: Channel) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除通道"${channel.channel_name}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await gb28181Api.deleteChannel(channel.id)
    ElMessage.success('删除成功')
    getChannelList()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('Failed to delete channel:', error)
      ElMessage.error(error.message || '删除通道失败')
    }
  }
}

// Get channel type options
const getChannelTypeOptions = async () => {
  try {
    const data = await gb28181Api.getChannelTypeOptions()
    channelTypeOptions.value = data || []
  } catch (error: any) {
    console.error('Failed to fetch channel type options:', error)
    ElMessage.error(error.message || '获取通道类型选项失败')
  }
}

// Initialize
onMounted(() => {
  getChannelTypeOptions()
  getChannelList()
})

// Watch for device_id changes in route query
watch(() => route.query.device_id, (newDeviceId, oldDeviceId) => {
  // Reset pagination when device changes
  pagination.value.currentPage = 1
  // Reload channel list with new device_id
  getChannelList()
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.channel-list-container {
  padding: 20px;
  background: var(--bg-hover);
  min-height: 100%;

  .channel-filters {
    background: var(--bg-panel);
    padding: 20px;
    border-radius: $radius-panel;
    border: 1px solid var(--border-base);
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;

    .filters-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
      flex-wrap: wrap;
    }

    .filters {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .batch-actions {
      display: flex;
      align-items: center;
      gap: 10px;

      .selection-info {
        color: var(--text-secondary);
        font-size: 14px;
      }
    }
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

  .video-container {
    width: 100%;
    height: 500px;
  }
}
</style>
