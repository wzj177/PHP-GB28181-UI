<template>
  <el-form
    ref="storageForm"
    v-loading="loading"
    :model="storageForm"
    :rules="rules"
    label-width="200px"
    class="setting-form"
  >
    <el-tabs
      v-model="activeName"
      :tab-position="tabPosition"
      class="secure-tab"
    >
      <el-tab-pane label="本地存储" name="local">
        <el-empty description="暂无配置"></el-empty>
      </el-tab-pane>
      <el-tab-pane label="七牛云存储" name="qiniu">
        <el-alert title="提示" type="warning" show-icon>
          如果切换到七牛云存储后，需要将原有设置的附件传输至七牛云存储，相关工具：
          <a href="https://developer.qiniu.com/sdk#tool" target="_blank"
            >官方</a
          >
        </el-alert>
        <el-form-item label="AccessKey：" prop="qiniu_access_key">
          <el-input v-model="storageForm.qiniu_access_key" />
          <div class="el-upload__tip">
            用于签名的公钥，从
            <a href="https://portal.qiniu.com/user/key" target="_blank"
              >https://portal.qiniu.com/user/key</a
            >
            获取
          </div>
        </el-form-item>
        <el-form-item label="SecretKey：" prop="qiniu_secret_key">
          <el-input v-model="storageForm.qiniu_secret_key" />
          <div class="el-upload__tip">
            用于签名的公钥，从
            <a href="https://portal.qiniu.com/user/key" target="_blank"
              >https://portal.qiniu.com/user/key</a
            >
            获取
          </div>
        </el-form-item>
        <el-form-item label="存储空间(Bucket)：" prop="qiniu_bucket">
          <el-input v-model="storageForm.qiniu_bucket" />
          <div class="el-upload__tip">空间名称，请保证为公开空间</div>
        </el-form-item>
        <el-form-item label="访问URL：" prop="qiniu_url">
          <el-input v-model="storageForm.qiniu_url" />
          <div class="el-upload__tip">
            访问域名，请以http://或者https://开头
          </div>
        </el-form-item>
      </el-tab-pane>
      <el-tab-pane label="阿里云oss" name="ali">
        <el-alert title="提示" type="warning" show-icon>
          如果切换到OSS后，需要将原有设置的附件传输至阿里云OSS，相关工具：
          <a
            href="https://market.aliyun.com/products/53690006/cmgj000281.html#sku=biaozhunban"
            target="_blank"
            >OSS控制台客户端Windows版</a
          >
          <a
            href="https://developer.aliyun.com/ask/191405?spm=a2c6h.13524658"
            target="_blank"
            >其它推荐</a
          >
        </el-alert>
        <el-form-item label="Access Key ID：" prop="ali_access_key">
          <el-input v-model="storageForm.ali_access_key" />
          <div class="el-upload__tip">Access Key ID是您访问阿里云API的密钥</div>
        </el-form-item>
        <el-form-item label="Access Key Secret：" prop="ali_secret_key">
          <el-input v-model="storageForm.ali_secret_key" />
          <div class="el-upload__tip">
            Access Key Secret是您访问阿里云API的密钥
          </div>
        </el-form-item>
        <el-form-item label="存储空间(Bucket)：" prop="ali_bucket">
          <el-input v-model="storageForm.ali_bucket" />
          <div class="el-upload__tip">
            请保证存储空间(Bucket),为可公共读取的
          </div>
        </el-form-item>
        <el-form-item label="访问URL：" prop="ali_url">
          <el-input v-model="storageForm.ali_url" />
          <div class="el-upload__tip">
            自定义访问域名，请以 http:// 或 https://
            开头，如不填写会使用OSS默认域名
          </div>
        </el-form-item>
      </el-tab-pane>
      <el-tab-pane label="腾讯云cos" name="tencent">
        <el-alert title="提示" type="warning" show-icon>
          如果切换到COS后，需要将原有设置的附件传输至腾讯COS, 相关工具：
          <a
            href="https://cloud.tencent.com/document/product/436/6242"
            target="_blank"
            >官方</a
          >
        </el-alert>
        <el-form-item label="App ID：" prop="tencent_app_id">
          <el-input v-model="storageForm.tencent_app_id" />
          <div class="el-upload__tip">App ID 是您项目的ID</div>
        </el-form-item>
        <el-form-item label="Secret ID：" prop="tencent_app_sercet">
          <el-input v-model="storageForm.tencent_app_sercet" />
          <div class="el-upload__tip">
            Secret ID 是您项目的安全秘钥，具有该账户完全的权限，请妥善保管
          </div>
        </el-form-item>
        <el-form-item label="Secret Key：" prop="tencent_seret_key">
          <el-input v-model="storageForm.tencent_seret_key" />
          <div class="el-upload__tip">
            Secret Key 是您项目的安全秘钥，具有该账户完全的权限，请妥善保管
          </div>
        </el-form-item>
        <el-form-item label="存储空间(Bucket)：" prop="tencent_bucket">
          <el-input v-model="storageForm.tencent_bucket" />
          <div class="el-upload__tip">请保证空间属性为 公有读私有写</div>
        </el-form-item>
        <el-form-item label="地域：" prop="tencent_bucket_location">
          <el-input v-model="storageForm.tencent_bucket_location" />
          <div class="el-upload__tip">存储空间(Bucket)所在的地域</div>
        </el-form-item>
        <el-form-item label="访问URL：" prop="tencent_url">
          <el-input v-model="storageForm.tencent_url" />
          <div class="el-upload__tip">
            自定义访问域名，请以 http:// 或 https://
            开头，如不填写会使用OSS默认域名
          </div>
        </el-form-item>
      </el-tab-pane>
    </el-tabs>
    <div class="footer-fixed">
      <el-form-item>
        <el-button type="primary" @click="submitForm">保存</el-button>
        <el-button @click="resetForm">重置</el-button>
      </el-form-item>
    </div>
  </el-form>
