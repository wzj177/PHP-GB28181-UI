<template>
  <ElDialog
    :model-value="visible"
    title="编辑通道"
    width="600px"
    @update:model-value="handleClose"
    @close="handleClose"
  >
    <ElForm
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
    >
      <ElFormItem label="通道ID">
        <ElInput v-model="formData.channel_id" disabled />
      </ElFormItem>

      <ElFormItem label="通道名称">
        <ElInput v-model="channelName" disabled />
      </ElFormItem>

      <ElFormItem label="显示名称" prop="show_name">
        <ElInput v-model="formData.show_name" placeholder="请输入显示名称" />
      </ElFormItem>

      <ElFormItem label="级联通道号" prop="origin_code">
        <ElInput v-model="formData.origin_code" placeholder="请输入级联通道号" />
      </ElFormItem>

      <ElFormItem label="自填经纬度">
        <div class="coordinate-input-group">
          <ElInput
            v-model="formData.custom_lat"
            placeholder="请输入纬度"
            type="number"
            step="0.000001"
          >
          </ElInput>
        <ElInput
          v-model="formData.custom_lng"
          placeholder="请输入经度"
          type="number"
          step="0.000001"
        />
        <ElButton @click="openCoordinatePicker">拾取坐标</ElButton>
        </div>
      </ElFormItem>
    </ElForm>

    <!-- Coordinate Picker Dialog -->
    <CoordinatePicker v-model="coordinatePickerVisible" />

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">保存</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { gb28181Api } from '@/api/gb28181Api'
import CoordinatePicker from '@/components/CoordinatePicker/index.vue'

interface Props {
  modelValue: boolean
  channel?: {
    id: number
    device_id: string
    channel_id: string
    channel_name: string
    show_name?: string
    origin_code?: string
    custom_lat?: string
    custom_lng?: string
  } | null
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
const channelName = ref('')
const coordinatePickerVisible = ref(false)

const formData = ref<{
  id: number
  device_id: string
  channel_id: string
  show_name: string
  origin_code: string
  custom_lat: string
  custom_lng: string
}>({
  id: 0,
  device_id: '',
  channel_id: '',
  show_name: '',
  origin_code: '',
  custom_lat: '',
  custom_lng: ''
})

const formRules: FormRules = {}

// Reset form function - must be defined before watch
const resetForm = () => {
  formData.value = {
    id: 0,
    device_id: '',
    channel_id: '',
    show_name: '',
    origin_code: '',
    custom_lat: '',
    custom_lng: ''
  }
  channelName.value = ''
  formRef.value?.clearValidate()
}

// Watch for channel changes
watch(
  () => props.channel,
  (channel) => {
    if (channel) {
      formData.value = {
        id: channel.id,
        device_id: channel.device_id,
        channel_id: channel.channel_id,
        show_name: channel.show_name || '',
        origin_code: channel.origin_code || '',
        custom_lat: channel.custom_lat || '',
        custom_lng: channel.custom_lng || ''
      }
      channelName.value = channel.channel_name
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

// Open coordinate picker
const openCoordinatePicker = () => {
  coordinatePickerVisible.value = true
}

const handleClose = () => {
  emit('update:modelValue', false)
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitting.value = true
    try {
      // Use channel update API - assuming it follows similar pattern to device update
      const updateData: {
        show_name?: string
        origin_code?: string
        custom_lat?: string
        custom_lng?: string
      } = {
        show_name: formData.value.show_name || undefined,
        origin_code: formData.value.origin_code || undefined,
        custom_lat: formData.value.custom_lat || undefined,
        custom_lng: formData.value.custom_lng || undefined
      }

      // Update channel via API
      await gb28181Api.updateChannel(String(formData.value.id), updateData)

      ElMessage.success('更新成功')
      emit('success')
      handleClose()
    } catch (error: any) {
      console.error('Failed to update channel:', error)
      ElMessage.error(error.message || '更新失败')
    } finally {
      submitting.value = false
    }
  })
}
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.coordinate-input-group {
  display: flex;
  flex: 1;
  gap: 10px;
}
</style>
