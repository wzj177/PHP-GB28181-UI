<template>
  <drag-dialog
    :show.sync="dialogVisible"
    :title="title"
    :width="width"
    :is-fullscreen-icon="isFullscreenIcon"
    :small="true"
  >
    <div slot="body" class>
      <el-form
        ref="catalogForm"
        :model="catalogForm"
        label-position="right"
        :rules="rules"
        size="medium"
        label-width="83px"
      >
        <el-form-item label="分组名称:" prop="title">
          <el-input v-model="catalogForm.title" placeholder="请输入分组名称" />
        </el-form-item>
        <el-form-item label="分组编码:" prop="code">
          <el-input
            v-model="catalogForm.code"
            placeholder="非必填,不可填写重复"
            :disabled="'edit' === dialogType && catalogForm.code != ''"
          />
        </el-form-item>
        <el-form-item label="上级分组:" prop="parentId">
          <el-select
            v-model="catalogForm.parentId"
            clearable
            placeholder="请选择"
          >
            <el-option :value="0" label="请选择上级分组"></el-option>
            <el-option
              v-for="item in catalogItems"
              :key="item.id"
              :label="item.tree_title"
              :value="item.id"
            ></el-option>
          </el-select>
          <!-- <el-cascader
            v-model="catalogForm.parentId"
            :options="catalogItems"
            :props="{
              checkStrictly: true,
              value: 'id',
              label: 'title'
            }"
            size="small"
            clearable
          ></el-cascader>-->
        </el-form-item>
        <el-form-item label="系统默认:" prop="code">
          <el-radio v-model="catalogForm.isDefault" :label="1">是</el-radio>
          <el-radio v-model="catalogForm.isDefault" :label="0">否</el-radio>
          <div class="el-upload__tip">系统默认分组无法删除、修改</div>
        </el-form-item>
        <el-form-item label="排序:">
          <el-input-number
            v-model="catalogForm.sort"
            controls-position="right"
            :min="1"
            :max="1000"
          />
        </el-form-item>
      </el-form>
    </div>
    <div slot="footer">
      <div style="text-align: right">
        <el-button v-prevent-re-click type="primary" @click="submitForm"
          >提交</el-button
        >
        <el-button type="danger" @click="dialogVisible = false">取消</el-button>
      </div>
    </div>
  </drag-dialog>
</template>

<script>
import DragDialog from '@/components/DragDialog'
import { useAttachmentApi } from '@/api/attachment/index'

const attachmentAPI = useAttachmentApi()

const defaultForm = {
  id: undefined,
  title: '',
  code: '',
  isDefault: 0,
  parentId: 0,
  sort: 50
}
export default {
  name: 'CatalogForm',
  components: {
    DragDialog
  },
  data() {
    return {
      dialogVisible: false,
      isFullscreenIcon: false,
      dialogType: 'add',
      width: '412px',
      catalogForm: Object.assign({}, defaultForm),
      catalogItems: [],
      rules: {
        title: [{ required: true, message: '请输入分组名称', trigger: 'blur' }]
      }
    }
  },
  computed: {
    title() {
      return this.dialogType === 'edit' ? '编辑分组' : '新增分组'
    }
  },
  methods: {
    async getCatalogTree() {
      this.loading = true
      const trees = await attachmentAPI.getCatalogTree({
        mode: 'list',
        level_le: 1
      })
      this.catalogItems = trees
      setTimeout(_ => {
        this.loading = false
      }, 1500)
    },
    submitForm() {
      this.$refs.catalogForm.validate(valid => {
        if (valid) {
          if (this.dialogType === 'edit') {
            attachmentAPI
              .editCatalog(this.catalogForm.id, this.catalogForm)
              .then(this.onOk)
              .catch(this.onError)
          } else {
            attachmentAPI
              .addCatalog(this.catalogForm)
              .then(this.onOk)
              .catch(this.onError)
          }
        }
      })
    },
    onOk() {
      const msg = this.dialogType === 'add' ? '添加' : '更新'
      this.$notify({
        title: '成功提示',
        dangerouslyUseHTMLString: true,
        message: msg + '成功',
        type: 'success'
      })
      this.dialogVisible = false
      this.$emit('ok')
    },
    onError(_error) {
      // this.$notify({
      //   title: 'Fail',
      //   dangerouslyUseHTMLString: true,
      //   message: '操作失败:'._error.message,
      //   type: 'error'
      // })
      // this.dialogVisible = false
    },
    resetForm(parentId = 0) {
      this.getCatalogTree()
      this.$nextTick(() => {
        this.catalogForm = Object.assign({}, defaultForm)
        this.$refs.catalogForm.resetFields()
        this.catalogForm.parentId = parentId
      })
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep .el-input {
  .el-input__inner {
    width: 279px;
  }
}

::v-deep .el-form--inline .el-form-item__label {
  width: 83px;
}
::v-deep .el-input-number {
  width: 279px !important;
}
.el-form {
  margin-bottom: 20px;
}
</style>
