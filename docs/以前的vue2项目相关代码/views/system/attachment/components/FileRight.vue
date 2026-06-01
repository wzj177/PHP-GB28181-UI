<template>
  <div class="file-right">
    <div class="filter-container">
      <div class="filter-container-top">
        <ul class="materials-nav">
          <li class="all">
            <span>类型：</span>
          </li>
          <li
            :class="listQuery.type == undefined ? 'active' : ''"
            @click.stop="onFilterType()"
          >
            <a class="item" href="javascript:;">全部</a>
          </li>
          <li
            v-for="(item, index) in typeOptions"
            :key="index"
            :class="listQuery.type == item.value ? 'active' : ''"
            @click.stop="onFilterType(item.value)"
          >
            <a class="item" href="javascript:;">{{ item.name }}</a>
          </li>
        </ul>
      </div>
      <div class="filter-container-bottom">
        <el-form
          ref="searchForm"
          :inline="true"
          :model="listQuery"
          size="small"
        >
          <el-form-item label="上传时间:" prop="start_time">
            <el-date-picker
              v-model="listQuery.start_time"
              type="date"
              placeholder="起始时间"
            ></el-date-picker
            >-
            <el-date-picker
              v-model="listQuery.end_time"
              type="date"
              placeholder="结束时间"
            ></el-date-picker>
          </el-form-item>
          <el-form-item label="关键词:" prop="keyword">
            <el-input
              v-model="listQuery.keyword"
              class="input-search-keyword"
              clearable
              placeholder="文件名称"
              @keyup.enter.native="handleFilter"
              @clear="handleFilter"
            />
          </el-form-item>
          <el-form-item>
            <el-button
              type="primary"
              icon="el-icon-search"
              @click="handleFilter"
              >搜索</el-button
            >
            <el-button icon="el-icon-refresh-right" @click="resetSearch"
              >重置</el-button
            >
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="ele-table-tool-title ele-space">
      <el-button
        type="success"
        style="margin-right: 10px"
        size="small"
        icon="el-icon-plus"
        @click="handleUploadFile"
        >上传附件</el-button
      >
      <el-button
        type="danger"
        style="margin-right: 10px"
        size="small"
        icon="el-icon-delete"
        @click="handleDelFiles"
        >删除</el-button
      >
      <el-cascader
        v-model="catalog_id"
        :options="catalogItems"
        ref="catalogCascader"
        :props="{
          checkStrictly: true,
          value: 'code',
          label: 'title'
        }"
        placeholder="图片移动至"
        size="small"
        @change="onChangeCatalog"
        clearable
      ></el-cascader>
    </div>
    <el-table
      ref="fTable"
      :data="fileList"
      v-loading="loading"
      stripe
      border
      :row-style="{ height: '45px' }"
      :cell-style="{ padding: '0' }"
      @selection-change="handleSelectionChange"
      class="file-table"
      style="width: 100%"
    >
      <el-table-column type="selection" width="60" align="center" />
      <el-table-column
        prop="id"
        label="ID"
        fixed
        sortable
        align="center"
        width="90"
      />
      <el-table-column
        align="center"
        prop="filename"
        label="文件名称"
        width="360"
      >
        <template slot-scope="scope">
          <div class="materials-cell">
            <div class="materials-table-img">
              <el-image :src="scope.row.coverFull" fit="fill"></el-image>
            </div>
            <div class="materials-table-title">
              <el-tooltip
                class="item"
                effect="dark"
                content=" 预览"
                placement="top"
              >
                <el-link
                  type="success"
                  class="heading"
                  :underline="false"
                  @click.stop="preview(scope.row)"
                >
                  {{ scope.row.filename }}
                </el-link>
              </el-tooltip>
              <div class="subtitle">
                <el-tag size="small">{{ scope.row.ext }}</el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="groupTitle"
        label="分组"
        width="140"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.groupTitle }}</span>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="typeText"
        label="类型"
        width="140"
      />
      <el-table-column
        align="center"
        prop="fileSizeText"
        label="大小/时长"
        width="140"
      >
        <template slot-scope="scope">
          <span>{{ scope.row.fileSizeText }}</span>
          <span v-if="scope.row.length > 0">/{{ scope.row.lengthText }}</span>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="storageText"
        label="存储方式"
        width="120"
      />
      <el-table-column
        align="center"
        prop="createClientText"
        label="上传端"
        width="120"
      />
      <el-table-column
        align="center"
        prop="createdTime"
        label="上传时间"
        width="120"
      >
        <template slot-scope="scope">
          <span>{{
            scope.row.createdTime | timeFormatFilter('YYYY-MM-DD HH:mm')
          }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" align="center" width="160">
        <template slot-scope="scope">
          <!-- <el-button size="mini" type="primary" @click="handleEdit(scope)">下载</el-button> -->
          <download btn-text="下载" :file="scope.row" />
          <el-button
            slot="reference"
            size="mini"
            type="danger"
            icon-class="el-icon-delete"
            @click="handleDelete(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="listQuery.page"
      :limit.sync="listQuery.page_size"
      @pagination="getFiles"
    />
    <file-form ref="FileForm" @ok="resetSearch" />
    <preview ref="preview" />
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import FileForm from './FileForm'
import { useAttachmentApi } from '@/api/attachment'
import Preview from '@/components/ElAttachment/preview.vue'

const attachmentAPI = useAttachmentApi()
const defaultQuery = {
  page: 1,
  page_size: 10,
  type: undefined,
  keyword: undefined,
  start_time: null, //new Date()
  end_time: null
}
export default {
  name: 'FileRight',
  components: {
    FileForm,
    Pagination,
    Preview,
    Download: () => import('@/components/ElAttachment/download.vue')
  },
  data() {
    return {
      typeOptions: [],
      loading: false,
      fileList: [],
      listQuery: Object.assign({}, defaultQuery),
      paginator: null,
      catalogItems: [],
      catalog_id: undefined,
      ids: []
    }
  },
  created() {
    this.getCatalogTree()
    this.getTypeOptions()
    this.getFiles()
  },
  computed: {
    total() {
      return this.paginator ? this.paginator.total : 0
    }
  },
  methods: {
    preview(file) {
      this.$nextTick(() => {
        this.$refs.preview.open(file)
      })
    },
    async getCatalogTree() {
      const trees = await attachmentAPI.getCatalogTree()
      this.catalogItems = trees
    },
    handleSelectionChange(items) {
      this.ids = items.map(item => {
        return parseInt(item.id)
      })
    },
    onChangeCatalog(vals) {
      let groupCode = null
      if (vals.length) {
        groupCode = vals[vals.length - 1]
      }
      if (!groupCode) {
        return false
      }
      if (!this.ids.length) {
        this.$message.error('操作失败，请至少选择一项附件')
        this.catalog_id = null
        this.$refs.catalogCascader.$refs.panel.clearCheckedNodes()
        this.$refs.catalogCascader.dropDownVisible = false
        return false
      }
      attachmentAPI
        .moveGroup({
          ids: this.ids,
          groupCode: groupCode
        })
        .then(response => {
          this.ids = []
          this.catalog_id = null
          this.$refs.catalogCascader.$refs.panel.clearCheckedNodes()
          this.$refs.catalogCascader.dropDownVisible = false
          this.$notify({
            title: '成功提示',
            dangerouslyUseHTMLString: true,
            message: '移动分组成功',
            type: 'success'
          })
          this.resetSearch()
        })
        .catch(error => {
          this.catalog_id = null
          this.$refs.catalogCascader.$refs.panel.clearCheckedNodes()
          this.$refs.catalogCascader.dropDownVisible = false
        })
    },
    triggerFilterCatalog(groupCode = undefined) {
      this.listQuery.group = groupCode
      this.handleFilter()
    },
    onFilterType(type = undefined) {
      this.listQuery.type = type
      this.handleFilter()
    },
    handleFilter() {
      this.listQuery.page = 1
      this.listQuery.page_size = 10
      this.getFiles()
    },
    resetSearch(refreshFlag = true) {
      if (!refreshFlag) {
        return false
      }
      this.listQuery = Object.assign({}, defaultQuery)
      this.$refs.searchForm.resetFields()
      this.getFiles()
    },
    async getFiles() {
      this.loading = true
      const { list, paginator } = await attachmentAPI.files(this.listQuery)
      if (!list.length && paginator.currentPage !== 1) {
        this.$set(this.listQuery, 'page', paginator.currentPage - 1)
        this.getFiles()
        return
      }

      this.fileList = list
      this.paginator = paginator
      setTimeout(() => {
        this.loading = false
      }, 1000)
    },
    handleUploadFile() {
      this.$nextTick(() => {
        this.$refs.FileForm.showImgUrl = ''
        this.$refs.FileForm.dialogVisible = true
        this.$refs.FileForm.getCatalogTree()
        this.$refs.FileForm.resetForm()
      })
    },
    handleEdit({ row }) {
      this.$refs.FileForm.dialogType = 'edit'
      this.$refs.FileForm.dialogVisible = true
      this.$refs.FileForm.getFilesCate()
      this.$refs.FileForm.resetForm()
      this.$nextTick(() => {
        this.$refs.FileForm.FileForm = deepClone(row)
      })
    },
    handleDelFiles() {
      if (!this.ids) {
        this.$message.error('删除失败，请至少选择一项附件')
        return false
      }
      this.$confirm('确定要删除它们吗?', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          await attachmentAPI.deletes(this.ids)
          this.$message({
            type: 'success',
            message: '删除成功'
          })
          this.resetSearch()
        })
        .catch(err => {
          console.error(err)
        })
    },
    handleDelete(id) {
      this.$confirm('确定要删除吗?', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          await attachmentAPI.delete(id)
          this.$message({
            type: 'success',
            message: '删除成功'
          })
          this.resetSearch()
        })
        .catch(err => {
          console.error(err)
        })
    },
    async getTypeOptions() {
      this.typeOptions = await attachmentAPI.typeOptions()
    },
    refreshData() {
      this.$emit('refreshData', false)
    }
  }
}
</script>
<style lang="scss">
.el-tooltip__popper {
  max-width: 50%;
}

