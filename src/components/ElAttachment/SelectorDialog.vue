<template>
  <ElDialog
    v-model="visible"
    :width="width"
    class="attachment-selector"
    @close="onDialogClose"
  >
    <template #header>
      <div class="attachment-selector-header">
        <div class="title">添加图片</div>
        <div class="storage-content">（当前托管方式：托管存储本地存储）</div>
      </div>
    </template>

    <ElTabs v-model="activeTab" stretch class="selector-tabs">
      <!-- 本地图片 -->
      <ElTabPane label="本地图片" name="local" class="selector-tab-item">
        <div class="attachment-selector-local">
          <!-- 左侧分组树 -->
          <div class="group">
            <CatalogLeft
              ref="groupRef"
              custom-class
              @change-catalog="changeCatalog"
            />
          </div>

          <!-- 右侧文件列表 -->
          <div class="list">
            <!-- 列表头部 -->
            <div class="list-header">
              <div class="btn">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleUpload"
                >
                  上传图片
                </el-button>
              </div>
              <div class="search search-keyword">
                <el-input
                  v-model="searchModel.keyword"
                  placeholder="请输入附件名称搜索"
                  class="search-input"
                  clearable
                  @clear="search(true)"
                  style="width: 300px"
                >
                  <template #append>
                    <el-button
                      :icon="Search"
                      @click="search"
                    />
                  </template>
                </el-input>
                <el-button
                  type="text"
                  @click="openOrCloseMore"
                  class="open-more-btn"
                >
                  {{ openMore ? '收起' : '展开' }}
                  <ElIcon>
                    <ArrowUp v-if="!openMore" />
                    <ArrowDown v-else />
                  </ElIcon>
                </el-button>
              </div>
            </div>

            <!-- 更多搜索选项 -->
            <div class="list-more-search" v-if="openMore">
              <el-date-picker
                v-model="searchTimeRange"
                type="datetimerange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                :picker-options="pickerOptions"
                value-format="YYYY-MM-DD HH:mm"
                @change="changeDate"
                style="width: 100%"
              />
            </div>

            <!-- 文件网格 -->
            <div class="list-content" v-loading="loading">
              <ul>
                <li v-for="file in fileList" :key="file.id">
                  <div class="file" @click.stop="onFileClick(file)">
                    <el-image
                      :src="file.cover_full || file.url"
                      :lazy="file.type === 'image'"
                      fit="cover"
                      style="width: 100%; height: 100%"
                    >
                      <template #error>
                        <div class="image-slot">
                          <ElIcon :size="30"><Picture /></ElIcon>
                        </div>
                      </template>
                    </el-image>
                    <div class="layer">
                      <div class="close-btn" @click.stop="delFile(file)">
                        <ElIcon :size="20" color="#b8b9bd"><CircleClose /></ElIcon>
                      </div>
                      <div class="image-size" v-if="file.width && file.height">
                        {{ file.width }} x {{ file.height }}
                      </div>
                    </div>
                    <div class="image-select-layer" v-show="isSelected(file)">
                      <ElIcon :size="30" color="#1198a0"><CircleCheck /></ElIcon>
                    </div>
                  </div>
                  <div class="text" :title="file.filename">
                    <span>{{ file.filename }}</span>
                  </div>
                </li>
              </ul>
            </div>

            <!-- 底部操作栏 -->
            <div class="list-footer">
              <div class="list-batch-delete">
                <el-button
                  type="default"
                  @click="delFiles"
                  :disabled="selectedFiles.length === 0"
                >
                  删除选中（{{ selectedFiles.length }}）
                </el-button>
              </div>
              <div class="list-pagination">
                <el-pagination
                  v-show="total > 0"
                  :total="total"
                  :current-page="searchModel.page"
                  :page-size="searchModel.page_size"
                  :page-sizes="[10, 20, 50]"
                  layout="total, sizes, prev, pager, next"
                  @size-change="handleSizeChange"
                  @current-change="handlePageChange"
                  small
                />
              </div>
            </div>
          </div>
        </div>
      </ElTabPane>

      <!-- 网络提取 -->
      <ElTabPane label="网络提取" name="network" class="selector-tab-item">
        <div class="network-extract">
          <el-form label-width="100px">
            <el-form-item label="资源地址:">
              <el-input
                v-model="sourceUrl"
                placeholder="请在此处粘贴资源地址"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSuccessGetRemoteSource">
                提取资源
              </el-button>
            </el-form-item>
            <el-form-item>
              <div class="tips">大小不要超过10M,支持图片、音频、视频的常用格式</div>
            </el-form-item>
          </el-form>
        </div>
      </ElTabPane>
    </ElTabs>

    <template #footer>
      <div class="attachment-selector-footer">
        <el-button @click="close">取 消</el-button>
        <el-button type="info" @click="previewImgs" v-if="fileType === 'image'">
          预 览
        </el-button>
        <el-button type="primary" @click="sure">确 定</el-button>
      </div>
    </template>

    <!-- 预览对话框 -->
    <ElDialog
      v-model="previewDialogVisible"
      title="附件预览"
      width="70%"
      append-to-body
    >
      <div v-if="previewFile" class="preview-dialog-content">
        <el-image
          v-if="previewFile.type === 'image'"
          :src="previewFile.url"
          fit="contain"
          style="height: 550px;width:100%;"
        />
        <video
          v-else-if="previewFile.type === 'video'"
          :src="previewFile.url"
          controls
          autoplay
          muted
          style="height: 550px;width:100%;"
        />
        <audio
          v-else-if="previewFile.type === 'audio'"
          :src="previewFile.url"
          controls
          autoplay
          muted
          style="width:100%;"
        />
        <el-empty v-else description="暂不支持该类型文件预览" />
      </div>
    </ElDialog>

    <!-- 上传对话框 -->
    <ElDialog
      v-model="uploadDialogVisible"
      title="上传附件"
      width="500px"
      append-to-body
    >
      <el-form label-width="100px">
        <el-form-item label="上传附件:">
          <el-upload
            ref="uploadRef"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            :show-file-list="true"
            :limit="3"
            :on-exceed="handleExceed"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
          >
            <el-button type="primary">选择文件</el-button>
            <template #tip>
              <div class="el-upload__tip">
                支持图片、音频、视频及常用文档格式，单个文件不超过10MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="所属分组:">
          <el-select
            v-model="uploadGroupCode"
            clearable
            placeholder="选择分组"
            style="width: 100%"
          >
            <el-option
              v-for="item in catalogItems"
              :key="item.id"
              :label="item.tree_title || item.title"
              :value="item.code"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">关闭</el-button>
      </template>
    </ElDialog>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, ArrowUp, ArrowDown, Picture, CircleClose, CircleCheck
} from '@element-plus/icons-vue'
import { attachmentApi, type AttachmentFile, type AttachmentCatalog } from '@/api/attachmentApi'
import { authUtils } from '@/utils/authUtils'
import CatalogLeft from '../attachment/CatalogLeft.vue'

