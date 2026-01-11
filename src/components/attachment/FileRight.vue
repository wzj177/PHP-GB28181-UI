<template>
  <div class="file-right">
    <div class="filter-container">
      <div class="filter-container-top">
        <ul class="materials-nav">
          <li class="all">
            <span>类型：</span>
          </li>
          <li
            :class="listQuery.type === undefined ? 'active' : ''"
            @click.stop="onFilterType(undefined)"
          >
            <a class="item" href="javascript:;">全部</a>
          </li>
          <li
            v-for="(item, index) in typeOptions"
            :key="index"
            :class="listQuery.type === item.value ? 'active' : ''"
            @click.stop="onFilterType(item.value)"
          >
            <a class="item" href="javascript:;">{{ item.name }}</a>
          </li>
        </ul>
      </div>

      <div class="filter-container-bottom">
        <el-form
          ref="searchFormRef"
          :inline="true"
          :model="listQuery"
          size="small"
        >
          <el-form-item label="上传时间:">
            <el-date-picker
              v-model="listQuery.start_time"
              type="date"
              placeholder="起始时间"
              style="width: 135px"
            />
            <span style="margin: 0 8px">-</span>
            <el-date-picker
              v-model="listQuery.end_time"
              type="date"
              placeholder="结束时间"
              style="width: 135px"
            />
          </el-form-item>
          <el-form-item label="关键词:">
            <el-input
              v-model="listQuery.keyword"
              style="width: 200px"
              clearable
              placeholder="文件名称"
              @keyup.enter="handleFilter"
              @clear="handleFilter"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">搜索</el-button>
            <el-button @click="resetSearch()">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="ele-table-tool-title ele-space">
      <el-button type="success" style="margin-right: 10px" size="small" @click="handleUploadFile">
        上传附件
      </el-button>
      <el-button type="danger" style="margin-right: 10px" size="small" @click="handleDelFiles">
        删除
      </el-button>
      <el-cascader
        v-model="catalog_id"
        :options="catalogItems"
        :props="{
          checkStrictly: true,
          value: 'code',
          label: 'title'
        }"
        placeholder="图片移动至"
        size="small"
        @change="onChangeCatalog"
        clearable
      />
    </div>

    <el-table
      ref="fTable"
      :data="fileList"
      v-loading="loading"
      stripe
      border
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
        <template #default="{ row }">
          <div class="materials-cell">
            <div class="materials-table-img">
              <el-image :src="row.coverFull" fit="fill" />
            </div>
            <div class="materials-table-title">
              <el-link
                type="success"
                class="heading"
                :underline="false"
                @click="preview(row)"
              >
                {{ row.filename }}
              </el-link>
              <div class="subtitle">
                <el-tag size="small">{{ row.ext }}</el-tag>
              </div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="group_title"
        label="分组"
        width="140"
      >
        <template #default="{ row }">
          <span>{{ row.group_title || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="type_text"
        label="类型"
        width="140"
      />
      <el-table-column
        align="center"
        prop="file_size_text"
        label="大小/时长"
        width="140"
      >
        <template #default="{ row }">
          <span>{{ row.file_size_text }}</span>
          <span v-if="row.length"> / {{ row.length_text }}</span>
        </template>
      </el-table-column>
      <el-table-column
        align="center"
        prop="storage_text"
        label="存储方式"
        width="120"
      />
      <el-table-column
        align="center"
        prop="create_client_text"
        label="上传端"
        width="120"
      />
      <el-table-column
        align="center"
        prop="created_time"
        label="上传时间"
        width="160"
      >
        <template #default="{ row }">
          {{ formatDateTime(row.created_time) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right" align="center" width="160">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="downloadFile(row)">下载</el-button>
          <el-button
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-show="total > 0"
      :total="total"
      :current-page="listQuery.page"
      :page-size="listQuery.limit"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handleSizeChange"
      @current-change="handlePageChange"
      style="margin-top: 20px; display: flex; justify-content: flex-end"
    />

    <!-- 上传表单 -->
    <FileForm ref="fileFormRef" @ok="onUploadOk" />

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="previewFileData?.filename || '预览'"
      :width="800"
      append-to-body
    >
      <div class="preview-content">
        <el-image
          v-if="previewFileData?.type === 'image'"
          :src="previewFileData?.url"
          fit="contain"
          style="width: 100%; max-height: 60vh"
        />
        <video
          v-else-if="previewFileData?.type === 'video'"
          :src="previewFileData?.url"
          controls
          style="width: 100%; max-height: 60vh"
        />
        <audio
          v-else-if="previewFileData?.type === 'audio'"
          :src="previewFileData?.url"
          controls
          style="width: 100%"
        />
        <div v-else>
          <p>此文件类型不支持预览</p>
          <el-button type="primary" @click="downloadFile(previewFileData!)">下载文件</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus'
import { attachmentApi, type AttachmentFile, type AttachmentCatalog } from '@/api/attachmentApi'
import FileForm from './FileForm.vue'

const defaultQuery = {
  page: 1,
  limit: 10,
  type: undefined,
  keyword: undefined,
  group: undefined,
  start_time: null,
  end_time: null
}

const loading = ref(false)
const searchFormRef = ref<FormInstance>()
const fileFormRef = ref<InstanceType<typeof FileForm>>()

const fileList = ref<AttachmentFile[]>([])
const catalogItems = ref<AttachmentCatalog[]>([])
const typeOptions = ref<Array<{ name: string; value: string }>>([])
const listQuery = reactive<any>({ ...defaultQuery })
const ids = ref<number[]>([])
const catalog_id = ref<string[]>([])

const previewDialogVisible = ref(false)
const previewFileData = ref<AttachmentFile | null>(null)

const total = computed(() => {
  return fileList.value.length > 0 ? (fileList.value[0] as any)._total || 0 : 0
})

// 获取目录树
const getCatalogTree = async () => {
  try {
    const trees = await attachmentApi.getCatalogTree()
    catalogItems.value = trees
  } catch (error) {
    console.error('Failed to get catalog tree:', error)
  }
}

// 获取类型选项
const getTypeOptions = async () => {
  try {
    const options = await attachmentApi.typeOptions()
    typeOptions.value = options
  } catch (error) {
    console.error('Failed to get type options:', error)
  }
}

// 获取文件列表
const getFiles = async () => {
  loading.value = true
  try {
    const params: any = {
      page: listQuery.page,
      limit: listQuery.limit
    }

    if (listQuery.type) params.type = listQuery.type
    if (listQuery.keyword) params.keyword = listQuery.keyword
    if (listQuery.group) params.group = listQuery.group

    if (listQuery.start_time) {
      params.start_time = new Date(listQuery.start_time).toISOString()
    }
    if (listQuery.end_time) {
      params.end_time = new Date(listQuery.end_time).toISOString()
    }

    const data = await attachmentApi.files(params)

    if (!data.list.length && data.paginator.current_page > 1) {
      listQuery.page = data.paginator.current_page
      getFiles()
      return
    }

    fileList.value = data.list
    // Store total for pagination
    if (data.list.length > 0) {
      (data.list[0] as any)._total = data.paginator.total
    }
  } catch (error) {
    console.error('Failed to get files:', error)
  } finally {
    loading.value = false
  }
}

// 处理选择变化
const handleSelectionChange = (items: AttachmentFile[]) => {
  ids.value = items.map(item => item.id)
}

// 移动到分组
const onChangeCatalog = (vals: string[]) => {
  let groupCode: string | null = null
  if (vals.length) {
    groupCode = vals[vals.length - 1]
  }
  if (!groupCode) {
    return false
  }
  if (!ids.value.length) {
    ElMessage.error('操作失败，请至少选择一项附件')
    catalog_id.value = []
    return false
  }

  attachmentApi.moveGroup({
    ids: ids.value,
    groupCode: groupCode
  })
    .then(() => {
      ids.value = []
      catalog_id.value = []
      ElMessage.success('移动分组成功')
      resetSearch()
    })
    .catch(error => {
      console.error('Failed to move group:', error)
      catalog_id.value = []
    })
}

// 触发过滤目录
const triggerFilterCatalog = (groupCode = undefined) => {
  listQuery.group = groupCode
  handleFilter()
}

// 过滤类型
const onFilterType = (type?: string) => {
  listQuery.type = type
  handleFilter()
}

// 处理过滤
const handleFilter = () => {
  listQuery.page = 1
  getFiles()
}

// 重置搜索
const resetSearch = (refreshFlag = true) => {
  if (!refreshFlag) return false

  Object.assign(listQuery, defaultQuery)
  searchFormRef.value?.resetFields()
  getFiles()
}

// 处理上传文件
const handleUploadFile = () => {
  fileFormRef.value?.open()
}

// 上传成功回调
const onUploadOk = (refreshFlag: boolean) => {
  if (refreshFlag) {
    resetSearch()
  }
}

// 删除文件
const handleDelFiles = () => {
  if (!ids.value.length) {
    ElMessage.error('删除失败，请至少选择一项附件')
    return false
  }

  ElMessageBox.confirm('确定要删除它们吗?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await attachmentApi.deletes(ids.value)
      ElMessage.success('删除成功')
      resetSearch()
    })
    .catch(err => {
      console.error(err)
    })
}

// 删除单个文件
const handleDelete = (id: number) => {
  ElMessageBox.confirm('确定要删除吗?', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(async () => {
      await attachmentApi.delete(id)
      ElMessage.success('删除成功')
      resetSearch()
    })
    .catch(err => {
      console.error(err)
    })
}

// 预览文件
const preview = (file: AttachmentFile) => {
  previewFileData.value = file
  previewDialogVisible.value = true
}

// 下载文件
const downloadFile = (file: AttachmentFile) => {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.original_name || file.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// 格式化时间
const formatDateTime = (dateStr: string) => {
  return new Date(dateStr).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 处理分页大小变化
const handleSizeChange = (size: number) => {
  listQuery.limit = size
  listQuery.page = 1
  getFiles()
}

// 处理页码变化
const handlePageChange = (page: number) => {
  listQuery.page = page
  getFiles()
}

onMounted(() => {
  getCatalogTree()
  getTypeOptions()
  getFiles()
})

defineExpose({
  triggerFilterCatalog,
  resetSearch,
  getCatalogTree
})
</script>

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

        &::after {
          content: '';
          display: table;
          clear: both;
        }

        li {
          float: left;
          position: relative;
          display: block;

          &.all {
            position: absolute;
            left: 8px;
            top: 15px;
          }

          &.active .item {
            color: #428bca;
            cursor: default;
          }

          .item {
            padding: 15px;
            display: inline-block;
            color: #555;
            cursor: pointer;
            text-decoration: none;

            &:hover {
              color: #428bca;
            }
          }
        }
      }
    }
  }

  .materials-cell {
    padding: 8px;

    &::after {
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

      :deep(.el-image) {
        height: 100%;
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

  :deep(.el-button--danger) {
    margin-left: 10px;
  }
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
