<template>
  <el-form
    ref="formRef"
    v-loading="loading"
    :model="formData"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="密码等级设置：" prop="user_password_level">
      <el-radio-group v-model="formData.user_password_level" size="small">
        <el-radio
          v-for="item in passwordLevelOptions"
          :key="item.value"
          :label="item.value"
          border
        >
          {{ item.name }}
        </el-radio>
      </el-radio-group>
      <div class="el-upload__tip" v-html="passwordLevelTip" />
    </el-form-item>
    <el-form-item label="用户登录限制：" prop="login_connect_login_limit">
      <el-switch
        v-model="formData.login_connect_login_limit"
        :active-value="1"
        :inactive-value="0"
      />
      <div class="el-upload__tip">
        开启后同一帐号只能在一处（同一IP）进行登录
      </div>
    </el-form-item>
    <el-form-item label="设备终端登录限制：" prop="login_connect_client_login_limit">
      <el-switch
        v-model="formData.login_connect_client_login_limit"
        :active-value="1"
        :inactive-value="0"
      />
      <div class="el-upload__tip">
        开启后，同一帐号同时只能在APP或WEB一个设备终端上进行登录
      </div>
    </el-form-item>
    <el-form-item label="第三方登录：" prop="oauth_login_enabled">
      <el-switch
        v-model="formData.oauth_login_enabled"
        :active-value="1"
        :inactive-value="0"
      />
    </el-form-item>
    <el-form-item label="用户登录保护：" prop="temporary_lock_enabled">
      <el-switch
        v-model="formData.temporary_lock_enabled"
        :active-value="1"
        :inactive-value="0"
      />
      <div class="el-upload__tip">
        开启后，登录时用户连续多次输入错误密码时暂时封禁用户
      </div>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { systemApi } from '@/api/systemApi'

const formRef = ref<FormInstance>()
const loading = ref(false)

interface AuthSetting {
  user_password_level: string
  login_connect_login_limit: number
  login_connect_client_login_limit: number
  oauth_login_enabled: number
  temporary_lock_enabled: number
}

const passwordLevelOptions = [
  { value: 'lower', name: '低' },
  { value: 'middle', name: '中' },
  { value: 'high', name: '高' }
]

const defaultForm: AuthSetting = {
  user_password_level: 'lower',
  login_connect_login_limit: 0,
  login_connect_client_login_limit: 0,
  oauth_login_enabled: 0,
  temporary_lock_enabled: 0
}

const formData = reactive<AuthSetting>({ ...defaultForm })

const rules = {}

const passwordLevelTip = computed(() => {
  const tips: Record<string, string> = {
    lower: '密码为5-20位英文、数字、符号，最少需输入5个字符。',
    middle: '<p>密码为8-20位英文、数字、符号，最少需输入8个字符。</p><p>至少包含字母、数字、符号中任意两种。</p>',
    high: '<p>密码为8-32位英文、数字、符号，最少需输入8个字符。</p><p>同时包含英文大写、英文小写、数字、符号四种。</p>'
  }
  return tips[formData.user_password_level]
})

const initDataSource = async () => {
  loading.value = true
  try {
    const result = await systemApi.getSetting('auth')
    if (result) {
      Object.assign(formData, result)
    }
  } catch (error) {
    console.error('Failed to load auth setting:', error)
  } finally {
    loading.value = false
  }
}

const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async valid => {
    if (valid) {
      try {
        await systemApi.setAuth(formData)
        ElMessage.success('保存成功')
      } catch (error) {
        console.error('Failed to save auth setting:', error)
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
</style>
