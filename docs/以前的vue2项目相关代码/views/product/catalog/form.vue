<template>
  <drag-dialog
    :show.sync="dialogVisible"
    :title="id ? '编辑分类' : '新增分类'"
    :width="width"
    :is-fullscreen-icon="false"
    :small="true"
    @close="onCloseDialog"
  >
    <div slot="body" class="two-columns-form-parent pb20">
      <el-form
        ref="catalogForm"
        :model="model"
        :rules="rules"
        size="medium"
        :inline="true"
      >
        <div class="form-group">
          <el-form-item label="分类名称:" prop="name">
            <el-input
              v-model="model.name"
              maxlength="50"
              show-word-limit
            ></el-input>
          </el-form-item>
          <el-form-item label="分类编码:" prop="code">
            <el-input
              v-model="model.code"
              placeholder="编码不重复，不填系统生成"
              :disabled="id && model.code ? true : false"
            ></el-input>
          </el-form-item>
        </div>
        <div class="form-group" prop="parentId">
          <el-form-item label="上级分类:" v-if="catalogItems.length">
            <el-select
              v-model="model.parentId"
              clearable
              placeholder="请选择上级分类"
            >
              <el-option
                v-for="item in catalogItems"
                :key="item.id"
                :label="item.treeName"
                :value="item.id"
              ></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="推荐标签:" prop="recommendTags">
            <el-select
              v-model="model.recommendTags"
              filterable
              multiple
              placeholder="请选择标签"
            >
              <el-option
                v-for="tag in tags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.id"
              >
                <span
                  ><el-tag size="mini">{{ tag.name }}</el-tag></span
                >
              </el-option>
            </el-select>
          </el-form-item>
        </div>
        <div class="form-group">
          <el-form-item label="状态:">
            <el-switch
              v-model="model.status"
              active-color="#13ce66"
              inactive-color="#ff4949"
              active-value="1"
              inactive-value="0"
            >
            </el-switch>
          </el-form-item>
        </div>
        <div class="form-group" prop="status">
          <el-form-item label="图标">
            <icon-selector v-model="model.icon" />
          </el-form-item>
          <el-form-item label="封面图">
            <uploader
              style-mode="avatar"
              accept="image/*"
              :image-url="coverFull"
              @success="onUploadedCover"
              uploadTip="建议尺寸：280x120px"
              ref="uploader"
              :auto-upload="false"
              :crop-img="true"
              :crop-img-size="[280, 120]"
              :crop-fixed-number="[7, 3]"
            />
          </el-form-item>
        </div>
        <div class="form-group">
          <el-form-item label="排序:" prop="sort">
            <el-input-number
              v-model="model.sort"
              :min="1"
              label="自定义排序"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="备注:" prop="remark">
            <el-input
              type="textarea"
              v-model="model.remark"
              :rows="4"
              maxlength="200"
              show-word-limit
            ></el-input>
          </el-form-item>
        </div>
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
</template>
<script>
import DragDialog from '@/components/DragDialog'
import { useProductApi } from '@/api/product'
import IconSelector from '@/components/IconSelector'
import Uploader from '@/components/Uploader/index'
const productAPI = useProductApi()
const defaultForm = {
  name: '',
  code: '',
  icon: '',
  parentId: 0,
  status: 1,
  sort: 10,
  remark: '',
  recommendTags: []
}
export default {
  name: 'CatalogForm',
  components: {
    DragDialog,
    IconSelector,
    Uploader
  },
  data() {
    return {
      dialogVisible: false,
      id: undefined,
      model: Object.assign({}, defaultForm),
      rules: {
        name: [{ required: true, trigger: 'blur' }],
        sort: [{ type: 'number', min: 0, trigger: 'blur' }]
      },
      width: '700px',
      catalogItems: [],
      tags: [],
      fileIds: [],
      coverFull: '',
      uploaderKey: new Date().getTime()
    }
  },
  created() {
    // this.getCatalogTree()
  },
  methods: {
    init(id = undefined, parentId = undefined) {
      this.id = id
      this.resetForm()
      this.getCatalogTree()
      this.getTags()
      if (parentId !== undefined) {
        this.model.parentId = parentId
      }
      if (this.id) {
        this.getCatalog()
      }
      this.dialogVisible = true
    },
    async getTags() {
      this.tags = await productAPI.tagOptions()
    },
    async getCatalog() {
      const catalog = await productAPI.catalogShow(this.id)
      this.model = {
        name: catalog.name,
        code: catalog.code,
        icon: catalog.icon,
        parentId: parseInt(catalog.parentId),
        status: catalog.status,
        sort: catalog.sort,
        remark: catalog.remark,
        recommendTags: catalog.recommendTags
      }
      this.coverFull = catalog.coverFull
      // this.$refs.uploader.setShowImgUrl(this.coverFull)
    },
    async getCatalogTree() {
      const trees = await productAPI.catalogTree({
        mode: 'tree_options'
      })
      this.catalogItems = trees
    },
    onIconChange(val) {
      this.model.icon = val
    },
    resetForm() {
      this.model = Object.assign({}, defaultForm)
      this.coverFull = ''
      if (this.$refs.uploader) {
        this.$refs.uploader.reset()
      }
    },
    onUploadedCover(res) {
      this.model.cover = res.path
    },
    submitForm() {
      this.$refs.catalogForm.validate(valid => {
        if (!valid) {
          return false
        }
        if (this.id) {
          productAPI.catalogEdit(this.id, this.model).then(response => {
            this.$notify({
              title: '成功提示',
              dangerouslyUseHTMLString: true,
              message: '更新成功',
              type: 'success'
            })

            this.dialogVisible = false

            this.$emit('ok')
          })
        } else {
          productAPI.catalogAdd(this.model).then(response => {
            this.$notify({
              title: '成功提示',
              dangerouslyUseHTMLString: true,
              message: '添加成功',
              type: 'success'
            })

            this.dialogVisible = false

            this.$emit('ok')
          })
        }
      })
    },
    onCloseDialog() {
      this.dialogVisible = false
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep.el-select {
  width: 100%;
}
.el-textarea {
  width: 100%;
}
</style>
