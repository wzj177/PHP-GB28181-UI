<template>
  <el-form
    ref="basicSettingForm"
    v-loading="loading"
    :model="basicSettingForm"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-form-item label="平台名称：" prop="site_name">
      <el-input maxlength="64" v-model="basicSettingForm.site_name" />
    </el-form-item>
    <el-form-item label="平台地址：" prop="site_url">
      <el-input v-model="basicSettingForm.site_url" />
      <div class="el-upload__tip">以"http://"或"https://"开头</div>
    </el-form-item>
    <el-form-item label="平台logo：" prop="site_logo">
      <!-- v-model="basicSettingForm.site_logo" -->
      <el-attachment
        ref="attachment"
        tip="请上传jpg、jpeg、png格式的图片。logo
      建议尺寸32×32px。图片大小建议不超过2MB"
        @success="onSelectorOk"
        @remove="onSelectorRemove"
      >
        <template slot="previewIcon">
          <i class="el-icon-upload"></i>
        </template>
      </el-attachment>
    </el-form-item>
    <el-form-item label="icp备案号：" prop="icp">
      <el-input v-model="basicSettingForm.icp" />
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
import { mapActions, mapGetters } from 'vuex'
import { validURL } from '@/utils/validate'
import ElAttachment from '@/components/ElAttachment/index'
const systemApi = useSystemApi()

const defaultForm = {
  site_name: '',
  site_url: '',
  site_logo: '',
  icp: '',
  favicon: ''
}
export default {
  components: {
    ElAttachment
  },
  data() {
    return {
      loading: false,
      basicSettingForm: Object.assign({}, defaultForm),
      rules: {
        site_url: [
          { type: 'url', message: '平台url参数格式错误', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.initDataSource()
  },
  computed: {
    ...mapGetters(['themeConfig'])
  },
  methods: {
    // ...mapActions({
    //   setThemeConfig: 'themeConfig/setThemeConfig'
    // }),
    async initDataSource() {
      this.loading = true
      const result = await systemApi.getSetting('basic')
      if (result) {
        this.basicSettingForm = result
        // 异步组件需要把$nextTick 换成 setTimeout(_ => this.initAttachmentor())
        this.$nextTick(_ => this.initAttachmentor())
      }

      this.loading = false
    },
    onSelectorOk(files) {
      this.basicSettingForm.site_logo = files.length > 0 ? files[0]['filepath'] : ''
    },
    onSelectorRemove(_file) {
      this.basicSettingForm.site_logo = ''
    },
    submitForm() {
      this.$refs.basicSettingForm.validate(async valid => {
        if (valid) {
          await systemApi.setBasic(this.basicSettingForm)
          let themeConfig = this.themeConfig
          themeConfig.globalTitle = this.basicSettingForm.site_name
          this.$store.dispatch('themeConfig/setThemeConfig', themeConfig)
          Local.set('themeConfigPrev', this.themeConfig)
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
    initAttachmentor() {
      if (!this.$refs.attachment) {
        return false
      }

      if (validURL(this.basicSettingForm.site_logo_full)) {
        this.$refs.attachment.init([
          {
            filename: this.basicSettingForm.title,
            url: this.basicSettingForm.site_logo_full,
            type: 'image',
            path: this.basicSettingForm.site_logo
          }
        ])
      }
    },
    resetForm() {
      this.$refs.basicSettingForm.resetFields()
    }
  }
}
</script>

<style lang="scss">
.avatar-uploader {
  .el-upload {
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    &:hover {
      border-color: #409eff;
    }
  }
}
</style>
<style lang="scss" scoped>
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
.avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>
