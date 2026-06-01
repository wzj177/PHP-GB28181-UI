<template>
  <el-form
    ref="vipSettingForm"
    v-loading="loading"
    :model="vipSettingForm"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="游客访问：" prop="enable_guest_view">
      <el-radio v-model="vipSettingForm.enable_guest_view" :label="1"
        >开启</el-radio
      >
      <el-radio v-model="vipSettingForm.enable_guest_view" :label="0"
        >关闭</el-radio
      >
    </el-form-item>
    <el-form-item label="DIY作品：" prop="enable_vip_diy">
      <el-radio v-model="vipSettingForm.enable_vip_diy" :label="1"
        >开启</el-radio
      >
      <el-radio v-model="vipSettingForm.enable_vip_diy" :label="0"
        >关闭</el-radio
      >
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submitForm">保存</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>
<script>
import { Local } from '@/utils/storage.js'
import { useSystemApi } from '@/api/system'
import { clone } from 'loadsh'

const systemApi = useSystemApi()

export default {
  data() {
    return {
      loading: false,
      vipSettingForm: {
        enable_guest_view: 0,
        enable_vip_diy: 1
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
      const result = await systemApi.getSetting('vip')
      if (result) {
        this.vipSettingForm = result
      }
      this.loading = false
    },
    submitForm() {
      this.$refs.vipSettingForm.validate(async valid => {
        if (valid) {
          await systemApi.setVIP(this.vipSettingForm)
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
      this.$refs.vipSettingForm.resetFields()
    }
  }
}
</script>

<style lang="scss" scoped></style>
