<template>
  <div class="app-container">
    <el-card class="box-card">
      <div class="filter-container">
        <el-form
          ref="searchForm"
          :inline="true"
          :model="listQuery"
          size="small"
        >
          <el-form-item label="模块:" prop="module">
            <el-select
              v-model="listQuery.module"
              clearable
              @clear="handleFilter"
              @change="onModuleChange"
            >
              <el-option
                v-for="v in logModuleOptions"
                :key="v.id"
                :label="v.name"
                :value="v.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="操作:" prop="action">
            <el-select
              v-model="listQuery.action"
              clearable
              @clear="handleFilter"
            >
              <el-option
                v-for="v in logModuleActionOptions"
                :key="v.id"
                :label="v.name"
                :value="v.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="等级:" prop="level">
            <el-select
              v-model="listQuery.level"
              clearable
              placeholder="下拉筛选"
            >
              <el-option label="一般" value="info" />
              <el-option label="错误" value="error" />
              <el-option label="警告" value="warning" />
            </el-select>
          </el-form-item>
          <el-form-item label="用户:" prop="userName">
            <el-input
              v-model="listQuery.userName"
              clearable
              placeholder="请输入用户账号"
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
      <div class="ele-table-tool ele-table-tool-default">
        <div class="ele-table-tool-title ele-space">
          <el-button
            type="danger"
            size="small"
            icon="el-icon-delete"
            @click="onBatchDelete"
            >删除
          </el-button>
        </div>
      </div>
      <el-table
        ref="operationLogTable"
        v-loading="listLoading"
        stripe
        border
        style="width: 100%"
        size="medium"
        :data="logList"
        :row-style="{ height: '10px' }"
        :cell-style="{ padding: '5px' }"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column
          prop="id"
          label="ID"
          width="80"
          fixed
          sortable
          align="center"
        />
        <el-table-column prop="userId" label="用户" align="center" width="120">
          <template slot-scope="scope">
            <span>{{ scope.row.userName }}</span>
          </template>
        </el-table-column>
        <el-table-column
          prop="moduleText"
          label="操作模块"
          align="center"
          width="120"
        />
        <el-table-column
          prop="actionText"
          label="操作类型"
          align="center"
          width="140"
        />
        <el-table-column prop="ip" label="IP" align="center" width="140">
          <template slot-scope="scope">
            <div>{{ scope.row.ip }}</div>
            <el-tag
              v-show="scope.row.ipArea.length"
              type="warning"
              size="mini"
              >{{ scope.row.ipArea }}</el-tag
            >
          </template>
        </el-table-column>
        <el-table-column
          prop="levelText"
          label="日志等级"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <el-tag :type="scope.row.level | logLevelFilter" size="mini">{{
              scope.row.levelText
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          show-overflow-tooltip
          prop="message"
          label="日志内容"
          align="center"
          width="300"
        />
        <el-table-column
          prop="createdTime"
          label="操作时间"
          sortable
          align="center"
          width="180"
        >
          <template slot-scope="scope">
            <i class="el-icon-time" />
            <span style="margin-left: 5px">{{
              scope.row.created_at | timeFormatFilter('YYYY-MM-DD HH:mm')
            }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220" align="center">
          <template slot-scope="scope">
            <el-button
              type="primary"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              size="small"
              >查看数据
            </el-button>
            <el-button
              type="danger"
              icon="el-icon-delete"
              size="small"
              @click="handleDelete(scope.row)"
              >删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.page_size"
        @pagination="getLogs"
      />
    </el-card>
    <el-dialog title="数据" :visible.sync="dialogJsonVisible">
      <div style="min-height: 340px">
        <json-viewer
          :value="jsonData"
          :expand-depth="5"
          copyable
          boxed
          sort
        ></json-viewer>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import JsonViewer from 'vue-json-viewer'
import { timeFormatFilter } from '@/filters'
import { useSystemApi } from '@/api/system'
const systemAPI = useSystemApi()
const defaultQuery = {
  page: 1,
  page_size: 10,
  userName: undefined,
  module: undefined,
  action: undefined,
  level: undefined,
  last_id: undefined
}
export default {
  name: 'OperationLog',
  components: {
    Pagination,
    JsonViewer
  },
  filters: {
    logLevelFilter(value) {
      if (value === 'error') {
        return 'danger'
      }
      return value
    }
  },
  data() {
    return {
      logList: [],
      dialogJsonVisible: false,
      listLoading: true,
      listQuery: Object.assign({}, defaultQuery),
      paginator: null,
      selectedIds: [],
      logModuleOptions: [],
      logModuleActionOptions: [],
      autoWidth: true,
      jsonData: null
    }
  },
  computed: {
    total() {
      return this.paginator ? this.paginator.total : 0
    }
  },

  created() {
    this.getLogModuleOptions()
    this.getLogs()
  },
  methods: {
    onBatchDelete() {
      if (!this.selectedIds.length) {
        this.$message({
          message: '请至少选择一项',
          type: 'warning'
        })
        return false
      }
      this.batchDelete(this.selectedIds)
    },
    async getLogs() {
      this.listLoading = true
      const res = await systemAPI.logList(this.listQuery)
      const { list, paginator } = res
      if (!list.length && this.listQuery.page !== 1) {
        this.listQuery.page -= 1
        this.getLogs()
      }
      // const [lastItem] = [...list].reverse()
      // if (lastItem) {
      //   this.listQuery.last_id = lastItem.id
      // }
      this.logList = list
      this.paginator = paginator
      this.listLoading = false
    },
    async getLogModuleOptions() {
      this.logModuleOptions = await systemAPI.logModuleOptions()
    },
    async onModuleChange(val) {
      if (!val) {
        this.logModuleActionOptions = []
        return false
      }
      this.logModuleActionOptions = await systemAPI.logModuleActionOptions(val)
    },
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.page_size = 10
      this.getLogs()
    },
    resetSearch() {
      this.selectIds = []
      this.listQuery = Object.assign({}, defaultQuery)
      this.$refs.searchForm.resetFields()
      this.getLogs()
    },
    handleDelete({ id }) {
      this.batchDelete([id])
    },
    handleView({ id }) {
      systemAPI.logView(id).then(log => {
        this.jsonData = log.data
        this.dialogJsonVisible = true
      })
    },
    batchDelete(ids) {
      this.$confirm('此操作将永久删除日志, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          systemAPI.logBatchDelete(ids).then(res => {
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
    },
    handleSelectionChange(vals) {
      this.selectedIds = vals.map(val => {
        return val.id
      })
    }
  }
}
</script>
<style lang="scss" scoped>
.app-container {
  .filter-container {
    margin-top: 10px;
  }

  .el-button--danger {
    margin-left: 10px;
  }

  .ele-table-tool {
    margin-bottom: 7px;
  }

  .el-pagination {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  ::v-deep .el-badge__content.is-fixed.is-dot {
    top: 6px;
    right: 0px;
  }

  ::v-deep .badge-enabled {
    .el-badge__content {
      background-color: #67c23a !important;
    }
  }

  ::v-deep .badge-disabled {
    .el-badge__content {
      background-color: #f56c6c !important;
    }
  }

  .pagination-container {
    padding: 0;
  }

  .el-dialog {
    width: 800px;
  }
}
</style>