interface Props {
  width?: string
  fileType?: string
  limit?: number
}

interface Emits {
  (e: 'selected', files: AttachmentFile[]): void
}

const props = withDefaults(defineProps<Props>(), {
  width: '1100px',
  fileType: 'image',
  limit: 1
})

const emit = defineEmits<Emits>()

const visible = ref(false)
const activeTab = ref('local')
const loading = ref(false)
const fileList = ref<AttachmentFile[]>([])
const sourceUrl = ref('')
const catalogItems = ref<AttachmentCatalog[]>([])
const selectedFiles = ref<AttachmentFile[]>([])
const remoteSourceFile = ref<AttachmentFile | null>(null)
const updFile = ref<AttachmentFile | null>(null)
const previewDialogVisible = ref(false)
const previewFile = ref<AttachmentFile | null>(null)
const uploadDialogVisible = ref(false)
const uploadGroupCode = ref('')
const openMore = ref(false)

const searchModel = reactive({
  page: 1,
  page_size: 10,
  type: props.fileType,
  keyword: '',
  group: undefined as string | undefined,
  start_time: undefined as string | undefined,
  end_time: undefined as string | undefined
})

const searchTimeRange = ref<[Date, Date] | null>(null)
const paginator = ref<{ total: number } | null>(null)

const pickerOptions = {
  shortcuts: [
    {
      text: '最近一周',
      onClick(picker: any) {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
        picker.emit('pick', [start, end])
      }
    },
    {
      text: '最近一个月',
      onClick(picker: any) {
        const end = new Date()
        const start = new Date()
        start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
        picker.emit('pick', [start, end])
      }
    }
  ]
}

const total = computed(() => paginator.value?.total || 0)

const uploadUrl = import.meta.env.VITE_API_BASE_URL + '/admin/attachment/upload'
const uploadHeaders = computed(() => ({
  'Authorization': authUtils.getToken() || ''
}))

const groupRef = ref<InstanceType<typeof CatalogLeft>>()

