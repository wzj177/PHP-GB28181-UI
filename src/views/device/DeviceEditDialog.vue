<template>
  <ElDialog :model-value="visible" title="编辑设备" width="600px" @update:model-value="handleClose" @close="handleClose">
    <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="140px">
      <ElFormItem label="设备ID">
        <ElInput v-model="formData.device_id" disabled />
      </ElFormItem>

      <ElFormItem label="设备名称">
        <ElInput v-model="deviceName" disabled />
      </ElFormItem>

      <ElFormItem label="自定义名称" prop="show_name">
        <ElInput v-model="formData.show_name" placeholder="请输入自定义名称" />
      </ElFormItem>

      <ElFormItem label="流传输类型" prop="rtp_trans_mode">
        <ElSelect v-model="formData.rtp_trans_mode" placeholder="请选择流传输类型" style="width: 100%;">
          <ElOption label="UDP模式（局域网推荐）" :value="0" />
          <ElOption label="TCP被动模式（公网推荐）" :value="1" />
          <ElOption label="TCP主动模式（需端口映射）" :value="2" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="启用状态" prop="enabled">
        <ElSwitch
          v-model="formData.enabled"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </ElFormItem>

      <ElFormItem label="行政区域" prop="area">
        <ElCascader v-model="areaValue" :options="regionOptions" :props="cascaderProps" placeholder="请选择行政区域" clearable
          filterable style="width: 100%;" />
      </ElFormItem>

      <ElFormItem label="自填经纬度">
        <div class="coordinate-input-group">
          <ElInput v-model="formData.custom_lat" placeholder="请输入纬度" type="number" step="0.000001">
          </ElInput>
          <ElInput v-model="formData.custom_lng" placeholder="请输入经度" type="number" step="0.000001" />
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
import type { DeviceEditData, RtpTransMode } from '@/types/media-server'
// 使用 element-china-area-data 获取行政区域数据
import { regionData } from 'element-china-area-data'
import CoordinatePicker from '@/components/CoordinatePicker/index.vue'

// 行政区域数据转换为Element Plus Cascader格式
const convertRegionData = (data: any[]): any[] => {
  return data.map((province: any) => ({
    value: province.value,
    label: province.label,
    children: province.children ? convertRegionData(province.children) : undefined
  }))
}

interface Props {
  modelValue: boolean
  device?: {
    id: number
    device_id: string
    device_name: string
    show_name?: string
    rtp_trans_mode?: number
    enabled?: number
    province_id?: string
    city_id?: string
    county_id?: string
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
const deviceName = ref('')
const coordinatePickerVisible = ref(false)

// 行政区域选项
const regionOptions = ref<any[]>(convertRegionData(regionData))

const cascaderProps = {
  value: 'value',
  label: 'label',
  children: 'children'
}

const formData = ref<DeviceEditData & { custom_lat?: string; custom_lng?: string; id?: number; enabled?: number }>({
  id: undefined,
  device_id: '',
  show_name: '',
  rtp_trans_mode: undefined,
  enabled: 1,
  custom_lat: '',
  custom_lng: ''
})

// 区域选择器的值（用于Cascader）
const areaValue = ref<string[]>([])

const formRules: FormRules = {
  rtp_trans_mode: [{ required: true, message: '请选择流传输类型', trigger: 'change' }]
}

// Reset form function - must be defined before watch
const resetForm = () => {
  formData.value = {
    id: undefined,
    device_id: '',
    show_name: '',
    rtp_trans_mode: 0,
    enabled: 1,
    custom_lat: '',
    custom_lng: ''
  }
  areaValue.value = []
  deviceName.value = ''
  formRef.value?.clearValidate()
}

// Watch for device changes
watch(
  () => props.device,
  (device) => {
    if (device) {
      formData.value = {
        id: device.id,
        device_id: device.device_id,
        show_name: device.show_name || '',
        rtp_trans_mode: device.rtp_trans_mode ?? 0,
        enabled: device.enabled ?? 1,
        custom_lat: device.custom_lat || '',
        custom_lng: device.custom_lng || ''
      }
      deviceName.value = device.device_name

      // 设置行政区域值
      if (device.province_id || device.city_id || device.county_id) {
        areaValue.value = [
          device.province_id || '',
          device.city_id || '',
          device.county_id || ''
        ].filter(Boolean)
      } else {
        areaValue.value = []
      }
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
      // 从Cascader的值中提取省市区代码
      const updateData: {
        show_name?: string
        rtp_trans_mode?: number
        enabled?: number
        province_id?: string
        city_id?: string
        county_id?: string
        custom_lat?: string
        custom_lng?: string
      } = {
        show_name: formData.value.show_name || undefined,
        rtp_trans_mode: formData.value.rtp_trans_mode,
        enabled: formData.value.enabled,
        custom_lat: formData.value.custom_lat || undefined,
        custom_lng: formData.value.custom_lng || undefined
      }

      if (areaValue.value.length > 0) {
        updateData.province_id = areaValue.value[0]
        if (areaValue.value.length > 1) {
          updateData.city_id = areaValue.value[1]
        }
        if (areaValue.value.length > 2) {
          updateData.county_id = areaValue.value[2]
        }
      }

      await gb28181Api.updateDevice(String(formData.value.id), updateData)

      ElMessage.success('更新成功')
      emit('success')
      handleClose()
    } catch (error: any) {
      console.error('Failed to update device:', error)
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
