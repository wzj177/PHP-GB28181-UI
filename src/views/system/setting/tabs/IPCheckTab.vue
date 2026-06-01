<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="IP黑名单：" prop="blackListIps">
      <el-input
        v-model="formData.blackListIps"
        style="width: 80%"
        type="textarea"
        :rows="6"
        placeholder="一行一个IP"
      />
      <div class="el-upload__tip">
        一行一个IP，被加入黑名单的IP将被禁止访问！可使用通配符，例如：202.101.20.*
      </div>
    </el-form-item>
    <el-form-item label="IP白名单：" prop="whiteListIps">
      <el-input
        v-model="formData.whiteListIps"
        style="width: 80%"
        type="textarea"
        :rows="6"
        placeholder="一行一个IP"
      />
      <div class="el-upload__tip">
        一行一个IP，只有白名单中的IP地址允许访问系统！可使用通配符，例如：202.101.20.*<br />
        <span style="color: #fca41d">
          <el-icon><WarningFilled /></el-icon>
          警告：如果设置了白名单，必须将本机IP包含在内，否则将导致管理员无法访问系统！
        </span>
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
import { ElMessage, FormInstance } from 'element-plus'
// @ts-ignore
import { WarningFilled } from '@element-plus/icons-vue'
import { systemApi, type IPCheckSetting } from '@/api/systemApi'

const formRef = ref<FormInstance>()
const loading = ref(false)

const defaultForm: IPCheckSetting = {
  blackListIps: '',
  whiteListIps: ''
}

const formData = reactive<IPCheckSetting>({ ...defaultForm })

const rules = {}

// IPv4 validation regex
const ipv4WithWildcardRegex = /^(\*|\d{1,3}(\.\d{1,3}){0,3}(\.\*)?)(\s*\*)?$/

const validateIP = (ip: string): boolean => {
  if (!ip) return true
  // Check if it's a valid IPv4 or IPv4 with wildcard
  if (ip.includes('*')) {
    // Wildcard format: 192.168.1.* or 192.168.* etc.
    const parts = ip.split('.')
    if (parts.length !== 4) return false
    for (const part of parts) {
      if (part === '*') continue
      if (!part) return false
      const num = parseInt(part, 10)
      if (isNaN(num) || num < 0 || num > 255) return false
    }
    return true
  }
  // Standard IPv4 format
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  for (const part of parts) {
    const num = parseInt(part, 10)
    if (isNaN(num) || num < 0 || num > 255) return false
  }
  return true
}

const initDataSource = async () => {
  loading.value = true
  try {
    const result = await systemApi.getSetting('ip')
    if (result) {
      Object.assign(formData, result)
    }
  } catch (error) {
    console.error('Failed to load IP check setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      // Validate IPs line by line
      const blackListIps = formData.blackListIps.split('\n').filter(ip => ip.trim())
      const whiteListIps = formData.whiteListIps.split('\n').filter(ip => ip.trim())

      for (const ip of [...blackListIps, ...whiteListIps]) {
        if (!validateIP(ip.trim())) {
          ElMessage.error(`IP格式错误: ${ip}`)
          return
        }
      }

      try {
        await systemApi.setIpCheckList(formData)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save IP check setting:', error)
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
  max-width: 800px;
}

.el-upload__tip {
  :deep(span) {
    display: flex;
    align-items: center;
    gap: 4px;
  }
}
</style>
