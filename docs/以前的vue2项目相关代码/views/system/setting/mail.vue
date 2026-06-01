<template>
  <div>
    <el-form
      ref="mailForm"
      v-loading="loading"
      :model="mailForm"
      :rules="rules"
      label-width="200px"
      class="setting-form"
    >
      <el-form-item label="邮件发送：" prop="mail_enabled">
        <el-radio v-model="mailForm.enabled" :label="1">开启</el-radio>
        <el-radio v-model="mailForm.enabled" :label="0">关闭</el-radio>
      </el-form-item>
      <el-form-item label="SMTP 服务器地址：" prop="host">
        <el-input v-model="mailForm.host" />
        <div class="el-upload__tip">
          每种邮箱的地址都不相同，请根据使用的邮箱类型，查找邮箱服务器地址，如：smtp.yourmail.com
        </div>
      </el-form-item>
      <el-form-item label="SMTP 服务器端口：" prop="port">
        <el-input v-model="mailForm.port" />
        <div class="el-upload__tip">通常端口号为25</div>
      </el-form-item>
      <el-form-item label="SMTP 身份验证用户名：" prop="username">
        <el-input v-model="mailForm.username" />
        <div class="el-upload__tip">正确格式应为abc@mail.com</div>
      </el-form-item>
      <el-form-item label="SMTP 身份验证密码：" prop="password">
        <el-input
          v-model="mailForm.password"
          type="password"
          :show-password="true"
        />
        <div class="el-upload__tip">smtp密码：即邮箱密码/客户端授权密码</div>
      </el-form-item>
      <el-form-item label="发信人邮件地址：" prop="from">
        <el-input v-model="mailForm.from" />
        <div class="el-upload__tip">正确格式应为abc@mail.com</div>
      </el-form-item>
      <el-form-item label="发信人称呼：" prop="name">
        <el-input v-model="mailForm.name" />
        <div class="el-upload__tip">用于展示发信人称呼</div>
      </el-form-item>
      <el-form-item label="测试邮箱地址：" prop="test_mail">
        <el-input v-model="test_mail" />
        <div class="el-upload__tip">用于展示发信人称呼</div>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button type="success" @click="checkMail" :loading="btnLoading"
          >验证</el-button
        >
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>
<script>
import { useSystemApi } from '@/api/system'
import { throttle } from 'lodash'
import { verifyEmail } from '../../../utils/validate'
const systemApi = useSystemApi()

export default {
  data() {
    const validateSmtpHost = (rule, value, callback) => {
      const regex = /^smtp\.(.*)\.(.*)$/
      if (regex.test(value)) {
        return callback()
      }
      return callback(new Error('服务器地址格式错误'))
    }

    return {
      loading: false,
      btnLoading: false,
      test_mail: '',
      mailForm: {
        enabled: 1,
        host: '',
        port: undefined,
        username: '',
        password: '',
        from: '',
        name: ''
      },
      rules: {
        username: [
          { type: 'email', message: '用户名格式错误', trigger: 'blur' }
        ],
        from: [
          { type: 'email', message: '发信人邮箱格式错误', trigger: 'blur' }
        ],
        // host: [{ trigger: 'blur', validator: validateSmtpHost }]
        host: [
          { type: 'required', message: '服务器地址必填', trigger: 'blur' }
        ],
        password: [
          { type: 'required', message: '身份验证密码必填', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.initDataSource()
    this._sendTestMail = throttle(() => this.sendTestMail(), 500)
  },
  methods: {
    async initDataSource() {
      this.loading = true
      const result = await systemApi.getSetting('mail')
      if (result) {
        this.mailForm = result
      }

      this.loading = false
    },
    submitForm() {
      this.$refs.mailForm.validate(async valid => {
        if (valid) {
          await systemApi.setMail(this.mailForm)
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
    checkMail() {
      if (!verifyEmail(this.test_mail)) {
        this.$message({
          showClose: false,
          message: '测试邮箱地址格式错误',
          type: 'error'
        })
      }
      this.$refs.mailForm.validate(async valid => {
        if (valid) {
          this._sendTestMail()
        }
        return false
      })
    },
    sendTestMail() {
      this.btnLoading = true
      systemApi
        .checkMail(this.test_mail)
        .then(response => {
          this.btnLoading = false
          this.$message({
            type: 'success',
            message: '发送成功'
          })
        })
        .catch(error => {
          this.btnLoading = false
          this.$message({
            type: 'error',
            message: error.message
          })
        })
    },
    resetForm() {
      this.$refs.mailForm.resetFields()
    }
  }
}
</script>
