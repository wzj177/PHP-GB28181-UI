<template>
  <ElDialog
    v-model="dialogVisible"
    title="选择附件"
    width="900px"
    append-to-body
  >
    <div class="attachment-select-list">
      <ElUpload
        :action="uploadUrl"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        :before-upload="beforeUpload"
        :show-file-list="false"
        accept="image/*"
        drag
        class="upload-area"
      >
        <ElIcon class="el-icon--upload" :size="50"><Plus /></ElIcon>
        <div class="el-upload__text">
          将图片拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            只能上传 jpg/png 文件，且不超过 2MB
          </div>
        </template>
      </ElUpload>

      <ElDivider />

      <div class="attachment-grid">
        <div
          v-for="item in attachments"
          :key="item.id"
          class="attachment-item"
          :class="{ selected: modelValue === item.url }"
          @click="selectAttachment(item.url)"
        >
          <ElImage
            :src="item.url"
            fit="cover"
            class="attachment-image"
            :preview-src-list="[item.url]"
          />
        </div>
      </div>

      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[12, 24, 48]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="pagination"
      />

      <div class="dialog-footer">
        <ElButton @click="handleCancel">取消</ElButton>
        <ElButton type="primary" @click="handleConfirm">确定</ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { attachmentApi } from '@/api/attachmentApi'
import type { AttachmentFile } from '@/api/attachmentApi'
import { authUtils } from '@/utils/authUtils'

interface Props {
  modelValue?: string | null
  type?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'confirm', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const attachments = ref<AttachmentFile[]>([])
const loading = ref(false)
const selectedUrl = ref(props.modelValue || '')

const pagination = ref({
  currentPage: 1,
  pageSize: 12,
  total: 0
})

const uploadUrl = import.meta.env.VITE_API_BASE_URL + '/admin/attachment/upload'
const uploadHeaders = computed(() => ({
  'Authorization': authUtils.getToken() || ''
}))

// Watch for modelValue changes
watch(() => props.modelValue, (newVal) => {
  selectedUrl.value = newVal || ''
})

const getAttachments = async () => {
  loading.value = true
  try {
    const data = await attachmentApi.files({
      type: (props.type as any) || 'image',
      page: pagination.value.currentPage,
      page_size: pagination.value.pageSize
    })
    attachments.value = data.list || []
    pagination.value.total = data.paginator?.total || 0
  } catch (error: any) {
    console.error('Failed to fetch attachments:', error)
  } finally {
    loading.value = false
  }
}

const selectAttachment = (url: string) => {
  selectedUrl.value = url
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.currentPage = 1
  getAttachments()
}

const handleCurrentChange = (page: number) => {
  pagination.value.currentPage = page
  getAttachments()
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('上传图片大小不能超过 2MB!')
    return false
  }
  return true
}

const handleUploadSuccess = (response: any) => {
  if (response.code === 0 && response.data?.url) {
    ElMessage.success('上传成功')
    selectedUrl.value = response.data.url
    getAttachments() // Refresh the list
  } else {
    ElMessage.error(response?.message || '上传失败')
  }
}

const handleUploadError = () => {
  ElMessage.error('上传失败')
}

const handleConfirm = () => {
  if (selectedUrl.value) {
    emit('update:modelValue', selectedUrl.value)
    emit('confirm', selectedUrl.value)
    dialogVisible.value = false
  } else {
    ElMessage.warning('请选择附件')
  }
}

const handleCancel = () => {
  dialogVisible.value = false
}

// 打开对话框
const openDialog = () => {
  dialogVisible.value = true
  getAttachments()
}

onMounted(() => {
  // Load data when dialog opens
})

defineExpose({
  openDialog
})
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.attachment-select-list {
  .upload-area {
    margin-bottom: 20px;
  }

  .attachment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
    min-height: 200px;

    .attachment-item {
      position: relative;
      aspect-ratio: 1;
      border: 2px solid var(--border-base);
      border-radius: 4px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
        transform: scale(1.05);
      }

      &.selected {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 2px var(--el-color-primary-light-7);
      }

      .attachment-image {
        width: 100%;
        height: 100%;
      }
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .dialog-footer {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>
