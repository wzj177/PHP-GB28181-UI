<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="邮件发送：" prop="enabled">
      <el-radio v-model="formData.enabled" :label="1">开启</el-radio>
      <el-radio v-model="formData.enabled" :label="0">关闭</el-radio>
    </el-form-item>
    <el-form-item label="SMTP 服务器地址：" prop="host">
      <el-input v-model="formData.host" />
      <div class="el-upload__tip">
        每种邮箱的地址都不相同，请根据使用的邮箱类型，查找邮箱服务器地址，如：smtp.yourmail.com
      </div>
    </el-form-item>
    <el-form-item label="SMTP 服务器端口：" prop="port">
      <el-input v-model.number="formData.port" type="number" />
      <div class="el-upload__tip">通常端口号为25</div>
    </el-form-item>
    <el-form-item label="SMTP 身份验证用户名：" prop="username">
      <el-input v-model="formData.username" />
      <div class="el-upload__tip">正确格式应为abc@mail.com</div>
    </el-form-item>
    <el-form-item label="SMTP 身份验证密码：" prop="password">
      <el-input
        v-model="formData.password"
        type="password"
        show-password
      />
      <div class="el-upload__tip">smtp密码：即邮箱密码/客户端授权密码</div>
    </el-form-item>
    <el-form-item label="发信人邮件地址：" prop="from">
      <el-input v-model="formData.from" />
      <div class="el-upload__tip">正确格式应为abc@mail.com</div>
    </el-form-item>
    <el-form-item label="发信人称呼：" prop="name">
      <el-input v-model="formData.name" />
      <div class="el-upload__tip">用于展示发信人称呼</div>
    </el-form-item>
    <el-form-item label="测试邮箱地址：" prop="testMail">
      <el-input v-model="testMail" />
      <div class="el-upload__tip">用于测试邮件发送</div>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button type="success" @click="checkMail" :loading="checkLoading">
        验证
      </el-button>
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
const checkLoading = ref(false)
const testMail = ref('')

interface MailSetting {
  enabled: number
  host: string
  port: number
  username: string
  password: string
  from: string
  name: string
}

const defaultForm: MailSetting = {
  enabled: 1,
  host: '',
  port: 25,
  username: '',
  password: '',
  from: '',
  name: ''
}

const formData = reactive<MailSetting>({ ...defaultForm })

const validateEmail = (rule: any, value: string, callback: any) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!value) {
    callback()
  } else if (!emailRegex.test(value)) {
    callback(new Error('邮箱格式错误'))
  } else {
    callback()
  }
}

const rules: FormRules = {
  username: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  from: [
    { validator: validateEmail, trigger: 'blur' }
  ],
  host: [
    { required: true, message: '服务器地址必填', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '身份验证密码必填', trigger: 'blur' }
  ]
}

const initDataSource = async () => {
  loading.value = true
  try {
    const result = await systemApi.getSetting('mail')
    if (result) {
      Object.assign(formData, result)
    }
  } catch (error) {
    console.error('Failed to load mail setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        await systemApi.setMail(formData)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save mail setting:', error)
      }
    }
  })
}

const checkMail = async () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(testMail.value)) {
    ElMessage.error('测试邮箱地址格式错误')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  checkLoading.value = true
  try {
    await systemApi.checkMail(testMail.value)
    ElMessage.success('发送成功')
  } catch (error: any) {
    ElMessage.error(error.message || '发送失败')
  } finally {
    checkLoading.value = false
  }
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
