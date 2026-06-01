<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="是否启用：" prop="cdn_enabled">
      <el-radio v-model="formData.cdn_enabled" :label="1">开启</el-radio>
      <el-radio v-model="formData.cdn_enabled" :label="0">关闭</el-radio>
    </el-form-item>
    <el-form-item label="URL：" prop="cdn_url">
      <el-input v-model="formData.cdn_url" />
      <div class="el-upload__tip">
        默认读取远程存储的访问地址，格式：以"http://"或"https://"开头
      </div>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance, FormRules } from 'element-plus'
import { systemApi } from '@/api/systemApi'

const formRef = ref<FormInstance>()
const loading = ref(false)

interface CDNSetting {
  cdn_enabled: number
  cdn_url: string
}

const defaultForm: CDNSetting = {
  cdn_enabled: 0,
  cdn_url: ''
}

const formData = reactive<CDNSetting>({ ...defaultForm })

const rules: FormRules = {
  cdn_url: [{ type: 'url', message: 'url参数格式错误', trigger: 'blur' }]
}

const initDataSource = async () => {
  loading.value = true
  try {
    const result = await systemApi.getSetting('cdn')
    if (result) {
      Object.assign(formData, result)
    }
    // 如果没有设置 CDN URL，尝试从存储配置中获取
    if (!formData.cdn_url) {
      const storage = await systemApi.getSetting('storage')
      if (storage && ['qiniu', 'ali', 'tencent'].includes(storage.type)) {
        formData.cdn_url = storage[`${storage.type}_url`] || ''
      }
    }
  } catch (error) {
    console.error('Failed to load CDN setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        await systemApi.setCDN(formData)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save CDN setting:', error)
      }
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
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
