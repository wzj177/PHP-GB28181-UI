<template>
  <div>
    <drag-dialog
      :show.sync="dialogVisible"
      title="添加标签"
      :width="width"
      :is-fullscreen-icon="false"
      :small="true"
      @close="onCloseDialog"
    >
      <div slot="body" class="tag-form-body">
        <el-form
          ref="FormForm"
          :model="model"
          label-position="right"
          size="medium"
          label-width="83px"
        >
          <el-form-item label="标签:">
            <!-- <el-input
              type="textarea"
              v-model="model.content"
              :autosize="{ minRows: 2, maxRows: 4 }"
              placeholder="请输入标签，一行一个"
            >
            </el-input> -->
            <el-tag
              :key="tag"
              v-for="tag in dynamicTags"
              closable
              :disable-transitions="false"
              @close="handleClose(tag)"
            >
              {{ tag }}
            </el-tag>
            <el-input
              class="input-new-tag"
              v-if="inputVisible"
              v-model="inputValue"
              ref="saveTagInput"
              size="small"
              @keyup.enter.native="handleInputConfirm"
              @blur="handleInputConfirm"
            >
            </el-input>
            <el-button
              v-else
              class="button-new-tag"
              size="small"
              @click="showInput"
              >+ 新标签</el-button
            >
          </el-form-item>
        </el-form>
      </div>
      <div slot="footer">
        <div style="text-align: right">
          <el-button v-prevent-re-click type="primary" @click="submitForm"
            >提 交</el-button
          >
          <el-button type="danger" @click="dialogVisible = false"
            >关 闭</el-button
          >
        </div>
      </div>
    </drag-dialog>
  </div>
</template>

<script>
import DragDialog from '@/components/DragDialog'
import { useProductApi } from '@/api/product'

const productAPI = useProductApi()

const defaultModel = {
  content: ''
}

export default {
  name: 'TagForm',
  components: {
    DragDialog
  },
  data() {
    return {
      dialogVisible: false,
      width: '200px',
      model: Object.assign({}, defaultModel),
      dynamicTags: [],
      inputVisible: false,
      inputValue: ''
    }
  },

  mounted() {},

  methods: {
    init() {
      this.dialogVisible = true
      this.resetForm()
    },
    onCloseDialog() {
      this.$emit('close')
    },
    handleClose(tag) {
      this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1)
    },

    showInput() {
      this.inputVisible = true
      this.$nextTick(_ => {
        this.$refs.saveTagInput.$refs.input.focus()
      })
    },

    handleInputConfirm() {
      let inputValue = this.inputValue
      if (inputValue) {
        if (!this.dynamicTags.includes(inputValue)) {
          this.dynamicTags.push(inputValue)
        }
      }
      this.inputVisible = false
      this.inputValue = ''
    },
    resetForm() {
      this.dynamicTags = []
      this.inputValue = ''
      this.model = Object.assign({}, defaultModel)
    },
    submitForm() {
      // this.model.content = this.model.content.replace(/\n/g, '|')
      this.model.content = this.dynamicTags.join('|')
      productAPI.tagAdd(this.model).then(response => {
        this.$notify({
          title: '成功提示',
          dangerouslyUseHTMLString: true,
          message: ' 添加成功',
          type: 'success'
        })
        this.dialogVisible = false
        this.$emit('ok')
      })
      // 提交时，更新分组
      // try {
      //     await attachmentAPI.moveGroup({
      //       ids: this.fileIds,
      //       groupCode: this.model.group_code
      //     })
      //     refreshFlag = true
      //     this.$notify({
      //       title: '成功提示',
      //       dangerouslyUseHTMLString: true,
      //       message: ' 保存成功',
      //       type: 'success'
      //     })
      //   } catch (_error) {
      //     this.$notify({
      //       title: 'Fail',
      //       dangerouslyUseHTMLString: true,
      //       message: '保存失败，'._error.message,
      //       type: 'error'
      //     })
      //   }
    }
  }
}
</script>

<style lang="scss" scoped>
.tag-form-body {
  padding: 30px 0;
  .el-tag + .el-tag {
    margin-left: 10px;
  }
  .button-new-tag {
    margin-left: 10px;
    height: 32px;
    line-height: 30px;
    padding-top: 0;
    padding-bottom: 0;
  }
  .input-new-tag {
    width: 90px;
    margin-left: 10px;
    vertical-align: bottom;
  }
}
</style>
