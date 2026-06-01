<template>
  <div class="app-container">
    <el-card class="box-card">
      <div class="goods-content">
        <div class="catalog-left">
          <catalog-left
            ref="CatalogLeft"
            @refreshData="refreshFiles"
            @changeCatalog="changeCatalog"
          />
        </div>
        <div v-loading="listLoading" class="file-right">
          <file-right ref="FileRight" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination'
import CatalogLeft from '@/components/ElAttachment/components/group'
import FileRight from './components/FileRight'

export default {
  name: 'AttachmentManage',
  components: {
    Pagination,
    CatalogLeft,
    FileRight
  },
  data() {
    return {
      listLoading: false,
      goodsCateOptions: []
    }
  },

  created() {},
  methods: {
    changeCatalog(catalog_code) {
      if (this.$refs.FileRight) {
        this.$refs.FileRight.triggerFilterCatalog(catalog_code)
      }
    },
    refreshFiles(isRefreshFile = true) {
      if (this.$refs.FileRight) {
        if (isRefreshFile) {
          this.$refs.FileRight.resetSearch()
        }
        this.$nextTick(() => {
          this.$refs.FileRight.getCatalogTree()
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.app-container {
  .filter-container {
    margin-top: 10px;
    .input-search-keyword {
      width: 203px;
    }
  }

  .goods-content {
    display: flex;
    .catalog-left {
      min-height: calc(100vh - 330px);
      width: 230px;
      margin-right: 20px;
    }

    .file-right {
      overflow-x: auto;
      flex-grow: 1;
      min-height: calc(100vh - 330px);
    }
  }

  .pagination-container {
    padding: 0;
    margin-top: 20px;
  }
}
</style>
