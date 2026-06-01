<template>
  <el-form
    ref="ipSettingForm"
    v-loading="loading"
    :model="ipSettingForm"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="IP黑名单：" prop="blackListIps">
      <el-input
        v-model="ipSettingForm.blackListIps"
        style="width: 80%"
        type="textarea"
        @keyup.enter.native="validateIP($event, 'blackListIps')"
        :rows="6"
        placeholder="一行一个IP"
      >
      </el-input>
      <div class="el-upload__tip">
        一行一个IP，被加入黑名单的IP将被禁止访问！可使用通配符，例如：202.101.20.*
      </div>
    </el-form-item>
    <el-form-item label="IP白名单：" prop="whiteListIps">
      <el-input
        style="width: 80%"
        v-model="ipSettingForm.whiteListIps"
        @keyup.enter.native="validateIP($event, 'whiteListIps')"
        type="textarea"
        :rows="6"
        placeholder="一行一个IP"
      >
      </el-input>
      <div class="el-upload__tip">
        一行一个IP，只有白名单中的IP地址允许访问系统！可使用通配符，例如：202.101.20.*<br />
        <span style="color: #fca41d"
          ><i class="el-icon-warning"></i>
          警告：如果设置了白名单，必须将本机IP包含在内，否则将导致管理员无法访问系统！</span
        >
      </div>
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
import { Local } from '@/utils/storage.js'
import { matchIPv4Address } from '@/utils/validate'
import { useSystemApi } from '@/api/system'
import { clone } from 'loadsh'

const systemApi = useSystemApi()

export default {
  data() {
    return {
      loading: false,
      ipSettingForm: {
        blackListIps: '',
        whiteListIps: ''
      },
      rules: {}
    }
  },
  created() {
    // this.initDataSource()
  },
  methods: {
    async initDataSource() {
      this.loading = true
      const result = await systemApi.getSetting('ip')
      if (result) {
        this.ipSettingForm = result
      }
      this.loading = false
    },
    validateIP(event, field) {
      const value = event.target.value.toString()
      const ips = value.split('\n').filter(Boolean)
      const currentIp = ips.pop()
      // console.log('ips:', ips)
      if (!matchIPv4Address(currentIp)) {
        this.ipSettingForm[field] = ips.join('\n')
      }
    },
    submitForm() {
      this.$refs.ipSettingForm.validate(async valid => {
        if (valid) {
          await systemApi.setIpCheckList(this.ipSettingForm)
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
      this.$refs.ipSettingForm.resetFields()
    }
  }
}
</script>

<style lang="scss" scoped></style>
