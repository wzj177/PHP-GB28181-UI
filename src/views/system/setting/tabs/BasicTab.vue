<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="平台名称：" prop="site_name">
      <el-input v-model="formData.site_name" maxlength="64" />
    </el-form-item>
    <el-form-item label="平台地址：" prop="site_url">
      <el-input v-model="formData.site_url" />
      <div class="el-upload__tip">以"http://"或"https://"开头</div>
    </el-form-item>
    <el-form-item label="平台logo：" prop="site_logo">
      <el-attachment
        ref="attachmentRef"
        tip="请上传jpg、jpeg、png格式的图片。logo 建议尺寸32×32px。图片大小建议不超过2MB"
        @success="onSelectorOk"
        @remove="onSelectorRemove"
      >
        <template #previewIcon>
          <ElIcon :size="28" color="#8c939d"><Plus /></ElIcon>
        </template>
      </el-attachment>
    </el-form-item>
    <el-form-item label="icp备案号：" prop="icp">
      <el-input v-model="formData.icp" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElIcon, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { systemApi, type BasicSetting } from '@/api/systemApi'
import { useSystemInfoStore } from '@/stores/systemInfo'
import ElAttachment from '@/components/ElAttachment/index.vue'
import type { AttachmentFile } from '@/api/attachmentApi'

const formRef = ref<FormInstance>()
const attachmentRef = ref<InstanceType<typeof ElAttachment>>()
const loading = ref(false)
const systemInfoStore = useSystemInfoStore()

const defaultForm: BasicSetting = {
  site_name: '',
  site_url: '',
  site_logo: '',
  icp: '',
  favicon: ''
}

const formData = reactive<BasicSetting>({ ...defaultForm })

const rules: FormRules = {
  site_url: [
    { type: 'url', message: '平台url参数格式错误', trigger: 'blur' }
  ]
}

const initDataSource = async () => {
  loading.value = true
  try {
    const result = await systemApi.getSetting('basic')
    if (result) {
      Object.assign(formData, result)
      // Initialize attachment component with existing logo
      if (result.site_logo) {
        const file: AttachmentFile = {
          id: 0,
          filename: result.site_logo.split('/').pop() || '',
          original_name: result.site_logo.split('/').pop() || '',
          ext: result.site_logo.split('.').pop() || '',
          type: 'image',
          type_text: '图片',
          mime_type: '',
          size: 0,
          file_size_text: '',
          url: result.site_logo,
          cover: result.site_logo,
          cover_full: result.site_logo,
          storage: 'local',
          storage_text: '本地',
          create_client: 'web',
          create_client_text: 'Web',
          created_time: new Date().toISOString()
        }
        attachmentRef.value?.init([file])
      }
    }
  } catch (error) {
    console.error('Failed to load basic setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        await systemApi.setBasic(formData)
        // Update system info store
        systemInfoStore.updateSystemInfo({
          platformName: formData.site_name || 'PHP-GB28181',
          platformLogo: formData.site_logo || '',
          platformShortName: (formData.site_name || 'G').substring(0, 1).toUpperCase()
        })
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save basic setting:', error)
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}

// 附件选择成功回调
const onSelectorOk = (files: AttachmentFile[]) => {
  if (files.length > 0) {
    formData.site_logo = files[0].url
  }
}

// 附件删除回调
const onSelectorRemove = (file: AttachmentFile) => {
  if (file.url === formData.site_logo) {
    formData.site_logo = ''
  }
}

defineExpose({
  initDataSource
})
</script>

<style lang="scss" scoped>
.setting-form {
  max-width: 600px;
}
</style>
