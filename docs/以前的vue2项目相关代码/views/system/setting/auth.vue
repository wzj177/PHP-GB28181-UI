<template>
  <div class="app-container">
    <el-form
      ref="secureSettingForm"
      v-loading="loading"
      :model="secureSettingForm"
      :rules="rules"
      label-width="200px"
      class="setting-form"
    >
      <el-form-item label="密码等级设置：" prop="user_password_level">
        <el-radio-group
          v-model="secureSettingForm.user_password_level"
          size="small"
        >
          <el-radio
            v-for="(item, key) in passwordLevelOptions"
            :key="key"
            :label="item.value"
            border
            >{{ item.name }}
          </el-radio>
        </el-radio-group>
        <div class="el-upload__tip" v-html="passwordLevelTip" />
      </el-form-item>
      <el-form-item label="用户登录限制：" prop="login_connect_login_limit">
        <el-switch
          v-model="secureSettingForm.login_connect_login_limit"
          active-color="#13ce66"
          inactive-color="#ff4949"
          :active-value="1"
          :inactive-value="0"
        />
        <div class="el-upload__tip">
          开启后同一帐号只能在一处（同一IP）进行登录
        </div>
      </el-form-item>
      <el-form-item
        label="设备终端登录限制："
        prop="login_connect_client_login_limit"
      >
        <el-switch
          v-model="secureSettingForm.login_connect_client_login_limit"
          active-color="#13ce66"
          inactive-color="#ff4949"
          :active-value="1"
          :inactive-value="0"
        />
        <div class="el-upload__tip">
          开启后，同一帐号同时只能在APP或WEB一个设备终端上进行登录
        </div>
      </el-form-item>
      <el-form-item label="第三方登录：" prop="oauth_login_enabled">
        <el-switch
          v-model="secureSettingForm.oauth_login_enabled"
          active-color="#13ce66"
          inactive-color="#ff4949"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
      <el-form-item label="用户登录保护：" prop="temporary_lock_enabled">
        <el-switch
          v-model="secureSettingForm.temporary_lock_enabled"
          active-color="#13ce66"
          inactive-color="#ff4949"
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
  </div>
</template>

<script>
import { useSystemApi } from '@/api/system'

const systemApi = useSystemApi()

export default {
  data() {
    return {
      loading: false,
      passwordLevelOptions: [
        { value: 'lower', name: '低' },
        { value: 'middle', name: '中' },
        { value: 'high', name: '高' }
      ],
      secureSettingForm: {
        user_password_level: 'lower',
        login_connect_login_limit: 0,
        login_connect_client_login_limit: 0,
        oauth_login_enabled: 0,
        temporary_lock_enabled: 0
      },
      rules: {},
      imageUrl: ''
    }
  },
  computed: {
    passwordLevelTip() {
      const tips = {
        lower: '密码为5-20位英文、数字、符号，最少需输入5个字符。',
        middle:
          '<p>密码为8-20位英文、数字、符号，最少需输入8个字符。</p><p>至少包含字母、数字、符号中任意两种。</p>',
        high: '<p>密码为8-32位英文、数字、符号，最少需输入8个字符。</p><p>同时包含英文大写、英文小写、数字、符号四种。</p>'
      }

      return tips[this.secureSettingForm.user_password_level]
    }
  },
  created() {
    this.initDataSource()
  },
  methods: {
    async initDataSource() {
      this.loading = true
      const result = await systemApi.getSetting('auth')
      if (result) {
        this.secureSettingForm = result
      }
      this.loading = false
    },
    submitForm() {
      this.$refs.secureSettingForm.validate(async valid => {
        if (valid) {
          await systemApi.setAuth(this.secureSettingForm)
          this.$notify({
            title: '成功提示',
            dangerouslyUseHTMLString: true,
            message: '保存成功',
            type: 'success'
          })
        }
        return false
      })
    },
    resetForm() {
      this.$refs.secureSettingForm.resetFields()
    }
  }
}
</script>
