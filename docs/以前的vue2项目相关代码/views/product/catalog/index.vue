<template>
  <section class="el-container">
    <aside class="el-aside" style="--el-aside-width: 40%">
      <section class="el-container is-vertical">
        <header class="el-header">
          <div class="left-panel">
            <el-button type="success" icon="el-icon-plus" @click="addTag"
              >添加标签</el-button
            >
            <el-button type="danger" icon="el-icon-delete" @click="delTags"
              >删除</el-button
            >
          </div>
        </header>
        <main class="el-main nopadding">
          <tag-index ref="tagIndex" />
        </main>
      </section>
    </aside>
    <section class="el-container is-vertical">
      <header class="el-header">
        <div class="left-panel">
          <el-button type="success" icon="el-icon-plus" @click="addCatalog"
            >添加分类</el-button
          >
        </div>
      </header>
      <main class="el-main nopadding">
        <div class="sc-table">
          <div class="sc-table-body">
            <div class="sc-table-filter">
              <el-form
                ref="searchForm"
                :inline="true"
                :model="listQuery"
                size="small"
              >
                <el-form-item label="关键词:" prop="keyword">
                  <el-input
                    v-model="listQuery.keyword"
                    class="input-search-keyword"
                    clearable
                    placeholder="分类名称、分类编码"
                    @keyup.enter.native="handleFilter"
                    @clear="handleFilter"
                  />
                </el-form-item>
                <el-form-item label="状态:" prop="status">
                  <el-select
                    v-model="listQuery.status"
                    clearable
                    placeholder="请选择"
                  >
                    <el-option
                      v-for="item in statusOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    >
                    </el-option>
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    icon="el-icon-search"
                    @click="handleFilter"
                    >搜索
                  </el-button>
                  <el-button icon="el-icon-refresh-right" @click="resetSearch"
                    >重置
                  </el-button>
                </el-form-item>
              </el-form>
            </div>
            <el-table
              ref="catalogTable"
              :data="catalogList"
              v-loading="loading"
              tooltip-effect="dark"
              style="width: 100%"
              row-key="id"
              border
              :default-expand-all="false"
              :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            >
              <el-table-column label="分类名称" width="120">
                <template slot-scope="scope">{{ scope.row.name }}</template>
              </el-table-column>
              <el-table-column prop="code" label="分类编码" width="200" />
              <el-table-column prop="icon" label="分类图标" width="80">
                <template slot-scope="scope"
                  ><i :class="scope.row.icon" v-if="scope.row.icon !== ''"></i
                ></template>
              </el-table-column>
              <el-table-column label="状态" width="70">
                <template slot-scope="scope">
                  <el-switch
                    v-model="scope.row.status"
                    active-color="#13ce66"
                    inactive-color="#ff4949"
                    active-value="1"
                    inactive-value="0"
                    @change="onStatusChange(scope.row.id, $event)"
                  >
                  </el-switch>
                </template>
              </el-table-column>
              <el-table-column prop="sort" label="排序" width="60">
              </el-table-column>
              <el-table-column prop="createdTime" label="添加时间" width="140">
                <template slot-scope="scope">
                  {{
                    scope.row.createdTime
                      | unitTimeFormatFilter('YYYY-MM-DD HH:mm')
                  }}
                </template>
              </el-table-column>
              <el-table-column label="操作">
                <template slot-scope="scope">
                  <el-button
                    @click="addSubCatalog(scope.row)"
                    type="text"
                    size="small"
                    >新增下级</el-button
                  >
                  <el-button
                    @click="updCatalog(scope.row)"
                    type="text"
                    size="small"
                    >编辑</el-button
                  >
                  <el-button
                    type="text"
                    size="small"
                    @click="delCatalog(scope.row)"
                    >删除</el-button
                  >
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- <div class="sc-table-page"></div> -->
        </div>
      </main>
    </section>
    <tag-form ref="tagForm" @ok="onSuccessTagAdd" />
    <catalog-form ref="catalogForm" @ok="resetSearch" />
  </section>
</template>

<script>
import Sortable from 'sortablejs'
import Pagination from '@/components/Pagination'
import TagIndex from '../tag/index.vue'
import { useProductApi } from '@/api/product'

