<template>
  <drag-dialog
    :show.sync="dialogVisible"
    title="上传附件"
    :width="width"
    :is-fullscreen-icon="false"
    :small="true"
    @close="onCloseDialog"
  >
    <div slot="body" class>
      <el-form
        ref="FormForm"
        :model="model"
        label-position="right"
        size="medium"
        label-width="83px"
      >
        <el-form-item label="上传方式:" prop="type">
          <el-radio-group v-model="model.type">
            <el-radio-button label="local">本地上传</el-radio-button>
            <el-radio-button label="net">网络上传</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="上传分组:">
          <el-select v-model="model.group_code" clearable placeholder="请选择" @change="onChangeGroup">
            <el-option
              v-for="item in catalogItems"
              :key="item.id"
              :label="item.tree_title"
              :value="item.code"
            ></el-option>
          </el-select>
          <!-- <el-cascader
            v-model="model.group_code"
            :options="catalogItems"
            :props="{
              value: 'code',
              label: 'title'
            }"
            placeholder="图片移动至"
            size="small"
          ></el-cascader>-->
        </el-form-item>
        <el-form-item label="上传附件" v-if="model.type === 'local'">
          <!-- 上传组件 start -->
          <uploader
            ref="uploader"
            style-mode="drag"
            :max-limit="3"
            @success="onUploadSuccess"
            :key="uploaderKey"
          />
          <!-- 上传组件 end -->
        </el-form-item>
        <el-form-item label="网络资源" v-if="model.type === 'net'">
          <network-addr-get-input
            v-model="model.net_addr"
            :group="model.group_code"
            placeholder="请在此处粘贴资源地址"
            tips="大小不要超过10M,支持图片、音频、视频的常用格式"
            btn-text="提取资源"
            custom-class
            @ok="onUploadSuccess"
          />
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer">
      <div style="text-align: right">
        <el-button v-prevent-re-click type="primary" @click="submitForm">提 交</el-button>
        <el-button type="danger" @click="dialogVisible = false">关 闭</el-button>
      </div>
    </div>
  </drag-dialog>
</template>
<script>
import DragDialog from '@/components/DragDialog'
import { useAttachmentApi } from '@/api/attachment/index'
import NetworkAddrGetInput from '@/components/Uploader/network-addr-get-input.vue'
// import Uploader from '@/components/Uploader/index'
const attachmentAPI = useAttachmentApi()
const defaultForm = {
  id: undefined,
  type: 'local',
  group_code: 'default',
  net_addr: undefined
}
export default {
  name: 'FileForm',
  components: {
    DragDialog,
    Uploader: () => import('@/components/Uploader/index'),
    NetworkAddrGetInput
  },
  data() {
    return {
      dialogVisible: false,
      model: Object.assign({}, defaultForm),
      width: '1200px',
      catalogItems: [],
      fileIds: [],
      uploaderKey: new Date().getTime()
    }
  },
  created() {
    // this.getCatalogTree()
  },
  methods: {
    async getCatalogTree() {
      const trees = await attachmentAPI.getCatalogTree({
        mode: 'list'
      })
      this.catalogItems = trees
    },
    resetForm() {
      this.model = Object.assign({}, defaultForm)
      this.fileIds = []
      this.uploaderKey = new Date().getTime()
      if (this.$refs.uploader) {
        this.$refs.uploader.reset()
        this.$refs.uploader.$refs.upload.clearFiles()
      }
    },
    async submitForm() {
      // 提交时，更新分组
      if (this.model.type === 'net' && !this.model.net_addr) {
        this.$notify({
          title: '警告',
          dangerouslyUseHTMLString: true,
          message: '未进行提取操作，请输入资源地址后点击”提取资源“按钮提取',
          type: 'warning'
        })
      }
      let refreshFlag = false
      if (this.fileIds.length) {
        try {
          await attachmentAPI.moveGroup({
            ids: this.fileIds,
            groupCode: this.model.group_code
          })
          refreshFlag = true
          this.$notify({
            title: '成功提示',
            dangerouslyUseHTMLString: true,
            message: ' 保存成功',
            type: 'success'
          })
        } catch (_error) {
          this.$notify({
            title: 'Fail',
            dangerouslyUseHTMLString: true,
            message: '保存失败，'._error.message,
            type: 'error'
          })
        }
      }
      this.dialogVisible = false
      this.$emit('ok', refreshFlag)
    },
    onChangeGroup(value) {
      if (this.$refs.uploader) {
        this.$refs.uploader.setGroup(value)
      }
    },
    onUploadSuccess(res, file, fileList) {
      // console.log(res, file, fileList)
      // 上传成功回调，可用于表单中上传成功赋值给业务字段
      this.fileIds.push(res.id)
    },
    onCloseDialog() {
      if (this.fileIds.length) {
        this.$emit('ok')
      }
      this.fileIds = []
    }
  }
}
</script>

<style lang="scss" scoped>
// ::v-deep .el-form-item__label {
//   width: 96px !important;
// }
::v-deep .el-input--small .el-input__inner {
  width: 199px;
}

::v-deep .el-date-editor.el-input,
.el-date-editor.el-input__inner {
  width: 199px;
}

::v-deep .el-input-number--small {
  width: 199px;
}

.el-textarea {
  width: 509px;
}

.el-divider--horizontal {
  margin: 0 0 15px 0;
}

.tips {
  margin: 0;
  padding: 0;
  color: #999;
  font-size: 12px;
}
</style>
<style lang="scss">
.corew-el-upload-box {
  .corew-el-upload {
    .el-upload-list {
      width: 360px;
      // display: inline-block;
    }
  }
}
</style>
