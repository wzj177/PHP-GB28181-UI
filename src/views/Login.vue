<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElInput, ElCard, ElMessage, ElForm, ElFormItem } from 'element-plus'
import { Lock, User } from '@element-plus/icons-vue'
import { authApi, type LoginConfig } from '@/api/authApi'
import { authUtils } from '@/utils/authUtils'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 登录配置
const loginConfig = ref<LoginConfig>({
  user_password_level: 'low',
  login_connect_login_limit: 0,
  login_connect_client_login_limit: 0,
  login_mode: 'nickname',
  login_captcha: 1,
  oauth_login_enabled: 0,
  temporary_lock_enabled: 0
})

// 是否显示验证码
const showCaptcha = computed(() => loginConfig.value.login_captcha === 1)

// 根据密码等级动态设置验证规则（匹配后端验证）
const passwordRules = computed(() => {
  const level = loginConfig.value.user_password_level

  if (level === 'low') {
    // 低等级：5-20个非空白字符
    return [
      { required: true, message: '请输入密码', trigger: 'blur' },
      {
        pattern: /^[\S]{5,20}$/,
        message: '密码长度为5-20个非空白字符',
        trigger: 'blur'
      }
    ]
  } else if (level === 'middle') {
    // 中等级：8-20个非空白字符，不能全是数字、全是字母、或全是特殊字符
    return [
      { required: true, message: '请输入密码', trigger: 'blur' },
      {
        pattern: /^(?!^(\d+|[a-zA-Z]+|[^\s\da-zA-Z]+)$)[\S]{8,20}$/,
        message: '密码长度为8-20个非空白字符，必须包含数字、字母或特殊字符中的至少两种',
        trigger: 'blur'
      }
    ]
  } else if (level === 'high') {
    // 高等级：8-32个非空白字符，必须包含数字、小写字母、大写字母、特殊字符
    return [
      { required: true, message: '请输入密码', trigger: 'blur' },
      {
        pattern: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^\s\da-zA-Z])[\S]{8,32}$/,
        message: '密码长度为8-32个非空白字符，必须包含大小写字母、数字和特殊字符',
        trigger: 'blur'
      }
    ]
  }

  // 默认：5-20个非空白字符
  return [
    { required: true, message: '请输入密码', trigger: 'blur' },
    {
      pattern: /^[\S]{5,20}$/,
      message: '密码长度为5-20个非空白字符',
      trigger: 'blur'
    }
  ]
})

interface LoginForm {
  username: string
  password: string
  captcha: string
}

const formRef = ref()
const loginForm = ref<LoginForm>({
  username: '',
  password: '',
  captcha: ''
})

const loading = ref(false)
const captchaSrc = ref('')

// 定义验证规则（使用 ref 避免响应式更新触发验证）
const rules = ref({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [],
  captcha: []
})

// 更新验证规则
const updateRules = () => {
  rules.value = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
    ],
    password: passwordRules.value,
    captcha: showCaptcha.value ? [
      { required: true, message: '请输入验证码', trigger: 'blur' }
    ] : []
  }
}

// 加载登录配置
const loadLoginConfig = async () => {
  try {
    const config = await authApi.getConfig()
    if (config) {
      loginConfig.value = config
      console.log('登录配置加载成功:', config)
      // 配置加载后更新验证规则
      updateRules()
    }
  } catch (error) {
    console.error('Failed to load login config:', error)
    // 即使加载失败，也使用默认配置更新规则
    updateRules()
  }
}

// Function to load new captcha
const loadCaptcha = async () => {
  try {
    const data = await authApi.getCaptcha();

    // Convert blob to base64 URL for displaying the image
    const imageUrl = URL.createObjectURL(data)
    captchaSrc.value = imageUrl;
  } catch (error) {
    console.error('Failed to load captcha:', error);
    ElMessage.error('验证码加载失败');
  }
}

// Load captcha and login config on component mount
onMounted(async () => {
  await loadLoginConfig()

  // 只在需要验证码时才加载
  if (showCaptcha.value) {
    loadCaptcha()
  }
})