</template>
<script>
import { useSystemApi } from '@/api/system'
const systemApi = useSystemApi()

export default {
  data() {
    return {
      loading: false,
      tabPosition: 'top',
      activeName: 'local',
      storageForm: {
        type: 'local',
        qiniu_access_key: '',
        qiniu_secret_key: '',
        qiniu_bucket: '',
        qiniu_url: '',
        ali_access_key: '',
        ali_secret_key: '',
        ali_bucket: '',
        ali_url: '',
        tencent_app_id: '',
        tencent_app_sercet: '',
        tencent_seret_key: '',
        tencent_bucket: '',
        tencent_bucket_location: '',
        tencent_url: ''
      }
    }
  },
  computed: {
    rules() {
      const allInRules = {
        qiniu: {
          qiniu_access_key: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          qiniu_secret_key: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          qiniu_bucket: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          qiniu_url: [
            { type: 'url', message: '参数格式错误', trigger: 'blur' },
            { required: true, message: '必须填写', trigger: 'blur' }
          ]
        },
        ali: {
          ali_access_key: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          ali_secret_key: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          ali_bucket: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          ali_url: [{ type: 'url', message: '参数格式错误', trigger: 'blur' }]
        },
        tencent: {
          tencent_app_id: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          tencent_app_sercet: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          tencent_seret_key: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          tencent_bucket: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          tencent_bucket_location: [
            { required: true, message: '必须填写', trigger: 'blur' }
          ],
          tencent_url: [
            { type: 'url', message: '参数格式错误', trigger: 'blur' }
          ]
        }
      }
      this.$nextTick(() => {
        this.$refs.storageForm.clearValidate()
      })
      return this.activeName in allInRules ? allInRules[this.activeName] : {}
    }
  },
  created() {},
  methods: {
    async initDataSource() {
      this.loading = true
      const result = await systemApi.getSetting('storage')
      if (result) {
        this.storageForm = result
      }
      this.activeName = this.storageForm.type
      this.loading = false
    },
    submitForm() {
      this.$refs.storageForm.validate(async valid => {
        if (valid) {
          this.storageForm.type = this.activeName
          await systemApi.setStorage(this.storageForm)
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
      this.$refs.storageForm.resetFields()
    }
  }
}
</script>
<style lang="scss" scoped>
.secure-tab {
  margin-left: 30px;
  .el-alert--warning {
    padding-top: 10px;
    margin-bottom: 20px;
    a {
      color: #409eff;
    }
  }
}
.el-upload__tip {
  a {
    color: #409eff;
  }
}
</style>
