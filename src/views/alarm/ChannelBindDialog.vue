<template>
  <el-dialog
    :model-value="visible"
    :title="`绑定通道 - ${planName}`"
    width="800px"
    @update:model-value="$emit('update:visible', $event)"
    @close="handleClose"
  >
    <div class="bind-dialog-content">
      <!-- 已绑定的通道 -->
      <div class="bound-section">
        <div class="section-header">
          <h4>已绑定通道</h4>
          <el-tag type="success" size="small">{{ boundChannels.length }} 个</el-tag>
        </div>
        <el-table
          :data="boundChannels"
          border
          stripe
          size="small"
          max-height="250"
        >
          <el-table-column prop="device_id" label="设备ID" min-width="160" show-overflow-tooltip />
          <el-table-column prop="channel_id" label="通道ID" min-width="160" show-overflow-tooltip />
          <el-table-column label="操作" width="80" align="center">
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
          v-if="boundChannels.length === 0"
          description="暂无绑定通道"
          :image-size="80"
        />
      </div>

      <!-- 绑定新通道 -->
      <div class="bind-section">
        <div class="section-header">
          <h4>绑定新通道</h4>
        </div>
        <el-form :inline="true" :model="bindForm" class="bind-form">
          <el-form-item label="设备ID">
            <el-select
              v-model="bindForm.device_id"
              placeholder="选择设备"
              filterable
              style="width: 240px"
              @change="handleDeviceChange"
            >
              <el-option
                v-for="device in devices"
                :key="device.device_id"
                :label="`${device.name} (${device.device_id})`"
                :value="device.device_id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="通道">
            <el-select
              v-model="bindForm.channel_ids"
              placeholder="选择通道"
              multiple
              filterable
              collapse-tags
              style="width: 320px"
              :disabled="!bindForm.device_id"
            >
              <el-option
                v-for="channel in channels"
                :key="channel.channel_id"
                :label="`${channel.name} (${channel.channel_id})`"
                :value="channel.channel_id"
              />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              @click="handleBind"
              :loading="binding"
              :disabled="!bindForm.device_id || bindForm.channel_ids.length === 0"
            >
              绑定
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { alarmApi } from '@/api/alarmApi'
import { gb28181Api } from '@/api/gb28181Api'

interface Props {
  visible: boolean
  planId?: number
  planName?: string
}

interface BoundChannel {
  device_id: string
  channel_id: string
}

interface Device {
  device_id: string
  name: string
}

interface Channel {
  channel_id: string
  name: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
  'success': []
}>()

const binding = ref(false)
const boundChannels = ref<BoundChannel[]>([])
const devices = ref<Device[]>([])
const channels = ref<Channel[]>([])

const bindForm = reactive({
  device_id: '',
  channel_ids: [] as string[]
})

// 加载设备列表
const loadDevices = async () => {
  try {
    const { data } = await gb28181Api.getDeviceList({
      page: 1,
      limit: 1000
    })
    devices.value = data.list || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载设备列表失败')
  }
}

// 设备变化时加载通道
const handleDeviceChange = async () => {
  bindForm.channel_ids = []
  channels.value = []

  if (!bindForm.device_id) return

  try {
    const { data } = await gb28181Api.getChannelList(bindForm.device_id, {
      page: 1,
      limit: 1000
    })
    channels.value = data.list || []
  } catch (error: any) {
    ElMessage.error(error.message || '加载通道列表失败')
  }
}

// 绑定通道
const handleBind = async () => {
  if (!props.planId) return

  binding.value = true
  try {
    await alarmApi.bindChannels(props.planId, {
      device_id: bindForm.device_id,
      channel_ids: bindForm.channel_ids
    })
    ElMessage.success('绑定成功')

    // 清空表单
    bindForm.device_id = ''
    bindForm.channel_ids = []
    channels.value = []

    // 重新加载已绑定通道
    loadBoundChannels()

    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '绑定失败')
  } finally {
    binding.value = false
  }
}

// 解绑通道
const handleUnbind = async (row: BoundChannel) => {
  if (!props.planId) return

  try {
    await alarmApi.unbindChannel(props.planId, row.channel_id)
    ElMessage.success('解绑成功')
    loadBoundChannels()
    emit('success')
  } catch (error: any) {
    ElMessage.error(error.message || '解绑失败')
  }
}

// 加载已绑定的通道（需要后端提供接口）
const loadBoundChannels = async () => {
  // TODO: 调用后端接口获取已绑定的通道列表
  // 暂时使用模拟数据
  boundChannels.value = []
}

// 关闭对话框
const handleClose = () => {
  emit('update:visible', false)
}

// 监听对话框打开
watch(() => props.visible, (val) => {
  if (val) {
    loadDevices()
    loadBoundChannels()
  }
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.bind-dialog-content {
  .bound-section {
    margin-bottom: 24px;

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
    padding-top: 16px;
    border-top: 1px solid var(--border-base);

    .section-header {
      margin-bottom: 12px;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
        color: var(--text-main);
      }
    }

    .bind-form {
      :deep(.el-form-item) {
        margin-bottom: 0;
      }
    }
  }
}
</style>