const handleLogin = async () => {
  // Use Element Plus form validation
  formRef.value.validate(async (valid: boolean) => {
    if (!valid) {
      return
    }

    loading.value = true

    try {
      console.log('开始调用登录API...')
      // 根据配置决定是否发送验证码
      const captchaValue = showCaptcha.value ? loginForm.value.captcha : undefined

      // Call the real API to login with captcha
      const resp: any = await authApi.login(loginForm.value.username, loginForm.value.password, captchaValue)
      console.log('登录API响应:', resp)

      if (!resp.token || !resp.user) {
        throw new Error(`登录响应格式错误。响应内容: ${JSON.stringify(resp)}`)
      }

      // 保存 token 信息
      authUtils.setTokenKey(resp.token.key)
      authUtils.setToken(resp.token.value, 24)

      // 保存用户信息到 store
      userStore.setLoginInfo({
        token: resp.token,
        user: resp.user
      })

      // Small delay to ensure token is properly stored before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      // Show success message
      ElMessage.success('登录成功')

      // Use replace instead of push to avoid back button issues
      // This also ensures we're not creating an additional history entry
      router.replace('/dashboard')
    } catch (error: any) {
      console.error('Login failed:', error)

      // Display appropriate error message
      if (error.response) {
        // 服务器响应了错误状态
        if (error.response.status === 401) {
          // Check if it's specifically a captcha error
          if (error.response.data?.message && error.response.data.message.includes('验证码')) {
            formRef.value?.validateField('captcha', '验证码错误')
            ElMessage.error('验证码错误');
          } else {
            formRef.value?.validateField('username', '用户名或密码错误')
            formRef.value?.validateField('password', '用户名或密码错误')
            ElMessage.error('用户名或密码错误');
          }
        } else if (error.response.status === 429) {
          ElMessage.error('操作过于频繁，请稍后再试');
        } else if (error.response.data?.message) {
          ElMessage.error(error.response.data.message);
        } else {
          ElMessage.error(`登录失败: ${error.response.status}`);
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('No response received:', error.request)
        ElMessage.error('无法连接到服务器，请检查后端服务是否运行')
      } else if (error.message) {
        // 其他错误
        ElMessage.error(error.message)
      } else {
        ElMessage.error('登录失败，请重试')
      }

      // 只在需要验证码时才刷新验证码
      if (showCaptcha.value) {
        loadCaptcha()
      }
    } finally {
      loading.value = false
    }
  })
}
</script>

<template>
  <div class="login-container">
    <!-- Animated background elements -->
    <div class="background-elements">
      <div class="circle circle-1" />
      <div class="circle circle-2" />
      <div class="circle circle-3" />
      <div class="square square-1" />
      <div class="triangle triangle-1" />
    </div>

    <!-- Login card -->
    <div class="login-card">
      <ElCard class="card">
        <template #header>
          <div class="card-header">
            <div class="logo">
              <div class="logo-inner">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 3L2 12L5 12L5 18L19 18L19 12L22 12L12 3Z"
                    stroke="white"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="14"
                    r="2"
                    fill="white"
                  />
                </svg>
              </div>
            </div>
            <div class="platform-info">
              <h1>PHP-GB28181</h1>
              <h2>视频平台</h2>
            </div>
          </div>
        </template>

        <div class="login-form">
          <ElForm
            ref="formRef"
            :model="loginForm"
            :rules="rules"
            :validate-on-rule-change="false"
            @keyup.enter="handleLogin"
          >
            <ElFormItem prop="username">
              <ElInput
                v-model="loginForm.username"
                placeholder="请输入用户名"
                :prefix-icon="User"
                size="large"
                autocomplete="off"
              />
            </ElFormItem>

            <ElFormItem prop="password">
              <ElInput
                v-model="loginForm.password"
                :prefix-icon="Lock"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
                autocomplete="current-password"
              />
            </ElFormItem>

            <ElFormItem prop="captcha" v-if="showCaptcha">
              <div class="captcha-group">
                <div class="input-group captcha-input">
                  <ElInput
                    v-model="loginForm.captcha"
                    placeholder="请输入验证码"
                    maxlength="6"
                    size="large"
                    autocomplete="off"
                  />
                </div>
                <div class="captcha-image">
                  <img
                    :src="captchaSrc"
                    alt="验证码"
                    style="height: 40px; width: 120px; cursor: pointer; border: 1px solid var(--el-border-color); border-radius: 4px;"
                    @click="loadCaptcha"
                  >
                </div>
              </div>
            </ElFormItem>

            <ElFormItem>
              <ElButton
                type="primary"
                size="large"
                :loading="loading"
                style="width: 100%; margin-top: 10px;"
                @click.prevent="handleLogin"
              >
                登录
              </ElButton>
            </ElFormItem>
          </ElForm>

          <div class="footer-text">
            <p>欢迎使用我们的视频监控平台</p>
          </div>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-main 0%, $bg-panel 100%);
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* Animated background elements */
.background-elements {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  animation-duration: 15s;
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  animation-direction: alternate;
}

