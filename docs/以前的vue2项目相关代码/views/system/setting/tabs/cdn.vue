<template>
  <div>
    <el-form
      ref="cdnForm"
      v-loading="loading"
      :model="cdnForm"
      :rules="rules"
      label-width="200px"
      class="setting-form"
    >
      <el-form-item label="是否启用：" prop="cdn_enabled">
        <el-radio v-model="cdnForm.cdn_enabled" :label="1">开启</el-radio>
        <el-radio v-model="cdnForm.cdn_enabled" :label="0">关闭</el-radio>
      </el-form-item>
      <el-form-item label="URL：" prop="cdn_url">
        <el-input v-model="cdnForm.cdn_url" />
        <div class="el-upload__tip">
          默认读取远程存储的访问地址，格式：以"http://"或"https://"开头
        </div>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm('cdnForm')"
          >保存</el-button
        >
        <el-button @click="resetForm('cdnForm')">重置</el-button>
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
      cdnForm: {
        cdn_enabled: 0,
        cdn_url: ''
      },
      rules: {
        cdn_url: [{ type: 'url', message: 'url参数格式错误', trigger: 'blur' }]
      }
    }
  },
  methods: {
    async initDataSource() {
      this.loading = true
      const result = await systemApi.getSetting('cdn')
      if (result) {
        this.cdnForm = result
      }
      const storage = await systemApi.getSetting('storage')
      if (storage && !this.cdnForm.cdn_url) {
        this.cdnForm.cdn_url = this.parseStorageCdnURL(storage)
      }

      this.loading = false
    },
    parseStorageCdnURL(storage) {
      if (['qiniu', 'ali', 'tencent'].includes(storage.type)) {
        return storage[`${storage.type}_url`]
      } else if (storage.type === 'huawei') {
        return storage['huawei_endpoint']
      } else {
        return ''
      }
    },
    submitForm(formName) {
      this.$refs[formName].validate(async valid => {
        if (valid) {
          await cdnSet(this.cdnForm)
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
    resetForm(formName) {
      this.$refs[formName].resetFields()
    }
  }
}
</script>
