<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="游客访问：" prop="enable_guest_view">
      <el-radio v-model="formData.enable_guest_view" :label="1">开启</el-radio>
      <el-radio v-model="formData.enable_guest_view" :label="0">关闭</el-radio>
    </el-form-item>
    <el-form-item label="DIY作品：" prop="enable_vip_diy">
      <el-radio v-model="formData.enable_vip_diy" :label="1">开启</el-radio>
      <el-radio v-model="formData.enable_vip_diy" :label="0">关闭</el-radio>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { systemApi, type VIPSetting } from '@/api/systemApi'

const formRef = ref<FormInstance>()
const loading = ref(false)

const defaultForm: VIPSetting = {
  enable_guest_view: 0,
  enable_vip_diy: 1
}

const formData = reactive<VIPSetting>({ ...defaultForm })

const rules = {}

const initDataSource = async () => {
  loading.value = true
  try {
    const result = await systemApi.getSetting('vip')
    if (result) {
      Object.assign(formData, result)
    }
  } catch (error) {
    console.error('Failed to load VIP setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        await systemApi.setVIP(formData)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save VIP setting:', error)
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
