<template>
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
              placeholder="标签名称"
              @keyup.enter.native="handleFilter"
              @clear="handleFilter"
            />
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
        ref="tagTable"
        v-loading="loading"
        :data="tags"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        :header-cell-style="{ 'text-align': 'center' }"
        :cell-style="{ 'text-align': 'center' }"
      >
        <el-table-column type="selection" />
        <el-table-column label="标签">
          <template slot-scope="scope"
            ><el-tag type="success">{{ scope.row.name }}</el-tag></template
          >
        </el-table-column>
        <el-table-column prop="typeTxt" label="类型" />
        <el-table-column prop="createdTime" label="添加时间">
          <template slot-scope="scope">
            {{ scope.row.createdTime | timeFormatFilter('YYYY-MM-DD HH:mm') }}
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="sc-table-page">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.page_size"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import { useProductApi } from '@/api/product'

const productAPI = useProductApi()
const defaultQuery = {
  page: 1,
  page_size: 10,
  keyword: undefined
}
export default {
  name: 'TagIndex',
  components: {
    Pagination
  },
  data() {
    return {
      tags: [],
      listQuery: Object.assign({}, defaultQuery),
      paginator: null,
      loading: false,
      selectedIds: []
    }
  },
  computed: {
    total() {
      return this.paginator ? this.paginator.total : 0
    }
  },
  mounted() {},

  methods: {
    init() {
      this.resetSearch()
    },
    delTags() {
      if (!this.selectedIds.length) {
        this.$message({
          type: 'warning',
          message: '请至少选择一项标签'
        })
        return
      }
      this.$confirm('此操作将永久删除标签, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          productAPI.tagBatchDelete(this.selectedIds).then(res => {
            this.$message({
              type: 'success',
              message: '删除成功!'
            })
            this.init()
          })
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: '已取消删除'
          })
        })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.page_size = 10
      this.getList()
    },
    resetSearch(clearSearchWhere = true) {
      if (clearSearchWhere) {
        this.listQuery = Object.assign({}, defaultQuery)
      }
      this.$refs.searchForm.resetFields()
      this.getList()
    },
    async getList() {
      const { list, paginator } = await productAPI.tagList(this.listQuery)
      if (!list.length && this.paginator.currentPage !== 1) {
        this.$set(this.listQuery, 'page', this.paginator.currentPage - 1)
        this.getList()
        return
      }

      this.tags = list
      this.paginator = paginator
      setTimeout(() => {
        this.loading = false
      }, 1000)
    },
    toggleSelection(rows) {
      if (rows) {
        rows.forEach(row => {
          this.$refs.tagTable.toggleRowSelection(row)
        })
      } else {
        this.$refs.tagTable.clearSelection()
      }
    },
    handleSelectionChange(vals) {
      this.selectedIds = vals.map(val => {
        return val.id
      })
    }
  }
}
</script>

<style lang="scss" scoped></style>
