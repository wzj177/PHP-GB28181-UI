<template>
  <div
    :class="customClass"
    class="attachment-group"
    v-loading="loading"
    element-loading-text="拼命加载中"
    element-loading-spinner="el-icon-loading"
    element-loading-background="rgba(0, 0, 0, 0.8)"
  >
    <div class="head-operation">
      <ul class="operation-list">
        <li class="list-item" @click="refreshData">
          <el-tooltip class="item" effect="dark" content="刷新" placement="top">
            <svg-icon iconClass="refresh" />
          </el-tooltip>
        </li>
        <li class="list-item" @click="handleAddCatalog(0)">
          <el-tooltip class="item" effect="dark" content="添加" placement="top">
            <svg-icon iconClass="add" />
          </el-tooltip>
        </li>
        <!-- <li class="list-item" @click="handleEditCatalog">
          <svg-icon iconClass="edit" />
        </li>
        <li class="list-item" @click="handleDelCatalog">
          <svg-icon iconClass="trash" />
        </li>-->
      </ul>
    </div>
    <div class="catalog-item">
      <el-tree
        ref="customTree"
        node-key="id"
        :data="catalogItems"
        :props="defaultProps"
        @node-click="handleNodeClick"
        :default-expand-all="true"
        icon-class=" "
      >
        <span class="custom-tree-node show-hide" slot-scope="{ node, data }">
          <span>
            <i class="el-icon-folder"></i>
            {{ node.label }}
          </span>
          <span class="custom-tree-node-span">
            <i
              v-if="node.level == 1"
              @click.stop="() => appendNode(node, data)"
              class="el-icon-plus"
              title="增加"
            ></i>
            <!--增加节点-->
            <!-- 根节点不需要删除和修改 -->
            <!--删除节点-->
            <i
              v-if="parseInt(data.isDefault) !== 1"
              @click.stop="() => removeNode(node, data)"
              class="el-icon-delete"
              title="删除"
            ></i>
            <i
              @click.stop="() => editNode(node, data)"
              class="el-icon-edit"
              title="编辑"
            ></i>
            <!--编辑节点-->
          </span>
        </span>
      </el-tree>
    </div>
    <catalog-form ref="CatalogForm" @ok="refreshData" />
  </div>
</template>

<script>
import CatalogForm from './CatalogForm'
import { deepClone } from '@/utils'
import { useAttachmentApi } from '@/api/attachment/index'

const attachmentAPI = useAttachmentApi()

export default {
  name: 'CatalogLeft',
  components: {
    SvgIcon: () => import('@/components/SvgIcon/index'),
    CatalogForm
  },
  props: {
    customClass: {
      type: String,
      default: 'attachment-manage-group'
    }
  },
  data() {
    return {
      loading: false,
      catalogItems: [],
      defaultProps: {
        children: 'children',
        label: 'title'
      },
      active_catalog_id: undefined // 当前选中的分组id
    }
  },
  mounted() {
    this.getCatalogTree()
  },
  methods: {
    // 新增树节点
    appendNode(node, data) {
      this.handleAddCatalog(data.id)
    },
    // 删除树节点
    removeNode(node, data) {
      // 判断该节点是否有子节点
      if (node.childNodes.length != 0) {
        this.$message({
          message: '该节点下存在子节点，不允许直接删除',
          type: 'warning'
        })
        return
      }
      this.$confirm('是否确认删除此节点?', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          this.handleDelCatalog(data.id)
          this.$nextTick(() => {
            this.$refs.customTree.remove(data)
          })
        })
        .catch(() => {})
    },
    // 编辑树节点
    editNode(node, data) {
      this.handleEditCatalog(data)
    },
    handleNodeClick(data) {
      this.active_catalog_id = data.id
      this.$emit('changeCatalog', data.code)
    },
    handleAddCatalog(parentId = 0) {
      this.$refs.CatalogForm.dialogType = 'add'
      this.$refs.CatalogForm.dialogVisible = true
      this.$refs.CatalogForm.resetForm(parentId)
    },
    async handleEditCatalog(data) {
      const catalog = await attachmentAPI.showCatalog(data.id)
      this.$refs.CatalogForm.dialogType = 'edit'
      this.$refs.CatalogForm.dialogVisible = true
      this.$refs.CatalogForm.resetForm()
      this.$nextTick(() => {
        this.$refs.CatalogForm.catalogForm = deepClone(catalog)
      })
    },
    async handleDelCatalog(id) {
      await attachmentAPI.delCatalog([id])
      this.$emit('refreshData', this.active_catalog_id == id)
    },
    refreshData() {
      this.getCatalogTree()
      this.$emit('refreshData', false)
    },
    async getCatalogTree() {
      this.loading = true
      const trees = await attachmentAPI.getCatalogTree()
      this.catalogItems = trees
      setTimeout(_ => {
        this.loading = false
      }, 1500)
    },
    handleSelect(key) {}
  }
}
</script>

<style lang="scss" scoped>
.attachment-group {
  &.attachment-manage-group {
    border: 1px solid #e6ebf5;
  }

  .head-operation {
    height: 50px;
    background: #fff;
    border-bottom: 1px dashed #e4e4e4;

    .operation-list {
      display: flex;
      justify-content: space-around;
      align-items: center;
      height: 100%;
      margin: 0;
      padding: 0;

      .list-item {
        list-style: none;
        width: 25px;
        height: 25px;
        cursor: pointer;
        .svg-icon {
          display: block;
          width: 100%;
          height: 100%;
        }
      }
    }
  }

  .catalog-item {
    .catalog-item-title {
      margin: 15px 15px 15px 22px;
      font-size: 15px;
      color: #606266;
    }
    .custom-tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 14px;
      padding-right: 8px;
      .custom-tree-node-span {
        display: none;
        i {
          padding: 2px;
        }
      }
    }

    .show-hide:hover :nth-child(2) {
      display: inline-block !important;
    }

    .el-tree ::v-deep .el-tree-node .el-tree-node__content {
      height: 56px;
      line-height: 56px;
    }
  }
}
</style>