.circle-1 {
  width: 150px;
  height: 150px;
  top: 10%;
  left: 10%;
  animation: float1;
}

.circle-2 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  right: 10%;
  animation: float2;
}

.circle-3 {
  width: 80px;
  height: 80px;
  top: 40%;
  right: 20%;
  animation: float3;
}

.square {
  position: absolute;
  width: 50px;
  height: 50px;
  border-radius: 10px;
  background: rgba($primary, 0.15);
  animation: rotate 20s linear infinite;
  top: 60%;
  left: 20%;
  animation-duration: 25s;
}

.triangle {
  position: absolute;
  width: 0;
  height: 0;
  border-left: 25px solid transparent;
  border-right: 25px solid transparent;
  border-bottom: 40px solid rgba($primary, 0.15);
  animation: bounce 10s ease-in-out infinite;
  top: 30%;
  right: 30%;
}

@keyframes float1 {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(20px, 20px) rotate(180deg); }
  100% { transform: translate(0, 0) rotate(360deg); }
}

@keyframes float2 {
  0% { transform: translate(0, 0); }
  50% { transform: translate(-20px, -20px); }
  100% { transform: translate(0, 0); }
}

@keyframes float3 {
  0% { transform: translate(0, 0) rotate(0deg); }
  50% { transform: translate(-10px, 15px) rotate(90deg); }
  100% { transform: translate(0, 0) rotate(180deg); }
}

@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-30px); }
}

.login-card {
  width: 400px;
  z-index: 10;
  backdrop-filter: blur(10px);
  animation: slideIn 0.6s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid $border-base;
  background: rgba($bg-panel, 0.9);
}

.card :deep(.el-card__header) {
  background: linear-gradient(135deg, $primary 0%, $primary-hover 100%);
  text-align: center;
  padding: 30px 20px 20px;
  position: relative;
}

.card-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo {
  margin-bottom: 15px;
}

.logo-inner {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba($primary, 0.15);
  border: 2px solid rgba($primary, 0.3);
  transition: all 0.3s ease;
}

.logo-inner:hover {
  transform: scale(1.1);
  background: rgba($primary, 0.25);
}

.platform-info h1 {
  margin: 0;
  color: white;
  font-size: 2rem;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.platform-info h2 {
  margin: 5px 0 0 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.2rem;
  font-weight: 400;
  letter-spacing: 1px;
}

.login-form {
  padding: 30px;
}

.input-group {
  margin-bottom: 20px;
}

.captcha-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;

  .captcha-input {
    flex: 1;
    margin-bottom: 0;
  }

  .captcha-image {
    display: flex;
    align-items: center;
  }
}

:deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 1px solid $border-base !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  background-color: $bg-panel !important;
  color: $text-main;
}

:deep(.el-input__inner:focus) {
  border-color: $primary;
  box-shadow: 0 0 0 3px rgba($primary, 0.1);
}

:deep(.el-button) {
  border-radius: 12px;
  padding: 14px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, $primary 0%, $primary-hover 100%);
  border: none;
}

:deep(.el-button):hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba($primary, 0.3);
}

:deep(.el-button):active {
  transform: translateY(0);
}

:deep(.el-button:disabled) {
  opacity: 0.6;
  transform: none;
}

.footer-text {
  text-align: center;
  margin-top: 20px;
  color: $text-muted;
  font-size: 0.9rem;
}

.footer-text p {
  margin: 0;
}

/* Responsive design */
@media (max-width: 480px) {
  .login-card {
    width: calc(100% - 40px);
    margin: 0 20px;
  }
  
  .card :deep(.el-card__header) {
    padding: 20px 15px 15px;
  }
  
  .platform-info h1 {
    font-size: 1.5rem;
  }
  
  .platform-info h2 {
    font-size: 1rem;
  }
  
  .login-form {
    padding: 20px;
  }
}
</style>