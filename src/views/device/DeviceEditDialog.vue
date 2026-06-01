<template>
  <ElDialog :model-value="visible" title="编辑设备" width="800px" @update:model-value="handleClose" @close="handleClose">
    <ElForm ref="formRef" :model="formData" :rules="formRules" label-width="120px">
      <!-- 基本信息 -->
      <ElDivider content-position="left">基本信息</ElDivider>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="设备ID">
            <ElInput v-model="formData.device_id" disabled />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="设备名称">
            <ElInput v-model="deviceName" disabled />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="自定义名称" prop="show_name">
            <ElInput v-model="formData.show_name" placeholder="请输入自定义名称" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="流传输类型" prop="rtp_trans_mode">
            <ElSelect v-model="formData.rtp_trans_mode" placeholder="请选择流传输类型" style="width: 100%;">
              <ElOption label="UDP模式（局域网推荐）" :value="0" />
              <ElOption label="TCP被动模式（公网推荐）" :value="1" />
              <ElOption label="TCP主动模式（需端口映射）" :value="2" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="启用状态" prop="enabled">
            <ElSwitch
              v-model="formData.enabled"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="字符集" prop="charset">
            <ElSelect v-model="formData.charset" placeholder="请选择字符集" style="width: 100%;">
              <ElOption label="自动识别" value="auto" />
              <ElOption label="GB2312" value="gb2312" />
              <ElOption label="UTF-8" value="utf8" />
            </ElSelect>
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="扩展SDP" prop="senior_sdp">
            <ElSwitch
              v-model="formData.senior_sdp"
              :active-value="1"
              :inactive-value="0"
              active-text="扩展"
              inactive-text="不扩展"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <!-- 预留空间 -->
        </ElCol>
      </ElRow>

      <ElFormItem label="流索引" prop="stream_index">
        <ElSelect v-model="formData.stream_index" placeholder="请选择流索引" style="width: 100%;">
          <ElOption label="自动" value="auto" />
          <ElOption label="stream:0 - 主码流" value="stream:0" />
          <ElOption label="stream:1 - 子码流" value="stream:1" />
          <ElOption label="streamnumber:0 - 主码流(2022)" value="streamnumber:0" />
          <ElOption label="streamnumber:1 - 子码流" value="streamnumber:1" />
          <ElOption label="streamprofile:0 - 主码流" value="streamprofile:0" />
          <ElOption label="streamprofile:1 - 子码流" value="streamprofile:1" />
          <ElOption label="streamMode:MAIN - 主码流" value="streamMode:MAIN" />
          <ElOption label="streamMode:SUB - 子码流" value="streamMode:SUB" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="设备分类" prop="device_category">
        <ElSelect v-model="formData.device_category" placeholder="请选择设备分类" clearable style="width: 100%;">
          <ElOption
            v-for="item in deviceCategoryOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="通道类型过滤" prop="filter_channel_types">
        <ElCheckboxGroup v-model="formData.filter_channel_types">
          <ElCheckbox
            v-for="item in channelTypeOptions"
            :key="item.code"
            :label="item.code"
          >
            {{ item.code }} - {{ item.name }}
          </ElCheckbox>
        </ElCheckboxGroup>
      </ElFormItem>

      <!-- 位置信息 -->
      <ElDivider content-position="left">位置信息</ElDivider>

      <ElFormItem label="行政区域" prop="area">
        <ElCascader v-model="areaValue" :options="regionOptions" :props="cascaderProps" placeholder="请选择行政区域" clearable
          filterable style="width: 100%;" />
      </ElFormItem>

      <ElFormItem label="自填经纬度">
        <div class="coordinate-input-group">
          <ElInput v-model="formData.custom_lat" placeholder="请输入纬度" type="number" step="0.000001" style="flex: 1;" />
          <ElInput v-model="formData.custom_lng" placeholder="请输入经度" type="number" step="0.000001" style="flex: 1;" />
          <ElButton @click="openCoordinatePicker">拾取坐标</ElButton>
        </div>
      </ElFormItem>

      <!-- 订阅配置 -->
      <ElDivider content-position="left">订阅配置</ElDivider>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="订阅目录">
            <ElSwitch v-model="formData.subscribe_catalog" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="订阅报警">
            <ElSwitch v-model="formData.subscribe_alarm" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="订阅位置">
            <ElSwitch v-model="formData.subscribe_position" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElCol>
        <!-- <ElCol :span="12">
          <ElFormItem label="订阅云台">
            <ElSwitch v-model="formData.subscribe_ptz" :active-value="1" :inactive-value="0" />
          </ElFormItem>
        </ElCol> -->
      </ElRow>

      <ElRow :gutter="20">
        <ElCol :span="12">
          <ElFormItem label="订阅有效期(秒)" prop="subscribe_expires">
            <ElInputNumber v-model="formData.subscribe_expires" :min="0" :max="86400" style="width: 100%;" />
          </ElFormItem>
        </ElCol>
        <ElCol :span="12">
          <ElFormItem label="位置间隔(秒)" prop="position_interval">
            <ElInputNumber v-model="formData.position_interval" :min="1" :max="3600" style="width: 100%;" />
          </ElFormItem>
        </ElCol>
      </ElRow>

      <ElFormItem label="目录间隔(秒)" prop="catalog_interval">
        <ElInputNumber v-model="formData.catalog_interval" :min="1" :max="3600" style="width: 200px;" />
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
import { ref, watch, computed, onMounted } from 'vue'
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
    senior_sdp?: number
    province_id?: string
    city_id?: string
    county_id?: string
    custom_lat?: string
    custom_lng?: string
    subscribe_catalog?: number
    subscribe_alarm?: number
    subscribe_position?: number
    subscribe_ptz?: number
    subscribe_expires?: number
    position_interval?: number
    catalog_interval?: number
    charset?: string
    stream_index?: string
    filter_channel_types?: number[]
    device_category?: number | string
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