// 获取目录树
const getCatalogTree = async () => {
  try {
    const trees = await attachmentApi.getCatalogTree()
    catalogItems.value = trees
  } catch (error) {
    console.error('Failed to get catalog tree:', error)
  }
}

// 获取文件列表
const getFiles = async () => {
  loading.value = true
  try {
    searchModel.type = props.fileType
    const data = await attachmentApi.files(searchModel)

    if (!data.list.length && paginator.value && searchModel.page > 1) {
      searchModel.page = searchModel.page - 1
      getFiles()
      return
    }

    fileList.value = data.list
    paginator.value = data.paginator

    // 选择待更新文件
    selectUpdFile()
  } catch (error) {
    console.error('Failed to get files:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const search = (resetFlag: boolean | MouseEvent = false) => {
  if (resetFlag) {
    searchModel.page = 1
    searchModel.keyword = ''
    searchModel.group = undefined
    searchModel.start_time = undefined
    searchModel.end_time = undefined
    searchTimeRange.value = null
  }
  getFiles()
}

// 切换分组
const changeCatalog = (groupCode: string) => {
  searchModel.group = groupCode
  search(true)
}

// 日期改变
const changeDate = (val: [Date, Date] | null) => {
  if (val && val.length === 2) {
    searchModel.start_time = val[0].toISOString()
    searchModel.end_time = val[1].toISOString()
  } else {
    searchModel.start_time = undefined
    searchModel.end_time = undefined
  }
  search()
}

// 展开/收起更多搜索
const openOrCloseMore = () => {
  openMore.value = !openMore.value
}

// 选择文件
const onFileClick = (file: AttachmentFile) => {
  if (props.limit > 1 && selectedFiles.value.length >= props.limit) {
    return false
  }

  if (!isSelected(file)) {
    if (props.limit === 1 && selectedFiles.value.length) {
      selectedFiles.value = []
    }
    selectedFiles.value.push(file)
  } else {
    removeSelectedFile(file)
  }
}

// 判断是否已选择
const isSelected = (file: AttachmentFile) => {
  return selectedFiles.value.some(item => item.id === file.id)
}

// 移除已选文件
const removeSelectedFile = (file: AttachmentFile) => {
  selectedFiles.value = selectedFiles.value.filter(item => item.id !== file.id)
}

// 选择待更新文件
const selectUpdFile = () => {
  if (updFile.value && !isSelected(updFile.value)) {
    selectedFiles.value.push(updFile.value)
  }
}

// 删除文件
const delFile = async (file: AttachmentFile) => {
  try {
    await ElMessageBox.confirm('确定要删除吗?', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await attachmentApi.delete(file.id)
    removeSelectedFile(file)

    if (updFile.value?.id === file.id) {
      updFile.value = null
    }

    ElMessage.success('删除成功')
    search()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete file:', error)
    }
  }
}

// 批量删除
const delFiles = async () => {
  if (selectedFiles.value.length <= 0) {
    ElMessage.error('删除失败，请至少选择一项附件')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除它们吗?', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await attachmentApi.deletes(selectedFiles.value.map(f => f.id))

    selectedFiles.value = []
    updFile.value = null

    ElMessage.success('删除成功')
    search()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to delete files:', error)
    }
  }
}

// 上传文件
const handleUpload = () => {
  uploadDialogVisible.value = true
  getCatalogTree()
}

// 上传前校验
const beforeUpload = (file: File) => {
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('上传文件大小不能超过 10MB!')
    return false
  }
  return true
}

// 超出限制
const handleExceed = () => {
  ElMessage.warning('最多只能上传3个文件')
}

