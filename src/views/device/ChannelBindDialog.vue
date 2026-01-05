<template>
  <ElDialog
    :model-value="visible"
    title="批量绑定流媒体"
    width="700px"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem label="已选通道">
        <div class="selected-channels">
          <ElTag
            v-for="channel in selectedChannels"
            :key="channel.channel_id"
            closable
            @close="removeChannel(channel)"
            style="margin: 4px;"
          >
            {{ channel.channel_name || channel.channel_id }}
          </ElTag>
          <div v-if="selectedChannels.length === 0" class="empty-text">未选择任何通道</div>
        </div>
      </ElFormItem>

      <ElFormItem label="流媒体服务器" prop="media_server_id">
        <ElSelect
          v-model="formData.media_server_id"
          placeholder="请选择流媒体服务器"
          style="width: 100%;"
          filterable
        >
          <ElOption
            v-for="server in mediaServers"
            :key="server.id"
            :label="`${server.name} (${server.type})`"
            :value="server.id"
          >
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>{{ server.name }}</span>
              <ElTag size="small" :type="server.status === 'running' ? 'success' : 'danger'" style="margin-left: 10px;">
                {{ server.status === 'running' ? '运行中' : '未运行' }}
              </ElTag>
            </div>
          </ElOption>
        </ElSelect>
      </ElFormItem>

      <ElAlert
        title="注意"
        type="warning"
        :closable="false"
        style="margin-top: 16px;"
      >
        绑定后，通道将使用所选流媒体服务器进行推流和播放。请确保服务器处于运行状态。
      </ElAlert>
    </ElForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">确定绑定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { gb28181Api } from '@/api/gb28181Api'
import { mediaServerApi } from '@/api/mediaServerApi'

interface ChannelInfo {
  channel_id: string
  channel_name?: string
  device_id?: string
}

interface MediaServerOption {
  id: number
  name: string
  server_id: string
  type: string
  status: string
}

interface Props {
  modelValue: boolean
  channels: ChannelInfo[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance>()
const submitting = ref(false)
const mediaServers = ref<MediaServerOption[]>([])
const selectedChannels = ref<ChannelInfo[]>([])

const formData = ref({
  media_server_id: undefined as number | undefined
})

const formRules: FormRules = {
  media_server_id: [{ required: true, message: '请选择流媒体服务器', trigger: 'change' }]
}

// Load available media servers
const loadMediaServers = async () => {
  try {
    const response = await mediaServerApi.getAvailableServers()
    if (response?.code === 0) {
      mediaServers.value = response.data || []
    }
  } catch (error: any) {
    console.error('Failed to load media servers:', error)
  }
}

// Watch for channels changes
watch(
  () => props.channels,
  (channels) => {
    selectedChannels.value = [...channels]
  },
  { immediate: true }
)

// Remove channel from selection
const removeChannel = (channel: ChannelInfo) => {
  const index = selectedChannels.value.findIndex(c => c.channel_id === channel.channel_id)
  if (index > -1) {
    selectedChannels.value.splice(index, 1)
  }
}

const resetForm = () => {
  formData.value.media_server_id = undefined
  selectedChannels.value = []
  formRef.value?.clearValidate()
}

const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  if (selectedChannels.value.length === 0) {
    ElMessage.warning('请至少选择一个通道')
    return
  }

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      // 获取服务器详情以获取server_id
      const server = mediaServers.value.find(s => s.id === formData.value.media_server_id)
      if (!server) {
        throw new Error('未找到选中的流媒体服务器')
      }

      const channelIds = selectedChannels.value.map(c => c.channel_id)
      const deviceId = selectedChannels.value[0]?.device_id

      const response = await gb28181Api.batchBindChannelsToMedia({
        device_id: deviceId,
        channel_ids: channelIds,
        media_server_id: server.server_id
      })

      if (response?.code === 0) {
        ElMessage.success(`成功绑定 ${channelIds.length} 个通道`)
        emit('success')
        handleClose()
      } else {
        throw new Error(response?.message || '绑定失败')
      }
    } catch (error: any) {
      console.error('Failed to bind channels:', error)
      ElMessage.error(error.message || '绑定失败')
    } finally {
      submitting.value = false
    }
  })
}

onMounted(() => {
  loadMediaServers()
})
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.selected-channels {
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid var(--border-base);
  border-radius: 4px;

  .empty-text {
    color: var(--text-muted);
    text-align: center;
    padding: 8px;
  }
}
</style>
