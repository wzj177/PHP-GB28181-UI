<template>
  <ElDialog
    :model-value="visible"
    :title="isEdit ? '编辑流媒体服务器' : '添加流媒体服务器'"
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
      <ElFormItem label="服务器名称" prop="name">
        <ElInput v-model="formData.name" placeholder="请输入服务器名称" />
      </ElFormItem>

      <ElFormItem label="流媒体类型" prop="type">
        <ElSelect v-model="formData.type" placeholder="请选择流媒体类型" style="width: 100%;">
          <ElOption label="ZLMediaKit" value="zlm" />
          <ElOption label="SRS" value="srs" />
          <ElOption label="其他" value="other" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="网络环境" prop="network_env">
        <ElSelect v-model="formData.network_env" placeholder="请选择网络环境" style="width: 100%;">
          <ElOption label="内网" value="internal" />
          <ElOption label="公网" value="public" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="服务器地址" prop="host">
        <ElInput v-model="formData.host" placeholder="请输入IP地址或域名" />
      </ElFormItem>

      <ElFormItem label="收流IP">
        <ElInput v-model="formData.stream_ip" placeholder="可选，用于SDP，为空则使用服务器地址">
          <template #append>
            <ElTooltip content="收流IP用于SDP协商，为空则使用服务器地址">
              <ElIcon><QuestionFilled /></ElIcon>
            </ElTooltip>
          </template>
        </ElInput>
        <div class="form-tip">可选，用于SDP协商，为空则使用服务器地址</div>
      </ElFormItem>

      <ElFormItem label="HTTP端口" prop="port">
        <ElInputNumber v-model="formData.port" :min="1" :max="65535" style="width: 100%;" />
      </ElFormItem>

      <ElFormItem label="API密钥" prop="secret">
        <ElInput v-model="formData.secret" type="password" show-password placeholder="请输入API密钥" :disabled="isEdit"/>
      </ElFormItem>

      <ElFormItem label="访问域名">
        <ElInput v-model="formData.access_domain" placeholder="可选，如：https://media.example.com">
          <template #append>
            <ElTooltip content="当流媒体通过nginx反向代理时，填写此域名，播放地址将使用此域名">
              <ElIcon><QuestionFilled /></ElIcon>
            </ElTooltip>
          </template>
        </ElInput>
        <div class="form-tip">可选，用于nginx反向代理场景，播放地址将使用此域名</div>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <span class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">确定</ElButton>
      </span>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import { mediaServerApi } from '@/api/mediaServerApi'
import type { MediaServer, MediaServerFormData } from '@/types/media-server'

interface Props {
  modelValue: boolean
  server?: MediaServer | null
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

const isEdit = computed(() => !!props.server)

const formRef = ref<FormInstance>()
const submitting = ref(false)

const formData = ref<MediaServerFormData>({
  name: '',
  type: 'zlm',
  host: '',
  port: 8086,
  secret: '',
  access_domain: '',
  network_env: 'internal',
  stream_ip: ''
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入服务器名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择流媒体类型', trigger: 'change' }],
  network_env: [{ required: true, message: '请选择网络环境', trigger: 'change' }],
  host: [{ required: true, message: '请输入服务器地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入HTTP端口', trigger: 'blur' }],
  secret: [{ required: false, message: '请输入API密钥', trigger: 'blur' }]
}

// Reset form function - must be defined before watch
const resetForm = () => {
  formData.value = {
    name: '',
    type: 'zlm',
    host: '',
    port: 8086,
    secret: '',
    access_domain: '',
    network_env: 'internal',
    stream_ip: ''
  }
  formRef.value?.clearValidate()
}

// Watch for server changes (edit mode)
watch(
  () => props.server,
  (server) => {
    if (server) {
      formData.value = {
        name: server.name,
        type: server.type,
        host: server.host,
        port: server.port,
        secret: server.secret,
        access_domain: server.access_domain || '',
        network_env: server.network_env || 'internal',
        stream_ip: server.stream_ip || ''
      }
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

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
      if (props.server) {
        // Update
        await mediaServerApi.update(props.server.id, formData.value)
      } else {
        // Create
        await mediaServerApi.create(formData.value)
      }

      ElMessage.success(props.server ? '更新成功' : '添加成功')
      emit('success')
      handleClose()
    } catch (error: any) {
      console.error('Failed to submit form:', error)
      ElMessage.error(error.message || '操作失败')
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

.form-tip {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