const formData = ref<DeviceEditData & {
  custom_lat?: string
  custom_lng?: string
  id?: number
  enabled?: number
  senior_sdp?: number
  subscribe_catalog?: number
  subscribe_alarm?: number
  subscribe_position?: number
  subscribe_ptz?: number
  subscribe_expires?: number
  position_interval?: number
  catalog_interval?: number
  charset?: string
  stream_index?: string
  filter_channel_types?: number[]
  device_category?: number | string
}>({
  id: undefined,
  device_id: '',
  show_name: '',
  rtp_trans_mode: undefined,
  enabled: 1,
  senior_sdp: 0,
  custom_lat: '',
  custom_lng: '',
  subscribe_catalog: 0,
  subscribe_alarm: 0,
  subscribe_position: 0,
  subscribe_ptz: 0,
  subscribe_expires: 3600,
  position_interval: 5,
  catalog_interval: 60,
  charset: 'auto',
  stream_index: '',
  filter_channel_types: [],
  device_category: undefined
})

// 区域选择器的值（用于Cascader）
const areaValue = ref<string[]>([])

// 设备类型选项列表
const channelTypeOptions = ref<Array<{ code: number; name: string }>>([])

// 设备分类选项列表
const deviceCategoryOptions = ref<Array<{ value: number | string; label: string }>>([])

// 获取设备分类选项
const fetchDeviceCategoryOptions = async () => {
  try {
    const data = await gb28181Api.getDeviceCategoryOptions()
    deviceCategoryOptions.value = data?.options || []
  } catch (error) {
    console.error('Failed to fetch device category options:', error)
  }
}

// 获取设备类型统计数据
const fetchChannelFilterTypes = async () => {
  try {
    const data = await gb28181Api.getChannelFilterTypes()
    channelTypeOptions.value = data || []
  } catch (error) {
    console.error('Failed to fetch device stats:', error)
  }
}

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
    senior_sdp: 0,
    custom_lat: '',
    custom_lng: '',
    subscribe_catalog: 0,
    subscribe_alarm: 0,
    subscribe_position: 0,
    subscribe_ptz: 0,
    subscribe_expires: 3600,
    position_interval: 5,
    catalog_interval: 60,
    charset: 'auto',
    stream_index: '',
    filter_channel_types: [],
    device_category: undefined
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
        senior_sdp: device.senior_sdp ?? 0,
        custom_lat: device.custom_lat || '',
        custom_lng: device.custom_lng || '',
        subscribe_catalog: device.subscribe_catalog ?? 0,
        subscribe_alarm: device.subscribe_alarm ?? 0,
        subscribe_position: device.subscribe_position ?? 0,
        subscribe_ptz: device.subscribe_ptz ?? 0,
        subscribe_expires: device.subscribe_expires ?? 3600,
        position_interval: device.position_interval ?? 5,
        catalog_interval: device.catalog_interval ?? 60,
        charset: device.charset || 'auto',
        stream_index: device.stream_index || '',
        filter_channel_types: device.filter_channel_types || [],
        device_category: device.device_category ?? undefined
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

// 组件挂载时获取设备类型数据
onMounted(() => {
  fetchChannelFilterTypes()
  fetchDeviceCategoryOptions()
})

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
        senior_sdp?: number
        province_id?: string
        city_id?: string
        county_id?: string
        custom_lat?: string
        custom_lng?: string
        subscribe_catalog?: number
        subscribe_alarm?: number
        subscribe_position?: number
        subscribe_ptz?: number
        subscribe_expires?: number
        position_interval?: number
        catalog_interval?: number
        charset?: string
        stream_index?: string
        filter_channel_types?: number[]
        device_category?: number | string
      } = {
        show_name: formData.value.show_name || undefined,
        rtp_trans_mode: formData.value.rtp_trans_mode,
        enabled: formData.value.enabled,
        senior_sdp: formData.value.senior_sdp,
        custom_lat: formData.value.custom_lat || undefined,
        custom_lng: formData.value.custom_lng || undefined,
        subscribe_catalog: formData.value.subscribe_catalog,
        subscribe_alarm: formData.value.subscribe_alarm,
        subscribe_position: formData.value.subscribe_position,
        subscribe_ptz: formData.value.subscribe_ptz,
        subscribe_expires: formData.value.subscribe_expires,
        position_interval: formData.value.position_interval,
        catalog_interval: formData.value.catalog_interval,
        charset: formData.value.charset,
        stream_index: formData.value.stream_index || undefined,
        filter_channel_types: formData.value.filter_channel_types?.length
          ? formData.value.filter_channel_types
          : undefined,
        device_category: formData.value.device_category ?? undefined
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