const productAPI = useProductApi()
const defaultQuery = {
  page: 1,
  page_size: 10,
  keyword: undefined,
  status: undefined,
  parent_id: undefined
}
export default {
  name: 'ProductCatalog',
  components: {
    TagForm: () => import('../tag/form.vue'),
    CatalogForm: () => import('./form.vue'),
    TagIndex,
    Pagination
  },
  data() {
    return {
      listQuery: Object.assign({}, defaultQuery),
      paginator: null,
      catalogList: [],
      statusOptions: [
        { value: 0, label: '禁用' },
        { value: 1, label: '正常' }
      ],
      loading: false
    }
  },
  computed: {
    total() {
      return this.paginator ? this.paginator.total : 0
    }
  },
  mounted() {
    this.getList()
    this.$nextTick(() => {
      this.initTagList()
    })
  },

  methods: {
    handleFilter() {
      this.getList()
    },
    async getList() {
      this.loading = true
      this.catalogList = await productAPI.catalogTree(this.listQuery)
      // 调用 table拖拽排序 （有可能不生效，最好等表格数据获取后在调用，或加个this.$nextTick方法）
      this.rowDrop()
      setTimeout(() => {
        this.loading = false
      }, 1000)
    },
    rowDrop() {
      const tbody = this.$refs.catalogTable.$el.querySelectorAll(
        '.el-table__body-wrapper > table > tbody'
      )[0]
      Sortable.create(tbody, {
        animation: 300,
        onEnd: async e => {
          //e.oldIndex为拖动一行原来的位置，e.newIndex为拖动后新的位置
          const targetRow = this.catalogList.splice(e.oldIndex, 1)[0]
          this.catalogList.splice(e.newIndex, 0, targetRow)
          let dragId = this.catalogList[e.newIndex].id //拖动行的id
          // console.log('dragId:', dragId, targetRow)
          await productAPI.catalogUpdSort(dragId, targetRow.sort)
          // 请求接口排序，后面具体需要什么参数，获取就行了，每个人需要不一样
        }
      })
    },
    /** 鼠标移入cell */
    handleCellEnter(row, column, cell, event) {
      row.isEdit = true
    },
    /** 鼠标移出cell */
    handleCellLeave(row, column, cell, event) {
      row.isEdit = false
    },
    async onStatusChange(id, val) {
      await productAPI.catalogUpdStatus(id, parseInt(val))
    },
    resetSearch(clearSearchWhere = true) {
      if (clearSearchWhere) {
        this.listQuery = Object.assign({}, defaultQuery)
      }
      this.$refs.searchForm.resetFields()
      this.getList()
    },
    addTag() {
      this.$refs.tagForm.init()
    },
    onSuccessTagAdd() {
      this.initTagList()
    },
    initTagList() {
      if (this.$refs.tagIndex) {
        this.$refs.tagIndex.init()
      }
    },
    delTags() {
      if (this.$refs.tagIndex) {
        this.$refs.tagIndex.delTags()
      }
    },
    addCatalog() {
      this.$refs.catalogForm.init()
    },
    addSubCatalog({ id }) {
      this.$refs.catalogForm.init(undefined, id)
    },
    updCatalog({ id }) {
      this.$refs.catalogForm.init(id)
    },
    delCatalog({ id }) {
      this.$confirm('此操作将永久删除分类, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          productAPI.catalogDelete(id).then(res => {
            this.$message({
              type: 'success',
              message: '删除成功!'
            })
            this.resetSearch()
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    }
  }
}
</script>

<style lang="scss" scoped>
.el-container {
  height: calc(100vh - 147px);

  .el-aside {
    overflow: auto;
    box-sizing: border-box;
    flex-shrink: 0;
    width: var(--el-aside-width, 300px);
    border-right: 1px solid var(--el-border-color-light);
  }
  .el-header {
    background: #fff;
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 13px 15px;
    justify-content: space-between;
    display: flex;
    align-items: center;
    .left-panel {
      display: flex;
      align-items: center;
    }
    .right-panel {
      display: flex;
      align-items: center;
    }
  }
  .el-main {
    flex-basis: 100%;
    .nopadding {
      padding: 0;
    }
  }
}
</style>