.el-tooltip__popper,
.el-tooltip__popper.is-dark {
  color: #fff !important;
  line-height: 24px;
}
</style>
<style lang="scss" scoped>
.file-right {
  .filter-container {
    .filter-container-top {
      margin-bottom: 10px;
      .materials-nav {
        list-style: none;
        position: relative;
        padding-left: 60px;
        margin: 0;
        border-bottom: 1px solid #ddd;
        &::before,
        &::after {
          display: table;
          content: ' ';
        }
        &::after {
          clear: both;
        }
        li {
          float: left;
          margin-bottom: 0;
          position: relative;
          display: block;
          &.all {
            position: absolute;
            left: 8px;
            top: 15px;
          }
          &.active {
            .item {
              color: #428bca;
              cursor: default;
              background-color: #fff;
              border-color: transparent;
              &::hover {
                color: #428bca;
                cursor: default;
                background-color: #fff;
                border-color: transparent;
              }
            }
          }
          .item {
            padding: 15px;
            display: inline-block;
            color: #555;
            cursor: pointer;
            text-decoration: none;
          }
        }
      }
    }
  }

  .materials-cell {
    padding: 8px;
    &:after {
      display: table;
      content: '';
      clear: both;
    }
    .materials-table-img {
      position: relative;
      float: left;
      margin-right: 10px;
      height: 56px;
      width: 100px;
      text-align: center;
      background: #313131;
      border-radius: 5px;
      overflow: hidden;
      .el-image {
        height: 100%;
        img {
          height: 100%;
        }
      }
    }
    .materials-table-title {
      .heading {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        word-wrap: normal;
        margin-bottom: 10px;
        max-width: 230px;
      }
      .subtitle {
        font-size: 12px;
        color: #999;
      }
    }
  }

  .ele-table-tool-title {
    margin-bottom: 20px;
  }

  border: 1px solid #e6ebf5;
  padding: 20px;

  .el-button--danger {
    margin-left: 10px;
  }
}
</style>
