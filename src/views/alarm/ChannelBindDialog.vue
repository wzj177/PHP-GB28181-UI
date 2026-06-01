<template>
  <el-dialog
    :model-value="visible"
    :title="`绑定通道 - ${planName}`"
    width="900px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <div class="bind-dialog-content">
      <!-- 已绑定的通道 -->
      <div class="bound-section">
        <div class="section-header">
          <h4>已绑定通道 ({{ boundChannels.length }})</h4>
        </div>
        <el-table
          :data="boundChannels"
          border
          stripe
          size="small"
          max-height="200"
        >
          <el-table-column label="设备" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.device_name || row.device_id }}</div>
              <div v-if="row.device_name" class="text-secondary">{{ row.device_id }}</div>
            </template>
          </el-table-column>
          <el-table-column label="通道" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              <div>{{ row.channel_name || row.channel_id }}</div>
              <div v-if="row.channel_name" class="text-secondary">{{ row.channel_id }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button
                type="danger"
                link
                size="small"
                @click="handleUnbind(row)"
              >
                解绑
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty
          v-if="boundChannels.length === 0 && !boundChannelsLoading"
          description="暂无绑定通道"
          :image-size="80"
        />
      </div>

      <!-- 绑定新通道 -->
      <div class="bind-section">
        <div class="section-header">
          <h4>绑定新通道</h4>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索设备ID/名称 或 通道ID/名称"
            clearable
            style="width: 280px"
            @input="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <el-table
          :data="filteredChannels"
          border
          stripe
          size="small"
          max-height="300"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" />
          <el-table-column prop="device_id" label="设备ID" min-width="140" show-overflow-tooltip />
          <el-table-column prop="device_name" label="设备名称" min-width="120" show-overflow-tooltip />
          <el-table-column prop="channel_id" label="通道ID" min-width="140" show-overflow-tooltip />
          <el-table-column prop="channel_name" label="通道名称" min-width="120" show-overflow-tooltip />
        </el-table>

        <div class="bind-actions">
          <el-button
            type="primary"
            @click="handleBind"
            :loading="binding"
            :disabled="selectedChannels.length === 0"
          >
            绑定选中的 {{ selectedChannels.length }} 个通道
          </el-button>
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { alarmApi } from '@/api/alarmApi'
import { gb28181Api } from '@/api/gb28181Api'
import type { AlarmPlanChannel } from '@/types/alarm'

interface Props {
  visible: boolean
  planId?: number
  planName?: string
}

interface ChannelInfo {
  id: number
  device_id: string
  channel_id: string
  device_name?: string
  channel_name?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const binding = ref(false)
const boundChannelsLoading = ref(false)
const boundChannels = ref<AlarmPlanChannel[]>([])
const allChannels = ref<ChannelInfo[]>([])
const selectedChannels = ref<ChannelInfo[]>([])
const searchKeyword = ref('')

// 已绑定通道的标识集合 (device_id:channel_id)
const boundChannelKeys = computed(() => {
  return new Set(
    boundChannels.value.map(c => `${c.device_id}:${c.channel_id}`)
  )
})

// 过滤后的通道列表（排除已绑定的）
const filteredChannels = computed(() => {
  // 排除已绑定的通道
  let filtered = allChannels.value.filter(c => {
    const key = `${c.device_id}:${c.channel_id}`
    return !boundChannelKeys.value.has(key)
  })

  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(c =>
      c.device_id?.toLowerCase().includes(keyword) ||
      c.device_name?.toLowerCase().includes(keyword) ||
      c.channel_id?.toLowerCase().includes(keyword) ||
      c.channel_name?.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

// 加载所有通道
const loadAllChannels = async () => {
  try {
    const response = await gb28181Api.getAllChannels({
      page: 1,
      page_size: 10000
    }) as any
    allChannels.value = response.list || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载通道列表失败')
  }
}

// 加载已绑定的通道
const loadBoundChannels = async () => {
  if (!props.planId) return

  boundChannelsLoading.value = true
  try {
    const response = await alarmApi.getAlarmPlanChannels(props.planId) as AlarmPlanChannel[]
    boundChannels.value = response || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载已绑定通道失败')
    boundChannels.value = []
  } finally {
    boundChannelsLoading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  // computed 会自动更新
}

// 选择变化
const handleSelectionChange = (selection: ChannelInfo[]) => {
  selectedChannels.value = selection
}

// 绑定通道
const handleBind = async () => {
  if (!props.planId || selectedChannels.value.length === 0) return

  binding.value = true
  try {
    // 按设备分组
    const groupedByDevice = selectedChannels.value.reduce((acc, channel) => {
      if (!acc[channel.device_id]) {
        acc[channel.device_id] = []
      }
      acc[channel.device_id].push(channel.channel_id)
      return acc
    }, {} as Record<string, string[]>)

    // 批量绑定
    const promises = Object.entries(groupedByDevice).map(([deviceId, channelIds]) =>
      alarmApi.bindChannels(props.planId!, { device_id: deviceId, channel_ids: channelIds })
    )

    await Promise.all(promises)

    ElMessage.success(`成功绑定 ${selectedChannels.value.length} 个通道`)

    // 清空选择
    selectedChannels.value = []

    // 重新加载已绑定通道
    await loadBoundChannels()

    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '绑定失败')
  } finally {
    binding.value = false
  }
}

// 解绑通道
const handleUnbind = async (row: AlarmPlanChannel) => {
  if (!props.planId) return

  try {
    await alarmApi.unbindChannel(props.planId, row.channel_id)
    ElMessage.success('解绑成功')

    // 重新加载已绑定通道
    await loadBoundChannels()

    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '解绑失败')
  }
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
  // 清空搜索
  searchKeyword.value = ''
  selectedChannels.value = []
}

// 监听对话框打开
watch(() => props.visible, (val) => {
  if (val) {
    loadAllChannels()
    loadBoundChannels()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.bind-dialog-content {
  .bound-section {
    margin-bottom: 20px;

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-main);
      }
    }
  }

  .bind-section {
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-main);
      }
    }

    .bind-actions {
      margin-top: 12px;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  .text-secondary {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 2px;
  }
}
</style>