// 上传成功
const handleUploadSuccess = (response: any) => {
  if (response.code === 0) {
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    search()
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('上传失败')
}

// 网络资源提取
const onSuccessGetRemoteSource = () => {
  if (!sourceUrl.value) {
    ElMessage.warning('请输入资源地址')
    return
  }

  // 简化处理，直接创建文件对象
  const file: AttachmentFile = {
    id: Date.now(),
    filename: sourceUrl.value.split('/').pop() || 'remote',
    original_name: sourceUrl.value.split('/').pop() || 'remote',
    ext: sourceUrl.value.split('.').pop() || '',
    type: props.fileType,
    type_text: '图片',
    mime_type: '',
    size: 0,
    file_size_text: '0',
    url: sourceUrl.value,
    cover: sourceUrl.value,
    cover_full: sourceUrl.value,
    storage: 'remote',
    storage_text: '远程',
    create_client: 'web',
    create_client_text: 'Web',
    created_time: new Date().toISOString()
  }

  remoteSourceFile.value = file
  ElMessage.success('提取成功')
}

// 预览
const previewImgs = () => {
  const images = fileList.value
    .filter(item => item.type === 'image')
    .map(item => item.url)

  if (images.length > 0) {
    // 简化预览，使用第一个图片
    previewFile.value = fileList.value.find(f => f.url === images[0]) || null
    previewDialogVisible.value = true
  }
}

// 预览文件
const preview = (file: AttachmentFile) => {
  previewFile.value = file
  previewDialogVisible.value = true
}

// 打开对话框
const open = (file?: AttachmentFile) => {
  updFile.value = file || null
  getCatalogTree()
  getFiles()
  visible.value = true
}

// 关闭对话框
const close = () => {
  visible.value = false
  selectedFiles.value = []
  updFile.value = null
  remoteSourceFile.value = null
}

// 对话框关闭回调
const onDialogClose = () => {
  selectedFiles.value = []
  updFile.value = null
}

// 确认选择
const sure = () => {
  if (activeTab.value === 'network') {
    emit('selected', remoteSourceFile.value ? [remoteSourceFile.value] : [])
  } else {
    emit('selected', selectedFiles.value)
  }
  close()
}

// 分页
const handlePageChange = (page: number) => {
  searchModel.page = page
  getFiles()
}

const handleSizeChange = (size: number) => {
  searchModel.page_size = size
  searchModel.page = 1
  getFiles()
}

defineExpose({
  open
})
</script>

<style lang="scss" scoped>
.attachment-selector {
  :deep(.el-dialog__header) {
    padding: 10px 20px;
  }

  .attachment-selector-header {
    display: flex;
    align-items: center;
    height: 20px;

    .title {
      font-size: 16px;
      font-weight: bold;
      line-height: 22px;
      color: #000;
    }

    .storage-content {
      padding-left: 20px;
      font-size: 14px;
      font-weight: normal;
      line-height: 20px;
      color: #939799;
    }
  }

  .selector-tabs {
    :deep(.el-tabs__nav-scroll) {
      width: 50%;
      margin: 0 auto;
    }
  }

  .attachment-selector-local {
    display: flex;
    flex-wrap: nowrap;

    .group {
      min-width: 200px;
      max-width: 200px;
      border-right: 1px solid #e9edef;
      overflow-x: hidden;
      overflow-y: auto;
      max-height: 500px;
    }

    .list {
      padding-left: 10px;
      width: 100%;
      overflow-y: auto;

      .list-header {
        padding-top: 20px;
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        padding-bottom: 10px;

        .search-input {
          width: 300px;
        }

        .open-more-btn {
          margin-left: 10px;
        }
      }

      .list-more-search {
        padding-bottom: 10px;
      }

      .list-content {
        overflow-y: auto;
        overflow-x: hidden;
        max-height: 400px;
        padding-top: 10px;

        ul {
          display: flex;
          flex-wrap: wrap;
          margin-right: -10px;
          padding: 0;
          list-style: none;

          li {
            padding: 0 10px 20px 0;

            .file {
              position: relative;
              width: 112px;
              height: 112px;
              border: 1px solid #e9edef;
              border-radius: 2px;
              cursor: pointer;
              background-color: #f4f6f8;

              &:hover {
                .layer {
                  display: block;
                }
              }

              .layer {
                display: none;

                .close-btn {
                  position: absolute;
                  top: -18px;
                  right: -9px;
                  font-size: 20px;
                  color: #b8b9bd;

                  &:hover {
                    color: #515a6e;
                  }
                }

                .image-size {
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  height: 20px;
                  line-height: 20px;
                  text-align: center;
                  background-color: rgba(0, 0, 0, 0.7);
                  color: #ffffff;
                  font-size: 12px;
                }
              }

              .image-select-layer {
                position: absolute;
                top: 0;
                bottom: 0;
                left: 0;
                right: 0;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                border-radius: 2px;
              }
            }

            .text {
              font-size: 12px;
              line-height: 16px;
              color: #000;
              margin-top: 10px;
              width: 112px;
              display: flex;

              span {
                word-break: break-all;
                white-space: nowrap;
                text-overflow: ellipsis;
                overflow: hidden;
              }
            }
          }
        }
      }

      .list-footer {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        padding: 10px 0;
        background-color: #ffffff;
      }
    }
  }

  .network-extract {
    padding: 20px;

    .tips {
      color: #999;
      font-size: 12px;
    }
  }

  .image-slot {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background: #f5f7fa;
    color: #909399;
  }
}

.preview-dialog-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
</style>
