<template>
  <div class="attachment-manage">
    <ElCard class="box-card">
      <div class="goods-content">
        <div class="catalog-left">
          <CatalogLeft
            ref="catalogLeftRef"
            @refresh-data="refreshFiles"
            @change-catalog="changeCatalog"
          />
        </div>
        <div v-loading="listLoading" class="file-right">
          <FileRight ref="fileRightRef" />
        </div>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CatalogLeft from '@/components/attachment/CatalogLeft.vue'
import FileRight from '@/components/attachment/FileRight.vue'

const catalogLeftRef = ref<InstanceType<typeof CatalogLeft>>()
const fileRightRef = ref<InstanceType<typeof FileRight>>()
const listLoading = ref(false)

// 当目录改变时
const changeCatalog = (catalog_code: string) => {
  if (fileRightRef.value) {
    fileRightRef.value.triggerFilterCatalog(catalog_code)
  }
}

// 刷新文件列表
const refreshFiles = (isRefreshFile = true) => {
  if (fileRightRef.value) {
    if (isRefreshFile) {
      fileRightRef.value.resetSearch()
    }
    setTimeout(() => {
      fileRightRef.value?.getCatalogTree()
    })
  }
}
</script>

<style lang="scss" scoped>
.attachment-manage {
  padding: 20px;
  min-height: 100%;
  background: var(--bg-hover);

  .box-card {
    border-radius: 8px;
    border: 1px solid var(--border-base);
  }

  .goods-content {
    display: flex;

    .catalog-left {
      min-height: calc(100vh - 250px);
      width: 230px;
      margin-right: 20px;
      flex-shrink: 0;
    }

    .file-right {
      overflow-x: auto;
      flex-grow: 1;
      min-height: calc(100vh - 250px);
    }
  }
}
</style>
